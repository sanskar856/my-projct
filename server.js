const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ✅ createPool — auto reconnect
const db = mysql.createPool({
    host:     process.env.MYSQLHOST,
    user:     process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port:     process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) { console.log("❌ DB FAILED:", err.message); return; }
    console.log("✅ DB CONNECTED");
    connection.release();

    db.query(`CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), address VARCHAR(100), payment VARCHAR(20), total INT, items TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    db.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(100) UNIQUE, password VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    db.query(`CREATE TABLE IF NOT EXISTS feedback (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), taste INT, hygiene INT, comments TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

// ✅ Health check
app.get("/health", (req, res) => {
    db.query("SELECT 1", (err) => {
        if(err) return res.status(500).json({status:"DB error",error:err.message});
        res.json({status:"OK",message:"Server and DB running ✅"});
    });
});

app.post("/order", (req, res) => {
    console.log("📦 ORDER:", req.body);
    const { name, address, payment, total, items } = req.body;
    if (!name || !address || total === undefined) {
        return res.status(400).json({success:false,message:"Missing fields"});
    }
    db.query(
        "INSERT INTO orders (name, address, payment, total, items) VALUES (?, ?, ?, ?, ?)",
        [name, address, payment||"Cash", total, JSON.stringify(items||[])],
        (err, result) => {
            if (err) { console.log("❌ SQL:", err.message); return res.status(500).json({success:false,message:"DB error: "+err.message}); }
            console.log("✅ ORDER ID:", result.insertId);
            res.json({success:true,message:"Order placed!",orderId:result.insertId});
        }
    );
});

app.post("/signup", (req, res) => {
    const { email, password } = req.body;
    if(!email||!password) return res.status(400).json({success:false});
    db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, password], (err) => {
        if (err) return res.json({success:false,message:err.code==="ER_DUP_ENTRY"?"Already registered":err.message});
        res.json({success:true});
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email=? AND password=?", [email, password], (err, result) => {
        if (err) return res.status(500).json({success:false});
        res.json({success:result.length>0});
    });
});

app.post("/feedback", (req, res) => {
    const { name, taste, hygiene, comments } = req.body;
    db.query("INSERT INTO feedback (name, taste, hygiene, comments) VALUES (?, ?, ?, ?)", [name, taste, hygiene, comments], (err) => {
        if (err) return res.status(500).json({success:false});
        res.json({success:true});
    });
});

app.use((req, res) => res.status(404).json({success:false,message:"Route not found"}));
app.use((err, req, res, next) => res.status(500).json({success:false,message:"Server error"}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 PORT:", PORT));

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
    if(err) return res.send(err);
    res.json(result);
  });
});

app.post("/update-status", (req, res) => {
  const { id, status } = req.body;

  db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, id],
    (err) => {
      if(err) return res.send(err);
      res.send("Updated");
    }
  );
});

db.query(`
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  address VARCHAR(100),
  payment VARCHAR(20),
  total INT,
  items TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);