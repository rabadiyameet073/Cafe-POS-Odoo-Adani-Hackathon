# 📡 Health Diagnostics API Specification

## Overview
This document specifies the routing, authentication headers, request body schema, and response formatting for Health Diagnostics under MongoDB Atlas.

## Endpoints
- **Base URI:** `/api/health-diagnostics`
- **Protocol:** HTTPS (Vercel Serverless) / WSS (Socket.IO)
- **Authentication:** Bearer JWT token required for staff roles.

### Request Sample
```json
{
  "timestamp": "2026-09-28T12:17:09.211Z",
  "action": "health-diagnostics"
}
```

### Response Sample
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-28T12:17:09.211Z"
}
```
