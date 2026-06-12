require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./db");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public")); // serve CSS, JS e o index.html

const rotaProdutos = require("./router/rotaSummit");
app.use("/produtos", rotaProdutos);

// Rota para abrir a página
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});