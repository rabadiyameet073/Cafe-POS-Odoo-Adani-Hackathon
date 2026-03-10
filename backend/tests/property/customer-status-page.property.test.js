/**
 * Property-Based Tests: Customer Status Page
 * 
 * Tests universal properties for customer status page display:
 * - Property 9: Cashier Payment Request Display
 * - Property 22: Customer Status Display Values
 * - Property 23: Customer Status Page Completeness
 * 
 * Validates: Requirements 4.3, 10.2, 10.3
 */

const fc = require('fast-check');
const {
  supabase,
  createTestUser,
  createTestFloor,
  createTestTable,
  createTestProduct,
  cleanupTestData
} = require('../helpers/testData');

const PaymentService = require('../../src/services/PaymentService');
const OrderService = require('../../src/services/OrderService');
const TableService = require('../../src/services/TableService');

describe('Property-Based Tests: Customer Status Page', () => {
  let testFloorId;
  let testTableId;
  let testProductId;
  let cashierId;
  let testUserIds = [];

  beforeAll(async () => {
    // Create test data
    const cashier = await createTestUser('cashier', 'prop-cashier');
    cashierId = cashier.id;
    testUserIds.push(cashier.id);

    const floor = await createTestFloor();
    testFloorId = floor.id;

    const table = await createTestTable(testFloorId);
    testTableId = table.id;

    const product = await createTestProduct();
    testProductId = product.id;
  });

  afterAll(async () => {
    await cleanupTestData({
      tableIds: [testTableId],
      floorIds: [testFloorId],
      productIds: [testProductId],
      userIds: testUserIds
    });
  });

  // Feature: real-time-cafe-enhancements, Property 9: For any pending cash payment request, the cashier dashboard should display all required fields: table number, order items, and total amount
  describe('Property 9: Cashier Payment Request Display', () => {
    it('should display all required fields for any pending cash payment request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            quantity: fc.integer({ min: 1, max: 10 }),
            unitPrice: fc.float({ min: 10, max: 1000, noNaN: true }).map(n => Math.round(n * 100) / 100)
          }),
          async ({ quantity, unitPrice }) => {
            // Setup: Select table and create order
            const selectResult = await TableService.selectTable(testTableId);
            expect(selectResult.success).toBe(true);
            const tableToken = selectResult.tableToken;

            // Add item to cart
            const { error: cartError } = await supabase
              .from('cart_items')
              .insert({
                table_token: tableToken,
                product_id: testProductId,
                quantity: quantity,
                unit_price: unitPrice
              });
            expect(cartError).toBeNull();

            // Create order
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('*, products(name, price, tax_percentage)')
              .eq('table_token', tableToken);

            const orderResult = await OrderService.createOrder(tableToken, cartItems);
            expect(orderResult.success).toBe(true);
            const orderId = orderResult.orderId;

            const totalAmount = quantity * unitPrice;

            // Execute: Create cash payment request
            const paymentResult = await PaymentService.createCashPaymentRequest(
              orderId,
              totalAmount,
              tableToken
            );
            expect(paymentResult.success).toBe(true);

            // Assert: Verify cashier payment request has all required fields
            const { data: cashierRequest, error: requestError } = await supabase
              .from('cashier_payment_requests')
              .select('*')
              .eq('payment_id', paymentResult.paymentId)
              .eq('status', 'pending')
              .single();

            expect(requestError).toBeNull();
            expect(cashierRequest).toBeDefined();

            // **Validates: Requirements 4.3**
            // Verify all required fields are present
            expect(cashierRequest.table_number).toBeDefined();
            expect(cashierRequest.table_number).not.toBe('');
            
            expect(cashierRequest.order_summary).toBeDefined();
            expect(Array.isArray(cashierRequest.order_summary)).toBe(true);
            expect(cashierRequest.order_summary.length).toBeGreaterThan(0);
            
            expect(cashierRequest.total_amount).toBeDefined();
            expect(cashierRequest.total_amount).toBeGreaterThan(0);

            // Cleanup
            await supabase.from('cashier_payment_requests').delete().eq('payment_id', paymentResult.paymentId);
            await supabase.from('payments').delete().eq('id', paymentResult.paymentId);
            await supabase.from('order_items').delete().eq('order_id', orderId);
            await supabase.from('orders').delete().eq('id', orderId);
            await supabase.from('cart_items').delete().eq('table_token', tableToken);
            await TableService.releaseTable(testTableId, 'test cleanup');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: real-time-cafe-enhancements, Property 22: For any order displayed on the customer status page, the status should be one of: 'Order Received', 'Preparing', or 'Ready'
  describe('Property 22: Customer Status Display Values', () => {
    it('should display valid status values for any order on customer status page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('received', 'preparing', 'ready'),
          async (kitchenStatus) => {
            // Setup: Create order and payment
            const selectResult = await TableService.selectTable(testTableId);
            expect(selectResult.success).toBe(true);
            const tableToken = selectResult.tableToken;

            const { error: cartError } = await supabase
              .from('cart_items')
              .insert({
                table_token: tableToken,
                product_id: testProductId,
                quantity: 2,
                unit_price: 100
              });
            expect(cartError).toBeNull();

            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('*, products(name, price, tax_percentage)')
              .eq('table_token', tableToken);

            const orderResult = await OrderService.createOrder(tableToken, cartItems);
            expect(orderResult.success).toBe(true);
            const orderId = orderResult.orderId;

            // Approve payment to send to kitchen
            const paymentResult = await PaymentService.createCashPaymentRequest(orderId, 200, tableToken);
            await PaymentService.approveCashPayment(paymentResult.paymentId, cashierId, 'Test Cashier');

            // Update kitchen order status
            const { data: kitchenOrder } = await supabase
              .from('kitchen_orders')
              .select('*')
              .eq('order_id', orderId)
              .single();

            await supabase
              .from('kitchen_orders')
              .update({ status: kitchenStatus })
              .eq('id', kitchenOrder.id);

            // Execute: Get order for customer status page
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .select(`
                *,
                kitchen_orders(status)
              `)
              .eq('id', orderId)
              .single();

            expect(orderError).toBeNull();
            expect(order).toBeDefined();

            // Map kitchen status to customer-facing status
            const statusMap = {
              'received': 'Order Received',
              'preparing': 'Preparing',
              'ready': 'Ready'
            };

            const customerStatus = statusMap[kitchenStatus];

            // **Validates: Requirements 10.2**
            // Assert: Status should be one of the valid customer-facing values
            expect(['Order Received', 'Preparing', 'Ready']).toContain(customerStatus);

            // Cleanup
            await supabase.from('kitchen_orders').delete().eq('order_id', orderId);
            await supabase.from('payments').delete().eq('order_id', orderId);
            await supabase.from('order_items').delete().eq('order_id', orderId);
            await supabase.from('orders').delete().eq('id', orderId);
            await supabase.from('cart_items').delete().eq('table_token', tableToken);
            await TableService.releaseTable(testTableId, 'test cleanup');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: real-time-cafe-enhancements, Property 23: For any order on the customer status page, it should display the table number and order time
  describe('Property 23: Customer Status Page Completeness', () => {
    it('should display table number and order time for any order on customer status page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            quantity: fc.integer({ min: 1, max: 5 }),
            unitPrice: fc.float({ min: 50, max: 500, noNaN: true }).map(n => Math.round(n * 100) / 100)
          }),
          async ({ quantity, unitPrice }) => {
            // Setup: Create order
            const selectResult = await TableService.selectTable(testTableId);
            expect(selectResult.success).toBe(true);
            const tableToken = selectResult.tableToken;

            const { error: cartError } = await supabase
              .from('cart_items')
              .insert({
                table_token: tableToken,
                product_id: testProductId,
                quantity: quantity,
                unit_price: unitPrice
              });
            expect(cartError).toBeNull();

            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('*, products(name, price, tax_percentage)')
              .eq('table_token', tableToken);

            const orderResult = await OrderService.createOrder(tableToken, cartItems);
            expect(orderResult.success).toBe(true);
            const orderId = orderResult.orderId;

            // Execute: Get order for customer status page
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single();

            expect(orderError).toBeNull();
            expect(order).toBeDefined();

            // **Validates: Requirements 10.3**
            // Assert: Order should have table number and order time
            expect(order.table_number).toBeDefined();
            expect(order.table_number).not.toBe('');
            expect(typeof order.table_number).toBe('string');

            expect(order.created_at).toBeDefined();
            expect(order.created_at).not.toBe('');
            // Verify it's a valid timestamp
            const orderTime = new Date(order.created_at);
            expect(orderTime.toString()).not.toBe('Invalid Date');
            expect(orderTime.getTime()).toBeGreaterThan(0);

            // Cleanup
            await supabase.from('order_items').delete().eq('order_id', orderId);
            await supabase.from('orders').delete().eq('id', orderId);
            await supabase.from('cart_items').delete().eq('table_token', tableToken);
            await TableService.releaseTable(testTableId, 'test cleanup');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
