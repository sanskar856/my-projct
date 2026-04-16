const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= ROOT ================= */
app.get("/", (req, res) => {
    res.send("🚀 Atithi Canteen API Running Successfully");
});

/* ================= DB CONNECTION ================= */
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }   // ⚠️ IMPORTANT for Railway
});

/* ================= TEST DB ================= */
app.get("/health", (req, res) => {
    db.query("SELECT 1", (err) => {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json({ status: "DB ERROR" });
        }
        res.json({ status: "OK", message: "DB Connected ✅" });
    });
});

/* ================= PLACE ORDER ================= */
app.post("/order", (req, res) => {
    const { name, address, payment, total, items } = req.body;

    if (!name || !address || total === undefined) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    db.query(
        "INSERT INTO orders (name, address, payment, total, items) VALUES (?, ?, ?, ?, ?)",
        [name, address, payment || "Cash", total, JSON.stringify(items || [])],
        (err, result) => {
            if (err) {
                console.log("SQL ERROR:", err);
                return res.status(500).json({ success: false });
            }

            res.json({
                success: true,
                message: "Order placed successfully",
                orderId: result.insertId
            });
        }
    );
});

/* ================= GET ORDERS (ADMIN PANEL) ================= */
app.get("/orders", (req, res) => {
    db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
        if (err) {
            console.log("ERROR:", err);
            return res.status(500).json({ success: false });
        }
        res.json(result);
    });
});

/* ================= UPDATE STATUS ================= */
app.post("/update-status", (req, res) => {
    const { id, status } = req.body;

    db.query(
        "UPDATE orders SET status=? WHERE id=?",
        [status, id],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false });
            }
            res.json({ success: true, message: "Updated" });
        }
    );
});

/* ================= SIGNUP ================= */
app.post("/signup", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false });
    }

    db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, password],
        (err) => {
            if (err) {
                return res.json({
                    success: false,
                    message:
                        err.code === "ER_DUP_ENTRY"
                            ? "Already registered"
                            : err.message
                });
            }
            res.json({ success: true });
        }
    );
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, result) => {
            if (err) {
                return res.status(500).json({ success: false });
            }

            res.json({ success: result.length > 0 });
        }
    );
});

/* ================= FEEDBACK ================= */
app.post("/feedback", (req, res) => {
    const { name, taste, hygiene, comments } = req.body;

    db.query(
        "INSERT INTO feedback (name, taste, hygiene, comments) VALUES (?, ?, ?, ?)",
        [name, taste, hygiene, comments],
        (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

/* ================= 404 ================= */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        success: false,
        message: "Server error"
    });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});