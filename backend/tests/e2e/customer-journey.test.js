/**
 * E2E Test: Complete Customer Journey
 * 
 * Tests the full flow from table selection to order completion:
 * - Select floor → select table → add to cart → checkout
 * - Cash payment → cashier approval → kitchen receives order
 * - Order status updates → timer expires → table freed
 * 
 * Validates: Requirements 20.1
 */

const request = require('supertest');
const {
  supabase,
  createTestUser,
  createTestFloor,
  createTestTable,
  createTestProduct,
  cleanupTestData
} = require('../helpers/testData');

// Import app without starting server
const app = require('../../src/app');

describe('E2E: Complete Customer Journey', () => {
  let testFloorId;
  let testTableId;
  let testProductId;
  let tableToken;
  let orderId;
  let paymentId;
  let cashierId;

  beforeAll(async () => {
    try {
      // Create test cashier user
      const cashier = await createTestUser('cashier', 'journey-cashier');
      cashierId = cashier.id;

      // Create test floor
      const floor = await createTestFloor();
      testFloorId = floor.id;

      // Create test table
      const table = await createTestTable(testFloorId);
      testTableId = table.id;

      // Create test product
      const product = await createTestProduct();
      testProductId = product.id;
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData({
      tableIds: [testTableId],
      floorIds: [testFloorId],
      productIds: [testProductId],
      userIds: [cashierId]
    });
  });

  it('should complete full customer journey with cash payment', async () => {
    // Step 1: Select floor
    const floorsResponse = await request(app)
      .get('/api/floors')
      .expect(200);
    
    expect(floorsResponse.body).toBeInstanceOf(Array);
    const floor = floorsResponse.body.find(f => f.id === testFloorId);
    expect(floor).toBeDefined();

    // Step 2: Get available tables for floor
    const tablesResponse = await request(app)
      .get(`/api/floors/${testFloorId}/tables`)
      .expect(200);
    
    expect(tablesResponse.body).toBeInstanceOf(Array);
    const availableTable = tablesResponse.body.find(t => t.id === testTableId && t.status === 'available');
    expect(availableTable).toBeDefined();

    // Step 3: Select table
    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: testTableId })
      .expect(200);
    
    expect(selectionResponse.body.table_token).toMatch(/^TBL[A-Z0-9]{8}$/);
    tableToken = selectionResponse.body.table_token;

    // Verify table status changed to occupied (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: updatedTable } = await supabase
      .from('tables')
      .select('status')
      .eq('id', testTableId)
      .single();
    expect(updatedTable.status).toBe('occupied');

    // Step 4: Add items to cart
    const cartResponse = await request(app)
      .post('/api/cart/add')
      .send({
        table_token: tableToken,
        product_id: testProductId,
        quantity: 2
      })
      .expect(200);
    
    expect(cartResponse.body.quantity).toBe(2);

    // Step 5: Checkout - create order
    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: tableToken })
      .expect(200);
    
    expect(orderResponse.body.order_id).toBeDefined();
    expect(orderResponse.body.total_amount).toBeGreaterThan(0);
    orderId = orderResponse.body.order_id;

    // Step 6: Request cash payment
    const paymentResponse = await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: orderId,
        table_token: tableToken,
        amount: orderResponse.body.total_amount
      })
      .expect(200);
    
    expect(paymentResponse.body.payment_id).toBeDefined();
    expect(paymentResponse.body.status).toBe('pending_approval');
    paymentId = paymentResponse.body.payment_id;

    // Verify cashier receives payment request (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: paymentRequest } = await supabase
      .from('cashier_payment_requests')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
    expect(paymentRequest).toBeDefined();
    expect(paymentRequest.status).toBe('pending');

    // Step 7: Cashier approves payment
    const approvalResponse = await request(app)
      .post('/api/payments/cash/approve')
      .send({
        payment_id: paymentId,
        cashier_id: cashierId
      })
      .expect(200);
    
    expect(approvalResponse.body.success).toBe(true);
    expect(approvalResponse.body.timer_ends_at).toBeDefined();

    // Verify payment confirmed (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: confirmedPayment } = await supabase
      .from('payments')
      .select('status, payment_confirmed_at')
      .eq('id', paymentId)
      .single();
    expect(confirmedPayment.status).toBe('approved');
    expect(confirmedPayment.payment_confirmed_at).toBeDefined();

    // Step 8: Verify kitchen receives order (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: kitchenOrder } = await supabase
      .from('kitchen_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    expect(kitchenOrder).toBeDefined();
    expect(kitchenOrder.status).toBe('received');

    // Step 9: Kitchen updates order status to preparing
    const preparingResponse = await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder.id}/status`)
      .send({ new_status: 'preparing' })
      .expect(200);
    
    expect(preparingResponse.body.new_status).toBe('preparing');

    // Verify order status updated (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: preparingOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
    expect(preparingOrder.status).toBe('preparing');

    // Step 10: Kitchen updates order status to ready
    const readyResponse = await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder.id}/status`)
      .send({ new_status: 'ready' })
      .expect(200);
    
    expect(readyResponse.body.new_status).toBe('ready');

    // Verify order status updated (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: readyOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
    expect(readyOrder.status).toBe('ready');

    // Step 11: Verify timer is running
    const { data: session } = await supabase
      .from('table_sessions')
      .select('timer_status, timer_started_at, timer_ends_at')
      .eq('table_token', tableToken)
      .single();
    expect(session.timer_status).toBe('running');
    expect(session.timer_started_at).toBeDefined();
    expect(session.timer_ends_at).toBeDefined();

    // Step 12: Simulate timer expiration (for testing, we'll manually release the table)
    // In production, this would be handled by the background job
    const releaseResponse = await request(app)
      .post('/api/tables/release')
      .send({
        table_id: testTableId,
        admin_id: cashierId, // Using cashier as admin for test
        reason: 'timer_expired'
      })
      .expect(200);
    
    expect(releaseResponse.body.success).toBe(true);

    // Verify table is freed (real-time update simulation)
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: freedTable } = await supabase
      .from('tables')
      .select('status, qr_code_token')
      .eq('id', testTableId)
      .single();
    expect(freedTable.status).toBe('available');
    expect(freedTable.qr_code_token).toBeNull();
  }, 60000); // 60 second timeout for complete journey

  it('should verify all state transitions occur within 2 seconds', async () => {
    // This test verifies real-time update performance
    // Create a new table for this test
    const testTable = await createTestTable(testFloorId, `RT${Date.now()}`);

    // Subscribe to table changes
    let updateReceived = false;
    let updateTime = null;
    
    const channel = supabase
      .channel('test-table-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${testTable.id}` },
        (payload) => {
          updateReceived = true;
          updateTime = Date.now();
        }
      )
      .subscribe();

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Trigger table selection
    const startTime = Date.now();
    await request(app)
      .post('/api/tables/select')
      .send({ table_id: testTable.id })
      .expect(200);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Verify update received within 2 seconds
    expect(updateReceived).toBe(true);
    if (updateTime) {
      const latency = updateTime - startTime;
      expect(latency).toBeLessThan(2000);
    }

    // Cleanup
    await channel.unsubscribe();
    await supabase.from('tables').delete().eq('id', testTable.id);
  }, 30000);
});
