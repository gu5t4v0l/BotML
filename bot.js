const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const { Pool } = require('pg');
require('dotenv').config();
 
// ============================================================
// CONFIGURAÇÃO
// ============================================================
 
const GROUP_ID = process.env.WHATSAPP_GROUP_ID;
 
if (!GROUP_ID) {
  console.error('❌ WHATSAPP_GROUP_ID não definido no .env');
  process.exit(1);
}
 
// ============================================================
// BANCO DE DADOS
// ============================================================
 
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
 
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar no Postgres:', err.message);
    return;
  }
  release();
  console.log('✅ Conectado ao Postgres!');
});
 
async function getNextProduct() {
  const result = await pool.query(`
SELECT * FROM produtos p
WHERE NOT EXISTS (
  SELECT 1 FROM historico h 
  WHERE h.idproduto = p.idproduto
  --AND h.quando > now() - interval '7 days'
)
LIMIT 1
  `);
  return result.rows[0] || null;
}
 
async function markAsSent(id) {
  await pool.query(`
    INSERT INTO historico (idproduto) VALUES ($1)
  `, [id]);
}
 
// ============================================================
// ENVIO
// ============================================================
 
function formatMessage(product) {
  const price = parseFloat(product.preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
 
  /*   if (product.description) message += `📝 ${product.description}\n\n`; */ 
  let message = `\n\n *Achei no Precinho!* \n\n`;
  message += `🛒 *${product.nome}*\n\n`
  message += `💰 *Por apenas ${price}*\n\n`;
  message += `🔗 Compre agora:\n${product.linkvenda}\n\n`;
  message += `👆🏻 *Clique no link para comprar* 👆🏻`;
 
  return message;
}
 
async function sendNextProduct() {
  try {
    console.log(`\n[${new Date().toLocaleString('pt-BR')}] 🔍 Buscando próximo produto...`);
 
    const product = await getNextProduct();
    if (!product) {
      console.log('⚠️  Nenhum produto pendente no banco.');
      return;
    }
 
    const chats = await client.getChats();
    const group = chats.find(chat => chat.id._serialized === GROUP_ID);
 
    if (!group) {
      console.error(`❌ Grupo "${GROUP_ID}" não encontrado. Verifique o ID no .env`);
      return;
    }
 
    const message = formatMessage(product);
 
    if (product.url_image) {
      try {
        const media = await MessageMedia.fromUrl(product.url_image, { unsafeMime: true });
        await group.sendMessage(media, { caption: message });
      } catch (imgErr) {
        console.warn('⚠️  Falha ao carregar imagem, enviando só texto:', imgErr.message);
        await group.sendMessage(message);
      }
    } else {
      await group.sendMessage(message);
    }
 
    await markAsSent(product.idproduto);
    console.log(`✅ Produto enviado: "${product.nome}" (ID: ${product.idproduto})`);
 
  } catch (err) {
    console.error('❌ Erro ao enviar produto:', err.message);
  }
}
 
// ============================================================
// CRONS
// ============================================================
 
function setupScheduler() {
  console.log('⏰ Horários configurados:');
 
/*   cron.schedule('0 9 * * *',  sendNextProduct, { timezone: 'America/Sao_Paulo' });
  console.log('  → 09:00');
 
  cron.schedule('0 12 * * *', sendNextProduct, { timezone: 'America/Sao_Paulo' });
  console.log('  → 12:00');
 
  cron.schedule('0 18 * * *', sendNextProduct, { timezone: 'America/Sao_Paulo' });
  console.log('  → 18:00\n'); */
   cron.schedule('*/30 * * * * *',  sendNextProduct, { timezone: 'America/Sao_Paulo' });
   console.log('  → A cada 30 segundos\n');
}
 
// ============================================================
// WHATSAPP CLIENT
// ============================================================
 
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'ml-affiliate-bot' }),
  webVersionCache: {          // ← está aqui, no mesmo nível
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
puppeteer: {
    headless: true,
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});
 
client.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR Code com seu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});
 
client.on('authenticated', () => console.log('🔐 WhatsApp autenticado!'));
 
client.on('ready', () => {
  console.log(`✅ Bot pronto! Grupo alvo: "${GROUP_ID}"\n`);
  setupScheduler();
});
 
client.on('disconnected', (reason) => {
  console.warn('⚠️  Desconectado:', reason);
  console.log('🔄 Reconectando em 10 segundos...');
  setTimeout(() => client.initialize(), 10000);
});
 
client.on('auth_failure', (msg) => console.error('❌ Falha na autenticação:', msg));
 
console.log('🚀 Iniciando bot do Mercado Livre...');
client.initialize();