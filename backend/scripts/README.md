# Backend Scripts

Standalone utility and test scripts. Run from the `backend/` directory.

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-database.js` | Initialize Supabase tables and seed data | `node scripts/setup-database.js` |
| `test-auth.js` | Manual auth endpoint testing | `node scripts/test-auth.js` |
| `test-background-jobs.js` | Test background job manager | `node scripts/test-background-jobs.js` |
| `test-monitoring.js` | Test logging and monitoring setup | `node scripts/test-monitoring.js` |
| `test-query-performance.js` | Benchmark database queries | `node scripts/test-query-performance.js` |

> **Note**: These are manual debugging scripts, not part of the Jest test suite. For automated tests, see `backend/tests/`.
