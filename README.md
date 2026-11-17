# Growth — MLM Marketing Platform

Production-style MLM platform built with **React 19 + Vite + TypeScript + Tailwind CSS 4** on the frontend and **Node.js + Express + MongoDB** on the backend.
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

## Project structure

```
MLM-admin-side/
├── backend/      # Express API, models, seed scripts
└── frontend/     # React + Vite SPA (served at /app)
```
