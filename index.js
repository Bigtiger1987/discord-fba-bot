import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// Tạo server express để giữ cho Render không bị 502
const app = express();
app.get("/", (req, res) => res.send("✅ Discord FBA Bot is alive!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server is running on port ${PORT}`));

// Cấu hình
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxtLvBTb6DaHz1Wyz5PyjrR7fvBuoi1dj8CZ6hH44vSjJQkEneFM8Vi49DsrOW5wsyH2g/exec";

// Khởi tạo bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`🤖 Bot đã đăng nhập thành công: ${client.user.tag}`);
});

// Slash command /fba
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== "fba") return;

  const unit = interaction.options.getString("unit");
  const l = interaction.options.getNumber("length");
  const w = interaction.options.getNumber("width");
  const h = interaction.options.getNumber("height");
  const weight = interaction.options.getNumber("weight");

  await interaction.deferReply();

  try {
    const url = `${SCRIPT_URL}?unit=${unit}&l=${l}&w=${w}&h=${h}&weight=${weight}`;
    const response = await fetch(url);
    const text = await response.text();

    // Embed đẹp
    const color = unit === "inch_lbs" ? 0x3b82f6 : 0x22c55e;
    const { EmbedBuilder } = await import("discord.js");
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("📦 FBA Fee Result")
      .setDescription("Kết quả tính phí FBA")
      .addFields(
        {
          name: "Unit",
          value: unit === "inch_lbs" ? "inch / lbs" : "cm / gram",
          inline: true,
        },
        {
          name: "Input",
          value: `📏 ${l} × ${w} × ${h}\n⚖️ ${weight}`,
          inline: true,
        }
      )
      .addFields({
        name: "Result",
        value: `\`\`\`${text.replace(/\*\*/g, "")}\`\`\``,
      })
      .setFooter({ text: "Dashboard 2025 • Eneocare" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu FBA:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(
        "❌ Có lỗi xảy ra khi tính toán FBA Fee. Vui lòng thử lại sau!"
      );
    } else {
      await interaction.reply(
        "❌ Có lỗi xảy ra khi tính toán FBA Fee. Vui lòng thử lại sau!"
      );
    }
  }
});

// Đăng ký slash command /fba
client.on("ready", async () => {
  const commands = [
    {
      name: "fba",
      description: "Tính phí FBA theo đơn vị & thông số",
      options: [
        {
          name: "unit",
          type: 3,
          description: "Chọn đơn vị đo",
          required: true,
          choices: [
            { name: "cm / gram", value: "cm_gram" },
            { name: "inch / lbs", value: "inch_lbs" },
          ],
        },
        {
          name: "length",
          type: 10, // số (float)
          description: "Chiều dài",
          required: true,
        },
        {
          name: "width",
          type: 10,
          description: "Chiều rộng",
          required: true,
        },
        {
          name: "height",
          type: 10,
          description: "Chiều cao",
          required: true,
        },
        {
          name: "weight",
          type: 10,
          description: "Cân nặng",
          required: true,
        },
      ],
    },
  ];

  await client.application.commands.set(commands);
  console.log("✅ Slash command /fba đã được đăng ký!");
});

client.login(DISCORD_TOKEN);
