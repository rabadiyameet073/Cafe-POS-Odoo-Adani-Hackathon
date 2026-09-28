/**
 * MongoDB Client & Realtime Socket Bridge (Backward Compatibility Alias)
 * 
 * Delegates 100% of operations to native MongoDB client (db.service.js).
 * Eliminates all Supabase cloud dependencies while preserving backward compatibility.
 */

export * from './db.service';
export { db as default } from './db.service';
