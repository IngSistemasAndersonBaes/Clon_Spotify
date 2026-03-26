const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const db = require('../db/conexion');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { validateBody } = require('../middlewares/validate');

const router = express.Router();
const salCaracter = 10;
const isProd = process.env.NODE_ENV === 'production';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos, intenta más tarde.' }
});

const normalizeRole = (value) => {
    if (!value) return null;
    const role = String(value).toLowerCase().trim();
    if (role === 'administrador' || role === 'trabajador') {
        return role;
    }
    return null;
};

const isStrongPassword = (value) => {
    const password = String(value);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= 8 && hasLower && hasUpper && hasNumber;
};

const loginSchema = Joi.object({
    usuario: Joi.string().max(20).required(),
    contrasena: Joi.string().required()
});

const createUserSchema = Joi.object({
    usuario: Joi.string().max(20).required(),
    contrasena: Joi.string().min(8).required(),
    nombre: Joi.string().max(200).required(),
    area: Joi.string().max(100).required(),
    correo: Joi.string().email().max(50).required(),
    estado: Joi.string().max(15).optional(),
    rol: Joi.string().valid('administrador', 'trabajador').optional()
});

const updateUserSchema = Joi.object({
    nombre: Joi.string().max(200).required(),
    contrasena: Joi.string().min(8).optional(),
    area: Joi.string().max(100).required(),
    correo: Joi.string().email().max(50).required(),
    estado: Joi.string().max(15).required(),
    rol: Joi.string().valid('administrador', 'trabajador').optional()
});

// Ruta para el login
router.post('/login', loginLimiter, validateBody(loginSchema), (req, res, next) => {
    const { usuario, contrasena } = req.body;

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT_SECRET no configurado' });
    }

    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
        if (err) {
            return next(err);
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuarioEncontrado = results[0];
        if (String(usuarioEncontrado.estado).toLowerCase() !== 'activo') {
            return res.status(403).json({ error: 'Usuario inactivo' });
        }

        const hash = usuarioEncontrado.contrasena;

        bcrypt.compare(contrasena, hash, (errCompare, match) => {
            if (errCompare) {
                return next(errCompare);
            }
            if (!match) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const rol = normalizeRole(usuarioEncontrado.rol) || 'trabajador';
            const tokenVersion = Number(usuarioEncontrado.token_version || 0);
            const payload = {
                usuario: usuarioEncontrado.usuario,
                nombre: usuarioEncontrado.nombre,
                area: usuarioEncontrado.area,
                estado: usuarioEncontrado.estado,
                rol,
                token_version: tokenVersion
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: isProd, // true solo en https
                sameSite: isProd ? 'none' : 'lax', // en produccion con frontend en otro dominio usar 'none' + secure:true
                maxAge: 4 * 60 * 60 * 1000
            });

            return res.status(200).json({
                mensaje: 'Login exitoso',
                usuario: payload
            });
        });
    });
});

// Ruta para obtener todos los usuarios
router.get('/usuarios', auth, authorizeRoles('administrador'), (req, res, next) => {
    db.query('SELECT usuario, nombre, area, correo, estado, rol FROM usuarios', (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

// Ruta para agregar un nuevo usuario
router.post('/usuarios', auth, authorizeRoles('administrador'), validateBody(createUserSchema), (req, res, next) => {
    const { usuario, contrasena, nombre, area, correo, estado, rol } = req.body;

    if (!isStrongPassword(contrasena)) {
        return res.status(400).send('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
    }

    const estadoFinal = estado && String(estado).trim() !== '' ? estado : 'activo';
    const rolFinal = normalizeRole(rol) || 'trabajador';

    bcrypt.hash(contrasena, salCaracter, (err, hash) => {
        if (err) {
            return next(err);
        }

        const query = 'INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado, rol) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [usuario, hash, nombre, area, correo, estadoFinal, rolFinal], (errInsert) => {
            if (errInsert) {
                return next(errInsert);
            }
            return res.status(201).json({
                usuario,
                nombre,
                area,
                correo,
                estado: estadoFinal,
                rol: rolFinal
            });
        });
    });
});

// Ruta para editar un usuario
router.put('/usuarios/:usuario', auth, authorizeRoles('administrador'), validateBody(updateUserSchema), (req, res, next) => {
    const { usuario } = req.params;
    const { nombre, contrasena, area, correo, estado, rol } = req.body;

    if (contrasena && !isStrongPassword(contrasena)) {
        return res.status(400).send('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
    }

    const updateUser = (passwordHash, rolFinal) => {
        const query = 'UPDATE usuarios SET nombre = ?, contrasena = ?, area = ?, correo = ?, estado = ?, rol = ? WHERE usuario = ?';
        db.query(query, [nombre, passwordHash, area, correo, estado, rolFinal, usuario], (err) => {
            if (err) {
                return next(err);
            }
            return res.send('Usuario actualizado');
        });
    };

    db.query('SELECT contrasena, rol FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
        if (err || !results || results.length === 0) {
            return res.status(500).send('Error al obtener el usuario');
        }

        const rolFinal = normalizeRole(rol) || results[0].rol || 'trabajador';

        if (contrasena) {
            bcrypt.hash(contrasena, salCaracter, (errHash, hash) => {
                if (errHash) {
                    return next(errHash);
                }
                return updateUser(hash, rolFinal);
            });
        } else {
            return updateUser(results[0].contrasena, rolFinal);
        }
    });
});

// Ruta para eliminar un usuario
router.delete('/usuarios/:usuario', auth, authorizeRoles('administrador'), (req, res, next) => {
    const { usuario } = req.params;

    const query = 'DELETE FROM usuarios WHERE usuario = ?';
    db.query(query, [usuario], (err) => {
        if (err) {
            return next(err);
        }
        return res.send('Usuario eliminado');
    });
});

router.post('/logout', auth, (req, res, next) => {
    const usuario = req.user?.usuario;

    db.query('UPDATE usuarios SET token_version = token_version + 1 WHERE usuario = ?', [usuario], (err) => {
        if (err) {
            return next(err);
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax'
        });
        return res.json({ mensaje: 'logout ok' });
    });
});

module.exports = router;
