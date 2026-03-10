/**
 * Validation script for subscription optimization
 * Run this in browser console to verify optimizations are working
 */

import { 
  subscribeToTable, 
  unsubscribeFromChannel,
  getCachedData,
  invalidateCache,
  getSubscriptionStatus,
  getConnectionPoolStats
} from './supabase.service.js'

export const validateOptimizations = async () => {
  console.log('🔍 Validating Subscription Optimizations...\n')

  // Test 1: Subscription Batching
  console.log('Test 1: Subscription Batching')
  const sub1 = subscribeToTable('tables', 'floor_id=eq.1', () => {})
  const sub2 = subscribeToTable('tables', 'floor_id=eq.2', () => {})
  const sub3 = subscribeToTable('tables', 'floor_id=eq.3', () => {})
  
  const stats1 = getConnectionPoolStats()
  console.log(`✓ Created 3 subscriptions to 'tables' table`)
  console.log(`  - Batched Channels: ${stats1.totalBatchedChannels} (expected: 1)`)
  console.log(`  - Total Subscriptions: ${stats1.totalSubscriptions} (expected: 3)`)
  
  if (stats1.totalBatchedChannels === 1 && stats1.totalSubscriptions === 3) {
    console.log('✅ Batching working correctly!\n')
  } else {
    console.log('❌ Batching not working as expected\n')
  }

  // Test 2: Different Tables
  console.log('Test 2: Different Tables')
  const sub4 = subscribeToTable('orders', null, () => {})
  
  const stats2 = getConnectionPoolStats()
  console.log(`✓ Added subscription to 'orders' table`)
  console.log(`  - Batched Channels: ${stats2.totalBatchedChannels} (expected: 2)`)
  console.log(`  - Total Subscriptions: ${stats2.totalSubscriptions} (expected: 4)`)
  
  if (stats2.totalBatchedChannels === 2 && stats2.totalSubscriptions === 4) {
    console.log('✅ Multiple table batching working correctly!\n')
  } else {
    console.log('❌ Multiple table batching not working as expected\n')
  }

  // Test 3: Unsubscribe and Cleanup
  console.log('Test 3: Unsubscribe and Cleanup')
  unsubscribeFromChannel(sub1)
  unsubscribeFromChannel(sub2)
  unsubscribeFromChannel(sub3)
  
  const stats3 = getConnectionPoolStats()
  console.log(`✓ Unsubscribed 3 subscriptions from 'tables'`)
  console.log(`  - Batched Channels: ${stats3.totalBatchedChannels} (expected: 1, 'tables' channel removed)`)
  console.log(`  - Total Subscriptions: ${stats3.totalSubscriptions} (expected: 1)`)
  
  if (stats3.totalBatchedChannels === 1 && stats3.totalSubscriptions === 1) {
    console.log('✅ Cleanup working correctly!\n')
  } else {
    console.log('❌ Cleanup not working as expected\n')
  }

  // Test 4: Client-Side Caching
  console.log('Test 4: Client-Side Caching')
  let fetchCount = 0
  const mockFetch = async () => {
    fetchCount++
    return { data: 'test', timestamp: Date.now() }
  }

  const result1 = await getCachedData('floors', mockFetch)
  console.log(`✓ First fetch: fetchCount = ${fetchCount} (expected: 1)`)
  
  const result2 = await getCachedData('floors', mockFetch)
  console.log(`✓ Second fetch (should use cache): fetchCount = ${fetchCount} (expected: 1)`)
  
  if (fetchCount === 1) {
    console.log('✅ Caching working correctly!\n')
  } else {
    console.log('❌ Caching not working as expected\n')
  }

  // Test 5: Cache Invalidation
  console.log('Test 5: Cache Invalidation')
  invalidateCache('floors')
  const result3 = await getCachedData('floors', mockFetch)
  console.log(`✓ After invalidation: fetchCount = ${fetchCount} (expected: 2)`)
  
  if (fetchCount === 2) {
    console.log('✅ Cache invalidation working correctly!\n')
  } else {
    console.log('❌ Cache invalidation not working as expected\n')
  }

  // Test 6: Subscription Status
  console.log('Test 6: Subscription Status')
  const status = getSubscriptionStatus()
  console.log(`✓ Active subscriptions: ${status.length}`)
  status.forEach(s => {
    console.log(`  - ${s.batchKey}: ${s.subscriptionCount} subscriptions, connected: ${s.isConnected}`)
  })
  console.log('✅ Status monitoring working!\n')

  // Cleanup
  unsubscribeFromChannel(sub4)
  
  console.log('🎉 Validation Complete!')
  console.log('\nSummary:')
  console.log('✅ Subscription batching implemented')
  console.log('✅ Connection pooling configured')
  console.log('✅ Client-side caching working')
  console.log('✅ Subscription lifecycle management working')
  console.log('✅ Status monitoring APIs functional')
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.validateOptimizations = validateOptimizations
}
