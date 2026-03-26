const express = require('express');
const router = express.Router();

const db = require('../db/conexion');
const auth = require('../middlewares/auth');

// Ruta para obtener todas las áreas
router.get('/areas', auth, (req, res, next) => {
    db.query('SELECT * FROM areas', (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

module.exports = router;
