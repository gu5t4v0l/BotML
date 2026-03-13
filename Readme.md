# 🛒 ML Affiliate Bot

Bot para WhatsApp que envia automaticamente produtos do Mercado Livre com links de afiliado para um grupo, usando Node.js, whatsapp-web.js e PostgreSQL.

## ✨ Funcionalidades

- ✅ Envia produtos automaticamente em horários configurados (cron)
- ✅ Envia imagem + mensagem formatada quando disponível
- ✅ Registra histórico de envios no banco — não reenvia o mesmo produto por 7 dias
- ✅ Sessão salva localmente — não precisa escanear QR toda vez
- ✅ Reconexão automática em caso de queda

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- Google Chrome ou Chromium instalado
- Conta no WhatsApp com acesso ao grupo

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ml-affiliate-bot.git
cd ml-affiliate-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

```bash
psql -U postgres -c "CREATE DATABASE Bot_ML;"
psql -U postgres -d Bot_ML -f setup.sql
```

### 4. Descubra o ID do seu grupo

```bash
node get-group-id.js
```

Escaneie o QR Code com seu WhatsApp, depois mande qualquer mensagem no grupo desejado. O ID aparecerá no terminal.

### 5. Configure o ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas informações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Bot_ML
DB_USER=postgres
DB_PASSWORD=sua_senha

WHATSAPP_GROUP_ID=seu_id_aqui@g.us
```

### 6. Inicie o bot

```bash
npm start
```

Na primeira vez, um QR Code aparecerá no terminal. Escaneie com seu WhatsApp em:
**Configurações → Dispositivos conectados → Conectar dispositivo**

## 📦 Adicionando produtos

Insira produtos diretamente no banco de dados:

```sql
INSERT INTO produtos (nome, preco, url_imagem, linkvenda, categoria)
VALUES (
  'Nome do Produto',
  99.90,
  'https://url-da-imagem.jpg',  -- ou NULL se não tiver
  'https://mercadolivre.com/sec/SEU_LINK_AFILIADO',
  'Eletrônicos'
);
```

## ⏰ Horários de envio

Os horários estão em `src/bot.js` na função `setupScheduler`. Por padrão:

| Horário | Descrição |
|---------|-----------|
| 09:00   | Envio manhã |
| 12:00   | Envio almoço |
| 18:00   | Envio tarde |

Para alterar, edite os crons:

```js
// Formato: 'minuto hora * * *'
cron.schedule('0 9 * * *', ...)   // 09:00
cron.schedule('30 14 * * *', ...) // 14:30
```

## 🗄️ Estrutura do banco

```sql
-- Catálogo de produtos
CREATE TABLE produtos (
  idproduto  SERIAL PRIMARY KEY,
  nome       VARCHAR(100),
  preco      NUMERIC,
  url_imagem TEXT,
  linkvenda  TEXT,
  categoria  VARCHAR(100)
);

-- Histórico de envios
CREATE TABLE historico (
  idhistorico SERIAL PRIMARY KEY,
  idproduto   INT REFERENCES produtos(idproduto),
  quando      TIMESTAMPTZ DEFAULT now()
);
```

## 🗄️ Gerenciando produtos

```sql
-- Ver todos os produtos
SELECT * FROM produtos;

-- Ver histórico de envios
SELECT p.nome, h.quando
FROM historico h
JOIN produtos p ON p.idproduto = h.idproduto
ORDER BY h.quando DESC;

-- Forçar reenvio de um produto (limpa histórico)
DELETE FROM historico WHERE idproduto = 1;
```

## 📁 Estrutura do projeto

```
ml-affiliate-bot/
├── src/
│   └── bot.js          # Bot completo — WhatsApp, banco, crons e envio
├── get-group-id.js     # Utilitário para descobrir o ID do grupo
├── setup.sql           # Script de criação do banco
├── .env.example        # Modelo de configuração
├── package.json
└── README.md
```

## 🔮 Próximos passos

- [ ] Integrar com API de afiliados do Mercado Livre para busca automática
- [ ] Interface web para cadastro de produtos
- [ ] Suporte a múltiplos grupos
- [ ] Relatório de produtos enviados por período