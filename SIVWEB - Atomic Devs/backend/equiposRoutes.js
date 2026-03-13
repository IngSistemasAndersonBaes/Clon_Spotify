const express = require('express');
const router = express.Router();
const db = require('./conexion');

//Ruta para obtener todos los estados de equipos
router.get('/estados_equipo', (req, res) => {
    db.query('SELECT * FROM estados_equipo', (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});

//Ruta para obtener todos los equipos
router.get('/equipos', (req, res) => {
    db.query('SELECT * FROM equipos', (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});

// Ruta para asignar usuario a aequipo
router.post('/equipos/asignacion', (req, res) => {
    const { num_serie, usuario } = req.body;

    //Si el usuario no existe o esa vacio, asignamos null
    const responsable = usuario && usuario.trim() !== '' ? usuario : null;

    const query = 'UPDATE equipos SET responsable = ? WHERE num_serie = ?';
    db.query(query, [responsable, num_serie], (err, results) => {
        if (err) {
            console.error('Error al asignar usuario al equipo:', err);
            return res.status(500).send('Error al asignar usuario al equipo');
        }
        res.status(200).send('Se asigno exitosamente el usuario al equipo correspondiente');
    });
});

//Ruta para registrar un nuevo reporte de falla
router.post('/equipos/reporte/add', (req, res) => {
    const { num_serie, falla } = req.body

    if (!num_serie || !falla) {
        return res.status(400).send('Número de serie y la falla son requeridos');
    }
    //Obtener la fecha actual con formato DD-MM-YYYY
    const fecha = new Date();

    //Formatear la fecha a YYYY-MM-DD
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    //Crear el string en el formato deseado
    const fecha_reporte = `${anio}-${mes}-${dia}`;

    //Iniciar la transaccion
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).send('Error al iniciar la transacción');
        }

        //Actualizar el estadi del equipo a mantenimiento
        const updateEstadoQuery = 'UPDATE equipos SET estado = "mantenimiento" WHERE num_serie = ?';
        db.query(updateEstadoQuery, [num_serie], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado', err);
                    return res.status(500).send('Error al actualizar el estado del equipo');
                });
            }

            const id_historial = Date.now();
            
            //Insertar el nuevo registro en la tabla historial_mantenimientos
            const insertHistorialQuery = 'INSERT INTO historial_mantenimientos (id_historial, num_serie, fecha_reporte, falla) VALUES (?, ?, ?, ?)';

            db.query(insertHistorialQuery, [id_historial, num_serie, fecha_reporte, falla], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al insertar el historial de mantenimiento', err);
                        return res.status(500).send('Error al insertar el historial de mantenimientos');
                    });
                }

                //Confirmar la transacción
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transacción', err);
                            return res.status(500).send('Error al confirmar la transacción');
                        });
                    }

                    res.status(200).send('Estado actualizado a mantenimiento y reporte registrado exitosamente');
                });
            });
        });
    }); 
});

//Ruta para obtener los Mantenimeitnos ordenados por fecha de reporte y falta de solucion
router.get('/equipos/mantenimientos', (req, res) => {
    const query = 'SELECT * FROM historial_mantenimientos WHERE fecha_solucion is NULL ORDER BY fecha_reporte ASC';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta');
        }

        res.json(results);
    });
});

//Ruta para actualizar la solucion en historial y cambiar el estado del equipo
router.post('/equipos/mantenimientos/update', (req, res) => {
    const { num_serie, id_historial, tecnico, solucion } = req.body;

    if (!num_serie || !id_historial || !tecnico || !solucion) {
        return res.status(400).send('El id, numero de serie, tecnico y solucion son requeridos');
    }

    //Obtener la fecha con el formao deseado
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    const fecha_solucion = `${anio}-${mes}-${dia}`;

    //Iniciar la transaccion
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).send('Error al iniciar la transacción');
        }   

        //Actulizar el estado del equipo a activo
        const updateEstadoQuery = 'UPDATE equipos SET estado = "activo" WHERE num_serie = ?';
        db.query(updateEstadoQuery, [num_serie], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado', err);
                    return res.status(500).send('Error al actualizar el estado del equipo');
                });
            }

            //Actualizamos el registro de la tabla historial_mantenimientos
            const updateHistorialQuery = 'UPDATE historial_mantenimientos SET fecha_solucion = ?, usuario_tecnico = ?, solucion = ? WHERE id_historial = ?';
            db.query(updateHistorialQuery, [fecha_solucion, tecnico, solucion, id_historial], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al actualizar el historial', err);
                        return res.status(500).send('Error al actualizar el historial');
                    });
                }

                //Confirmar la transacción
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transacción', err);
                            return res.status(500).send('Error al confirmar la transacción');
                        });
                    }

                    res.status(200).send('Estado del equipo actulizado a activo a mantenimiento actualizado');
                });
            });
        });
    });
});

//Ruta para obtener los mantenimientos por id_historial, num_serie o tecnico
router.post('/equipos/mantenimientos/find', (req, res) => {
    const{ filter } = req.body;

    if (!filter) {
        return res.status(400).json({ error: 'Se debe propocionar al menos uno de los parametros' });
    }

    const query = `SELECT * FROM historial_mantenimientos 
    WHERE id_historial = '${filter}'
    OR num_serie = '${filter}'
    OR usuario_tecnico = '${filter}'
    AND solucion IS NOT NULL`

    db.query(query, [filter], (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }

        res.json(results)
    })

});

module.exports = router;