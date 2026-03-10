/**
 * E2E Test: Admin Operations
 * 
 * Tests the complete admin workflow:
 * - Add table → monitor occupied tables
 * - Extend timer → monitor payments
 * - Delete table
 * - Verifies all admin controls and real-time updates
 * 
 * Validates: Requirements 14.1-14.5, 15.1-15.5, 16.1-16.5, 17.1-17.5
 */

const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

const app = require('../../src/app');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('E2E: Admin Operations', () => {
  let testFloorId;
  let testProductId;
  let adminId;
  let cashierId;
  let createdTableIds = [];

  beforeAll(async () => {
    // Create test admin user
    const { data: admin } = await supabase
      .from('users')
      .insert({
        email: `admin-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    adminId = admin.id;

    // Create test cashier
    const { data: cashier } = await supabase
      .from('users')
      .insert({
        email: `admin-cashier-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        full_name: 'Admin Test Cashier',
        role: 'cashier',
        is_active: true
      })
      .select()
      .single();
    cashierId = cashier.id;

    // Create test floor
    const { data: floor } = await supabase
      .from('floors')
      .insert({
        name: `Admin Floor ${Date.now()}`,
        description: 'Admin Test Floor',
        is_active: true
      })
      .select()
      .single();
    testFloorId = floor.id;

    // Create test product
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        name: `Admin Category ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    const { data: product } = await supabase
      .from('products')
      .insert({
        category_id: category.id,
        name: `Admin Product ${Date.now()}`,
        description: 'Admin Test Product',
        price: 200.00,
        is_available: true,
        is_active: true
      })
      .select()
      .single();
    testProductId = product.id;
  });

  afterAll(async () => {
    // Cleanup
    for (const tableId of createdTableIds) {
      await supabase.from('tables').delete().eq('id', tableId);
    }
    if (testFloorId) {
      await supabase.from('floors').delete().eq('id', testFloorId);
    }
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }
    if (adminId) {
      await supabase.from('users').delete().eq('id', adminId);
    }
    if (cashierId) {
      await supabase.from('users').delete().eq('id', cashierId);
    }
  });

  it('should add a new table successfully', async () => {
    const tableNumber = `ADM${Date.now()}`;
    
    const response = await request(app)
      .post('/api/tables/create')
      .send({
        floor_id: testFloorId,
        table_number: tableNumber,
        seats: 6,
        position_x: 100,
        position_y: 200
      })
      .expect(200);

    expect(response.body.table_id).toBeDefined();
    expect(response.body.table_number).toBe(tableNumber);

    createdTableIds.push(response.body.table_id);

    // Verify table was created in database
    const { data: table } = await supabase
      .from('tables')
      .select('*')
      .eq('id', response.body.table_id)
      .single();

    expect(table).toBeDefined();
    expect(table.floor_id).toBe(testFloorId);
    expect(table.table_number).toBe(tableNumber);
    expect(table.seats).toBe(6);
    expect(table.status).toBe('available');
    expect(table.position_x).toBe(100);
    expect(table.position_y).toBe(200);

    // Verify real-time broadcast (simulate by checking table appears in list)
    await new Promise(resolve => setTimeout(resolve, 500));
    const tablesResponse = await request(app)
      .get(`/api/floors/${testFloorId}/tables`)
      .expect(200);

    const createdTable = tablesResponse.body.find(t => t.id === response.body.table_id);
    expect(createdTable).toBeDefined();
  }, 30000);

  it('should monitor occupied tables with timer and order status', async () => {
    // Create and occupy a table
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `OCC${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(table.id);

    // Select table and create paid order
    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    const tableToken = selectionResponse.body.table_token;

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: tableToken,
        product_id: testProductId,
        quantity: 2
      })
      .expect(200);

    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: tableToken })
      .expect(200);

    const paymentResponse = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: tableToken,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: paymentResponse.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    // Wait for timer to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get occupied tables view
    const occupiedResponse = await request(app)
      .get('/api/admin/occupied-tables')
      .expect(200);

    expect(occupiedResponse.body).toBeInstanceOf(Array);
    
    const occupiedTable = occupiedResponse.body.find(t => t.table_id === table.id);
    expect(occupiedTable).toBeDefined();
    expect(occupiedTable.table_number).toBe(table.table_number);
    expect(occupiedTable.timer_remaining).toBeDefined();
    expect(occupiedTable.order_status).toBeDefined();
    expect(occupiedTable.payment_status).toBe('paid');
    expect(occupiedTable.session_start).toBeDefined();

    // Verify timer remaining is close to 39 minutes (in seconds)
    expect(occupiedTable.timer_remaining).toBeGreaterThan(38 * 60);
    expect(occupiedTable.timer_remaining).toBeLessThanOrEqual(39 * 60);
  }, 60000);

  it('should extend timer successfully', async () => {
    // Create occupied table with timer
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `EXT${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(table.id);

    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: selectionResponse.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: selectionResponse.body.table_token })
      .expect(200);

    const paymentResponse = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: selectionResponse.body.table_token,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: paymentResponse.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get session ID
    const { data: session } = await supabase
      .from('table_sessions')
      .select('id, timer_ends_at')
      .eq('table_token', selectionResponse.body.table_token)
      .single();

    const originalEndsAt = new Date(session.timer_ends_at);

    // Extend timer by 15 minutes
    const extendResponse = await request(app)
      .post('/api/timers/extend')
      .send({
        session_id: session.id,
        extension_minutes: 15,
        admin_id: adminId
      })
      .expect(200);

    expect(extendResponse.body.success).toBe(true);
    expect(extendResponse.body.new_timer_ends_at).toBeDefined();

    // Verify timer was extended
    const { data: extendedSession } = await supabase
      .from('table_sessions')
      .select('timer_ends_at, timer_status')
      .eq('id', session.id)
      .single();

    const newEndsAt = new Date(extendedSession.timer_ends_at);
    const extensionMs = newEndsAt.getTime() - originalEndsAt.getTime();
    const extensionMinutes = extensionMs / (1000 * 60);

    expect(extensionMinutes).toBeCloseTo(15, 0);
    expect(extendedSession.timer_status).toBe('extended');

    // Verify extension logged
    const { data: log } = await supabase
      .from('table_timer_logs')
      .select('*')
      .eq('session_id', session.id)
      .single();

    expect(log.extended_by).toBe(adminId);
    expect(log.extension_minutes).toBe(15);
  }, 60000);

  it('should reset timer to 39 minutes', async () => {
    // Create occupied table
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `RST${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(table.id);

    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: selectionResponse.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: selectionResponse.body.table_token })
      .expect(200);

    const paymentResponse = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: selectionResponse.body.table_token,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: paymentResponse.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    // Wait a bit so timer is not at exactly 39 minutes
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: session } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_token', selectionResponse.body.table_token)
      .single();

    // Reset timer
    const resetResponse = await request(app)
      .post('/api/timers/reset')
      .send({
        session_id: session.id,
        admin_id: adminId
      })
      .expect(200);

    expect(resetResponse.body.success).toBe(true);
    expect(resetResponse.body.new_timer_ends_at).toBeDefined();

    // Verify timer is now 39 minutes from current time
    const { data: resetSession } = await supabase
      .from('table_sessions')
      .select('timer_ends_at')
      .eq('id', session.id)
      .single();

    const endsAt = new Date(resetSession.timer_ends_at);
    const now = new Date();
    const remainingMs = endsAt.getTime() - now.getTime();
    const remainingMinutes = remainingMs / (1000 * 60);

    expect(remainingMinutes).toBeGreaterThan(38.5);
    expect(remainingMinutes).toBeLessThanOrEqual(39);
  }, 60000);

  it('should monitor all payments with correct payment method display', async () => {
    // Create cash payment
    const { data: cashTable } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `CASH${Date.now()}`,
        seats: 2,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(cashTable.id);

    const cashSelection = await request(app)
      .post('/api/tables/select')
      .send({ table_id: cashTable.id })
      .expect(200);

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: cashSelection.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const cashOrder = await request(app)
      .post('/api/orders/create')
      .send({ table_token: cashSelection.body.table_token })
      .expect(200);

    const cashPayment = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: cashOrder.body.order_id,
        table_token: cashSelection.body.table_token,
        amount: cashOrder.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: cashPayment.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    // Create UPI payment
    const { data: upiTable } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `UPI${Date.now()}`,
        seats: 2,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(upiTable.id);

    const upiSelection = await request(app)
      .post('/api/tables/select')
      .send({ table_id: upiTable.id })
      .expect(200);

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: upiSelection.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const upiOrder = await request(app)
      .post('/api/orders/create')
      .send({ table_token: upiSelection.body.table_token })
      .expect(200);

    const upiQR = await request(app)
      .post('/api/payments/upi/generate-qr')
      .send({
        order_id: upiOrder.body.order_id,
        table_token: upiSelection.body.table_token,
        amount: upiOrder.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/upi/verify')
      .send({
        transaction_id: `UPI${Date.now()}`,
        order_id: upiOrder.body.order_id,
        amount: upiOrder.body.total_amount,
        upi_reference: upiQR.body.transaction_ref
      })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get payment monitor
    const paymentsResponse = await request(app)
      .get('/api/payments/monitor')
      .expect(200);

    expect(paymentsResponse.body).toBeInstanceOf(Array);

    // Find our test payments
    const cashPaymentRecord = paymentsResponse.body.find(p => p.payment_id === cashPayment.body.payment_id);
    const upiPaymentRecord = paymentsResponse.body.find(p => p.payment_id === upiQR.body.payment_id);

    // Verify cash payment shows cashier name
    expect(cashPaymentRecord).toBeDefined();
    expect(cashPaymentRecord.payment_method).toBe('cash');
    expect(cashPaymentRecord.cashier_name).toBeDefined();
    expect(cashPaymentRecord.cashier_name).not.toBe('UPI');

    // Verify UPI payment shows "UPI" instead of cashier name
    expect(upiPaymentRecord).toBeDefined();
    expect(upiPaymentRecord.payment_method).toBe('upi');
    expect(upiPaymentRecord.cashier_name).toBe('UPI');
  }, 60000);

  it('should delete available table successfully', async () => {
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `DEL${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    const deleteResponse = await request(app)
      .delete(`/api/tables/${table.id}`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);

    // Verify table was deleted
    const { data: deletedTable } = await supabase
      .from('tables')
      .select('*')
      .eq('id', table.id)
      .single();

    expect(deletedTable).toBeNull();
  }, 30000);

  it('should require confirmation to delete occupied table', async () => {
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `DELOC${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(table.id);

    // Occupy the table
    await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    // Attempt to delete without confirmation
    const deleteResponse = await request(app)
      .delete(`/api/tables/${table.id}`)
      .expect(400);

    expect(deleteResponse.body.requiresConfirmation).toBe(true);
    expect(deleteResponse.body.message).toContain('occupied');

    // Verify table still exists
    const { data: stillExists } = await supabase
      .from('tables')
      .select('*')
      .eq('id', table.id)
      .single();

    expect(stillExists).toBeDefined();
  }, 30000);

  it('should manually free occupied table', async () => {
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `FREE${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    createdTableIds.push(table.id);

    // Occupy table
    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    // Verify occupied
    const { data: occupiedTable } = await supabase
      .from('tables')
      .select('status')
      .eq('id', table.id)
      .single();

    expect(occupiedTable.status).toBe('occupied');

    // Manually free table
    const freeResponse = await request(app)
      .post('/api/tables/release')
      .send({
        table_id: table.id,
        admin_id: adminId,
        reason: 'manual_release'
      })
      .expect(200);

    expect(freeResponse.body.success).toBe(true);

    // Verify table is now available
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: freedTable } = await supabase
      .from('tables')
      .select('status, qr_code_token')
      .eq('id', table.id)
      .single();

    expect(freedTable.status).toBe('available');
    expect(freedTable.qr_code_token).toBeNull();

    // Verify session was ended
    const { data: session } = await supabase
      .from('table_sessions')
      .select('status, freed_by, freed_reason')
      .eq('table_token', selectionResponse.body.table_token)
      .single();

    expect(session.status).toBe('force_freed');
    expect(session.freed_by).toBe(adminId);
    expect(session.freed_reason).toContain('manual_release');
  }, 30000);
});
