/**
 * E2E Test: Kitchen Workflow
 * 
 * Tests the complete kitchen workflow:
 * - Order arrives → kitchen updates to preparing
 * - Kitchen updates to ready → customer notified
 * - Verifies chronological ordering
 * - Verifies status transitions
 * 
 * Validates: Requirements 8.1-8.5, 9.1-9.5
 */

const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

const app = require('../../src/app');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('E2E: Kitchen Workflow', () => {
  let testFloorId;
  let testProductId;
  let cashierId;
  let order1Id, order2Id, order3Id;
  let kitchenOrder1Id, kitchenOrder2Id, kitchenOrder3Id;

  beforeAll(async () => {
    // Create test cashier
    const { data: cashier } = await supabase
      .from('users')
      .insert({
        email: `kitchen-cashier-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        full_name: 'Kitchen Test Cashier',
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
        name: `Kitchen Floor ${Date.now()}`,
        description: 'Kitchen Test Floor',
        is_active: true
      })
      .select()
      .single();
    testFloorId = floor.id;

    // Create test product
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        name: `Kitchen Category ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    const { data: product } = await supabase
      .from('products')
      .insert({
        category_id: category.id,
        name: `Kitchen Product ${Date.now()}`,
        description: 'Kitchen Test Product',
        price: 150.00,
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

  async function createPaidOrder(tableNumber) {
    // Create table
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: tableNumber,
        seats: 4,
        status: 'available',
        is_active: true
      })
      .select()
      .single();

    // Select table
    const selectionResponse = await request(app)
      .post('/api/tables/select')
      .send({ table_id: table.id })
      .expect(200);

    const tableToken = selectionResponse.body.table_token;

    // Add to cart
    await request(app)
      .post('/api/cart/add')
      .send({
        table_token: tableToken,
        product_id: testProductId,
        quantity: 2
      })
      .expect(200);

    // Create order
    const orderResponse = await request(app)
      .post('/api/orders/create')
      .send({ table_token: tableToken })
      .expect(200);

    // Request and approve payment
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

    // Wait for kitchen order creation
    await new Promise(resolve => setTimeout(resolve, 500));

    return orderResponse.body.order_id;
  }

  it('should display orders in chronological order (oldest first)', async () => {
    // Create 3 orders with slight delays to ensure different timestamps
    order1Id = await createPaidOrder(`K1-${Date.now()}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    order2Id = await createPaidOrder(`K2-${Date.now()}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    order3Id = await createPaidOrder(`K3-${Date.now()}`);

    // Wait for all kitchen orders to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get kitchen orders
    const kitchenResponse = await request(app)
      .get('/api/kitchen/orders')
      .expect(200);

    expect(kitchenResponse.body).toBeInstanceOf(Array);
    
    // Find our test orders
    const testOrders = kitchenResponse.body.filter(ko => 
      [order1Id, order2Id, order3Id].includes(ko.order_id)
    );

    expect(testOrders.length).toBeGreaterThanOrEqual(3);

    // Verify chronological ordering (oldest first)
    for (let i = 0; i < testOrders.length - 1; i++) {
      const currentTime = new Date(testOrders[i].received_at).getTime();
      const nextTime = new Date(testOrders[i + 1].received_at).getTime();
      expect(currentTime).toBeLessThanOrEqual(nextTime);
    }

    // Store kitchen order IDs for cleanup
    kitchenOrder1Id = testOrders.find(ko => ko.order_id === order1Id)?.id;
    kitchenOrder2Id = testOrders.find(ko => ko.order_id === order2Id)?.id;
    kitchenOrder3Id = testOrders.find(ko => ko.order_id === order3Id)?.id;
  }, 60000);

  it('should complete full kitchen status transition workflow', async () => {
    // Use order1 for status transitions
    expect(kitchenOrder1Id).toBeDefined();

    // Initial status should be 'received'
    const { data: initialOrder } = await supabase
      .from('kitchen_orders')
      .select('status')
      .eq('id', kitchenOrder1Id)
      .single();
    
    expect(initialOrder.status).toBe('received');

    // Step 1: Update to 'preparing'
    const preparingResponse = await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder1Id}/status`)
      .send({ new_status: 'preparing' })
      .expect(200);

    expect(preparingResponse.body.success).toBe(true);
    expect(preparingResponse.body.new_status).toBe('preparing');
    expect(preparingResponse.body.timestamp).toBeDefined();

    // Verify status updated in database
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: preparingOrder } = await supabase
      .from('kitchen_orders')
      .select('status, started_preparing_at')
      .eq('id', kitchenOrder1Id)
      .single();
    
    expect(preparingOrder.status).toBe('preparing');
    expect(preparingOrder.started_preparing_at).toBeDefined();

    // Verify main order status also updated
    const { data: mainOrder1 } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order1Id)
      .single();
    
    expect(mainOrder1.status).toBe('preparing');

    // Step 2: Update to 'ready'
    const readyResponse = await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder1Id}/status`)
      .send({ new_status: 'ready' })
      .expect(200);

    expect(readyResponse.body.success).toBe(true);
    expect(readyResponse.body.new_status).toBe('ready');

    // Verify status updated
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: readyOrder } = await supabase
      .from('kitchen_orders')
      .select('status, ready_at')
      .eq('id', kitchenOrder1Id)
      .single();
    
    expect(readyOrder.status).toBe('ready');
    expect(readyOrder.ready_at).toBeDefined();

    // Verify main order status
    const { data: mainOrder2 } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order1Id)
      .single();
    
    expect(mainOrder2.status).toBe('ready');

    // Step 3: Update to 'served'
    const servedResponse = await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder1Id}/status`)
      .send({ new_status: 'served' })
      .expect(200);

    expect(servedResponse.body.success).toBe(true);
    expect(servedResponse.body.new_status).toBe('served');

    // Verify final status
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: servedOrder } = await supabase
      .from('kitchen_orders')
      .select('status, served_at')
      .eq('id', kitchenOrder1Id)
      .single();
    
    expect(servedOrder.status).toBe('served');
    expect(servedOrder.served_at).toBeDefined();

    // Verify timestamps are in correct order
    expect(new Date(servedOrder.served_at).getTime())
      .toBeGreaterThan(new Date(readyOrder.ready_at).getTime());
    expect(new Date(readyOrder.ready_at).getTime())
      .toBeGreaterThan(new Date(preparingOrder.started_preparing_at).getTime());
  }, 60000);

  it('should only display orders with confirmed payment', async () => {
    // Create an order without payment confirmation
    const { data: table } = await supabase
      .from('tables')
      .insert({
        floor_id: testFloorId,
        table_number: `UNPAID-${Date.now()}`,
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

    const unpaidOrderId = orderResponse.body.order_id;

    // Request payment but don't approve
    await request(app)
      .post('/api/payments/cash/request')
      .send({
        order_id: unpaidOrderId,
        table_token: selectionResponse.body.table_token,
        amount: orderResponse.body.total_amount
      })
      .expect(200);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get kitchen orders
    const kitchenResponse = await request(app)
      .get('/api/kitchen/orders')
      .expect(200);

    // Verify unpaid order is NOT in kitchen
    const unpaidInKitchen = kitchenResponse.body.find(ko => ko.order_id === unpaidOrderId);
    expect(unpaidInKitchen).toBeUndefined();

    // Cleanup
    await supabase.from('tables').delete().eq('id', table.id);
  }, 30000);

  it('should filter orders by status', async () => {
    // Get all orders
    const allOrdersResponse = await request(app)
      .get('/api/kitchen/orders')
      .expect(200);

    expect(allOrdersResponse.body).toBeInstanceOf(Array);

    // Get only 'preparing' orders
    const preparingResponse = await request(app)
      .get('/api/kitchen/orders?status=preparing')
      .expect(200);

    expect(preparingResponse.body).toBeInstanceOf(Array);
    preparingResponse.body.forEach(order => {
      expect(order.status).toBe('preparing');
    });

    // Get only 'ready' orders
    const readyResponse = await request(app)
      .get('/api/kitchen/orders?status=ready')
      .expect(200);

    expect(readyResponse.body).toBeInstanceOf(Array);
    readyResponse.body.forEach(order => {
      expect(order.status).toBe('ready');
    });

    // Get only 'received' orders
    const receivedResponse = await request(app)
      .get('/api/kitchen/orders?status=received')
      .expect(200);

    expect(receivedResponse.body).toBeInstanceOf(Array);
    receivedResponse.body.forEach(order => {
      expect(order.status).toBe('received');
    });
  }, 30000);

  it('should record timestamps for each status change', async () => {
    // Use order2 for timestamp verification
    expect(kitchenOrder2Id).toBeDefined();

    // Update through all statuses
    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder2Id}/status`)
      .send({ new_status: 'preparing' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder2Id}/status`)
      .send({ new_status: 'ready' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app)
      .put(`/api/kitchen/orders/${kitchenOrder2Id}/status`)
      .send({ new_status: 'served' })
      .expect(200);

    // Verify all timestamps are recorded
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: order } = await supabase
      .from('kitchen_orders')
      .select('received_at, started_preparing_at, ready_at, served_at')
      .eq('id', kitchenOrder2Id)
      .single();

    expect(order.received_at).toBeDefined();
    expect(order.started_preparing_at).toBeDefined();
    expect(order.ready_at).toBeDefined();
    expect(order.served_at).toBeDefined();

    // Verify timestamps are in chronological order
    const receivedTime = new Date(order.received_at).getTime();
    const preparingTime = new Date(order.started_preparing_at).getTime();
    const readyTime = new Date(order.ready_at).getTime();
    const servedTime = new Date(order.served_at).getTime();

    expect(preparingTime).toBeGreaterThan(receivedTime);
    expect(readyTime).toBeGreaterThan(preparingTime);
    expect(servedTime).toBeGreaterThan(readyTime);
  }, 60000);
});
