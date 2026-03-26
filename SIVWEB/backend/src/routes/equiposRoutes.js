const express = require('express');
const router = express.Router();

const db = require('../db/conexion');
const auth = require('../middlewares/auth');
const { formatDate } = require('../utils/date');

// Ruta para obtener todos los estados de equipos
router.get('/estados_equipo', auth, (req, res, next) => {
    db.query('SELECT * FROM estados_equipo', (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

// Ruta para obtener todos los equipos
router.get('/equipos', auth, (req, res, next) => {
    db.query('SELECT * FROM equipos', (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

// Ruta para asignar usuario a equipo
router.post('/equipos/asignacion', auth, (req, res, next) => {
    const { num_serie, usuario } = req.body;

    if (!num_serie) {
        return res.status(400).send('Número de serie requerido');
    }

    const responsable = usuario && String(usuario).trim() !== '' ? usuario : null;

    const query = 'UPDATE equipos SET responsable = ? WHERE num_serie = ?';
    db.query(query, [responsable, num_serie], (err) => {
        if (err) {
            return next(err);
        }
        return res.status(200).send('Se asignó exitosamente el usuario al equipo correspondiente');
    });
});

// Ruta para registrar un nuevo reporte de falla
router.post('/equipos/reporte/add', auth, (req, res, next) => {
    const { num_serie, falla } = req.body;

    if (!num_serie || !falla) {
        return res.status(400).send('Número de serie y la falla son requeridos');
    }

    const fecha_reporte = formatDate(new Date());

    db.beginTransaction((err) => {
        if (err) {
            return next(err);
        }

        const updateEstadoQuery = 'UPDATE equipos SET estado = "mantenimiento" WHERE num_serie = ?';
        db.query(updateEstadoQuery, [num_serie], (errUpdate) => {
            if (errUpdate) {
                return db.rollback(() => next(errUpdate));
            }

            const id_historial = Date.now();
            const insertHistorialQuery = 'INSERT INTO historial_mantenimientos (id_historial, num_serie, fecha_reporte, falla) VALUES (?, ?, ?, ?)';

            db.query(insertHistorialQuery, [id_historial, num_serie, fecha_reporte, falla], (errInsert) => {
                if (errInsert) {
                    return db.rollback(() => next(errInsert));
                }

                db.commit((errCommit) => {
                    if (errCommit) {
                        return db.rollback(() => next(errCommit));
                    }

                    return res.status(200).send('Estado actualizado a mantenimiento y reporte registrado exitosamente');
                });
            });
        });
    });
});

// Ruta para obtener los mantenimientos ordenados por fecha de reporte y falta de solución
router.get('/equipos/mantenimientos', auth, (req, res, next) => {
    const query = 'SELECT * FROM historial_mantenimientos WHERE fecha_solucion IS NULL ORDER BY fecha_reporte ASC';

    db.query(query, (err, results) => {
        if (err) {
            return next(err);
        }

        return res.json(results);
    });
});

// Ruta para actualizar la solución en historial y cambiar el estado del equipo
router.post('/equipos/mantenimientos/update', auth, (req, res, next) => {
    const { num_serie, id_historial, tecnico, solucion } = req.body;

    if (!num_serie || !id_historial || !tecnico || !solucion) {
        return res.status(400).send('El id, número de serie, técnico y solución son requeridos');
    }

    const fecha_solucion = formatDate(new Date());

    db.beginTransaction((err) => {
        if (err) {
            return next(err);
        }

        const updateEstadoQuery = 'UPDATE equipos SET estado = "activo" WHERE num_serie = ?';
        db.query(updateEstadoQuery, [num_serie], (errUpdate) => {
            if (errUpdate) {
                return db.rollback(() => next(errUpdate));
            }

            const updateHistorialQuery = 'UPDATE historial_mantenimientos SET fecha_solucion = ?, usuario_tecnico = ?, solucion = ? WHERE id_historial = ?';
            db.query(updateHistorialQuery, [fecha_solucion, tecnico, solucion, id_historial], (errHistorial) => {
                if (errHistorial) {
                    return db.rollback(() => next(errHistorial));
                }

                db.commit((errCommit) => {
                    if (errCommit) {
                        return db.rollback(() => next(errCommit));
                    }

                    return res.status(200).send('Estado del equipo actualizado a activo y mantenimiento actualizado');
                });
            });
        });
    });
});

// Ruta para obtener los mantenimientos por id_historial, num_serie o técnico
router.post('/equipos/mantenimientos/find', auth, (req, res, next) => {
    const { filter } = req.body;

    if (!filter) {
        return res.status(400).json({ error: 'Se debe proporcionar al menos uno de los parámetros' });
    }

    const query = `SELECT * FROM historial_mantenimientos 
    WHERE (id_historial = ? OR num_serie = ? OR usuario_tecnico = ?)
    AND solucion IS NOT NULL`;

    db.query(query, [filter, filter, filter], (err, results) => {
        if (err) {
            return next(err);
        }

        return res.json(results);
    });
});

module.exports = router;
