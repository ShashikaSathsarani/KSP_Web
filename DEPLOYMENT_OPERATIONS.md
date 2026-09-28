# KSP Deployment and Storage Operations

## Production Configuration

Configure the backend environment on the VPS; do not commit secrets:

- `MONGODB_URI`: production MongoDB connection string
- `JWT_SECRET`: long, randomly generated signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials
- `PORT`, `NODE_ENV`: backend listener and environment mode
- `FRONTEND_URL`, `CORS_ORIGIN`: deployed frontend origin and API CORS policy
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: required only when configuring Stripe webhook delivery
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: optional Google sign-in
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optional `SMTP_FROM`, `SMTP_SECURE`, `SMTP_TLS`: password reset and subscriber email

The frontend defaults to same-origin `/api`. For a separate API host, build with `REACT_APP_API_URL` set to its HTTPS URL ending in `/api`; Create React App embeds this value at build time. Media URL construction uses this shared API base.

## VPS Release Checklist

1. Provision Node.js, a process manager, a reverse proxy, and TLS. Keep the Express listener private behind the proxy where possible.
2. Use a production MongoDB database and restrict database network access to the VPS.
3. Set backend environment variables in the service manager, not in committed files. Set the frontend API URL before running `npm run build`.
4. Install with `npm ci` in both packages; run the backend with `npm start` and serve `frontend/build` as static files.
5. Configure the reverse proxy for the frontend and `/api` requests, then verify `/health`, product reads, login, and uploads.
6. Test product and bank-slip uploads with synthetic files. Confirm Cloudinary URLs and delete test assets afterward.
7. Back up MongoDB and configure log rotation, monitoring, firewall rules, and restart-on-failure.

## Production Readiness and Remaining Blockers

The following safeguards are now in code; production values and external integrations still need configuration and verification:

- CORS is restricted to configured origins; set `CORS_ORIGIN` to the deployed frontend origin(s).
- Startup requires `JWT_SECRET`; production requires at least 32 characters. Startup also requires production `MONGODB_URI`.
- All admin API route groups are guarded by JWT authentication and admin-role authorization.
- MongoDB connection logs no longer print the connection URI.
- The Stripe webhook verifies the raw request body signature and is outside user-JWT authentication. However, there is no PaymentIntent creation/confirmation flow in the app. Implement and test that flow, including server-calculated amount/currency and `orderId` metadata, before enabling card payments.
- The unverified PayHere notification and generic client-trusted payment mutation routes were removed. Do not offer PayHere payments until a verified integration is implemented.
- Order creation currently accepts cash-on-delivery and (for direct orders) Cloudinary bank-slip URLs only; the placeholder cart checkout page is not a completed order flow.
- `/health` currently reports API process status without checking database readiness. Configure monitoring with that limitation in mind or add a readiness check.
- The seed script resets demo account passwords to known values. Never run `npm run seed` against production.

## Cloudinary Upload Behavior

New uploads do not use local disk storage:

| Purpose | API | Multipart field | Cloudinary folder | Limit |
|---|---|---|---|---|
| Product image | `POST /api/upload/product-image` | `image` | `ksp_uploads/products` | 5 MB |
| Bank slip | `POST /api/upload/bank-slip` | `slip` | `ksp_uploads/bank-slips` | 10 MB |

Both endpoints require a JWT. Product images accept JPEG, PNG, and WebP; bank slips also accept PDF. Files are held in memory and streamed to Cloudinary. The response URL is stored in MongoDB when the product or order is saved.

The current checkout frontend uses multipart field `slip`, matching Multer. Keep this field name in sync if either side changes.

## Existing Media and Migration

- New product images use the Cloudinary URL in `Product.imageUrl`.
- Bank-slip URLs can be stored on orders and payments.
- Frontend image helpers still support legacy `/uploads/...` URLs, and the backend still exposes an `/uploads` static route for compatibility. That route makes local files publicly addressable; do not place private documents there.
- The legacy `backend/uploads/products` and `backend/uploads/bank-slips` folders were emptied after checking current database references by filename. Two order records still contain legacy local-style bank-slip URLs, but those paths had no matching local files. Review those records and repair or remove the stale URLs separately if they affect order administration.
- Migration scripts are under `backend/scripts`. Review their dry-run output and back up the database before any live migration. Migration logs may contain record identifiers and media URLs; handle them as operational data.
- Do not delete Cloudinary assets solely because a local file is absent. Check database references and Cloudinary public IDs first.

## Local Verification

```bash
cd KSP_Website/KSP/backend
npm run dev

cd KSP_Website/KSP/frontend
npm start
```

For an upload check, log in, select a synthetic product image or bank-slip file, and inspect the Network response for `success: true` and a Cloudinary URL. Do not submit a real order for a smoke test; remove the test asset from Cloudinary afterward.