import { useState, useEffect } from 'react'
import { getCachedData, invalidateCache } from '../services/supabase.service'

/**
 * Custom hook for using cached static data
 * @param {string} cacheKey - Cache key (floors, categories, products)
 * @param {function} fetchFn - Function to fetch fresh data
 * @param {object} options - Options { autoFetch: boolean, dependencies: array }
 * @returns {object} { data, loading, error, refetch, invalidate }
 */
export const useCachedData = (cacheKey, fetchFn, options = {}) => {
  const { autoFetch = true, dependencies = [] } = options
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCachedData(cacheKey, fetchFn)
      setData(result)
    } catch (err) {
      console.error(`Error fetching cached data for ${cacheKey}:`, err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const invalidate = () => {
    invalidateCache(cacheKey)
    if (autoFetch) {
      fetchData()
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [cacheKey, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate
  }
}
