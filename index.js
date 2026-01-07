import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config'; // make sure your BOT_TOKEN is in .env

// ======= CONFIG =======
const TOKEN = process.env.BOT_TOKEN; // Your bot token here
const PREFIX = '/'; // Not strictly needed for slash commands
const ALLOWED_ROLE = 'Staff'; // Change to your role name allowed to run /clearbasement
// =====================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ======== REGISTER COMMAND =========
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const commands = [
  {
    name: 'clearbasement',
    description: 'Deletes channels under a specific category',
    options: [
      {
        name: 'category',
        type: 3, // STRING
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
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
// ===================================

// ======== BOT EVENTS =========
client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'clearbasement') {
    const categoryOption = interaction.options.getString('category');

    // Check role
    const member = interaction.member;
    if (!member.roles.cache.some((r) => r.name === ALLOWED_ROLE)) {
      return interaction.reply({
        content: '❌ You do not have permission to run this command.',
        ephemeral: true,
      });
    }

    // Map the option to your category IDs
    let categoryId;
    if (categoryOption === 'general_support') categoryId = '1458224100131737804';
    else if (categoryOption === 'appeal_report') categoryId = '1458224717168377956';
    else if (categoryOption === 'management') categoryId = '1458224472862621788';

    if (!categoryId) {
      return interaction.reply({
        content: '❌ Invalid category selected.',
        ephemeral: true,
      });
    }

    const category = interaction.guild.channels.cache.get(categoryId);
    if (!category) {
      return interaction.reply({
        content: '❌ Category not found.',
        ephemeral: true,
      });
    }

    // Delete all channels under category
    const channelsToDelete = category.children.cache;
    let deletedCount = 0;
    for (const [, channel] of channelsToDelete) {
      try {
        await channel.delete('Cleared by /clearbasement');
        deletedCount++;
      } catch (err) {
        console.error(err);
      }
    }

    await interaction.reply({
      content: `✅ Deleted ${deletedCount} channels under **${category.name}**.`,
      ephemeral: true,
    });
  }
});

// ======== KEEP ALIVE FOR RENDER =========
setInterval(() => {
  console.log('Bot alive check');
}, 1000 * 60 * 5); // Logs every 5 minutes

// ======== LOGIN =======
client.login(TOKEN);
