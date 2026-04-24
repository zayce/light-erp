const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let products = []; // пока храним в памяти

// получить все товары
app.get("/products", (req, res) => {
  res.json(products);
});

// добавить товар
app.post("/products", (req, res) => {
  console.log("ПРИШЛО:", req.body);

  const newProduct = {
    ...req.body, // 🔥 ВАЖНО — не режем данные
    id: Date.now(),
    qrCode: "QR_" + (req.body.sku || Date.now()),
  };

  products.push(newProduct);

  res.json(newProduct);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
