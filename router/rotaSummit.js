const express = require("express");
const router = express.Router();
const pool = require("../db");

// Extrai o código MLB (ex: "MLB110126921171") da imagem, link ou nome.
// Esse código é o identificador único do produto no Mercado Livre.
function extrairMlbId(...textos) {
  for (const t of textos) {
    if (!t) continue;
    const m = String(t).match(/MLB-?(\d+)/i);
    if (m) return "MLB" + m[1];
  }
  return null;
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

router.post("/", async (req, res) => {
  const { nome, preco, url_image, link, linkvenda } = req.body;
  const venda = linkvenda || link;
  const mlb_id = extrairMlbId(url_image, venda, nome);
  try {
    // Upsert por mlb_id: se o produto já existe (mesmo código MLB), atualiza;
    // senão, insere. Quando não há código MLB (mlb_id NULL), sempre insere.
    const result = await pool.query(
      `INSERT INTO produtos (nome, preco, url_image, linkvenda, mlb_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (mlb_id) DO UPDATE SET
         nome = EXCLUDED.nome,
         preco = EXCLUDED.preco,
         url_image = EXCLUDED.url_image,
         linkvenda = EXCLUDED.linkvenda
       RETURNING *`,
      [nome, preco, url_image, venda, mlb_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, preco, url_image, link, linkvenda } = req.body;
  const venda = linkvenda || link;
  const mlb_id = extrairMlbId(url_image, venda, nome);
  try {
    const result = await pool.query(
      `UPDATE produtos
       SET nome = $1, preco = $2, url_image = $3, linkvenda = $4, mlb_id = $5
       WHERE id = $6 RETURNING *`,
      [nome, preco, url_image, venda, mlb_id, id]
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
