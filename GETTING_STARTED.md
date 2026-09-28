# KSP Getting Started

This guide starts the React frontend and Express API for local development. Run commands from the relevant package directory under `KSP_Website/KSP`.

## Requirements

- Node.js and npm
- A reachable MongoDB database (local MongoDB or MongoDB Atlas)
- Cloudinary credentials for image and bank-slip uploads

## Configure the Backend

Create `backend/.env` with the required values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/kandy_super_phone
JWT_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

Keep real credentials out of source control and logs. Optional integrations use `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and the `SMTP_*` variables. See [Deployment and Operations](DEPLOYMENT_OPERATIONS.md) for production configuration.

## Install and Start

Backend, in one terminal:

```bash
cd KSP_Website/KSP/backend
npm ci
npm run init-db
npm run dev
```

Frontend, in a second terminal:

```bash
cd KSP_Website/KSP/frontend
npm ci
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Then start the frontend:

```bash
npm start
```

The frontend is available at `http://localhost:3000`; the API is available at `http://localhost:5000`.

## Optional Development Seed Data

```bash
cd KSP_Website/KSP/backend
npm run seed
```

Use seed data only in a disposable development database. The script creates or resets demo accounts to known passwords and inserts sample products. Never run it against production data.

## Verify

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/products
```

Build the frontend for deployment:

```bash
cd KSP_Website/KSP/frontend
npm run build
```

The generated static site is in `frontend/build`. For deployment requirements and known security gaps, see [Deployment and Operations](DEPLOYMENT_OPERATIONS.md). For routes and data flow, see [Technical Overview](TECHNICAL_OVERVIEW.md).