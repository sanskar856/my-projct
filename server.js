const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "atithi",
    charset: "utf8mb4"
});

db.connect(err => {
    if (err) {
        console.log("❌ DB Error:", err.message);
    } else {
        console.log("✅ Connected to MySQL DB!");
    }
});

app.post("/signup", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Email & Password required!" });
    db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, password], (err) => {
        if (err) return res.json({ success: false, message: "Signup failed!" });
        res.json({ success: true, message: "Signup successful! Please login." });
    });
});

app.post("/login", (req, res) => {
    console.log("🔐 LOGIN HIT:", req.body);
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Email & Password required!" });
    db.query("SELECT * FROM users WHERE email=? AND password=?", [email, password], (err, result) => {
        if (err) return res.json({ success: false, message: "DB Error" });
        if (result.length > 0) {
            res.json({ success: true, message: "Login successful! 🎉" });
        } else {
            res.json({ success: false, message: "Invalid email or password!" });
        }
    });
});

app.post("/order", (req, res) => {
    const { name, address, payment, total, items } = req.body;
    if (!name || !address || !total) return res.json({ success: false, message: "All fields required!" });
    db.query("INSERT INTO orders (name, address, payment, total, items) VALUES (?, ?, ?, ?, ?)",
        [name, address, payment, total, JSON.stringify(items)], (err) => {
        if (err) return res.json({ success: false, message: "Order failed ❌" });
        res.json({ success: true, message: "Order placed successfully ✅" });
    });
});

app.post("/feedback", (req, res) => {
    const { name, taste, hygiene, comments } = req.body;
    db.query("INSERT INTO feedback (name, taste, hygiene, comments) VALUES (?, ?, ?, ?)", 
    [name, taste, hygiene, comments], (err) => {
        if (err) {
            console.log("❌ Feedback Error:", err.message);
            return res.json({ success: false, message: "Feedback failed!" });
        }
        res.json({ success: true, message: "Feedback submitted! 🙏" });
    });
});

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});