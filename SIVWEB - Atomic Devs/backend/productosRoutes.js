const express = require('express');
const router = express.Router();
const db = require('./conexion');

//Ruta para obtener los productos de la tabla productos
router.get('/productos', (req, res) => {
    const sql = 'SELECT * FROM productos';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});

//Ruta para obtener el producto usando el codigo del mismo

router.get('/producto', (req, res) => {
    const {codigo} = req.query;
    
    const query = 'SELECT codigo, num_producto, pre_publico FROM productos WHERE codigo = ?';
    db.query(query, [codigo], (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Error al obtener el producto' });
        }
        res.json(results);
    });
});

//Ruta para agregar un nuevo producto
router.post('/productos', (req, res) => {
    const { codigo, num_producto,desc_producto, pre_publico, pre_proveedor, existencias } = req.body;

    if (!codigo || !num_producto || !desc_producto || !pre_publico || !pre_proveedor || !existencias) {
        return res.status(400).send({ error: 'Todos los campos son obligatorios' });
    }

    const sql = 'INSERT INTO productos (codigo, num_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [codigo, num_producto, desc_producto, pre_publico, pre_proveedor, existencias], (err, result) => {
        if (err) {
            console.error('Error al agregar el producto:', err);
            return res.status(500).send({ error: 'Error al agregar el producto' });
        }
        res.status(201).send({ codigo, num_producto, desc_producto, pre_publico, pre_proveedor, existencias });
    });
});

//Ruta para editar un producto
router.put('/productos/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { num_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body;

    const query = 'UPDATE productos SET num_producto = ?, desc_producto = ?, pre_publico = ?, pre_proveedor = ?, existencias = ? WHERE codigo = ?';
    db.query(query, [num_producto, desc_producto, pre_publico, pre_proveedor, existencias, codigo], (err, result) => {
        if (err) {
            return res.status(500).send('Error al actualizar el producto');
        }
        res.send('Producto actualizado correctamente');
    });
});

//Ruta para eliminar un producto
router.delete('/productos/:producto', (req, res) => {
    const { producto } = req.params;
    const query = 'DELETE FROM productos WHERE codigo = ?';

    db.query(query, [producto], (err, result) => {
        if (err) {
            return res.status(500).send('Error al eliminar el producto');
        }
        res.send('Producto eliminado correctamente');
    });
});

module.exports = router;