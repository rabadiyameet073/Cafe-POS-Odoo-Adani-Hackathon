/**
 * Test Data Helpers
 * 
 * Utilities for creating and managing test data
 */

const { db } = require('../../src/config/db');

/**
 * Create a test user with proper error handling
 */
async function createTestUser(role = 'customer', emailPrefix = 'test') {
  try {
    const { data, error } = await db
      .from('users')
      .insert({
        email: `${emailPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
        password_hash: '$2a$10$test.hash.for.testing.purposes.only',
        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: role,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating test ${role}:`, error);
      // If user creation fails, try to find an existing user with that role
      const { data: existingUser } = await db
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (existingUser) {
        console.log(`Using existing ${role} user:`, existingUser.id);
        return existingUser;
      }
      
      throw new Error(`Failed to create or find test ${role}: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error(`Exception creating test user:`, err);
    throw err;
  }
}

/**
 * Create a test floor
 */
async function createTestFloor(name = null) {
  const { data, error } = await db
    .from('floors')
    .insert({
      name: name || `Test Floor ${Date.now()}`,
      description: 'E2E Test Floor',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test floor: ${error.message}`);
  }

  return data;
}

/**
 * Create a test table
 */
async function createTestTable(floorId, tableNumber = null) {
  const { data, error } = await db
    .from('tables')
    .insert({
      floor_id: floorId,
      table_number: tableNumber || `T${Date.now()}`,
      seats: 4,
      status: 'available',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test table: ${error.message}`);
  }

  return data;
}

/**
 * Create a test product
 */
async function createTestProduct(categoryId = null, price = 100.00) {
  let catId = categoryId;
  
  if (!catId) {
    const { data: category, error: catError } = await db
      .from('product_categories')
      .insert({
        name: `Test Category ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    if (catError) {
      throw new Error(`Failed to create test category: ${catError.message}`);
    }
    
    catId = category.id;
  }

  const { data, error } = await db
    .from('products')
    .insert({
      category_id: catId,
      name: `Test Product ${Date.now()}`,
      description: 'E2E Test Product',
      price: price,
      is_available: true,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test product: ${error.message}`);
  }

  return data;
}

/**
 * Cleanup test data
 */
async function cleanupTestData(ids) {
  const { tableIds = [], floorIds = [], productIds = [], userIds = [] } = ids;

  // Delete in reverse order of dependencies
  for (const id of tableIds) {
    await db.from('tables').delete().eq('id', id);
  }

  for (const id of floorIds) {
    await db.from('floors').delete().eq('id', id);
  }

  for (const id of productIds) {
    await db.from('products').delete().eq('id', id);
  }

  for (const id of userIds) {
    await db.from('users').delete().eq('id', id);
  }
}

/**
 * Ensure UPI payment method exists
 */
async function ensureUPIPaymentMethod() {
  const { data: existing } = await db
    .from('payment_methods')
    .select('*')
    .eq('name', 'upi')
    .single();

  if (!existing) {
    const { data, error } = await db
      .from('payment_methods')
      .insert({
        name: 'upi',
        display_name: 'UPI Payment',
        is_enabled: true,
        upi_id: 'testmerchant@upi',
        merchant_name: 'Test Cafe'
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not create UPI payment method:', error.message);
    }

    return data;
  }

  return existing;
}

module.exports = {
  db,
  createTestUser,
  createTestFloor,
  createTestTable,
  createTestProduct,
  cleanupTestData,
  ensureUPIPaymentMethod
};
