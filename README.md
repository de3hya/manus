# Accounting & Inventory Management App

A full-stack web application for personal accounting and inventory management with a modern glassmorphism UI.

## Features

### Authentication
- User registration and login
- Password reset with OTP verification
- JWT-based session management

### Accounting Module
- **Transactions**: Create, read, update, delete transactions with categories
- **Budgets**: Set monthly budgets per category with progress tracking
- **Reports**: View financial analytics with charts and trends
- **CSV Export**: Export transactions to CSV

### Inventory Module
- **Items**: Manage inventory items with SKU, supplier, and location
- **Size Variants**: Track multiple sizes per item with purchase/selling prices
- **Stock Movements**: Log inbound and outbound stock movements
- **Low Stock Alerts**: Get alerted when stock falls below minimum threshold

### Settings
- Profile management
- Currency preferences (USD, EUR, GBP, JPY, INR)
- Custom categories for income/expense
- Password change

## Tech Stack

### Backend
- **Runtime**: Node.js (Express.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **API**: RESTful with CORS support

### Frontend
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS with glassmorphism effects
- **State Management**: Zustand
- **Data Fetching**: React Query with Axios
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **UI Components**: Lucide React icons, Sonner toasts

## Project Structure

```
accounting-inventory-app/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes (auth, transactions, budgets, etc.)
│   │   ├── middleware/      # Authentication middleware
│   │   ├── utils/           # JWT and password utilities
│   │   ├── db.ts            # Database client
│   │   └── server.ts        # Express server setup
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── api/             # API client
│   │   ├── store/           # Zustand stores
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   └── package.json
└── package.json             # Root package.json
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Local Development

1. **Clone and install dependencies**
   ```bash
   cd accounting-inventory-app
   npm run setup
   ```

2. **Configure environment variables**
   
   Create `.env` in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/accounting_db"
   JWT_SECRET="your-secret-key-here"
   PORT=3000
   NODE_ENV=development
   ```

3. **Set up database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

## Deployment to Railway

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository

### Steps

1. **Create GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Connect your repository

3. **Add PostgreSQL service**
   - In Railway dashboard, click "Add Service"
   - Select "PostgreSQL"
   - Note the DATABASE_URL

4. **Configure backend service**
   - Add service from GitHub repo
   - Set environment variables:
     ```
     DATABASE_URL=<from-postgres-service>
     JWT_SECRET=<generate-a-secret>
     NODE_ENV=production
     PORT=3000
     ```
   - Set start command: `npm run start`

5. **Configure frontend service**
   - Add another service from GitHub repo
   - Set environment variables:
     ```
     VITE_API_URL=<backend-railway-url>/api
     ```
   - Set build command: `npm --prefix frontend run build`
   - Set start command: `npm --prefix frontend run preview`

6. **Deploy**
   - Railway will automatically deploy on push to main
   - Access your app via the Railway-provided URL

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### User
- `GET /api/user/me` - Get current user
- `PUT /api/user/me` - Update profile
- `PUT /api/user/me/password` - Change password

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get summary
- `GET /api/transactions/export/csv` - Export to CSV

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/progress` - Get budget progress

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Inventory
- `GET /api/inventory/items` - List items
- `POST /api/inventory/items` - Create item
- `GET /api/inventory/items/:id` - Get item detail
- `PUT /api/inventory/items/:id` - Update item
- `DELETE /api/inventory/items/:id` - Delete item
- `POST /api/inventory/items/:id/sizes` - Add size variant
- `PUT /api/inventory/items/:id/sizes/:sizeId` - Update size
- `DELETE /api/inventory/items/:id/sizes/:sizeId` - Delete size
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/summary` - Get inventory summary

### Stock Movements
- `GET /api/stock` - List movements
- `POST /api/stock` - Create movement
- `GET /api/stock/item/:itemId` - Get item movements

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.
