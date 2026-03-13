const express = require('express');
const router = express.Router();
const db = require('./conexion');

//Ruta par obtener las ventas en un rango de fechas
router.get('/ventas', (req, res) => {
    const { inicio, fin } = req.query;
    
    if (!inicio || !fin) {
        return res.status(400).json({ error: 'Se requieren las fechas de inicio y fin' });
    }

    const fechaInIcio = new Date(inicio);
    const fechaFin = new Date(fin);

    //Validamos que las fechas sean correctas
    if (isNaN(fechaInIcio.getTime()) || isNaN(fechaFin.getTime())) {
        return res.status(400).send('Fechas no válidas');
    }   
    //Aseguramos que la fecha inicio no sea mayor a fecha final
    if (fechaInIcio > fechaFin) {
        return res.status(400).send('La fecha de inicio no puede ser mayor a la fecha final');
    }

    //Formateamos las fechas para la consulta SQL
    const fechaInicioStr = fechaInIcio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    const query = `SELECT * FROM ventas WHERE fecha_venta BETWEEN ? AND ?`;
    db.query(query, [fechaInicioStr, fechaFinStr], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener las ventas');
        }
        res.status(200).send(results);
    });
});

//Ruta para agregar una nueva venta
//Codigo-producto-pre_publico-cantidad-total_totalventa_usuario

router.post('/ventas', (req, res) => {
    const { venta} = req.body;
    
    if (!venta) {
        return res.status(400).send('Se requiere la información de la venta');
    }

    const fecha = new Date()
    //Formatear fecha para la consulta SQL
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    const id_venta = Date.now().toString();

    //Crear el string en el formato deseado
    const fecha_venta = `${anio}-${mes}-${dia}`;

    //Separar los productos y el total de la venta (Asumiendo que venta viene como un string ''productos_totales)
    const productosString = venta.split('_');
    const productos = productosString[0];
    const total_venta = parseFloat(productosString[1]);

    const vendedor = productosString[2];

    //Validar el total venta
    if (isNaN(total_venta)) {
        return res.status(400).send('Total de venta no válido');
    }

    //Insertar la venta en l base de datos
    const query = `INSERT INTO ventas (id_venta, productos, total_venta, fecha_venta, vendedor) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [id_venta, productos, total_venta, fecha_venta, vendedor], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al agregar la venta');
        }
        res.status(201).send({
            message: 'Venta agregada exitosamente',
            id_venta
        })
    });
});

module.exports = router;