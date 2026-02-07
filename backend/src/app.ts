import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import { requestLogger } from './common/middleware/request-logger.middleware';
import { httpLogger } from './common/middleware/pino-middleware.http';
import { errorHandler } from './common/middleware/error.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { limiter } from './common/middleware/rate-limit.middleware';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './modules/catalog/routes/auth.routes';
import catalogRoutes from './modules/catalog/routes/catalog.routes';
import profileRoutes from './modules/catalog/routes/profile.routes';
import categoryRoutes from './modules/catalog/routes/category.routes';
import orderRoutes from './modules/catalog/routes/order.routes';
import cartRoutes from './modules/catalog/routes/cart.routes';
import adminRoutes from './modules/catalog/routes/admin.routes';
import settingsRoutes from './modules/catalog/routes/settings.routes';
import wishlistRoutes from './modules/catalog/routes/wishlist.routes';
import paymentRoutes from './modules/catalog/routes/payment.routes';
import uploadRoutes from './modules/catalog/routes/upload.routes';

const app = express();

// ---------- Global middleware ----------
// Configure Helmet to allow Google Sign-In popups (COOP)
app.use(
    helmet({
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false, // disable CSP just in case it's interfering with scripts
    })
);
app.use(express.json());
// Manual sanitization to support Express 5 (req.query is read-only)
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.query) mongoSanitize.sanitize(req.query);
    if (req.params) mongoSanitize.sanitize(req.params);
    next();
});
app.use(limiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

// Request ID middleware (must be before Morgan)
app.use(requestIdMiddleware);

// Request logger (after request ID)
app.use(requestLogger);

app.use(httpLogger);

// ---------- Routes ----------
app.get('/', (_req, res) => {
    res.status(200).json({
        name: 'E-Commerce Platform API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            api: '/api/v1',
            auth: '/api/v1/auth',
            products: '/api/v1/products',
            orders: '/api/v1/orders',
            cart: '/api/v1/cart',
            profile: '/api/v1/profile',
            categories: '/api/v1/categories',
            wishlist: '/api/v1/wishlist',
            payments: '/api/v1/payments',
            admin: '/api/v1/admin',
            settings: '/api/v1/settings',
            upload: '/api/v1/upload'
        }
    });
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', catalogRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/upload', uploadRoutes);

// ---------- Error handler (ALWAYS LAST) ----------
app.use(errorHandler);


export default app;
