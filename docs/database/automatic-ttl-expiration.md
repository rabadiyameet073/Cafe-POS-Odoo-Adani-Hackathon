# 🗄️ Database Optimization: Automatic Ttl Expiration

## Overview
Guidelines and benchmarks for Automatic Ttl Expiration on MongoDB Atlas.

### Recommendations
1. Ensure connection caching across Vercel serverless invocations.
2. Maintain index coverage for frequent query filters (`id`, `table_token`, `status`).
