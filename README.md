# Growth — MLM Marketing Platform

Production-style MLM platform built with **React 19 + Vite + TypeScript + Tailwind CSS 4** on the frontend and **Node.js + Express + MongoDB** on the backend. The legacy EJS frontend has been removed; all pages are served by the React SPA at `/app`.

## Features

- Referral network with spillover placement and invite links
- Wallet points, join commissions, ranks and leaderboard
- Payout requests with admin approval and automatic point deduction
- Admin-only daily lucky draw
- Transaction history, CSV export, contact submissions and user management
- Light/dark themes, responsive sidebar, mobile drawer and points calculator
- Configurable point value: **1 point = ₹12** by default

## Stack

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router
- **Backend:** Node.js, Express 4, Mongoose, JWT cookies, bcrypt
- **Database:** MongoDB
- **Security:** httpOnly cookies, rate limiting, input validation, role checks

## Environment

Create `backend/.env`:

```env
DB_URL=mongodb://127.0.0.1:27017/mlm-admin
PORT=4000
SECRET_KEY=change-me

ADMIN_EMAIL=admin@example.com
ADMIN_PASS=ChangeMe123!

APP_URL=http://localhost:4000/app

# Password hashing cost (10-14; production default 12)
BCRYPT_ROUNDS=12

# Payouts
MIN_PAYOUT=500
POINT_VALUE_INR=12

# SMTP for password reset emails (optional in development)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Growth <no-reply@example.com>
```

## Project structure

```
MLM-admin-side/
├── backend/      # Express API, models, seed scripts
└── frontend/     # React + Vite SPA (served at /app)
```

## Getting started

```sh
npm run install:all
```

Development (two terminals):

```sh
npm run dev:backend    # API on http://localhost:4000
npm run dev:frontend   # SPA on http://localhost:5173/app
```

Production:

```sh
npm run build          # builds frontend/dist
npm start              # API + SPA on http://localhost:4000/app
```

The server redirects `/` and any legacy URL (for example `/join?ref=CODE`) to the matching `/app` route.

## Security

- Never commit `.env`; it is gitignored. Use the hosting provider’s secret store in production.
- Use a random `SECRET_KEY` of at least 32 characters and a strong `ADMIN_PASS`.
- Set `APP_URL` to the public HTTPS URL in production. Startup fails if it is missing or insecure.
- Authentication uses httpOnly, SameSite cookies; API errors do not expose internal details.
- Demo seeding is blocked when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is explicitly set.
- If a `.env` file was ever committed, treat those values as compromised and rotate them.

Optional seed data:

```sh
npm run seed:demo
npm run seed:admin
```

**Repository:** [https://lnkd.in/gsXiuzsj](https://lnkd.in/gsXiuzsj)
