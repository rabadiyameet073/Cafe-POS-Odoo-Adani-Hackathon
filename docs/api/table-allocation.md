# 📡 Table Allocation API Specification

## Overview
This document specifies the routing, authentication headers, request body schema, and response formatting for Table Allocation under MongoDB Atlas.

## Endpoints
- **Base URI:** `/api/table-allocation`
- **Protocol:** HTTPS (Vercel Serverless) / WSS (Socket.IO)
- **Authentication:** Bearer JWT token required for staff roles.

### Request Sample
```json
{
  "timestamp": "2026-09-28T12:16:58.357Z",
  "action": "table-allocation"
}
```

### Response Sample
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-28T12:16:58.357Z"
}
```
