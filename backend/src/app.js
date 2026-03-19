const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csurf = require('csurf');

const usuariosRoutes = require('./routes/usuariosRoutes');
const areasRoutes = require('./routes/areasRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const productosRoutes = require('./routes/productosRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (isProd) {
    app.use((req, res, next) => {
        if (req.secure) return next();
        return res.status(400).json({ success: false, message: 'HTTPS requerido' });
    });
}

const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
    }
});

app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    return csrfProtection(req, res, next);
});

app.use('/', usuariosRoutes);
app.use('/', areasRoutes);
app.use('/', equiposRoutes);
app.use('/', productosRoutes);
app.use('/', ventasRoutes);

app.use(errorHandler);

module.exports = app;
