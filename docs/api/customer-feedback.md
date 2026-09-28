# 📡 Customer Feedback API Specification

## Overview
This document specifies the routing, authentication headers, request body schema, and response formatting for Customer Feedback under MongoDB Atlas.

## Endpoints
- **Base URI:** `/api/customer-feedback`
- **Protocol:** HTTPS (Vercel Serverless) / WSS (Socket.IO)
- **Authentication:** Bearer JWT token required for staff roles.

### Request Sample
```json
{
  "timestamp": "2026-09-28T12:17:03.142Z",
  "action": "customer-feedback"
}
```

### Response Sample
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-28T12:17:03.142Z"
}
```
