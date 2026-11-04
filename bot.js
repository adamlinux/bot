// Keeps your Discord bot online and applies the status chosen on the website.
// Run: npm install && BOT_TOKEN=your_bot_token npm start
import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from "@discordjs/voice";
const VOICE_CHANNEL = process.env.VOICE_CHANNEL_ID || "1566106993456848946";
const API = "https://trenchesliferoleplay.lovable.app/api/public/fivem" + "/bot-status";
const KEY = "tl_c187c3fffd42148b1c0d644263eaa64b996b0ac495662d9d";
const TYPES = { playing: ActivityType.Playing, watching: ActivityType.Watching, listening: ActivityType.Listening, competing: ActivityType.Competing };
const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
// Stay in the voice channel; rejoin automatically if kicked or disconnected.
async function stayInVoice() {
  try {
    const ch = await c.channels.fetch(VOICE_CHANNEL);
    if (!ch || !ch.isVoiceBased()) return console.error("voice channel not found:", VOICE_CHANNEL);
    const conn = joinVoiceChannel({ channelId: ch.id, guildId: ch.guild.id, adapterCreator: ch.guild.voiceAdapterCreator, selfDeaf: true, selfMute: true });
    conn.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([entersState(conn, VoiceConnectionStatus.Signalling, 5000), entersState(conn, VoiceConnectionStatus.Connecting, 5000)]);
      } catch { conn.destroy(); setTimeout(stayInVoice, 5000); }
    });
    console.log("joined voice channel", ch.name);
  } catch (e) { console.error("voice join failed", e.message); setTimeout(stayInVoice, 15000); }
}
let last = "";
async function sync() {
  try {
    const r = await fetch(API, { headers: { "x-api-key": KEY } });
    const b = await r.json();
    const k = JSON.stringify(b);
    if (k === last) return;
    last = k;
    c.user.setPresence({ status: b.status, activities: b.activityText ? [{ name: b.activityText, type: TYPES[b.activityType] ?? 0 }] : [] });
    console.log("status ->", b.status, b.activityText);
  } catch (e) { console.error("sync failed", e.message); }
}
c.once("ready", () => { console.log("online as", c.user.tag); sync(); setInterval(sync, 30000); stayInVoice(); });
c.login(process.env.BOT_TOKEN);
