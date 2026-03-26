const express = require('express');
const Joi = require('joi');
const router = express.Router();

const db = require('../db/conexion');
const auth = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');

const productQuerySchema = Joi.object({
    codigo: Joi.string().max(50).required()
});

const productSchema = Joi.object({
    codigo: Joi.string().max(50).required(),
    nom_producto: Joi.string().max(100).required(),
    desc_producto: Joi.string().required(),
    pre_publico: Joi.number().positive().required(),
    pre_proveedor: Joi.number().positive().required(),
    existencias: Joi.number().integer().min(0).required()
});

const productUpdateSchema = Joi.object({
    nom_producto: Joi.string().max(100).required(),
    desc_producto: Joi.string().required(),
    pre_publico: Joi.number().positive().required(),
    pre_proveedor: Joi.number().positive().required(),
    existencias: Joi.number().integer().min(0).required()
});

// Ruta para obtener los productos de la tabla productos
router.get('/productos', auth, (req, res, next) => {
    const sql = 'SELECT * FROM productos';
    db.query(sql, (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

// Ruta para obtener el producto usando el código del mismo
router.get('/producto', auth, validateQuery(productQuerySchema), (req, res, next) => {
    const { codigo } = req.query;

    const query = 'SELECT codigo, nom_producto, pre_publico FROM productos WHERE codigo = ?';
    db.query(query, [codigo], (err, results) => {
        if (err) {
            return next(err);
        }
        return res.json(results);
    });
});

// Ruta para agregar un nuevo producto
router.post('/productos', auth, validateBody(productSchema), (req, res, next) => {
    const { codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body;

    const query = 'INSERT INTO productos (codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias], (err) => {
        if (err) {
            return next(err);
        }
        return res.status(201).send({ codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias });
    });
});

// Ruta para editar un producto
router.put('/productos/:codigo', auth, validateBody(productUpdateSchema), (req, res, next) => {
    const { codigo } = req.params;
    const { nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body;

    const query = 'UPDATE productos SET nom_producto = ?, desc_producto = ?, pre_publico = ?, pre_proveedor = ?, existencias = ? WHERE codigo = ?';
    db.query(query, [nom_producto, desc_producto, pre_publico, pre_proveedor, existencias, codigo], (err) => {
        if (err) {
            return next(err);
        }
        return res.send('Producto actualizado correctamente');
    });
});

// Ruta para eliminar un producto
router.delete('/productos/:producto', auth, (req, res, next) => {
    const { producto } = req.params;
    const query = 'DELETE FROM productos WHERE codigo = ?';

    db.query(query, [producto], (err) => {
        if (err) {
            return next(err);
        }
        return res.send('Producto eliminado correctamente');
    });
});

module.exports = router;
