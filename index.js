import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import express from 'express';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

// ===== CONFIG =====
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const ALLOWED_ROLE = 'Staff';
// ==================

// ===== RENDER KEEP-ALIVE SERVER =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive.');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
// ===================================

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();

// ===== REGISTER SLASH COMMAND =====
const commands = [
  {
    name: 'clearbasement',
    description: 'Deletes channels under a specific category',
    options: [
      {
        name: 'category',
        type: 3,
        description: 'Which ticket category to clear?',
        required: true,
        choices: [
          { name: 'General and Support Tickets', value: 'general_support' },
          { name: 'Appeal and Report Tickets', value: 'appeal_report' },
          { name: 'Management Tickets', value: 'management' },
        ],
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error(err);
  }
})();

// ===== BOT READY =====
client.once('clientReady', () => {
  console.log(`🟢 Logged in as ${client.user.tag}`);
});

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'clearbasement') {
    await interaction.deferReply({ ephemeral: true });

    const categoryOption = interaction.options.getString('category');
    const member = interaction.member;

    if (!member.roles.cache.some(r => r.name === ALLOWED_ROLE)) {
      return interaction.editReply('❌ You do not have permission to use this command.');
    }

    let categoryId;
    if (categoryOption === 'general_support') categoryId = '1458224100131737804';
    if (categoryOption === 'appeal_report') categoryId = '1458224717168377956';
    if (categoryOption === 'management') categoryId = '1458224472862621788';

    const category = interaction.guild.channels.cache.get(categoryId);
    if (!category) {
      return interaction.editReply('❌ Category not found.');
    }

    const channels = category.children.cache;
    let deleted = 0;

    for (const [, channel] of channels) {
      try {
        await channel.delete('Cleared via /clearbasement');
        deleted++;
      } catch (err) {
        console.error(err);
      }
    }

    await interaction.editReply(
      `✅ Deleted **${deleted}** channels from **${category.name}**.`
    );
  }
});

// ===== LOGIN =====
client.login(TOKEN);
