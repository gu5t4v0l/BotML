const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "botGroupID",
        dataPath: './sessions'
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));

client.on('ready', () => {
    console.log('🚀 MONITOR ATIVO!');
    console.log('Agora, vá no seu celular e mande a palavra "ID" dentro do grupo desejado.');
});

// Este evento captura TUDO, inclusive o que você envia
client.on('message_create', async (msg) => {
    // Filtra para processar apenas se a mensagem veio de VOCÊ
    if (msg.fromMe) {
        const chat = await msg.getChat();
        
        if (chat.isGroup) {
            console.log('\n==================================================');
            console.log(`✅ GRUPO IDENTIFICADO POR SUA MENSAGEM:`);
            console.log(`NOME: ${chat.name}`);
            console.log(`ID: ${chat.id._serialized}`);
            console.log('==================================================\n');
        } else {
            // Se você mandar em um chat privado, ele avisa também (útil para testes)
            console.log(`ℹ️ Você mandou mensagem no privado. ID: ${chat.id._serialized}`);
        }
    }
});

client.initialize();