const express = require('express');
const router = express.Router();
const db = require('./conexion');

//Ruta para obtener todas las áreas
router.get('/areas', (req, res) => {
    db.query('SELECT * FROM areas', (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});

module.exports = router;