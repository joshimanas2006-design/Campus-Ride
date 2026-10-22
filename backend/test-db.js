const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Admin123',
    database: 'campus_ride'
});

connection.connect((err) => {

    if (err) {
        console.log("CONNECTION ERROR:");
        console.log(err.message);
        return;
    }

    console.log("CONNECTED SUCCESSFULLY!");

    connection.query(
        'SELECT id, name FROM students',
        (err, results) => {

            if (err) {
                console.log("QUERY ERROR:");
                console.log(err.message);
                connection.end();
                return;
            }

            console.log("STUDENTS:");
            console.log(results);

            connection.end();
        }
    );
});