/**
 * PostgREST / Supabase REST API Emulation for MongoDB
 * 
 * Handles /rest/v1/:table requests from client-side @supabase/supabase-js.
 * Directly translates PostgREST query parameters into MongoDB queries.
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const logger = require('../utils/logger');

// Helper to parse PostgREST query parameters
function applyPostgrestFilters(query, queryParams) {
    for (const [key, rawVal] of Object.entries(queryParams)) {
        if (key === 'select') continue;
        if (key === 'order') {
            const [field, dir] = rawVal.split('.');
            query.order(field, { ascending: dir !== 'desc' });
            continue;
        }
        if (key === 'limit') {
            query.limit(parseInt(rawVal, 10));
            continue;
        }

        // Filter operators: eq.val, neq.val, in.(a,b), gte.val, lte.val, etc.
        if (typeof rawVal === 'string') {
            const dotIdx = rawVal.indexOf('.');
            if (dotIdx !== -1) {
                const op = rawVal.slice(0, dotIdx);
                let val = rawVal.slice(dotIdx + 1);

                // Type casting
                if (val === 'true') val = true;
                else if (val === 'false') val = false;
                else if (val === 'null') val = null;

                if (op === 'eq') {
                    query.eq(key, val);
                } else if (op === 'neq') {
                    query.neq(key, val);
                } else if (op === 'in') {
                    const list = val.replace(/[()"]/g, '').split(',').map(s => s.trim());
                    query.in(key, list);
                } else if (op === 'gte') {
                    query.gte(key, val);
                } else if (op === 'lte') {
                    query.lte(key, val);
                } else if (op === 'gt') {
                    query.gt(key, val);
                } else if (op === 'lt') {
                    query.lt(key, val);
                } else if (op === 'ilike') {
                    query.ilike(key, val);
                }
            } else {
                query.eq(key, rawVal);
            }
        }
    }
}

// GET /rest/v1/:table
router.get('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const selectFields = req.query.select || '*';
        const isSingle = req.headers.accept?.includes('application/vnd.pgrst.object+json');

        const query = db.from(table).select(selectFields);
        if (isSingle) query.single();

        applyPostgrestFilters(query, req.query);

        const { data, error, count } = await query;

        if (error) {
            return res.status(error.code === 'PGRST116' ? 406 : 400).json(error);
        }

        if (req.headers.prefer?.includes('count=exact') && count !== undefined) {
            res.setHeader('Content-Range', `0-${data?.length || 0}/${count}`);
        }

        return res.status(200).json(data);
    } catch (err) {
        logger.error('PostgREST GET error:', err.message);
        return res.status(500).json({ message: err.message });
    }
});

// POST /rest/v1/:table
router.post('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const body = req.body;
        const isSingle = !Array.isArray(body);

        const query = db.from(table).insert(body);
        const { data, error } = await query;

        if (error) {
            return res.status(400).json(error);
        }

        const returnRepresentation = req.headers.prefer?.includes('return=representation');
        if (returnRepresentation) {
            return res.status(201).json(data);
        }

        return res.status(201).json(data);
    } catch (err) {
        logger.error('PostgREST POST error:', err.message);
        return res.status(500).json({ message: err.message });
    }
});

// PATCH /rest/v1/:table
router.patch('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const query = db.from(table).update(req.body);
        applyPostgrestFilters(query, req.query);

        const { data, error } = await query;

        if (error) {
            return res.status(400).json(error);
        }

        return res.status(200).json(data);
    } catch (err) {
        logger.error('PostgREST PATCH error:', err.message);
        return res.status(500).json({ message: err.message });
    }
});

// DELETE /rest/v1/:table
router.delete('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const query = db.from(table).delete();
        applyPostgrestFilters(query, req.query);

        const { data, error } = await query;

        if (error) {
            return res.status(400).json(error);
        }

        return res.status(200).json(data);
    } catch (err) {
        logger.error('PostgREST DELETE error:', err.message);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;
