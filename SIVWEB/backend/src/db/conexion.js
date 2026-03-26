const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const db = mysql.createConnection(dbConfig);

// Conectar la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }

    console.log('Conexión a la base de datos establecida');
});

module.exports = db;
