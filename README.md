# Green Wallet — Turn Waste into Worth

Green Wallet is a MERN sustainability platform connecting households, local waste collectors, and organisations offering recycled/upcycled products. It supports pickup scheduling, collector assignment and verification, a Green Points wallet, a redemption marketplace, and a shared order lifecycle.

> Development starter implementation. It contains working source for the core flows, but must be configured and tested against a MongoDB replica set before real deployment. Do not use the seeded accounts or sample reward rates in production.

## Features

- Three account roles: household, collector, organisation.
- Password hashing with bcrypt, JWT in HTTP-only cookies, protected API routes, role checks, rate limiting and CORS.
- Household pickup scheduling with images, QR payload generation, pickup history, and a server-enforced 30-minute cancellation cutoff.
- Collector pickup acceptance/rejection, atomic assignment via conditional MongoDB update, assignment cancellation, QR validation, category-level verified weights and idempotent reward transaction keys.
- Configurable category reward rates and wallet history.
- Organisation product creation/editing/deactivation and stock.
- Marketplace search/category filtering/sorting and points redemption.
- Shared order records, organisation processing/dispatch and household received confirmation.
- MongoDB-backed in-app notifications.
- Responsive React dashboard and public landing page.

## Technology

- Frontend: React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Lucide React, Recharts dependency, `qrcode.react`, `html5-qrcode`.
- Backend: Node.js, Express, Mongoose, MongoDB, JWT, bcryptjs, Joi, Multer, QRCode, Helmet, CORS and express-rate-limit.
- Tests: Node's built-in test runner.

## Folder structure

```text
green-wallet/
  client/
    src/
      components/
      context/
      layouts/
      pages/
      services/
      App.jsx
      main.jsx
      styles.css
    index.html
    package.json
    vite.config.js
    tailwind.config.js
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    tests/
    app.js
    server.js
    seed.js
  .env.example
  README.md
  package.json
```

## Prerequisites

- Node.js 20 LTS or a currently supported Node release.
- npm.
- MongoDB running locally or a MongoDB Atlas database.
- **MongoDB replica set** for multi-document transactions used by reward verification and product redemption. Atlas clusters are replica sets. For local development, run a single-node replica set rather than standalone `mongod`.

## Setup

### 1. Configure environment

From the project root, copy `.env.example` to `server/.env`.

PowerShell:

```powershell
Copy-Item .env.example server/.env
```

macOS/Linux:

```bash
cp .env.example server/.env
```

Edit `server/.env` and set a unique `JWT_SECRET` of at least 32 characters. Set `MONGODB_URI`, `CLIENT_ORIGIN`, `PORT`, and reward rates as appropriate. Do not commit `.env`.

For a local MongoDB replica set, a typical URI is:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/green_wallet?replicaSet=rs0
```

Configure and initialise the local replica set in MongoDB before using transactional endpoints. The exact setup depends on your MongoDB installation.

### 2. Install dependencies

From the root directory:

```bash
npm run install:all
```

PowerShell can use the same command:

```powershell
npm run install:all
```

### 3. Seed development accounts and products

```bash
npm run seed --prefix server
```

PowerShell:

```powershell
npm run seed --prefix server
```

Development-only demo credentials (all use the password below):

| Role | Email | Password |
|---|---|---|
| Household | `household@greenwallet.local` | `GreenWallet123!` |
| Local collector | `collector@greenwallet.local` | `GreenWallet123!` |
| Organisation | `organisation@greenwallet.local` | `GreenWallet123!` |

The seed script refuses to run if `NODE_ENV=production`. Change these credentials and remove seeded accounts before any shared environment.

### 4. Run the app

Start both client and server from the project root:

```bash
npm run dev
```

PowerShell:

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

Alternatively, run each process in a separate terminal:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

### 5. Production build

```bash
npm run build
```

PowerShell:

```powershell
npm run build
```

The Vite build is emitted to `client/dist`.

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (32+ characters) |
| `CLIENT_ORIGIN` | Exact frontend origin for credentialed CORS |
| `PORT` | API port, default 5000 |
| `NODE_ENV` | Set `production` for production |
| `COOKIE_SAME_SITE` | Cookie SameSite policy; default `lax` |
| `UPLOAD_DIR` | Local development image upload directory |
| `MAX_UPLOAD_MB` | Maximum upload size per image, default 5 MB |
| `PAPER_POINTS_PER_KG` | Sample paper reward rate |
| `NEWSPAPERS_POINTS_PER_KG` | Sample newspaper reward rate |
| `CARDBOARD_POINTS_PER_KG` | Sample cardboard reward rate |
| `METAL_POINTS_PER_KG` | Sample metal reward rate |
| `RIGID_PLASTIC_POINTS_PER_KG` | Sample rigid plastic reward rate |
| `OTHER_DRY_POINTS_PER_KG` | Sample other dry recycling reward rate |

The rates are configurable demonstration values, not market prices or official municipal rules. Reward calculation multiplies verified kilograms by each category's configured rate and rounds the final aggregate to the nearest whole point.

## API overview

All routes are prefixed with `/api`.

| Route | Methods | Purpose |
|---|---|---|
| `/health` | GET | Health check |
| `/auth/register` | POST | Create account and sign in |
| `/auth/login` | POST | Sign in |
| `/auth/logout` | POST | Clear authentication cookie |
| `/auth/me` | GET | Current authenticated account |
| `/users/profile` | PATCH | Update role-appropriate profile |
| `/pickups` | POST | Household schedules a pickup (multipart form) |
| `/pickups/mine` | GET | Household pickup history |
| `/pickups/available` | GET | Collector available requests |
| `/pickups/assigned` | GET | Collector assignments |
| `/pickups/stats` | GET | Verified collection stats |
| `/pickups/:id/accept` | POST | Accept available pickup |
| `/pickups/:id/reject` | POST | Hide a pickup from this collector |
| `/pickups/:id/cancel` | POST | Household cancellation |
| `/pickups/:id/cancel-assignment` | POST | Collector releases assignment |
| `/pickups/:id/qr` | GET | Rotate and retrieve household QR |
| `/pickups/verify` | POST | Validate QR payload and collector assignment |
| `/pickups/complete` | POST | Verify actual category weights and award points |
| `/wallet` | GET | Balance and transaction history |
| `/products` | GET | Active, in-stock marketplace products |
| `/products/mine` | GET | Organisation catalogue |
| `/products` | POST | Create product (multipart form) |
| `/products/:id` | PUT/DELETE | Update/deactivate own product |
| `/orders/redeem/:productId` | POST | Redeem points for a product |
| `/orders/household` | GET | Household orders (`status=active` or `completed`) |
| `/orders/organisation` | GET | Organisation orders (optional status filter) |
| `/orders/:id/status` | PATCH | Organisation moves order to processing/dispatched |
| `/orders/:id/received` | POST | Household confirms receipt |
| `/notifications` | GET | User notifications |
| `/notifications/:id/read` | PATCH | Mark notification read |

Authenticated routes use the HTTP-only `gw_token` cookie. The API also accepts a bearer token for controlled integrations, but the web client uses cookies.

## Pickup and QR flow

1. A household schedules a pickup; the API stores a SHA-256 hash of a cryptographically random token and returns a QR image.
2. Only the household owner can request a refreshed QR. QR data contains an opaque pickup ID and token, not the household's address or name.
3. The collector scans the QR or enters the payload manually.
4. The API validates the token and confirms the signed-in collector is assigned to that pickup.
5. The collector enters measured category weights and submits completion.
6. The pickup update and wallet credit are wrapped in a MongoDB transaction. The unique `idempotencyKey` prevents duplicate reward transactions. The pickup state transition also prevents a second completion.
7. The collector can use the manual entry path when camera access is not available. Camera scanning works on localhost or secure HTTPS contexts, subject to browser permissions.

A refreshed QR rotates the token, invalidating the previous code. Avoid screenshots or forwarding QR codes; share them only with the assigned collector at collection time.

## Image uploads

Local development uses Multer and stores images in `UPLOAD_DIR` (default `server/uploads` when the server is started from the server directory). Only JPEG, PNG, and WebP MIME types are accepted; each file is limited by `MAX_UPLOAD_MB` and up to five images are accepted per request. Files are served from `/uploads`.

For production, replace local disk storage with private object storage (for example, S3-compatible storage or Cloudinary), configure upload scanning and access controls, and add a retention policy. The current local static upload folder is intended for development, not sensitive/private production hosting.

## Green Points

Rates are loaded from environment variables. Sample defaults: paper 10 points/kg, newspapers 10, cardboard 8, metal 15, rigid plastic 12, other dry recyclable materials 5. Only collector-verified weights are used. Points are stored as ledger transactions rather than a client-editable balance. The wallet UI derives the balance by summing credits and debits.

## Tests and verification

Run backend unit tests:

```bash
npm test --prefix server
```

PowerShell:

```powershell
npm test --prefix server
```

The included tests cover pure reward calculation (configured category rates, unknown categories and empty weights). The broader acceptance scenarios in the project requirements—authentication integration, role access, cancellation cutoffs, concurrent assignment, QR permissions, duplicate verification, stock races and order ownership—still require integration tests against a configured MongoDB replica set. They are not represented as passing here.

Run the frontend production build:

```bash
npm run build
```

## Troubleshooting

- **MongoDB transaction error**: use MongoDB Atlas or configure a local replica set; standalone MongoDB does not support transactions.
- **401 / session appears signed out**: confirm `CLIENT_ORIGIN` matches the frontend origin and both use the expected ports. Cookies are HTTP-only and cannot be read from JavaScript.
- **CORS error**: use the exact frontend origin in `CLIENT_ORIGIN`; do not use `*` with credentialed requests.
- **Camera scanner unavailable**: allow camera access and use localhost or HTTPS.
- **Uploads missing**: `UPLOAD_DIR` is resolved relative to the server process working directory. Ensure that directory is writable and served by the same API process.
- **No products / requests**: seed the development accounts and products, then sign in with the appropriate role.
- **Email already registered**: use a different email or remove the development account from your local database.

## Security and deployment notes

- Use a long random `JWT_SECRET`; configure HTTPS and secure cookies in production.
- Configure SameSite/CORS deliberately if client and API are on different sites. CSRF protection should be added before deploying cross-site cookie authentication.
- The local upload implementation is not a private storage service; use access-controlled object storage for production.
- Multi-document operations rely on MongoDB transactions and should be deployed to a replica set.
- Add audit logging, admin-assisted exception workflow, email/SMS delivery, image malware scanning, retention/deletion controls, and a complete automated integration suite before production use.
- No real payment gateway is required for the core points redemption flow.
