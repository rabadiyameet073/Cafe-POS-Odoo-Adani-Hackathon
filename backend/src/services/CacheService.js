/**
 * CacheService
 * 
 * Implements in-memory caching for static/semi-static data to reduce database load.
 * Supports TTL-based expiration and manual cache invalidation.
 * 
 * Performance NFR 1, 2, 3: Reduces query load for frequently accessed static data
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
        
        // Default TTL values (in milliseconds)
        this.DEFAULT_TTL = {
            floors: 5 * 60 * 1000,           // 5 minutes (rarely changes)
            categories: 5 * 60 * 1000,       // 5 minutes (rarely changes)
            products: 2 * 60 * 1000,         // 2 minutes (availability may change)
            paymentMethods: 10 * 60 * 1000,  // 10 minutes (rarely changes)
            tables: 30 * 1000                // 30 seconds (status changes frequently)
        };
    }

    /**
     * Get cached value or fetch from database
     * @param {string} key - Cache key
     * @param {function} fetchFn - Function to fetch data if not cached
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise<any>} Cached or fresh data
     */
    async get(key, fetchFn, ttl = 60000) {
        const now = Date.now();
        
        // Check if cached and not expired
        if (this.cache.has(key)) {
            const expiresAt = this.ttls.get(key);
            if (expiresAt && expiresAt > now) {
                logger.debug(`Cache hit: ${key}`);
                return this.cache.get(key);
            } else {
                // Expired, remove from cache
                this.cache.delete(key);
                this.ttls.delete(key);
            }
        }

        // Fetch fresh data
        logger.debug(`Cache miss: ${key}, fetching...`);
        const data = await fetchFn();
        
        // Store in cache with TTL
        this.cache.set(key, data);
        this.ttls.set(key, now + ttl);
        
        return data;
    }

    /**
     * Invalidate specific cache key
     * @param {string} key - Cache key to invalidate
     */
    invalidate(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
        logger.debug(`Cache invalidated: ${key}`);
    }

    /**
     * Invalidate all cache keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'floors:*')
     */
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        let count = 0;
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.ttls.delete(key);
                count++;
            }
        }
        
        logger.debug(`Cache invalidated: ${count} keys matching ${pattern}`);
    }

    /**
     * Clear all cache
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.ttls.clear();
        logger.info(`Cache cleared: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     * @returns {object} Cache stats
     */
    getStats() {
        const now = Date.now();
        let expired = 0;
        
        for (const [key, expiresAt] of this.ttls.entries()) {
            if (expiresAt <= now) {
                expired++;
            }
        }
        
        return {
            totalEntries: this.cache.size,
            activeEntries: this.cache.size - expired,
            expiredEntries: expired
        };
    }

    // ========================================================================
    // DOMAIN-SPECIFIC CACHE METHODS
    // ========================================================================

    /**
     * Get all floors (cached)
     * @returns {Promise<Array>} Floors array
     */
    async getFloors() {
        return this.get('floors:all', async () => {
            const { data, error } = await supabase
                .from('floors')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                logger.error('Error fetching floors:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.floors);
    }

    /**
     * Get all product categories (cached)
     * @returns {Promise<Array>} Categories array
     */
    async getCategories() {
        return this.get('categories:all', async () => {
            const { data, error } = await supabase
                .from('product_categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                logger.error('Error fetching categories:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.categories);
    }

    /**
     * Get products by category (cached)
     * @param {string} categoryId - Category UUID
     * @returns {Promise<Array>} Products array
     */
    async getProductsByCategory(categoryId) {
        return this.get(`products:category:${categoryId}`, async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_variants(*)
                `)
                .eq('category_id', categoryId)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                logger.error('Error fetching products:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.products);
    }

    /**
     * Get all products (cached)
     * @returns {Promise<Array>} Products array
     */
    async getAllProducts() {
        return this.get('products:all', async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_variants(*),
                    product_categories(name, icon_emoji)
                `)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                logger.error('Error fetching all products:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.products);
    }

    /**
     * Get payment methods (cached)
     * @returns {Promise<Array>} Payment methods array
     */
    async getPaymentMethods() {
        return this.get('payment_methods:all', async () => {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('is_enabled', true);

            if (error) {
                logger.error('Error fetching payment methods:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.paymentMethods);
    }

    /**
     * Get tables by floor (cached with shorter TTL)
     * @param {string} floorId - Floor UUID
     * @returns {Promise<Array>} Tables array
     */
    async getTablesByFloor(floorId) {
        return this.get(`tables:floor:${floorId}`, async () => {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('floor_id', floorId)
                .eq('is_active', true)
                .order('table_number', { ascending: true });

            if (error) {
                logger.error('Error fetching tables:', error);
                throw error;
            }

            return data || [];
        }, this.DEFAULT_TTL.tables);
    }

    /**
     * Invalidate product-related caches
     */
    invalidateProducts() {
        this.invalidatePattern('products:*');
    }

    /**
     * Invalidate table-related caches
     */
    invalidateTables() {
        this.invalidatePattern('tables:*');
    }

    /**
     * Invalidate floor-related caches
     */
    invalidateFloors() {
        this.invalidate('floors:all');
        this.invalidatePattern('tables:floor:*');
    }

    /**
     * Start background cleanup job (removes expired entries)
     */
    startCleanupJob() {
        if (this.cleanupInterval) {
            logger.warn('Cleanup job already running');
            return;
        }

        logger.info('Starting cache cleanup job (runs every 5 minutes)');

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleaned = 0;

            for (const [key, expiresAt] of this.ttls.entries()) {
                if (expiresAt <= now) {
                    this.cache.delete(key);
                    this.ttls.delete(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Stop background cleanup job
     */
    stopCleanupJob() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            logger.info('Cache cleanup job stopped');
        }
    }
}

module.exports = new CacheService();
