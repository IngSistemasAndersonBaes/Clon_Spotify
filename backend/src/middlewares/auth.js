const jwt = require('jsonwebtoken');
const db = require('../db/conexion');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.token;
    const token = cookieToken || headerToken;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token requerido' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'JWT_SECRET no configurado' });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    db.query('SELECT usuario, rol, estado, token_version FROM usuarios WHERE usuario = ?', [payload.usuario], (err, results) => {
        if (err) {
            return next(err);
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }

        const usuarioDb = results[0];
        const tokenVersion = Number(usuarioDb.token_version || 0);
        const payloadVersion = Number(payload.token_version || 0);

        if (tokenVersion !== payloadVersion) {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }

        if (String(usuarioDb.estado).toLowerCase() !== 'activo') {
            return res.status(403).json({ success: false, message: 'Usuario inactivo' });
        }

        req.user = {
            usuario: usuarioDb.usuario,
            rol: usuarioDb.rol || payload.rol || 'trabajador',
            estado: usuarioDb.estado,
            area: payload.area,
            nombre: payload.nombre,
            token_version: tokenVersion
        };

        const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        if (shouldLog) {
            res.on('finish', () => {
                const query = 'INSERT INTO audit_logs (usuario, rol, metodo, ruta, status, ip) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(query, [req.user.usuario, req.user.rol, req.method, req.originalUrl, res.statusCode, req.ip], () => {});
            });
        }

        return next();
    });
}

module.exports = authMiddleware;
