// index.js
import { Client, GatewayIntentBits, REST, Routes, PermissionFlagsBits } from 'discord.js';
import express from 'express';
import 'dotenv/config'; // Make sure you have a .env file with BOT_TOKEN and GUILD_ID

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID; // your Discord server ID
const COMMAND_ROLE = 'Ticket Manager'; // Role required to run the command

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// ---------- Express server to satisfy Render ----------
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// ---------- Slash Command Setup ----------
const commands = [
  {
    name: 'clearbasement',
    description: 'Delete all channels in a specific ticket category',
    options: [
      {
        name: 'type',
        description: 'Which ticket category to clear',
        type: 3, // STRING
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

// Register commands to your guild
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationGuildCommands(client.user?.id || '0', GUILD_ID), {
      body: commands,
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (err) {
    console.error(err);
  }
})();

// ---------- Bot Logic ----------
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'clearbasement') {
    // Check role
    if (!interaction.member.roles.cache.some(r => r.name === COMMAND_ROLE)) {
      return interaction.reply({ content: '❌ You do not have permission to run this.', ephemeral: true });
