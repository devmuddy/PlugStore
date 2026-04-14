# Luxcart Server

Backend server for the Digital Assets Purchase Platform.

## Tech Stack

- **Node.js** / **Express** - Server framework
- **MongoDB** / **Mongoose** - Database and ODM
- **Cloudinary** - Image upload and storage
- **Socket.io** - Real-time notifications
- **JWT** - Authentication
- **Nodemailer** - Email notifications

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/luxcart
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxcart?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@luxcart.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin Default Credentials (for initial setup)
ADMIN_EMAIL=admin@luxcart.com
ADMIN_PASSWORD=admin123456
```

### 3. MongoDB Setup

#### Local MongoDB:
- Install MongoDB locally or use Docker
- Start MongoDB service
- Update `MONGODB_URI` in `.env` to point to your local instance

#### MongoDB Atlas (Cloud):
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get your connection string
- Update `MONGODB_URI` in `.env`

### 4. Cloudinary Setup

- Create a free account at [Cloudinary](https://cloudinary.com/)
- Get your Cloud Name, API Key, and API Secret from the dashboard
- Update the Cloudinary variables in `.env`

### 5. Run the Server

#### Development:
```bash
npm run dev
```

#### Production:
```bash
npm run build
npm start
```

### 6. Render Keepalive (Free Tier)

This server includes an internal keepalive pinger that calls your own health endpoint every 12 minutes.

Set these environment variables in Render:

```env
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_URL=https://your-service-name.onrender.com
KEEP_ALIVE_PATH=/health
KEEP_ALIVE_INTERVAL_MS=720000
KEEP_ALIVE_TIMEOUT_MS=15000
```

Notes:
- If `KEEP_ALIVE_URL` is not set, the app will try `RENDER_EXTERNAL_URL` automatically.
- Render Free services can still sleep depending on platform policy. Internal pinging helps reduce idle sleep, but does not guarantee 100% uptime at all times.

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (database, cloudinary)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, upload, etc.)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── index.ts         # Server entry point
├── .env                 # Environment variables (not in git)
├── package.json
└── tsconfig.json
```

## API Endpoints

(To be documented as routes are added)

## Database Models

- **User** - User accounts and authentication
- **Category** - Product categories
- **Product** - Digital products for sale
- **Order** - User orders
- **Deposit** - User deposits/wallet top-ups
- **Wallet** - User wallet balances
- **Transaction** - Wallet transactions

## Image Upload

Images are uploaded to Cloudinary using multer middleware. The upload middleware handles:
- File type validation (JPEG, PNG, GIF, WebP)
- File size limits (5MB max)
- Automatic image optimization
- Secure URL generation

## Socket.io

Real-time features include:
- Order status updates
- Admin notifications
- User notifications

## License

ISC
