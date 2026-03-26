function errorHandler(err, req, res, next) {
    console.error(err);

    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ success: false, message: 'CSRF token inválido' });
    }

    const status = err.status || 500;
    const isProd = process.env.NODE_ENV === 'production';

    res.status(status).json({
        success: false,
        message: isProd ? 'Error interno del servidor' : (err.message || 'Error interno del servidor')
    });
}

module.exports = errorHandler;
