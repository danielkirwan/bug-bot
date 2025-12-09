import { 
  Client, GatewayIntentBits, Events,
  ActionRowBuilder, ButtonBuilder, ButtonStyle
} from "discord.js";

const BUG_CHANNEL_ID = "process.env.BUG_CHANNEL_ID";
const BUG_CATEGORY_ID = "process.env.BUG_CATEGORY_ID";
const ARCHIVE_CATEGORY_ID = "process.env.ARCHIVE_CATEGORY_ID";


// If using Node 18+, fetch is built-in. If not, uncomment:
// import fetch from "node-fetch";

async function downloadFile(url) {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});


// Create the status buttons
function createStatusButtons() {

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_logged")
      .setLabel("🟩 Logged")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("status_progress")
      .setLabel("🔄 In Progress")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("status_needsinfo")
      .setLabel("🟦 Needs Info")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("status_duplicate")
      .setLabel("🟫 Duplicate")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("status_wontfix")
      .setLabel("🟧 Won't Fix")
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_done")
      .setLabel("✔️ Done")
      .setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}


client.on(Events.MessageCreate, async (message) => {
  if (message.channelId !== BUG_CHANNEL_ID) return;
  if (!message.webhookId) return;

  console.log("New bug detected:", message.id);

  const match = message.content.match(/ID:\s*`([A-Z0-9]+)`/);
  const bugId = match ? match[1] : "unknown";

  const channelName = `bug-${bugId.toLowerCase()}`;

  // Create the bug ticket channel under the category
  const bugChannel = await message.guild.channels.create({
    name: channelName,
    parent: BUG_CATEGORY_ID,   
    reason: `Bug report ${bugId}`,
  });

  console.log(`Created bug channel: ${channelName}`);

  // Prepare attachments
  const files = [];
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      const buffer = await downloadFile(attachment.url);
      files.push({
        attachment: buffer,
        name: attachment.name
      });
    }
  }

  // Buttons
  const rows = createStatusButtons();

  // Send bug details + attachments to ticket channel
  await bugChannel.send({
    content: message.content,
    components: rows,
    files: files.length > 0 ? files : undefined
  });

  // Reply in original webhook channel
  await message.reply(`📂 Bug **${bugId}** created: <#${bugChannel.id}>`);
});




client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const statusLabels = {
    "status_logged": "🟩 Logged",
    "status_progress": "🔄 In Progress",
    "status_needsinfo": "🟦 Needs Info",
    "status_duplicate": "🟫 Duplicate",
    "status_wontfix": "🟧 Won't Fix",
    "status_done": "✔️ Done"
  };

  const newStatus = statusLabels[interaction.customId];

  // Update status message
  const lines = interaction.message.content.split("\n");
  if (lines[0].startsWith("Status:")) {
    lines[0] = `Status: ${newStatus}`;
  } else {
    lines.unshift(`Status: ${newStatus}`);
  }

  await interaction.message.edit({
    content: lines.join("\n"),
    components: interaction.message.components
  });

  // Handle Done → move to archive
  if (interaction.customId === "status_done") {

    await interaction.reply({
      content: "Bug marked as **Done**. Archiving ticket...",
      ephemeral: true
    });

    // Move channel to archive category
    await interaction.channel.setParent(ARCHIVE_CATEGORY_ID, {
      lockPermissions: false
    });

    // Rename to show archived
    await interaction.channel.setName(`archived-${interaction.channel.name}`);

    return;
  }

  // Normal button response
  await interaction.reply({
    content: `Status updated to **${newStatus}**`,
    ephemeral: true
  });
});


client.login(process.env.TOKEN);
