const express = require('express');
const router = express.Router();
const db = require('./conexion');

//Ruta para el login
router.post('/login', (req, res) => {
    const { usuario, contrasena } = req.body;  
    if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    //Buscar el usuario en  base de datos
    db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?', [usuario, contrasena], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la consulta a la base de datos' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const usaurioEncontrado = results[0];
        res.status(200).send({
            mensaje: '',
            usuario: {
                usuario: usaurioEncontrado.usuario,
                nombre: usaurioEncontrado.nombre,
                area: usaurioEncontrado.area,
                estado: usaurioEncontrado.estado
            }
        });
    });
});

//Ruta para obtener todos los usuarios 
router.get('/usuarios', (req, res) => {
    db.query('SELECT usuario, nombre, area, correo, estado FROM usuarios', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta');
        }
        res.json(results);  
    });
});

//Ruta para agregar un nuevo usuario
router.post('/usuarios', (req, res) => {
    const { usuario, contrasena, nombre, area, correo, estado } = req.body; 

    if (!usuario || !contrasena || !nombre || !area || !correo) {
        return res.status(400).send('Faltan campos requeridos');
    }

    const query = `INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES (?, ?, ?, ?, ?, "activo")`;
    db.query(query, [usuario, contrasena, nombre, area, correo, estado], (err, results) => {
        if (err) {
            console.error('Error al agregar el usuario:', err);
            return res.status(500).send('Error al agregar el usuario');
        }
        res.status(201).send({
            usuario, contrasena, nombre, area, correo, estado 
        })
    });
});

//Ruta para editar un usuario

router.put('/usuarios/:usuario', (req, res) => {
    const { usuario } = req.params;
    const { nombre, contrasena, area, correo, estado } = req.body;

    const query = `UPDATE usuarios SET nombre = ?, contrasena = ?, area = ?, correo = ?, estado = ? WHERE usuario = ?`;
    db.query(query, [nombre, contrasena, area, correo, estado, usuario], (err, results) => {
        if (err) {
            return res.status(500).send('Error al actualizar el usuario');
        }
        res.send('Usuario actualizado')
    });
});

//Ruta para elminar un usuario
router.delete('/usuarios/:usuario', (req, res) => {
    const { usuario } = req.params;

    const query = `DELETE FROM usuarios WHERE usuario = ?`;
    db.query(query, [usuario], (err, results) => {
        if (err) {
            return res.status(500).send('Error al eliminar el usuario');
        }
        res.send('Usuario eliminado')
    });
});

module.exports = router;