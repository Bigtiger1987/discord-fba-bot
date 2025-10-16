import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import fetch from "node-fetch";

// ===== CONFIG =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1428048994717794415";
const GUILD_ID = "1425160334779351094";
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxtLvBTb6DaHz1Wyz5PyjrR7fvBuoi1dj8CZ6hH44vSjJQkEneFM8Vi49DsrOW5wsyH2g/exec";

// ===== REGISTER SLASH COMMAND =====
const commands = [
  new SlashCommandBuilder()
    .setName("fba")
    .setDescription("Tính phí FBA theo kích thước & trọng lượng")
    .addStringOption((o) =>
      o
        .setName("unit")
        .setDescription("Chọn đơn vị đo")
        .setRequired(true)
        .addChoices(
          { name: "cm / gram", value: "cm_gram" },
          { name: "inch / lbs", value: "inch_lbs" }
        )
    )
    .addNumberOption((o) =>
      o.setName("length").setDescription("Chiều dài").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName("width").setDescription("Chiều rộng").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName("height").setDescription("Chiều cao").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName("weight").setDescription("Cân nặng").setRequired(true)
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Slash command /fba đã được đăng ký thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký command:", error);
  }
})();

// ===== BOT RUN =====
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`🚀 Bot đã đăng nhập thành ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "fba") return;

  const unit = interaction.options.getString("unit");
  const l = interaction.options.getNumber("length");
  const w = interaction.options.getNumber("width");
  const h = interaction.options.getNumber("height");
  const weight = interaction.options.getNumber("weight");

  await interaction.deferReply();

  try {
    const url = `${WEBAPP_URL}?unit=${unit}&l=${l}&w=${w}&h=${h}&weight=${weight}`;
    const res = await fetch(url);
    const text = await res.text();

    await interaction.editReply(text);
  } catch (err) {
    await interaction.editReply("❌ Lỗi khi tính toán FBA. Vui lòng kiểm tra lại.");
    console.error(err);
  }
});

client.login(DISCORD_TOKEN);
