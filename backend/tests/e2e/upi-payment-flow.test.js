/**
 * E2E Test: UPI Payment Flow
 * 
 * Tests the complete UPI payment flow:
 * - Select table → add to cart → checkout
 * - UPI QR generation → payment verification
 * - Kitchen receives order → order completion
 * 
 * Validates: Requirements 6.1-6.5, 7.1-7.5
 */

const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

const app = require('../../src/app');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('E2E: UPI Payment Flow', () => {
  let testFloorId;
  let testTableId;
  let testProductId;
  let tableToken;
  let orderId;
  let paymentId;
  let transactionRef;

  beforeAll(async () => {
    // Create test floor
    const { data: floor } = await supabase
      .from('floors')
      .insert({
        name: `UPI Test Floor ${Date.now()}`,
        description: 'UPI E2E Test Floor',
        is_active: true
      })
      .select()
      .single();
    testFloorId = floor.id;

    // Create test table
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `UPI${Date.now()}`,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();
    testTableId = table.id;

    // Create test product
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        name: `UPI Category ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    const { data: product } = await supabase
      .from('products')
      .insert({
        category_id: category.id,
        name: `UPI Product ${Date.now()}`,
        description: 'UPI Test Product',
        price: 250.00,
        is_available: true,
        is_active: true
      })
      .select()
      .single();
    testProductId = product.id;

    // Ensure UPI payment method exists
    const { data: existingUPI } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('name', 'upi')
      .single();

    if (!existingUPI) {
      await supabase
        .from('payment_methods')
        .insert({
          name: 'upi',
          display_name: 'UPI Payment',
          is_enabled: true,
          upi_id: 'testmerchant@upi',
          merchant_name: 'Test Cafe'
        });
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testTableId) {
      await supabase.from('tables').delete().eq('id', testTableId);
    }
    if (testFloorId) {
      await supabase.from('floors').delete().eq('id', testFloorId);
    }
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }
  });

  it('should complete full UPI payment flow', async () => {
    // Step 1: Select table
    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: testTableId })
      .expect(200);
    
    tableToken = selectionResponse.body.table_token;
    expect(tableToken).toMatch(/^TBL[A-Z0-9]{8}$/);

    // Step 2: Add items to cart
    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: tableToken,
        product_id: testProductId,
        quantity: 3
      })
      .expect(200);

    // Step 3: Create order
    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: tableToken })
      .expect(200);
    
    orderId = orderResponse.body.order_id;
    const orderAmount = orderResponse.body.total_amount;

    // Step 4: Generate UPI QR code
    const qrResponse = await request(app)
      .post('/api/payments/upi/generate-qr')
      .send({
        order_id: orderId,
        table_token: tableToken,
        amount: orderAmount
      })
      .expect(200);
    
    expect(qrResponse.body.payment_id).toBeDefined();
    expect(qrResponse.body.qr_code_data).toBeDefined();
    expect(qrResponse.body.transaction_ref).toBeDefined();
    expect(qrResponse.body.expires_at).toBeDefined();
    
    paymentId = qrResponse.body.payment_id;
    transactionRef = qrResponse.body.transaction_ref;

    // Verify QR code format (UPI standard)
    const qrData = qrResponse.body.qr_code_data;
    expect(qrData).toMatch(/^upi:\/\/pay\?/);
    expect(qrData).toContain('pa=');
    expect(qrData).toContain('pn=');
    expect(qrData).toContain('am=');
    expect(qrData).toContain('tr=');
    expect(qrData).toContain('tn=');
    expect(qrData).toContain('cu=INR');

    // Verify amount in QR code
    const amountMatch = qrData.match(/am=([\d.]+)/);
    expect(amountMatch).toBeDefined();
    expect(parseFloat(amountMatch[1])).toBeCloseTo(orderAmount, 2);

    // Verify transaction reference in QR code
    expect(qrData).toContain(transactionRef);

    // Step 5: Simulate UPI payment verification
    const verifyResponse = await request(app)
      .post('/api/payments/upi/verify')
      .send({
        transaction_id: `UPI${Date.now()}`,
        order_id: orderId,
        amount: orderAmount,
        upi_reference: transactionRef
      })
      .expect(200);
    
    expect(verifyResponse.body.success).toBe(true);
    expect(verifyResponse.body.timer_ends_at).toBeDefined();

    // Verify payment status updated
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: payment } = await supabase
      .from('payments')
      .select('status, payment_method, cashier_name, payment_confirmed_at')
      .eq('id', paymentId)
      .single();
    
    expect(payment.status).toBe('completed');
    expect(payment.payment_method).toBe('upi');
    expect(payment.cashier_name).toBe('UPI'); // UPI payments show "UPI" instead of cashier name
    expect(payment.payment_confirmed_at).toBeDefined();

    // Step 6: Verify kitchen receives order
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: kitchenOrder } = await supabase
      .from('kitchen_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    expect(kitchenOrder).toBeDefined();
    expect(kitchenOrder.status).toBe('received');
    expect(kitchenOrder.payment_method).toBe('upi');

    // Step 7: Kitchen updates to preparing
    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder.id}/status`)
      .send({ new_status: 'preparing' })
      .expect(200);

    // Step 8: Kitchen updates to ready
    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder.id}/status`)
      .send({ new_status: 'ready' })
      .expect(200);

    // Step 9: Mark as served (order completion)
    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder.id}/status`)
      .send({ new_status: 'served' })
      .expect(200);

    // Verify final order status
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: finalOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
    
    expect(finalOrder.status).toBe('served');

    // Verify timer is running
    const { data: session } = await supabase
      .from('table_sessions')
      .select('timer_status, timer_started_at')
      .eq('table_token', tableToken)
      .single();
    
    expect(session.timer_status).toBe('running');
    expect(session.timer_started_at).toBeDefined();
  }, 60000);

  it('should validate QR code format for all UPI apps', async () => {
    // Create a minimal order for QR testing
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `QR${Date.now()}`,
        seats: 2,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    const token = selectionResponse.body.table_token;

    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: token,
        product_id: testProductId,
        quantity: 1
      })
      .expect(200);

    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: token })
      .expect(200);

    const qrResponse = await request(app)
      .post('/api/payments/upi/generate-qr')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: token,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    const qrData = qrResponse.body.qr_code_data;

    // Verify UPI standard format (compatible with GPay, PhonePe, Paytm, etc.)
    expect(qrData).toMatch(/^upi:\/\/pay\?pa=[^&]+&pn=[^&]+&am=[\d.]+&tr=[^&]+&tn=[^&]+&cu=INR$/);

    // Verify all required parameters are present
    const params = new URLSearchParams(qrData.split('?')[1]);
    expect(params.get('pa')).toBeTruthy(); // Payee address
    expect(params.get('pn')).toBeTruthy(); // Payee name
    expect(params.get('am')).toBeTruthy(); // Amount
    expect(params.get('tr')).toBeTruthy(); // Transaction reference
    expect(params.get('tn')).toBeTruthy(); // Transaction note
    expect(params.get('cu')).toBe('INR'); // Currency

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 30000);

  it('should reject payment verification with mismatched amount', async () => {
    // Create order
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `AMT${Date.now()}`,
        seats: 2,
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

    const qrResponse = await request(app)
      .post('/api/payments/upi/generate-qr')
      .send({
        order_id: orderResponse.body.order_id,
        table_token: selectionResponse.body.table_token,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    // Attempt verification with wrong amount
    const verifyResponse = await request(app)
      .post('/api/payments/upi/verify')
      .send({
        transaction_id: `UPI${Date.now()}`,
        order_id: orderResponse.body.order_id,
        amount: orderResponse.body.total_amount + 100, // Wrong amount
        upi_reference: qrResponse.body.transaction_ref
      })
      .expect(400);

    expect(verifyResponse.body.error).toBeDefined();

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 30000);
});
