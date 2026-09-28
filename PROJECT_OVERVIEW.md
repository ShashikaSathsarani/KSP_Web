# Kandy Super Phone

## Project Summary

Kandy Super Phone (KSP) is a full-stack e-commerce application for browsing and selling mobile phones and accessories. Customers can create accounts, browse products, manage a cart, place orders, track order status, and review products. Administrators manage the catalog, inventory, orders, users, reports, and newsletter subscribers.

## Main Capabilities

- Product catalog with brand, condition, price, and search filters
- Customer registration, login, profile, order history, and password recovery
- Order placement with cash-on-delivery and bank-slip verification; Stripe and PayHere checkout integrations are not enabled
- Product ratings and reviews, including verified-purchase status
- Admin product, order, user, reporting, and subscriber management
- Product image and bank-slip uploads to Cloudinary

## Technology

- Frontend: React 18, React Router, Zustand, Axios, Tailwind CSS
- Backend: Node.js, Express, Mongoose, JWT, Multer
- Data: MongoDB
- Media: Cloudinary
- Optional integrations: Google OAuth and SMTP email

## Architecture

The React application calls a REST API served by Express. Mongoose models persist users, products, carts, orders, order items, payments, reviews, and subscriptions in MongoDB. The backend uploads new product images and bank slips to Cloudinary; the database stores their returned URLs.

## Current Status

The application has local development and production build scripts. Public production deployment still requires environment-specific configuration and security follow-up. Review the deployment checklist and complete a provider-backed Stripe or PayHere checkout flow before advertising online card payments.

## Documentation

- [Getting Started](GETTING_STARTED.md): local setup, configuration, and verification
- [Technical Overview](TECHNICAL_OVERVIEW.md): routes, data, and application flows
- [Deployment and Operations](DEPLOYMENT_OPERATIONS.md): VPS deployment, media storage, and release risks