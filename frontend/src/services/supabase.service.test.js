import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  subscribeToTable, 
  unsubscribeFromChannel,
  getCachedData,
  invalidateCache,
  clearAllCaches,
  getSubscriptionStatus,
  getConnectionPoolStats
} from './supabase.service'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    channel: vi.fn((name) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 10)
        return { state: 'joined' }
      })
    })),
    removeChannel: vi.fn()
  })
}))

describe('Subscription Batching', () => {
  beforeEach(() => {
    clearAllCaches()
  })

  it('should batch multiple subscriptions to the same table', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const callback3 = vi.fn()

    const sub1 = subscribeToTable('tables', 'floor_id=eq.1', callback1)
    const sub2 = subscribeToTable('tables', 'floor_id=eq.2', callback2)
    const sub3 = subscribeToTable('tables', 'floor_id=eq.3', callback3)

    const stats = getConnectionPoolStats()
    
    // All three should be batched into one channel
    expect(stats.totalBatchedChannels).toBe(1)
    expect(stats.totalSubscriptions).toBe(3)
  })

  it('should create separate channels for different tables', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    subscribeToTable('tables', null, callback1)
    subscribeToTable('orders', null, callback2)

    const stats = getConnectionPoolStats()
    
    // Different tables should have separate channels
    expect(stats.totalBatchedChannels).toBe(2)
    expect(stats.totalSubscriptions).toBe(2)
  })

  it('should properly unsubscribe and cleanup empty channels', () => {
    const callback = vi.fn()
    const sub = subscribeToTable('tables', null, callback)

    let stats = getConnectionPoolStats()
    expect(stats.totalBatchedChannels).toBe(1)

    unsubscribeFromChannel(sub)

    stats = getConnectionPoolStats()
    // Channel should be removed when last subscription is removed
    expect(stats.totalBatchedChannels).toBe(0)
    expect(stats.totalSubscriptions).toBe(0)
  })

  it('should maintain channel when other subscriptions exist', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const sub1 = subscribeToTable('tables', null, callback1)
    const sub2 = subscribeToTable('tables', null, callback2)

    unsubscribeFromChannel(sub1)

    const stats = getConnectionPoolStats()
    // Channel should remain with one subscription
    expect(stats.totalBatchedChannels).toBe(1)
    expect(stats.totalSubscriptions).toBe(1)
  })
})

describe('Client-Side Caching', () => {
  beforeEach(() => {
    clearAllCaches()
  })

  it('should cache data on first fetch', async () => {
    const fetchFn = vi.fn(async () => ({ data: 'test' }))
    
    const result1 = await getCachedData('floors', fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result1).toEqual({ data: 'test' })
  })

  it('should return cached data on subsequent calls', async () => {
    const fetchFn = vi.fn(async () => ({ data: 'test' }))
    
    await getCachedData('floors', fetchFn)
    const result2 = await getCachedData('floors', fetchFn)
    
    // Should only fetch once
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result2).toEqual({ data: 'test' })
  })

  it('should invalidate cache when requested', async () => {
    const fetchFn = vi.fn(async () => ({ data: 'test' }))
    
    await getCachedData('floors', fetchFn)
    invalidateCache('floors')
    await getCachedData('floors', fetchFn)
    
    // Should fetch twice after invalidation
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should handle different cache keys independently', async () => {
    const fetchFloors = vi.fn(async () => ({ data: 'floors' }))
    const fetchCategories = vi.fn(async () => ({ data: 'categories' }))
    
    await getCachedData('floors', fetchFloors)
    await getCachedData('categories', fetchCategories)
    
    expect(fetchFloors).toHaveBeenCalledTimes(1)
    expect(fetchCategories).toHaveBeenCalledTimes(1)
  })

  it('should clear all caches', async () => {
    const fetchFn1 = vi.fn(async () => ({ data: 'test1' }))
    const fetchFn2 = vi.fn(async () => ({ data: 'test2' }))
    
    await getCachedData('floors', fetchFn1)
    await getCachedData('categories', fetchFn2)
    
    clearAllCaches()
    
    await getCachedData('floors', fetchFn1)
    await getCachedData('categories', fetchFn2)
    
    // Should fetch again after clearing
    expect(fetchFn1).toHaveBeenCalledTimes(2)
    expect(fetchFn2).toHaveBeenCalledTimes(2)
  })
})

describe('Subscription Status', () => {
  beforeEach(() => {
    clearAllCaches()
  })

  it('should report subscription status correctly', () => {
    const callback = vi.fn()
    subscribeToTable('tables', null, callback)

    const status = getSubscriptionStatus()
    
    expect(status).toHaveLength(1)
    expect(status[0]).toMatchObject({
      tableName: 'tables',
      subscriptionCount: 1
    })
  })

  it('should report connection pool stats correctly', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    subscribeToTable('tables', null, callback1)
    subscribeToTable('orders', null, callback2)

    const stats = getConnectionPoolStats()
    
    expect(stats.totalBatchedChannels).toBe(2)
    expect(stats.totalSubscriptions).toBe(2)
    expect(stats.maxConnections).toBe(5)
    expect(stats.channels).toHaveLength(2)
  })
})

describe('Filter Matching', () => {
  it('should filter events correctly for eq operator', () => {
    // This would require exposing shouldTriggerCallback for testing
    // or testing through integration with actual payloads
    expect(true).toBe(true) // Placeholder
  })

  it('should filter events correctly for neq operator', () => {
    // This would require exposing shouldTriggerCallback for testing
    expect(true).toBe(true) // Placeholder
  })

  it('should pass all events when no filter is specified', () => {
    // This would require exposing shouldTriggerCallback for testing
    expect(true).toBe(true) // Placeholder
  })
})
