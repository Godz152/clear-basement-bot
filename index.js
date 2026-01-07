require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CATEGORY_MAP = {
    general_support: 'Closed Tickets',
    appeal_report: 'Closed Appeal / Report Tickets',
    management: 'Closed Management & Directors Tickets'
};

client.once('ready', async () => {
    console.log(`🟢 Logged in as ${client.user.tag}`);

    const command = new SlashCommandBuilder()
        .setName('clearbasement')
        .setDescription('Deletes all channels under a closed ticket category')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Select which basement to clear')
                .setRequired(true)
                .addChoices(
                    { name: 'General and Support Tickets', value: 'general_support' },
                    { name: 'Appeal and Report Tickets', value: 'appeal_report' },
                    { name: 'Management Tickets', value: 'management' }
                )
        );

    await client.guilds.cache
        .get(process.env.GUILD_ID)
        .commands.create(command);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'clearbasement') return;

    if (!interaction.member.roles.cache.has(process.env.REQUIRED_ROLE_ID)) {
        return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const choice = interaction.options.getString('type');
    const categoryName = CATEGORY_MAP[choice];

    const category = interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === categoryName
    );

    if (!category) {
        return interaction.reply({ content: '❌ Category not found.', ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(
        ch => ch.parentId === category.id
    );

    for (const ch of channels.values()) {
        await ch.delete().catch(console.error);
    }

    await interaction.reply({
        content: `✅ Deleted ${channels.size} channels from **${category.name}**.`,
        ephemeral: true
    });
});

client.login(process.env.BOT_TOKEN);
