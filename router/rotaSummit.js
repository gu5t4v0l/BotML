const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

router.post("/", async (req, res) => {
  const { nome, preco, url_image, link } = req.body;    
  try { 
    const result = await pool.query(
      "INSERT INTO produtos (nome, preco, url_image, linkvenda) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, preco, url_image, link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar produto" });
  } 
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, preco, url_image, link } = req.body; 
  try {
    const result = await pool.query(
      "UPDATE produtos SET nome = $1, preco = $2, url_image = $3, linkvenda = $4 WHERE id = $5 RETURNING *",
      [nome, preco, url_image, link, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
    });

module.exports = router;