# 🗄️ Database Optimization: Read Write Concerns

## Overview
Guidelines and benchmarks for Read Write Concerns on MongoDB Atlas.

### Recommendations
1. Ensure connection caching across Vercel serverless invocations.
2. Maintain index coverage for frequent query filters (`id`, `table_token`, `status`).
