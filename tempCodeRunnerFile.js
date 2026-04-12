app.post("/feedback", (req, res) => {
    const { taste, hygiene, comments } = req.body;
    db.query("INSERT INTO feedback (taste, hygiene, comments) VALUES (?, ?, ?)", [taste, hygiene, comments], (err) => {
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