// server.js

const express = require("express");
const bodyParser = require("body-parser");
const { orders } = require("./db");

const app = express();
app.use(bodyParser.json());

// POST /orders/check - Get order by ID from body
app.post("/orders/check", (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: "order_id is required" });
  }

  const order = orders.find((o) => o.id === order_id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order); // returns full order details
});

// POST /orders/by-email - Get all orders for a specific email
app.post("/orders/byemail", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const userOrders = orders.filter((order) => order.email === email);

  if (userOrders.length === 0) {
    return res.status(404).json({ message: "No orders found for this email" });
  }

  res.json(userOrders);
});

// Get all orders by email
app.get("/orders", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const userOrders = orders.filter((order) => order.email === email);
  res.json(userOrders);
});

// Get a specific order by ID
app.get("/orders/:orderId", (req, res) => {
  const order = orders.find((o) => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  res.json(order);
});

// Refund an order
app.post("/orders/:orderId/refund", (req, res) => {
  const order = orders.find((o) => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status === "refunded") {
    return res.status(400).json({ error: "Order already refunded" });
  }

  if (["pending", "shipped", "delivered"].includes(order.status)) {
    order.status = "refunded";
    return res.json({ message: "Refund initiated", order });
  }

  res
    .status(400)
    .json({ error: `Cannot refund order with status: ${order.status}` });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
