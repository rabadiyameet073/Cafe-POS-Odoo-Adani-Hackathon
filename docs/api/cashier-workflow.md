# 📡 Cashier Workflow API Specification

## Overview
This document specifies the routing, authentication headers, request body schema, and response formatting for Cashier Workflow under MongoDB Atlas.

## Endpoints
- **Base URI:** `/api/cashier-workflow`
- **Protocol:** HTTPS (Vercel Serverless) / WSS (Socket.IO)
- **Authentication:** Bearer JWT token required for staff roles.

### Request Sample
```json
{
  "timestamp": "2026-09-28T12:17:01.024Z",
  "action": "cashier-workflow"
}
```

### Response Sample
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-28T12:17:01.024Z"
}
```
