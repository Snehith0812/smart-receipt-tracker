const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// ✅ Middleware
app.use(cors({
  origin: "*"
}));
app.use(bodyParser.json());

const SECRET = "SECRET_KEY";

// In-memory storage (for demo)
let users = [];
let receipts = [];

// 🏠 Home route
app.get("/", (req, res) => {
  res.send("Smart Receipt Tracker API is LIVE 🚀");
});

// 🔐 Signup
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).send("User already exists");
  }

  const hash = await bcrypt.hash(password, 10);
  users.push({ email, password: hash });

  res.send("User created");
});

// 🔑 Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).send("Wrong password");

  const token = jwt.sign({ email }, SECRET);
  res.json({ token });
});

// 🔒 Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(403).send("No token");

  try {
    const data = jwt.verify(token, SECRET);
    req.user = data;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// 🧠 Categorization
function categorize(text) {
  text = text.toLowerCase();

  if (text.includes("zomato") || text.includes("food")) return "Food";
  if (text.includes("uber") || text.includes("ola")) return "Travel";
  if (text.includes("amazon")) return "Shopping";

  return "Others";
}

// ➕ Add expense
app.post("/api/add", auth, (req, res) => {
  const { merchant, amount } = req.body;

  const data = {
    id: receipts.length + 1,
    user: req.user.email,
    merchant,
    amount,
    category: categorize(merchant),
    date: new Date()
  };

  receipts.push(data);
  res.json(data);
});

// 📊 Get receipts
app.get("/api/receipts", auth, (req, res) => {
  const userData = receipts.filter(r => r.user === req.user.email);
  res.json(userData);
});

// 📤 Export Excel
app.get("/api/export", auth, async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Receipts");

  sheet.columns = [
    { header: "Merchant", key: "merchant" },
    { header: "Amount", key: "amount" },
    { header: "Category", key: "category" },
    { header: "Date", key: "date" }
  ];

  const userData = receipts.filter(r => r.user === req.user.email);
  sheet.addRows(userData);

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=receipts.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});