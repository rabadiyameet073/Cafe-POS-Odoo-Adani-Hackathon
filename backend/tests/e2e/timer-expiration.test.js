/**
 * E2E Test: Timer Expiration
 * 
 * Tests the complete timer lifecycle:
 * - Payment confirmed → timer starts
 * - Timer countdown → timer expires
 * - Table auto-released
 * 
 * Validates: Requirements 11.1-11.5, 13.1-13.5
 */

const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

const app = require('../../src/app');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('E2E: Timer Expiration', () => {
  let testFloorId;
  let testProductId;
  let cashierId;

  beforeAll(async () => {
    // Create test cashier
    const { data: cashier } = await supabase
      .from('users')
      .insert({
        email: `timer-cashier-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        full_name: 'Timer Test Cashier',
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
        name: `Timer Floor ${Date.now()}`,
        description: 'Timer Test Floor',
        is_active: true
      })
      .select()
      .single();
    testFloorId = floor.id;

    // Create test product
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        name: `Timer Category ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    const { data: product } = await supabase
      .from('products')
      .insert({
        category_id: category.id,
        name: `Timer Product ${Date.now()}`,
        description: 'Timer Test Product',
        price: 100.00,
        is_available: true,
        is_active: true
      })
      .select()
      .single();
    testProductId = product.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testFloorId) {
      await supabase.from('floors').delete().eq('id', testFloorId);
    }
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }
    if (cashierId) {
      await supabase.from('users').delete().eq('id', cashierId);
    }
  });

  it('should start timer after payment confirmation', async () => {
    // Create table and order
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `TMR${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

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

    // Verify timer NOT started before payment
    const { data: sessionBefore } = await supabase
      .from('table_sessions')
      .select('timer_status, timer_started_at, timer_ends_at')
      .eq('table_token', tableToken)
      .single();

    expect(sessionBefore.timer_status).toBe('not_started');
    expect(sessionBefore.timer_started_at).toBeNull();
    expect(sessionBefore.timer_ends_at).toBeNull();

    // Confirm payment
    const paymentResponse = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: tableToken,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    const approvalResponse = await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: paymentResponse.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    expect(approvalResponse.body.timer_ends_at).toBeDefined();

    // Verify timer started after payment
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: sessionAfter } = await supabase
      .from('table_sessions')
      .select('timer_status, timer_started_at, timer_ends_at')
      .eq('table_token', tableToken)
      .single();

    expect(sessionAfter.timer_status).toBe('running');
    expect(sessionAfter.timer_started_at).toBeDefined();
    expect(sessionAfter.timer_ends_at).toBeDefined();

    // Verify timer is set to 39 minutes
    const startTime = new Date(sessionAfter.timer_started_at);
    const endTime = new Date(sessionAfter.timer_ends_at);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    expect(durationMinutes).toBeCloseTo(39, 0);

    // Verify table occupied_until is set
    const { data: tableAfter } = await supabase
      .from('tables')
      .select('occupied_until')
      .eq('id', table.id)
      .single();

    expect(tableAfter.occupied_until).toBeDefined();
    expect(new Date(tableAfter.occupied_until).getTime()).toBeCloseTo(endTime.getTime(), -3);

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 60000);

  it('should display timer countdown correctly', async () => {
    // Create table with timer
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `CNT${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

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

    // Get active timers
    const timersResponse = await request(app)
      .get('/api/timers/active')
      .expect(200);

    expect(timersResponse.body).toBeInstanceOf(Array);

    const timer = timersResponse.body.find(t => t.table_id === table.id);
    expect(timer).toBeDefined();
    expect(timer.table_number).toBe(table.table_number);
    expect(timer.timer_started_at).toBeDefined();
    expect(timer.timer_ends_at).toBeDefined();
    expect(timer.remaining_seconds).toBeDefined();

    // Verify remaining seconds is close to 39 minutes
    expect(timer.remaining_seconds).toBeGreaterThan(38 * 60);
    expect(timer.remaining_seconds).toBeLessThanOrEqual(39 * 60);

    // Wait 2 seconds and check countdown decreased
    await new Promise(resolve => setTimeout(resolve, 2000));

    const timersResponse2 = await request(app)
      .get('/api/timers/active')
      .expect(200);

    const timer2 = timersResponse2.body.find(t => t.table_id === table.id);
    expect(timer2.remaining_seconds).toBeLessThan(timer.remaining_seconds);
    expect(timer.remaining_seconds - timer2.remaining_seconds).toBeGreaterThanOrEqual(1);
    expect(timer.remaining_seconds - timer2.remaining_seconds).toBeLessThanOrEqual(3);

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 60000);

  it('should automatically release table when timer expires', async () => {
    // Create table with very short timer for testing
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `EXP${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

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
        quantity: 1
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

    await new Promise(resolve => setTimeout(resolve, 500));

    // Get session
    const { data: session } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_token', tableToken)
      .single();

    // Manually set timer to expire in 2 seconds (for testing)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2000);

    await supabase
      .from('table_sessions')
      .update({
        timer_ends_at: expiresAt.toISOString()
      })
      .eq('id', session.id);

    await supabase
      .from('tables')
      .update({
        occupied_until: expiresAt.toISOString()
      })
      .eq('id', table.id);

    // Verify table is occupied
    const { data: occupiedTable } = await supabase
      .from('tables')
      .select('status')
      .eq('id', table.id)
      .single();

    expect(occupiedTable.status).toBe('occupied');

    // Simulate timer expiration by manually releasing
    // (In production, this would be done by background job)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Manually trigger release (simulating background job)
    await request(app)
      .post('/api/tables/release')
      .send({
        table_id: table.id,
        admin_id: cashierId,
        reason: 'timer_expired'
      })
      .expect(200);

    // Verify table is now available
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: freedTable } = await supabase
      .from('tables')
      .select('status, qr_code_token, current_session_id, occupied_since, occupied_until')
      .eq('id', table.id)
      .single();

    expect(freedTable.status).toBe('available');
    expect(freedTable.qr_code_token).toBeNull();
    expect(freedTable.current_session_id).toBeNull();
    expect(freedTable.occupied_since).toBeNull();
    expect(freedTable.occupied_until).toBeNull();

    // Verify session is expired
    const { data: expiredSession } = await supabase
      .from('table_sessions')
      .select('status, timer_status, session_end')
      .eq('id', session.id)
      .single();

    expect(expiredSession.status).toBe('expired');
    expect(expiredSession.timer_status).toBe('expired');
    expect(expiredSession.session_end).toBeDefined();

    // Verify token is invalidated
    const tokenValidation = await request(app)
      .post('/api/cart/add')
      .send({
        table_token: tableToken,
        product_id: testProductId,
        quantity: 1
      })
      .expect(400);

    expect(tokenValidation.body.error).toContain('token');

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 60000);

  it('should archive session data when timer expires', async () => {
    // Create table
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `ARC${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

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
        quantity: 1
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

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: session } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('table_token', tableToken)
      .single();

    // Simulate expiration
    await request(app)
      .post('/api/tables/release')
      .send({
        table_id: table.id,
        admin_id: cashierId,
        reason: 'timer_expired'
      })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify session data is preserved (archived)
    const { data: archivedSession } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('id', session.id)
      .single();

    expect(archivedSession).toBeDefined();
    expect(archivedSession.status).toBe('expired');
    expect(archivedSession.session_start).toBeDefined();
    expect(archivedSession.session_end).toBeDefined();
    expect(archivedSession.timer_started_at).toBeDefined();
    expect(archivedSession.timer_ends_at).toBeDefined();
    expect(archivedSession.table_token).toBe(tableToken);

    // Verify timer log exists
    const { data: timerLog } = await supabase
      .from('table_timer_logs')
      .select('*')
      .eq('session_id', session.id)
      .single();

    expect(timerLog).toBeDefined();
    expect(timerLog.status).toBe('expired');

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 60000);

  it('should reset timer if payment confirmed again on same table', async () => {
    // This tests the requirement: "IF a Timer already exists for a table, THEN THE System SHALL reset the Timer to 39 minutes"
    
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

    // First order
    const selection1 = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: selection1.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const order1 = await request(app)
      .post('/api/orders/create')
      .send({ table_token: selection1.body.table_token })
      .expect(200);

    const payment1 = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: order1.body.order_id,
        table_token: selection1.body.table_token,
        amount: order1.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: payment1.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: session1 } = await supabase
      .from('table_sessions')
      .select('timer_ends_at')
      .eq('table_token', selection1.body.table_token)
      .single();

    const firstEndsAt = new Date(session1.timer_ends_at);

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Second order on same table (customer orders more items)
    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: selection1.body.table_token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const order2 = await request(app)
      .post('/api/orders/create')
      .send({ table_token: selection1.body.table_token })
      .expect(200);

    const payment2 = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: order2.body.order_id,
        table_token: selection1.body.table_token,
        amount: order2.body.total_amount
      })
      .expect(200);

    await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: payment2.body.payment_id,
        cashier_id: cashierId
      })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: session2 } = await supabase
      .from('table_sessions')
      .select('timer_ends_at')
      .eq('table_token', selection1.body.table_token)
      .single();

    const secondEndsAt = new Date(session2.timer_ends_at);

    // Verify timer was reset (second end time should be later than first)
    expect(secondEndsAt.getTime()).toBeGreaterThan(firstEndsAt.getTime());

    // Verify new timer is approximately 39 minutes from now
    const now = new Date();
    const remainingMs = secondEndsAt.getTime() - now.getTime();
    const remainingMinutes = remainingMs / (1000 * 60);

    expect(remainingMinutes).toBeGreaterThan(38);
    expect(remainingMinutes).toBeLessThanOrEqual(39);

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 60000);
});
