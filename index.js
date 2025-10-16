import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// Giữ cho Render không bị 502
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== "fba") return;

  const unit = interaction.options.getString("unit");
  const l = interaction.options.getNumber("length");
  const w = interaction.options.getNumber("width");
  const h = interaction.options.getNumber("height");
  const weight = interaction.options.getNumber("weight");

  await interaction.deferReply();

  try {
    const url = `${SCRIPT_URL}?unit=${unit}&l=${l}&w=${w}&h=${h}&weight=${weight}`;
    const response = await fetch(url);
    let text = await response.text();

    // Làm sạch chuỗi trả về
    text = text
      .replace(/\*\*/g, "")                  // bỏ ** nếu có
      .replace(/Unit:[^\r\n]*(\r?\n|\n\r)/, "") // xóa dòng Unit: xử lý cả \r\n hoặc \n\r
      .replace(/^[\s.]+(?=•)/gm, "")         // xóa mọi dấu . hoặc khoảng trắng trước dấu •
      .replace(/^\s*[•.]+\s*/gm, "• ")       // chuẩn hóa bullet đầu dòng
      .trim();

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
        },
        {
          name: "Result",
          value: `\`\`\`${text}\`\`\``,
        }
      )
      .setFooter({ text: "Amazon 2025 • Eneocare" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu FBA:", error);
    const msg = "❌ Có lỗi xảy ra khi tính toán FBA Fee. Vui lòng thử lại sau!";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

// Đăng ký lệnh /fba
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
        { name: "length", type: 10, description: "Chiều dài", required: true },
        { name: "width", type: 10, description: "Chiều rộng", required: true },
        { name: "height", type: 10, description: "Chiều cao", required: true },
        { name: "weight", type: 10, description: "Cân nặng", required: true },
      ],
    },
  ];

  await client.application.commands.set(commands);
  console.log("✅ Slash command /fba đã được đăng ký!");
});

client.login(DISCORD_TOKEN);
