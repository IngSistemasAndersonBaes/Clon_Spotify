const mysql = require('mysql2');

//Configuración de la conexión a la base de datos

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'db_inv_ti'
};

const db = mysql.createConnection(dbConfig);

//Conectar la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    } 

    console.log('Conexión a la base de datos establecida');
});

module.exports = db;