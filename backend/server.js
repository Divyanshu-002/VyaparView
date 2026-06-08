const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// YE KARO (SAHI)
const db = mysql.createPool({
  host     : process.env.MYSQLHOST,
  user     : process.env.MYSQLUSER,
  password : process.env.MYSQLPASSWORD,
  database : process.env.MYSQLDATABASE,
  port     : process.env.MYSQLPORT,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/summary', async (req, res) => {
  try {
    const [[row]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM customers)                               AS total_customers,
        (SELECT COUNT(*) FROM sellers)                                 AS total_sellers,
        (SELECT COUNT(*) FROM products)                                AS total_products,
        (SELECT COUNT(*) FROM orders)                                  AS total_orders,
        (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status='delivered') AS total_revenue,
        (SELECT ROUND(AVG(total_amount),0)    FROM orders WHERE status='delivered') AS avg_order_value,
        (SELECT ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM orders),1)
         FROM orders WHERE status='returned')                          AS return_rate,
        (SELECT ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM orders),1)
         FROM orders WHERE status='cancelled')                         AS cancel_rate
    `);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/revenue-by-category', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.category,
             ROUND(SUM(oi.quantity * oi.unit_price),0) AS revenue,
             COUNT(DISTINCT o.order_id)                 AS orders
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o   ON oi.order_id   = o.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.category ORDER BY revenue DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/monthly-trend', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(order_date,'%b %Y') AS month,
             DATE_FORMAT(order_date,'%Y-%m') AS sort_key,
             COUNT(*)                         AS orders,
             ROUND(SUM(total_amount),0)       AS revenue
      FROM orders WHERE status != 'cancelled'
      GROUP BY sort_key, month ORDER BY sort_key
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sellers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.seller_name, s.rating, s.city,
             COUNT(DISTINCT o.order_id)                 AS total_orders,
             ROUND(SUM(oi.quantity * oi.unit_price),0)  AS revenue,
             ROUND(SUM(CASE WHEN o.status='returned' THEN 1 ELSE 0 END)*100.0/COUNT(o.order_id),1) AS return_rate
      FROM sellers s
      JOIN products p     ON s.seller_id  = p.seller_id
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o       ON oi.order_id  = o.order_id
      GROUP BY s.seller_id, s.seller_name, s.rating, s.city
      ORDER BY revenue DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/top-products', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.name AS product_name, p.category, p.price,
             SUM(oi.quantity)                         AS units_sold,
             ROUND(SUM(oi.quantity * oi.unit_price),0) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o   ON oi.order_id   = o.order_id
      WHERE o.status = 'delivered'
      GROUP BY p.product_id, p.name, p.category, p.price
      ORDER BY units_sold DESC LIMIT 10
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/return-rates', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.category, COUNT(*) AS total_orders,
             SUM(CASE WHEN o.status='returned' THEN 1 ELSE 0 END) AS returns,
             ROUND(SUM(CASE WHEN o.status='returned' THEN 1 ELSE 0 END)*100.0/COUNT(*),1) AS return_rate
      FROM orders o
      JOIN order_items oi ON o.order_id    = oi.order_id
      JOIN products p     ON oi.product_id = p.product_id
      GROUP BY p.category ORDER BY return_rate DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/order-status', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n✅  Backend running → http://localhost:${PORT}`);
  console.log(`📊  Open frontend  → http://localhost:3000\n`);
});
