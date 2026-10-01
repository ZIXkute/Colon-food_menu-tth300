
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
// Connect to MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "food_menu"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to MySQL database: food_menu");
});

// Validate menu item fields
function validMenuItem(body) {
    const { name, description, category, price } = body;

    return (
        typeof name === "string" &&
        name.trim() !== "" &&
        typeof description === "string" &&
        description.trim() !== "" &&
        ["Starters", "Mains", "Desserts", "Drinks"].includes(category) &&
        price !== "" &&
        price !== null &&
        price !== undefined &&
        Number.isFinite(Number(price)) &&
        Number(price) >= 0
    );
}

// ========================================
// GET - Retrieve All Menu Items
// ========================================
app.get("/api/menu", (req, res) => {
    const sql = "SELECT * FROM menu_items ORDER BY id";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to retrieve menu items"
            });
        }

        res.json(results);
    });
});

// ========================================
// GET - Retrieve One Menu Item
// ========================================
app.get("/api/menu/:id", (req, res) => {
    const sql = "SELECT * FROM menu_items WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        res.json(results[0]);
    });
});

// ========================================
// POST - Add Menu Item
// ========================================
app.post("/api/menu", (req, res) => {
    if (!validMenuItem(req.body)) {
        return res.status(400).json({
            message: "Please provide a valid name, description, category, and price"
        });
    }

    const {
        name,
        description,
        category,
        price,
        available = true
    } = req.body;

    if (typeof available !== "boolean") {
        return res.status(400).json({
            message: "Available must be true or false"
        });
    }

    const sql = `
        INSERT INTO menu_items
        (name, description, category, price, available)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name.trim(),
            description.trim(),
            category,
            Number(price),
            available
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to add menu item"
                });
            }

            res.status(201).json({
                message: "Menu item added successfully",
                id: result.insertId
            });
        }
    );
});

// ========================================
// PUT - Update Menu Item
// ========================================
app.put("/api/menu/:id", (req, res) => {
    if (!validMenuItem(req.body)) {
        return res.status(400).json({
            message: "Please provide valid menu item details"
        });
    }

    const {
        name,
        description,
        category,
        price,
        available
    } = req.body;

    if (typeof available !== "boolean") {
        return res.status(400).json({
            message: "Available must be true or false"
        });
    }

    const sql = `
        UPDATE menu_items
        SET name = ?,
            description = ?,
            category = ?,
            price = ?,
            available = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name.trim(),
            description.trim(),
            category,
            Number(price),
            available,
            req.params.id
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to update menu item"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Menu item not found"
                });
            }

            res.json({
                message: "Menu item updated successfully"
            });
        }
    );
});

// ========================================
// DELETE - Remove Menu Item
// ========================================
app.delete("/api/menu/:id", (req, res) => {
    const sql = "DELETE FROM menu_items WHERE id = ?";

    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete menu item"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        res.json({
            message: "Menu item deleted successfully"
        });
    });
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});