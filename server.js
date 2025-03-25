const express = require("express");
const { orders } = require("./db");

const app = express();
app.use(express.json());

// Utility to extract body (handles Retell AI "args" or raw body)
function extractBody(req) {
  const raw = req.body?.args || req.body;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  return raw;
}

// ✅ POST /orders/check
app.post("/orders/check", (req, res) => {
  const body = extractBody(req);
  const { order_id } = body;

  if (!order_id) {
    return res.status(400).json({ error: "order_id is required" });
  }

  const order = orders.find((o) => o.id === order_id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({
    ...order,
    message: `Order ${order.id} is currently ${
      order.status
    }. It was placed on ${new Date(
      order.createdAt
    ).toDateString()}, and expected delivery is ${new Date(
      order.expectedDelivery
    ).toDateString()}.`,
  });
});

// ✅ POST /orders/byemail
app.post("/orders/byemail", (req, res) => {
  const body = extractBody(req);
  const { email } = body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const userOrders = orders.filter((order) => order.email === email);

  if (userOrders.length === 0) {
    return res.status(404).json({ message: "No orders found for this email" });
  }

  res.json(userOrders);
});

// GET all orders by email
app.get("/orders", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const userOrders = orders.filter((order) => order.email === email);
  res.json(userOrders);
});

// GET order by ID
app.get("/orders/:orderId", (req, res) => {
  const order = orders.find((o) => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  res.json(order);
});

// ✅ POST /orders/:orderId/refund
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
