# KSP Technical Overview

## System Shape

```text
React frontend (frontend/src)
        | REST/JSON and multipart uploads
        v
Express API (backend/src)
   |                 |
   v                 v
MongoDB           Cloudinary
```

The frontend is a Create React App application. The backend owns authentication, business rules, and persistence. MongoDB stores application records; Cloudinary stores newly uploaded product images and bank slips. The frontend uses a shared API base: same-origin `/api` by default, or `REACT_APP_API_URL` for a separate API host. The development proxy targets `http://localhost:5000`.

## Backend Modules

- `src/server.js`: Express middleware, health endpoint, static paths, and route registration
- `src/routes/`: authentication, products, cart, orders, payments, reviews, subscriptions, uploads, and admin operations
- `src/models/`: Mongoose schemas for users, products, carts, orders, order items, payments, reviews, and subscriptions
- `src/middleware/`: JWT authentication, authorization, and centralized error handling
- `src/config/`: MongoDB and Cloudinary clients
- `scripts/`: media migration utilities

## Data Areas

- **Users:** account details, role, status, and password-reset data
- **Products:** catalog fields, inventory, and `imageUrl`
- **Carts:** user/product references, quantity, and price snapshot
- **Orders and order items:** shipping, payment method/status, line items, and optional `bankSlipUrl`
- **Payments:** transaction and verification state, including optional `bankSlipUrl`
- **Reviews:** product/user references, one-to-five rating, comment, and verified-purchase flag
- **Subscriptions:** newsletter subscriber and status data

Prices use MongoDB Decimal128. Models define the indexes and validation rules used by the application.

## API Surface

### Public

- `GET /health`
- `GET /api/products`, `/api/products/brands`, `/api/products/:id`
- `POST /api/auth/register`, `POST /api/auth/login`
- Google OAuth and password recovery routes under `/api/auth`
- `GET /api/reviews/product/:productId` and `GET /api/reviews/latest`
- `POST /api/subscriptions/subscribe`

### Authenticated

- `/api/cart`: read, add, update, remove, and clear cart items
- `/api/orders`: list, view, cash-on-delivery cart checkout, direct purchase using cash-on-delivery or bank slip, and cancel
- `GET /api/payments/:orderId`: authenticated payment status lookup
- `POST /api/payments/stripe-webhook`: public Stripe delivery endpoint with raw-body signature verification
- `/api/upload/product-image` and `/api/upload/bank-slip`
- Review create, update, delete, and current-user review routes

### Admin

- `/api/admin/products`: catalog management and inventory statistics
- `/api/admin/orders`: order processing, payment verification, tracking, and sales report
- `/api/admin/users`: user and role management
- `/api/admin/reports`: sales, revenue, customers, and inventory
- `/api/admin/subscriptions`: subscriber list and email broadcast

All `/api/admin/*` route groups are mounted behind JWT authentication and admin-role authorization.

## Main Flows

### Product Image

The admin frontend sends multipart field `image` to `POST /api/upload/product-image`. Multer holds the file in memory, then the API streams it to Cloudinary folder `ksp_uploads/products`. The returned secure URL is saved on the product as `imageUrl`.

### Bank Slip

Checkout sends multipart field `slip` to `POST /api/upload/bank-slip`. Multer accepts supported image formats and PDF, then the API streams the file to `ksp_uploads/bank-slips`. The returned URL is attached to the order/payment flow. Uploading a slip and submitting the order are separate actions.

Both upload routes are mounted behind JWT authentication. See [Deployment and Operations](DEPLOYMENT_OPERATIONS.md) for limits, migration notes, and storage/deployment risks.

### Stripe Notifications

The Stripe webhook is mounted outside user-JWT authentication and before JSON body parsing. It verifies the `stripe-signature` header against the raw request body and `STRIPE_WEBHOOK_SECRET`, then only handles supported PaymentIntent events linked to a Stripe order by metadata. The application does not yet create Stripe PaymentIntents, so a complete card-payment checkout flow remains to be implemented. Stripe and PayHere are not currently offered as order payment methods.

### Product Review

Product reviews are public to read. An authenticated user can submit one review per product; the backend validates the rating/comment and checks order history to set verified-purchase status. Review owners can edit or delete their reviews.