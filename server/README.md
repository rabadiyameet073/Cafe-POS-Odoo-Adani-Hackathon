# Cafe POS Backend

Production-ready Node.js + Express.js backend for the Cafe POS system.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# Then start the server
npm run dev
```

## Environment Variables

Required variables in `.env`:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) |

## API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Login, signup, logout |
| Users | `/api/users` | User management |
| Floors | `/api/floors` | Floor CRUD |
| Tables | `/api/tables` | Table management |
| Categories | `/api/categories` | Product categories |
| Products | `/api/products` | Products & variants |
| Orders | `/api/orders` | Order management |
| Payments | `/api/payments` | Payment processing |
| Sessions | `/api/sessions` | POS sessions |
| Kitchen | `/api/kitchen` | Kitchen display |
| Feedback | `/api/feedback` | Customer feedback |
| Reports | `/api/reports` | Analytics |

## Testing with Postman

1. **Signup**: `POST /api/auth/signup`
   ```json
   {"email": "test@example.com", "password": "test123", "full_name": "Test User"}
   ```

2. **Login**: `POST /api/auth/login`
   ```json
   {"email": "test@example.com", "password": "test123"}
   ```

3. Use the returned `token` in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

## Project Structure

```
server/
├── package.json
├── .env.example
└── src/
    ├── server.js      # Entry point
    ├── app.js         # Express setup
    ├── config/        # Configuration
    ├── routes/        # API routes
    ├── controllers/   # Request handlers
    ├── models/        # Database models
    ├── middleware/    # Auth, validation
    ├── services/      # Business logic
    ├── sockets/       # Socket.IO
    ├── utils/         # Helpers
    └── validators/    # Input validation
```
