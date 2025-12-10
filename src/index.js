// src/index.js
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL pool using RDS parameters
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create table if not exists
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_ips (
      id SERIAL PRIMARY KEY,
      ip_address VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✅ Database initialized");
}

// Get client real IP behind ALB/NGINX ingress
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.socket.remoteAddress;
}

// Health check
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// Save client IP
app.get("/client-ip", async (req, res) => {
  const ip = getClientIp(req);

  try {
    await pool.query(
      "INSERT INTO client_ips (ip_address) VALUES ($1)",
      [ip]
    );
    res.json({ message: "IP saved", ip });
  } catch (err) {
    console.error("Error saving IP:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// List all client IPs
app.get("/client-ip/list", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, ip_address, created_at FROM client_ips ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching IPs:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
app.listen(PORT, async () => {
  try {
    await initDb();
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("DB init failed:", err);
    process.exit(1);
  }
});