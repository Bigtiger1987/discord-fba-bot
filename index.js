import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("fba")
    .setDescription("Tính phí FBA theo kích thước & cân nặng")
    .addStringOption(option =>
      option
        .setName("unit")
        .setDescription("Chọn đơn vị đo")
        .setRequired(true)
        .addChoices(
          { name: "inch / lbs", value: "inch_lbs" },
          { name: "cm / gram", value: "cm_gram" }
        )
    )
    .addNumberOption(o => o.setName("length").setDescription("Chiều dài").setRequired(true))
    .addNumberOption(o => o.setName("width").setDescription("Chiều rộng").setRequired(true))
    .addNumberOption(o => o.setName("height").setDescription("Chiều cao").setRequired(true))
    .addNumberOption(o => o.setName("weight").setDescription("Cân nặng").setRequired(true))
].map(c => c.toJSON());

// === Register Slash Command ===
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Slash command /fba đã được đăng ký thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký lệnh:", err);
  }
})();

// === Bot Behavior ===
client.once("ready", () => {
  console.log(`🤖 Bot đã đăng nhập thành công: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "fba") return;

  const unit = interaction.options.getString("unit");
  const l = interaction.options.getNumber("length");
  const w = interaction.options.getNumber("width");
  const h = interaction.options.getNumber("height");
  const weight = interaction.options.getNumber("weight");

  try {
    const url = `https://script.google.com/macros/s/AKfycbxtLvBTb6DaHz1Wyz5PyjrR7fvBuoi1dj8CZ6hH44vSjJQkEneFM8Vi49DsrOW5wsyH2g/exec?unit=${unit}&l=${l}&w=${w}&h=${h}&weight=${weight}`;
    const response = await fetch(url);
    const text = await response.text();

    // === Embed đẹp ===
    const color = unit === "inch_lbs" ? 0x3b82f6 : 0x22c55e; // xanh dương / xanh lá
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("📦 FBA Fee Result")
      .setDescription("Kết quả tính phí FBA")
      .addFields(
        { name: "Unit", value: unit === "inch_lbs" ? "inch / lbs" : "cm / gram", inline: true },
        { name: "Input", value: `📏 ${l} × ${w} × ${h}\n⚖️ ${weight}`, inline: true },
      )
      .addFields(
        { name: "Result", value: `\`\`\`${text.replace(/\*\*/g, "")}\`\`\`` }
      )
      .setFooter({ text: "Dashboard 2025 • Eneocare", iconURL: "https://cdn.discordapp.com/emojis/1264710780647249950.webp?size=96&quality=lossless" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await interaction.reply("❌ Có lỗi xảy ra khi tính toán FBA Fee. Vui lòng thử lại sau!");
  }
});

client.login(DISCORD_TOKEN);

