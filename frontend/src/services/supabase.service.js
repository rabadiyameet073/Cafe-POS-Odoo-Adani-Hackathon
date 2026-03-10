import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://smxqcotsqhiofecfzykg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ZJRurFT273UXU5qQvriVVA_P5wE6W6I'

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  maxConnections: 5, // Limit concurrent WebSocket connections
  connectionTimeout: 30000, // 30 seconds
  heartbeatInterval: 15000 // 15 seconds
}

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: CONNECTION_POOL_CONFIG.heartbeatInterval,
    timeout: CONNECTION_POOL_CONFIG.connectionTimeout
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Client-side cache for static data
const staticDataCache = {
  floors: { data: null, timestamp: null, ttl: 300000 }, // 5 minutes
  categories: { data: null, timestamp: null, ttl: 300000 },
  products: { data: null, timestamp: null, ttl: 60000 } // 1 minute
}

/**
 * Get cached data or fetch if expired
 * @param {string} key - Cache key (floors, categories, products)
 * @param {function} fetchFn - Function to fetch fresh data
 * @returns {Promise<any>} Cached or fresh data
 */
export const getCachedData = async (key, fetchFn) => {
  const cache = staticDataCache[key]
  if (!cache) {
    console.warn(`No cache configured for key: ${key}`)
    return fetchFn()
  }

  const now = Date.now()
  if (cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
    console.log(`✓ Cache hit for ${key}`)
    return cache.data
  }

  console.log(`⟳ Cache miss for ${key}, fetching fresh data`)
  const data = await fetchFn()
  cache.data = data
  cache.timestamp = now
  return data
}

/**
 * Invalidate cache for a specific key
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
  if (staticDataCache[key]) {
    staticDataCache[key].data = null
    staticDataCache[key].timestamp = null
    console.log(`✓ Cache invalidated for ${key}`)
  }
}

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  Object.keys(staticDataCache).forEach(key => {
    staticDataCache[key].data = null
    staticDataCache[key].timestamp = null
  })
  console.log('✓ All caches cleared')
}

// Reconnection configuration with exponential backoff
// Requirement: Reliability NFR 2 - Reconnect every 5 seconds
const RECONNECTION_CONFIG = {
  initialDelay: 5000, // 5 seconds (per Reliability NFR 2)
  maxDelay: 30000, // 30 seconds
  maxAttempts: Infinity, // Unlimited attempts for resilience
  backoffMultiplier: 1.5 // Gentler exponential backoff
}

// Subscription batching - group multiple table subscriptions into single channels
const batchedChannels = new Map() // channelKey -> { channel, tables: Set, callbacks: Map }
const activeSubscriptions = new Map() // subscriptionId -> subscription info

/**
 * Create a batched channel key for grouping subscriptions
 * @param {string} tableName - Database table name
 * @param {string|null} filterType - Type of filter (e.g., 'floor', 'status', 'token')
 * @returns {string} Channel key for batching
 */
const getBatchChannelKey = (tableName, filterType) => {
  // Group subscriptions by table and filter type (not specific filter values)
  return `${tableName}-${filterType || 'all'}`
}

/**
 * Optimized subscription with batching and connection pooling
 * Multiple subscriptions to the same table are batched into a single WebSocket channel
 * @param {string} tableName - Name of the database table
 * @param {string|null} filter - Optional filter string (e.g., 'floor_id=eq.123')
 * @param {function} callback - Callback function for handling changes
 * @param {object} options - Additional options
 * @returns {object} Subscription object with unsubscribe method
 */
export const subscribeToTable = (tableName, filter, callback, options = {}) => {
  const subscriptionId = `${tableName}-${filter || 'all'}-${Date.now()}-${Math.random()}`
  
  // Determine filter type for batching
  const filterType = filter ? filter.split('=')[0] : null
  const batchKey = getBatchChannelKey(tableName, filterType)
  
  let batchedChannel = batchedChannels.get(batchKey)
  
  if (!batchedChannel) {
    // Create new batched channel
    console.log(`✓ Creating new batched channel for ${batchKey}`)
    
    const channelName = `batched-${batchKey}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
          // No filter here - we'll filter client-side for batching
        },
        (payload) => {
          // Distribute to all callbacks in this batch
          batchedChannel.callbacks.forEach((cb, subId) => {
            const subInfo = activeSubscriptions.get(subId)
            if (subInfo && shouldTriggerCallback(payload, subInfo.filter)) {
              cb(payload)
            }
          })
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✓ Batched channel subscribed: ${batchKey}`)
          batchedChannel.reconnectAttempts = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`✗ Batched channel error for ${batchKey}:`, err)
          handleBatchedReconnection(batchKey)
        } else if (status === 'CLOSED') {
          console.warn(`⚠ Batched channel closed for ${batchKey}`)
          handleBatchedReconnection(batchKey)
        }
      })
    
    batchedChannel = {
      channel,
      channelName,
      tableName,
      callbacks: new Map(),
      reconnectAttempts: 0,
      reconnectTimeout: null
    }
    
    batchedChannels.set(batchKey, batchedChannel)
  } else {
    console.log(`✓ Reusing batched channel for ${batchKey} (${batchedChannel.callbacks.size} existing subscriptions)`)
  }
  
  // Add callback to batched channel
  batchedChannel.callbacks.set(subscriptionId, callback)
  
  // Store subscription info
  activeSubscriptions.set(subscriptionId, {
    tableName,
    filter,
    callback,
    options,
    batchKey,
    subscriptionId
  })
  
  // Return subscription object
  return {
    subscriptionId,
    unsubscribe: () => unsubscribeFromBatch(subscriptionId),
    getStatus: () => ({
      batchKey,
      subscriptionCount: batchedChannel.callbacks.size,
      isConnected: batchedChannel.channel?.state === 'joined'
    })
  }
}

/**
 * Check if a payload should trigger a callback based on filter
 * @param {object} payload - Supabase change payload
 * @param {string|null} filter - Filter string
 * @returns {boolean} Whether to trigger callback
 */
const shouldTriggerCallback = (payload, filter) => {
  if (!filter) return true
  
  const record = payload.new || payload.old
  if (!record) return true
  
  // Parse filter: "field=eq.value" or "field=neq.value"
  const filterMatch = filter.match(/^(\w+)=(eq|neq)\.(.+)$/)
  if (!filterMatch) return true
  
  const [, field, operator, value] = filterMatch
  const recordValue = String(record[field])
  
  if (operator === 'eq') {
    return recordValue === value
  } else if (operator === 'neq') {
    return recordValue !== value
  }
  
  return true
}

/**
 * Handle reconnection for batched channel
 * @param {string} batchKey - Batched channel key
 */
const handleBatchedReconnection = (batchKey) => {
  const batchedChannel = batchedChannels.get(batchKey)
  if (!batchedChannel) return
  
  // No max attempts limit - keep trying indefinitely for resilience
  batchedChannel.reconnectAttempts++
  
  // Calculate delay with exponential backoff, capped at maxDelay
  const delay = Math.min(
    RECONNECTION_CONFIG.initialDelay * Math.pow(RECONNECTION_CONFIG.backoffMultiplier, batchedChannel.reconnectAttempts - 1),
    RECONNECTION_CONFIG.maxDelay
  )
  
  console.log(`⟳ Reconnecting batched channel ${batchKey} in ${delay}ms (attempt ${batchedChannel.reconnectAttempts})`)
  
  if (batchedChannel.reconnectTimeout) {
    clearTimeout(batchedChannel.reconnectTimeout)
  }
  
  batchedChannel.reconnectTimeout = setTimeout(() => {
    // Remove old channel
    try {
      supabase.removeChannel(batchedChannel.channel)
    } catch (error) {
      console.error('Error removing old batched channel:', error)
    }
    
    // Recreate channel
    const callbacks = new Map(batchedChannel.callbacks)
    batchedChannels.delete(batchKey)
    
    // Resubscribe all callbacks
    callbacks.forEach((cb, subId) => {
      const subInfo = activeSubscriptions.get(subId)
      if (subInfo) {
        const newSub = subscribeToTable(subInfo.tableName, subInfo.filter, cb, subInfo.options)
        // Update subscription ID
        activeSubscriptions.delete(subId)
        activeSubscriptions.set(newSub.subscriptionId, subInfo)
      }
    })
  }, delay)
}

/**
 * Unsubscribe from a batched channel
 * @param {string} subscriptionId - Subscription ID
 */
const unsubscribeFromBatch = (subscriptionId) => {
  const subInfo = activeSubscriptions.get(subscriptionId)
  if (!subInfo) {
    console.warn(`Subscription ${subscriptionId} not found`)
    return
  }
  
  const batchedChannel = batchedChannels.get(subInfo.batchKey)
  if (batchedChannel) {
    batchedChannel.callbacks.delete(subscriptionId)
    console.log(`✓ Unsubscribed ${subscriptionId} from ${subInfo.batchKey} (${batchedChannel.callbacks.size} remaining)`)
    
    // If no more callbacks, remove the channel
    if (batchedChannel.callbacks.size === 0) {
      console.log(`✓ Removing empty batched channel ${subInfo.batchKey}`)
      try {
        supabase.removeChannel(batchedChannel.channel)
      } catch (error) {
        console.error('Error removing batched channel:', error)
      }
      batchedChannels.delete(subInfo.batchKey)
    }
  }
  
  activeSubscriptions.delete(subscriptionId)
}

/**
 * Helper function to unsubscribe from a channel
 * @param {object} subscription - Subscription object to unsubscribe
 */
export const unsubscribeFromChannel = (subscription) => {
  if (subscription && subscription.subscriptionId) {
    unsubscribeFromBatch(subscription.subscriptionId)
  } else if (subscription) {
    // Legacy support for old channel objects
    try {
      supabase.removeChannel(subscription)
      console.log('✓ Unsubscribed from legacy channel')
    } catch (error) {
      console.error('Error unsubscribing from legacy channel:', error)
    }
  }
}

/**
 * Reconnect all active subscriptions (useful for network recovery)
 */
export const reconnectAllSubscriptions = () => {
  console.log('⟳ Reconnecting all active subscriptions...')
  batchedChannels.forEach((batchedChannel, batchKey) => {
    handleBatchedReconnection(batchKey)
  })
}

/**
 * Get status of all active subscriptions
 */
export const getSubscriptionStatus = () => {
  const status = []
  
  batchedChannels.forEach((batchedChannel, batchKey) => {
    status.push({
      batchKey,
      tableName: batchedChannel.tableName,
      subscriptionCount: batchedChannel.callbacks.size,
      state: batchedChannel.channel?.state,
      isConnected: batchedChannel.channel?.state === 'joined',
      reconnectAttempts: batchedChannel.reconnectAttempts
    })
  })
  
  return status
}

/**
 * Get connection pool statistics
 */
export const getConnectionPoolStats = () => {
  return {
    totalBatchedChannels: batchedChannels.size,
    totalSubscriptions: activeSubscriptions.size,
    maxConnections: CONNECTION_POOL_CONFIG.maxConnections,
    channels: Array.from(batchedChannels.entries()).map(([key, channel]) => ({
      key,
      subscriptionCount: channel.callbacks.size,
      isConnected: channel.channel?.state === 'joined'
    }))
  }
}

// Connection health monitoring
const connectionHealth = {
  lastHealthCheck: null,
  consecutiveFailures: 0,
  isHealthy: true,
  healthCheckInterval: null
}

/**
 * Perform connection health check
 * Tests database connectivity and subscription status
 * @returns {Promise<Object>} Health check result
 */
export const performHealthCheck = async () => {
  const now = Date.now()
  connectionHealth.lastHealthCheck = now
  
  try {
    // Test database connectivity with a simple query
    const { data, error } = await supabase
      .from('floors')
      .select('id')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    // Check subscription health
    const unhealthyChannels = []
    batchedChannels.forEach((channel, key) => {
      if (channel.channel?.state !== 'joined') {
        unhealthyChannels.push(key)
      }
    })
    
    const isHealthy = unhealthyChannels.length === 0
    
    if (isHealthy) {
      connectionHealth.consecutiveFailures = 0
      connectionHealth.isHealthy = true
    } else {
      connectionHealth.consecutiveFailures++
      connectionHealth.isHealthy = false
      
      // Attempt to reconnect unhealthy channels
      console.warn(`⚠ Health check found ${unhealthyChannels.length} unhealthy channels, attempting reconnection`)
      unhealthyChannels.forEach(key => handleBatchedReconnection(key))
    }
    
    return {
      healthy: isHealthy,
      timestamp: now,
      databaseConnected: true,
      unhealthyChannels: unhealthyChannels.length,
      consecutiveFailures: connectionHealth.consecutiveFailures,
      totalChannels: batchedChannels.size
    }
  } catch (error) {
    connectionHealth.consecutiveFailures++
    connectionHealth.isHealthy = false
    
    console.error('✗ Health check failed:', error)
    
    return {
      healthy: false,
      timestamp: now,
      databaseConnected: false,
      error: error.message,
      consecutiveFailures: connectionHealth.consecutiveFailures
    }
  }
}

/**
 * Start automatic health monitoring
 * Performs health checks every 30 seconds
 * @param {number} intervalMs - Health check interval in milliseconds (default: 30000)
 */
export const startHealthMonitoring = (intervalMs = 30000) => {
  if (connectionHealth.healthCheckInterval) {
    console.warn('Health monitoring already started')
    return
  }
  
  console.log(`✓ Starting connection health monitoring (interval: ${intervalMs}ms)`)
  
  // Perform initial health check
  performHealthCheck()
  
  // Schedule periodic health checks
  connectionHealth.healthCheckInterval = setInterval(() => {
    performHealthCheck()
  }, intervalMs)
}

/**
 * Stop automatic health monitoring
 */
export const stopHealthMonitoring = () => {
  if (connectionHealth.healthCheckInterval) {
    clearInterval(connectionHealth.healthCheckInterval)
    connectionHealth.healthCheckInterval = null
    console.log('✓ Health monitoring stopped')
  }
}

/**
 * Get current connection health status
 * @returns {Object} Current health status
 */
export const getConnectionHealth = () => {
  return {
    isHealthy: connectionHealth.isHealthy,
    lastHealthCheck: connectionHealth.lastHealthCheck,
    consecutiveFailures: connectionHealth.consecutiveFailures,
    timeSinceLastCheck: connectionHealth.lastHealthCheck 
      ? Date.now() - connectionHealth.lastHealthCheck 
      : null
  }
}

// Polling fallback for when real-time subscriptions fail
const pollingIntervals = new Map() // tableName -> intervalId

/**
 * Start polling fallback for a table when real-time fails
 * Graceful degradation: Requirements Reliability NFR 1
 * @param {string} tableName - Database table name
 * @param {string|null} filter - Optional filter
 * @param {function} callback - Callback function
 * @param {number} intervalMs - Polling interval (default: 5000ms)
 * @returns {string} Polling ID
 */
export const startPollingFallback = (tableName, filter, callback, intervalMs = 5000) => {
  const pollingId = `poll-${tableName}-${Date.now()}`
  
  console.log(`⚠ Starting polling fallback for ${tableName} (interval: ${intervalMs}ms)`)
  
  let lastData = null
  
  const pollFunction = async () => {
    try {
      // Build query
      let query = supabase.from(tableName).select('*')
      
      // Apply filter if provided
      if (filter) {
        const filterMatch = filter.match(/^(\w+)=(eq|neq)\.(.+)$/)
        if (filterMatch) {
          const [, field, operator, value] = filterMatch
          if (operator === 'eq') {
            query = query.eq(field, value)
          } else if (operator === 'neq') {
            query = query.neq(field, value)
          }
        }
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error(`Polling error for ${tableName}:`, error)
        return
      }
      
      // Compare with last data to detect changes
      if (lastData) {
        const changes = detectChanges(lastData, data)
        changes.forEach(change => callback(change))
      }
      
      lastData = data
    } catch (error) {
      console.error(`Polling exception for ${tableName}:`, error)
    }
  }
  
  // Initial poll
  pollFunction()
  
  // Schedule periodic polling
  const intervalId = setInterval(pollFunction, intervalMs)
  pollingIntervals.set(pollingId, intervalId)
  
  return pollingId
}

/**
 * Stop polling fallback
 * @param {string} pollingId - Polling ID
 */
export const stopPollingFallback = (pollingId) => {
  const intervalId = pollingIntervals.get(pollingId)
  if (intervalId) {
    clearInterval(intervalId)
    pollingIntervals.delete(pollingId)
    console.log(`✓ Polling fallback stopped: ${pollingId}`)
  }
}

/**
 * Detect changes between two data snapshots
 * @param {Array} oldData - Previous data
 * @param {Array} newData - Current data
 * @returns {Array} Array of change events
 */
const detectChanges = (oldData, newData) => {
  const changes = []
  const oldMap = new Map(oldData.map(item => [item.id, item]))
  const newMap = new Map(newData.map(item => [item.id, item]))
  
  // Detect inserts and updates
  newData.forEach(newItem => {
    const oldItem = oldMap.get(newItem.id)
    if (!oldItem) {
      // Insert
      changes.push({
        eventType: 'INSERT',
        new: newItem,
        old: null
      })
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      // Update
      changes.push({
        eventType: 'UPDATE',
        new: newItem,
        old: oldItem
      })
    }
  })
  
  // Detect deletes
  oldData.forEach(oldItem => {
    if (!newMap.has(oldItem.id)) {
      changes.push({
        eventType: 'DELETE',
        new: null,
        old: oldItem
      })
    }
  })
  
  return changes
}

/**
 * Subscribe with automatic fallback to polling
 * If real-time fails, automatically switches to polling
 * @param {string} tableName - Database table name
 * @param {string|null} filter - Optional filter
 * @param {function} callback - Callback function
 * @param {object} options - Options
 * @returns {object} Subscription object
 */
export const subscribeWithFallback = (tableName, filter, callback, options = {}) => {
  let realtimeSubscription = null
  let pollingId = null
  let isFallbackActive = false
  
  const { pollingInterval = 5000, maxRealtimeFailures = 3 } = options
  let realtimeFailures = 0
  
  // Try real-time first
  const startRealtime = () => {
    realtimeSubscription = subscribeToTable(tableName, filter, callback, {
      ...options,
      onMaxReconnectAttempts: () => {
        realtimeFailures++
        if (realtimeFailures >= maxRealtimeFailures && !isFallbackActive) {
          console.warn(`⚠ Real-time failed ${realtimeFailures} times, switching to polling fallback`)
          activateFallback()
        }
      }
    })
  }
  
  const activateFallback = () => {
    if (isFallbackActive) return
    
    isFallbackActive = true
    pollingId = startPollingFallback(tableName, filter, callback, pollingInterval)
  }
  
  startRealtime()
  
  return {
    unsubscribe: () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
      }
      if (pollingId) {
        stopPollingFallback(pollingId)
      }
    },
    isFallbackActive: () => isFallbackActive,
    getStatus: () => ({
      mode: isFallbackActive ? 'polling' : 'realtime',
      realtimeFailures
    })
  }
}
