# AssignEcom – Full‑Stack E‑Commerce Platform

A monorepo containing a TypeScript / Node.js (Express 5) backend and a React 19 + Vite + TailwindCSS frontend. Provides user, product, cart, order, delivery, inventory, and category management with JWT auth, role-based access control, Swagger docs, and Prisma ORM (PostgreSQL).

## watch Demo here [Demo](https://drive.google.com/file/d/1pB_50vg9cP5BQtv7cVPsTiqB7WqfHQoH/view?usp=sharing) - deployed but azure credits get over today morning

## 1. Features (Current)
- Authentication & Authorization
  - Register / login / refresh tokens (JWT + refresh token storage)
  - Roles: ADMIN, CUSTOMER, DELIVERY (enforced via middleware)
- User Profile & Addresses (multiple + default)
- Categories & Products (CRUD, images via Cloudinary, inventory tracking)
- Cart (single active cart per user) & Cart Items
- Orders (status workflow: PENDING → PROCESSING → SHIPPED → DELIVERED / CANCELLED)
- Delivery Assignment (UNASSIGNED / ASSIGNED / OUT_FOR_DELIVERY / DELIVERED / FAILED) auto‑maps to order status transitions
- Inventory Transactions (auditable stock adjustments)
- Shipping Amount & Totals Computation
- Swagger OpenAPI documentation (/api-docs)
- Responsive React frontend (role specific dashboard shells)

## 2. Tech Stack
Backend:
- Node.js, Express 5, TypeScript
- Prisma ORM + PostgreSQL
- JWT (access + refresh) / bcrypt for password hashing
- Cloudinary for image storage with Multer middleware
- Swagger (swagger-jsdoc + swagger-ui-express)
- Socket.io (prepared for real‑time events)
- Zod for request validation

Frontend:
- React 19, Vite, TypeScript
- TailwindCSS + tailwind-merge + tailwindcss-animate
- Radix UI primitives (@radix-ui/*), lucide-react icons
- React Router v7
- React Query (TanStack) for server state
- Redux Toolkit (if global state beyond server cache required)
- React Hook Form + Zod validation

Tooling:
- ESLint (flat config) + TypeScript strict
- Prisma migrations

## 3. Repository Structure (Important Folders)
```
backend/
  src/
    controller/            # Route handlers (business logic)
    routes/                # Express route declarations
    middleware/            # Auth / Role / Upload middlewares
    utils/cloudnairy.ts    # Cloudinary config
    prismaClient.ts        # Prisma client import wrapper (generated)
    docs/                  # Swagger components/extensions
    generatePostman.ts     # Dynamic Postman collection builder
    app.ts / index.ts      # Express app + bootstrap
  prisma/
    schema.prisma          # Prisma data model
    migrations/            # Generated migration SQL
frontend/
  src/
    components/            # UI + role specific dashboards
    pages/                 # Route level components
    hooks/ lib/ utils/     # Reusable logic & helpers
    types/                 # Shared TypeScript types
```

## 4. Prerequisites
- Node.js >= 18.x (LTS recommended)
- PostgreSQL database (local or hosted)
- Cloudinary account (for product images)
- pnpm / npm / yarn (examples use npm)

## 5. Environment Variables
Create a `.env` file inside `backend/` (NOT committed). Example:
```
# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Auth
JWT_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/assignecom?schema=public

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_key
CLOUD_API_SECRET=your_secret

# Optional (Postman generator overrides)
POSTMAN_BASE_URL=http://localhost:3000
POSTMAN_OUTPUT=postman_collection.json
```
Frontend specific (if needed) can go into `frontend/.env` using Vite prefix `VITE_`:
```
VITE_API_BASE=http://localhost:3000
```

## 6. Installation & Local Development
Clone and install both workspaces.
```
# From repo root
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate   # creates initial tables (edit name when adding new migrations)

cd ../frontend
npm install
```
Run servers (two terminals):
```
# Backend
cd backend
npm run dev
# -> http://localhost:3000 (Swagger: /api-docs)

# Frontend
cd frontend
npm run dev
# -> http://localhost:5173
```

## 7. Database & Prisma Workflow
- Modify `prisma/schema.prisma`
- Run: `npm run prisma:migrate` (auto names migration `init` currently; for new features use `npx prisma migrate dev --name feature_xyz`)
- Regenerate client: `npm run prisma:generate`
- (Optional) Open Prisma Studio: `npm run prisma:studio`

## 8. API Documentation
- Swagger UI: `GET /api-docs`
- Health check: `GET /health`
- Base root: `GET /` returns simple message
Add new route annotations in `backend/src/routes/*.ts` or `backend/src/docs/*.ts` as defined in swagger options.

## 9. Postman Collection Generation
`backend/src/generatePostman.ts` walks Express routes and emits a Postman collection.
Steps:
```
cd backend
npx ts-node src/generatePostman.ts   # or compile then: node dist/generatePostman.js
# Output: postman_collection.json (or custom via POSTMAN_OUTPUT)
```
Import the generated JSON into Postman.

## 10. Authentication Flow
1. User registers (password hashed with bcrypt).  
2. Login returns access + refresh tokens.  
3. Access token used in `Authorization: Bearer <token>` header.  
4. Refresh endpoint verifies `JWT_REFRESH_SECRET` to rotate credentials.  
5. Logout clears stored refresh token.  
Role middleware restricts access; delivery & admin routes guarded accordingly.

## 11. Image Uploads
- Cloudinary configured in `utils/cloudnairy.ts` using env credentials.
- Multer middleware handles multipart form-data for product image uploads then uploads to Cloudinary; stored URL persisted in `Product_Images` table.

## 12. Order & Delivery Status Mapping
Delivery status transitions update mapped order status via `deliveryToOrderStatusMap` & `allowedTransitions` defined in `constant.ts` ensuring consistent fulfillment workflow.

## 13. Scripts Summary (Backend)
- `npm run dev` – Compile TS then start server
- `npm start` – Start existing build (`dist/`)
- `npm run prisma:generate` – Generate Prisma client
- `npm run prisma:migrate` – Run dev migration (named `init` by default)
- `npm run prisma:studio` – Launch Prisma Studio

Frontend:
- `npm run dev` – Vite dev server
- `npm run build` – Type check + production build
- `npm run preview` – Preview production build
- `npm run lint` – ESLint

## 14. Production Build Considerations
Backend:
```
cd backend
npm install --production
npm run prisma:generate
npx prisma migrate deploy
npm run build  # (add a build script if desired to compile only)
node dist/index.js
```
Frontend:
```
cd frontend
npm install
npm run build
# Serve 'dist/' via a CDN/static host or reverse proxy
```
Environment hardening:
- Use strong secrets, rotate refresh tokens
- Enable HTTPS & secure cookies (if you later store tokens in cookies)
- Configure CORS to specific domains only


## 15. Logging & Monitoring (Planned)
Add Winston / Pino logger abstraction; integrate with a log aggregator (e.g., ELK, Loki) and health metrics.

## 16. Future Enhancements
- Payment gateway integration (Stripe / Razorpay)
- Advanced discount & coupon engine
- Product search & filtering (full text / vector search)
- Real‑time order status updates via Socket.io
- Soft deletes & auditing
- Rate limiting & input sanitization
- CI/CD workflow, containerization, deployment scripts

## 17. Contributing
1. Fork & clone
2. Create feature branch: `git checkout -b feat/short-description`
3. Make changes + add migration if schema changes
4. Ensure lint passes
5. Open PR describing changes & test steps

## 18. Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot connect to DB | Wrong DATABASE_URL | Verify credentials / network |
| 401 Unauthorized | Missing / expired access token | Refresh token or login |
| 403 Forbidden | Role mismatch | Use correct account role |
| Cloudinary upload fails | Env vars missing | Set CLOUD_* vars |
| Swagger empty | Missing JSDoc comments / server not restarted | Add comments & restart |

## 19. License
Add your chosen license here (e.g., MIT).
