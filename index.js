// index.js
import { Client, GatewayIntentBits, REST, Routes, PermissionFlagsBits } from 'discord.js';
import express from 'express';
import 'dotenv/config'; // Make sure you have a .env file with BOT_TOKEN and GUILD_ID

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID; // your Discord server ID
const COMMAND_ROLE = 'Staff'; // Role required to run the command

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
    }

    const type = interaction.options.getString('type');

    // Map input to category IDs
    const categoryMap = {
      general_support: '1458224100131737804', // replace with Closed Tickets category ID
      appeal_report: '1458224717168377956',   // replace with Closed Appeal / Report Tickets category ID
      management: '1458224472862621788',      // replace with Closed Management & Directors Tickets category ID
    };

    const categoryId = categoryMap[type];
    if (!categoryId) return interaction.reply({ content: '❌ Invalid category.', ephemeral: true });

    const category = interaction.guild.channels.cache.get(categoryId);
    if (!category) return interaction.reply({ content: '❌ Category not found.', ephemeral: true });

    // Delete channels under category
    const children = category.children; // Collection of channels under category
    let deletedCount = 0;

    for (const [id, channel] of children) {
      try {
        await channel.delete();
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete channel ${channel.name}:`, err);
      }
    }

    await interaction.reply({ content: `✅ Deleted ${deletedCount} channels from **${category.name}**.`, ephemeral: true });
  }
});

// ---------- Login ----------
client.login(BOT_TOKEN);
