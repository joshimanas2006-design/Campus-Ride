const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// MYSQL DATABASE CONNECTION
// =====================================================

const db = mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "Admin123",
    database: "campus_ride"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
        return;
    }

    console.log("MySQL Connected Successfully!");
});


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
    res.send("CampusRide Backend is Running!");
});


// =====================================================
// GET ALL STUDENTS
// =====================================================

app.get("/api/students", (req, res) => {

    const sql = `
        SELECT id, name, email, phone
        FROM students
        ORDER BY name
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error loading students"
            });
        }

        res.json(results);
    });
});


// =====================================================
// REGISTER
// =====================================================

app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        phone,
        password
    } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const checkSql = `
        SELECT id
        FROM students
        WHERE email = ?
    `;

    db.query(checkSql, [email], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const insertSql = `
            INSERT INTO students
            (name, email, phone, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [name, email, phone, password],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Registration failed"
                    });
                }

                res.json({
                    message: "Registration successful",
                    student: {
                        id: result.insertId,
                        name,
                        email,
                        phone
                    }
                });
            }
        );
    });
});


// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT id, name, email, phone
        FROM students
        WHERE email = ?
        AND password = ?
    `;

    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            res.json({
                message: "Login successful",
                student: results[0]
            });
        }
    );
});


// =====================================================
// GET ALL RIDES
// =====================================================

app.get("/api/rides", (req, res) => {

    const sql = `
        SELECT
            r.id,
            r.driver_id,
            r.from_location,
            r.to_location,
            r.ride_date,
            r.ride_time,
            r.available_seats,
            r.price,
            s.name AS driver_name,
            s.email AS driver_email,
            s.phone AS driver_phone
        FROM rides r
        JOIN students s
            ON r.driver_id = s.id
        ORDER BY
            r.ride_date,
            r.ride_time
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error loading rides"
            });
        }

        res.json(results);
    });
});


// =====================================================
// OFFER RIDE
// =====================================================

app.post("/api/rides", (req, res) => {

    const {
        driver_id,
        from_location,
        to_location,
        ride_date,
        ride_time,
        available_seats,
        price
    } = req.body;

    if (
        !driver_id ||
        !from_location ||
        !to_location ||
        !ride_date ||
        !ride_time ||
        !available_seats
    ) {
        return res.status(400).json({
            message: "Please fill all required fields"
        });
    }

    const sql = `
        INSERT INTO rides
        (
            driver_id,
            from_location,
            to_location,
            ride_date,
            ride_time,
            available_seats,
            price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            driver_id,
            from_location,
            to_location,
            ride_date,
            ride_time,
            available_seats,
            price || 0
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Could not create ride"
                });
            }

            res.json({
                message: "Ride offered successfully",
                rideId: result.insertId
            });
        }
    );
});


// =====================================================
// DELETE RIDE
// =====================================================

app.delete("/api/rides/:id", (req, res) => {

    const rideId = req.params.id;
    const driverId = req.body.driver_id;

    if (!driverId) {
        return res.status(400).json({
            message: "Driver ID is required"
        });
    }

    const checkSql = `
        SELECT id
        FROM rides
        WHERE id = ?
        AND driver_id = ?
    `;

    db.query(
        checkSql,
        [rideId, driverId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(403).json({
                    message: "You can only delete your own ride"
                });
            }

            const deleteBookingsSql = `
                DELETE FROM bookings
                WHERE ride_id = ?
            `;

            db.query(
                deleteBookingsSql,
                [rideId],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Could not delete ride bookings"
                        });
                    }

                    const deleteRideSql = `
                        DELETE FROM rides
                        WHERE id = ?
                    `;

                    db.query(
                        deleteRideSql,
                        [rideId],
                        (err) => {

                            if (err) {
                                console.error(err);

                                return res.status(500).json({
                                    message: "Could not delete ride"
                                });
                            }

                            res.json({
                                message: "Ride deleted successfully"
                            });
                        }
                    );
                }
            );
        }
    );
});


// =====================================================
// REQUEST / BOOK RIDE
// =====================================================

app.post("/api/bookings", (req, res) => {

    const {
        ride_id,
        student_id
    } = req.body;

    if (!ride_id || !student_id) {
        return res.status(400).json({
            message: "Ride ID and student ID are required"
        });
    }

    const rideSql = `
        SELECT
            id,
            driver_id,
            available_seats
        FROM rides
        WHERE id = ?
    `;

    db.query(
        rideSql,
        [ride_id],
        (err, rides) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (rides.length === 0) {
                return res.status(404).json({
                    message: "Ride not found"
                });
            }

            const ride = rides[0];

            if (Number(ride.driver_id) === Number(student_id)) {
                return res.status(400).json({
                    message: "You cannot book your own ride"
                });
            }

            if (Number(ride.available_seats) <= 0) {
                return res.status(400).json({
                    message: "No seats available"
                });
            }

            const duplicateSql = `
                SELECT id
                FROM bookings
                WHERE ride_id = ?
                AND student_id = ?
                AND status IN ('PENDING', 'ACCEPTED')
            `;

            db.query(
                duplicateSql,
                [ride_id, student_id],
                (err, results) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    if (results.length > 0) {
                        return res.status(400).json({
                            message: "You already requested this ride"
                        });
                    }

                    const insertSql = `
                        INSERT INTO bookings
                        (
                            ride_id,
                            student_id,
                            status
                        )
                        VALUES (?, ?, 'PENDING')
                    `;

                    db.query(
                        insertSql,
                        [ride_id, student_id],
                        (err, result) => {

                            if (err) {
                                console.error(err);

                                return res.status(500).json({
                                    message: "Could not create booking"
                                });
                            }

                            res.json({
                                message: "Ride request sent successfully",
                                bookingId: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
});


// =====================================================
// GET BOOKINGS OF STUDENT
// =====================================================

app.get("/api/bookings/student/:studentId", (req, res) => {

    const studentId = req.params.studentId;

    const sql = `
        SELECT
            b.id,
            b.ride_id,
            b.student_id,
            b.status,

            r.from_location,
            r.to_location,
            r.ride_date,
            r.ride_time,
            r.available_seats,
            r.price,

            s.name AS driver_name,
            s.email AS driver_email,
            s.phone AS driver_phone

        FROM bookings b

        JOIN rides r
            ON b.ride_id = r.id

        JOIN students s
            ON r.driver_id = s.id

        WHERE b.student_id = ?

        ORDER BY
            r.ride_date DESC,
            r.ride_time DESC
    `;

    db.query(
        sql,
        [studentId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Error loading bookings"
                });
            }

            res.json(results);
        }
    );
});


// =====================================================
// GET BOOKING REQUESTS FOR DRIVER
// =====================================================

app.get("/api/bookings/driver/:driverId", (req, res) => {

    const driverId = req.params.driverId;

    const sql = `
        SELECT
            b.id,
            b.ride_id,
            b.student_id,
            b.status,

            r.from_location,
            r.to_location,
            r.ride_date,
            r.ride_time,
            r.available_seats,
            r.price,

            s.name AS passenger_name,
            s.email AS passenger_email,
            s.phone AS passenger_phone

        FROM bookings b

        JOIN rides r
            ON b.ride_id = r.id

        JOIN students s
            ON b.student_id = s.id

        WHERE r.driver_id = ?

        ORDER BY
            r.ride_date DESC,
            r.ride_time DESC
    `;

    db.query(
        sql,
        [driverId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Error loading booking requests"
                });
            }

            res.json(results);
        }
    );
});


// =====================================================
// ACCEPT BOOKING
// =====================================================

app.put("/api/bookings/:bookingId/accept", (req, res) => {

    const bookingId = req.params.bookingId;
    const driverId = req.body.driver_id;

    if (!driverId) {
        return res.status(400).json({
            message: "Driver ID is required"
        });
    }

    const bookingSql = `
        SELECT
            b.id,
            b.status,
            b.ride_id,
            r.driver_id,
            r.available_seats

        FROM bookings b

        JOIN rides r
            ON b.ride_id = r.id

        WHERE b.id = ?
    `;

    db.query(
        bookingSql,
        [bookingId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }

            const booking = results[0];

            if (Number(booking.driver_id) !== Number(driverId)) {
                return res.status(403).json({
                    message: "You are not the driver of this ride"
                });
            }

            if (booking.status !== "PENDING") {
                return res.status(400).json({
                    message: "This booking has already been processed"
                });
            }

            if (Number(booking.available_seats) <= 0) {
                return res.status(400).json({
                    message: "No seats available"
                });
            }

            db.beginTransaction((err) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Transaction error"
                    });
                }

                const updateRideSql = `
                    UPDATE rides
                    SET available_seats = available_seats - 1
                    WHERE id = ?
                    AND available_seats > 0
                `;

                db.query(
                    updateRideSql,
                    [booking.ride_id],
                    (err, result) => {

                        if (err) {
                            return db.rollback(() => {
                                console.error(err);

                                res.status(500).json({
                                    message: "Could not update seats"
                                });
                            });
                        }

                        if (result.affectedRows === 0) {
                            return db.rollback(() => {
                                res.status(400).json({
                                    message: "No seats available"
                                });
                            });
                        }

                        const updateBookingSql = `
                            UPDATE bookings
                            SET status = 'ACCEPTED'
                            WHERE id = ?
                            AND status = 'PENDING'
                        `;

                        db.query(
                            updateBookingSql,
                            [bookingId],
                            (err, result) => {

                                if (err) {
                                    return db.rollback(() => {
                                        console.error(err);

                                        res.status(500).json({
                                            message: "Could not accept booking"
                                        });
                                    });
                                }

                                if (result.affectedRows === 0) {
                                    return db.rollback(() => {
                                        res.status(400).json({
                                            message: "Booking already processed"
                                        });
                                    });
                                }

                                db.commit((err) => {

                                    if (err) {
                                        return db.rollback(() => {
                                            console.error(err);

                                            res.status(500).json({
                                                message: "Could not complete booking"
                                            });
                                        });
                                    }

                                    res.json({
                                        message: "Booking accepted successfully"
                                    });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});


// =====================================================
// REJECT BOOKING
// =====================================================

app.put("/api/bookings/:bookingId/reject", (req, res) => {

    const bookingId = req.params.bookingId;
    const driverId = req.body.driver_id;

    if (!driverId) {
        return res.status(400).json({
            message: "Driver ID is required"
        });
    }

    const sql = `
        SELECT
            b.id,
            b.status,
            r.driver_id

        FROM bookings b

        JOIN rides r
            ON b.ride_id = r.id

        WHERE b.id = ?
    `;

    db.query(
        sql,
        [bookingId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }

            const booking = results[0];

            if (Number(booking.driver_id) !== Number(driverId)) {
                return res.status(403).json({
                    message: "You are not the driver of this ride"
                });
            }

            if (booking.status !== "PENDING") {
                return res.status(400).json({
                    message: "This booking has already been processed"
                });
            }

            const updateSql = `
                UPDATE bookings
                SET status = 'REJECTED'
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [bookingId],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Could not reject booking"
                        });
                    }

                    res.json({
                        message: "Booking rejected successfully"
                    });
                }
            );
        }
    );
});


// =====================================================
// DRIVER BOOKING COUNTS
// =====================================================

app.get("/api/bookings/driver/:driverId/counts", (req, res) => {

    const driverId = req.params.driverId;

    const sql = `
        SELECT
            SUM(status = 'PENDING') AS pending,
            SUM(status = 'ACCEPTED') AS accepted,
            SUM(status = 'REJECTED') AS rejected,
            COUNT(*) AS total

        FROM bookings b

        JOIN rides r
            ON b.ride_id = r.id

        WHERE r.driver_id = ?
    `;

    db.query(
        sql,
        [driverId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Error loading counts"
                });
            }

            res.json(results[0]);
        }
    );
});


// =====================================================
// STUDENT BOOKING COUNTS
// =====================================================

app.get("/api/bookings/student/:studentId/counts", (req, res) => {

    const studentId = req.params.studentId;

    const sql = `
        SELECT
            SUM(status = 'PENDING') AS pending,
            SUM(status = 'ACCEPTED') AS accepted,
            SUM(status = 'REJECTED') AS rejected,
            COUNT(*) AS total

        FROM bookings

        WHERE student_id = ?
    `;

    db.query(
        sql,
        [studentId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Error loading counts"
                });
            }

            res.json(results[0]);
        }
    );
});


// =====================================================
// START SERVER
// =====================================================

app.listen(3000, () => {
    console.log("CampusRide server running on http://localhost:3000");
});