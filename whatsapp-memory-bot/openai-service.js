"use strict";

let OpenAI = null;
try { OpenAI = require("openai"); } catch { OpenAI = null; }
const config = require("./config");

const client = OpenAI && config.openAiApiKey ? new OpenAI({ apiKey: config.openAiApiKey }) : null;

function clampImportance(value) {
  const num = Number(value || 3);
  return Math.max(1, Math.min(5, Number.isFinite(num) ? num : 3));
}
function extractTags(text) {
  return Array.from(new Set(String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3))).slice(0, 5);
}
function parseIndexes(text) {
  return Array.from(new Set((String(text || "").match(/\d+/g) || []).map(Number).filter((n) => n > 0)));
}
function parseReminderTime(text) {
  const normalized = String(text || "").toLowerCase();
  const date = new Date();
  date.setSeconds(0, 0);
  let hour = 9;
  let minute = 0;
  const timeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2] || 0);
    const meridian = timeMatch[3];
    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
  }
  if (normalized.includes("tomorrow")) date.setDate(date.getDate() + 1);
  else if (normalized.includes("next week")) date.setDate(date.getDate() + 7);
  date.setHours(hour, minute, 0, 0);
  if (!normalized.includes("tomorrow") && date.getTime() < Date.now() + 60 * 1000) date.setDate(date.getDate() + 1);
  let recurrence = "none";
  if (/every day|daily/.test(normalized)) recurrence = "daily";
  if (/every week|weekly|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday/.test(normalized)) recurrence = "weekly";
  if (/every month|monthly/.test(normalized)) recurrence = "monthly";
  return { due_at_iso: date.toISOString(), recurrence };
}
function buildHeuristicResponse({ userText, memories = [], reminders = [] }) {
  const text = String(userText || "").trim();
  const normalized = text.toLowerCase();
  if (/^help$|what can you do|commands/.test(normalized)) return { assistant_reply: "You can ask me to remember things, recall them, set reminders, show memories, show reminders, delete memory numbers, delete reminder numbers, export your data, or delete your data.", intent: "help", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
  if (/delete my data|forget me|erase my data/.test(normalized)) return { assistant_reply: "I’ll delete your memories and reminders now.", intent: "delete_data", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
  if (/export my data|download my data/.test(normalized)) return { assistant_reply: "I’ll gather what I have so you can review it.", intent: "export_data", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
  if (/show my reminders|list reminders|what are my reminders/.test(normalized)) return { assistant_reply: reminders.length ? reminders.map((r, i) => `${i + 1}. ${r.title} — ${new Date(r.dueAt).toLocaleString()}${r.recurrence !== "none" ? ` (${r.recurrence})` : ""}`).join("\n") : "You have no scheduled reminders yet.", intent: "show_reminders", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
  if (/delete reminder|remove reminder|cancel reminder/.test(normalized)) return { assistant_reply: parseIndexes(normalized).length ? `I’ll delete reminder ${parseIndexes(normalized).join(", ")}.` : "Tell me which reminder number to delete, like ‘Delete reminder 2’.", intent: "delete_reminders", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: parseIndexes(normalized) };
  if (/show my memories|list memories|what do you remember|recall|remember about/.test(normalized)) return { assistant_reply: memories.length ? memories.map((m, i) => `${i + 1}. ${m.text}`).join("\n") : "I don’t have anything saved for that yet.", intent: "show_memories", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
  if (/delete memory|remove memory|forget memory/.test(normalized)) return { assistant_reply: parseIndexes(normalized).length ? `I’ll delete memory ${parseIndexes(normalized).join(", ")}.` : "Tell me which memory number to delete, like ‘Delete memory 2’.", intent: "delete_memories", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: parseIndexes(normalized), reminder_indexes_to_delete: [] };
  if (/^remember\b|save this|note that|please remember/.test(normalized)) { const cleaned = text.replace(/^(remember|save this|note that|please remember)[:,\s-]*/i, "").trim(); return { assistant_reply: cleaned ? `Saved. I’ll remember: ${cleaned}` : "Tell me what you want me to remember.", intent: "remember", memories_to_write: cleaned ? [{ text: cleaned, kind: "note", importance: 3, tags: extractTags(cleaned) }] : [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] }; }
  if (/remind me|set a reminder/.test(normalized)) { const cleaned = text.replace(/^(please\s*)?(remind me|set a reminder)\s*/i, "").trim(); const schedule = parseReminderTime(cleaned || text); const title = cleaned.replace(/\b(tomorrow|today|next week|every day|daily|every week|weekly|every month|monthly)\b/gi, "").replace(/\bat\s*\d{1,2}(?::\d{2})?\s*(am|pm)?/gi, "").replace(/\b(on|to)\b/gi, "").replace(/\s+/g, " ").trim() || "Reminder"; return { assistant_reply: `Done. I’ll remind you about “${title}” on ${new Date(schedule.due_at_iso).toLocaleString()}.`, intent: "remind", memories_to_write: [], reminders_to_create: [{ title, ...schedule }], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] }; }
  const relevant = memories.slice(0, 3).map((memory) => `• ${memory.text}`).join("\n");
  return { assistant_reply: relevant ? `Here’s the most relevant context I found:\n${relevant}` : "I can help with memories and reminders. Try ‘Remember that…’ or ‘Remind me…’.", intent: relevant ? "recall" : "chat", memories_to_write: [], reminders_to_create: [], memory_indexes_to_delete: [], reminder_indexes_to_delete: [] };
}
function parseJsonResponse(rawText) {
  try { return JSON.parse(rawText); } catch {
    const match = String(rawText || "").match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Model did not return valid JSON");
  }
}

module.exports = class OpenAIService {
  static async respond({ userPhone, userText, recentTurns, memories, reminders }) {
    const fallback = buildHeuristicResponse({ userText, memories, reminders });
    if (!client) return fallback;
    const systemPrompt = [
      "You are Atom, a premium WhatsApp memory assistant.",
      "Return only JSON.",
      "Only write long-term memory when the user explicitly asks or when the fact is clearly durable and useful.",
      "Never store passwords, card numbers, passport numbers, one-time codes, or similar sensitive secrets.",
      "Available intents: chat, remember, recall, remind, show_memories, show_reminders, delete_memories, delete_reminders, delete_data, export_data, help.",
      "JSON schema:",
      JSON.stringify({ assistant_reply: "string", intent: "string", memories_to_write: [{ text: "string", kind: "note|preference|fact|project|person", importance: 3, tags: ["string"] }], reminders_to_create: [{ title: "string", due_at_iso: "ISO string", recurrence: "none|daily|weekly|monthly" }], memory_indexes_to_delete: [1], reminder_indexes_to_delete: [1] }),
    ].join("\n");
    const memoryBlock = memories.length ? memories.map((memory, index) => `${index + 1}. ${memory.text}`).join("\n") : "(none)";
    const reminderBlock = reminders.length ? reminders.map((reminder, index) => `${index + 1}. ${reminder.title} @ ${reminder.dueAt}`).join("\n") : "(none)";
    try {
      const response = await client.chat.completions.create({
        model: config.openAiModel,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [`Phone: ${userPhone}`, `Message: ${userText}`, `Recent turns: ${JSON.stringify(recentTurns || []).slice(0, 5000)}`, `Memories:\n${memoryBlock}`, `Reminders:\n${reminderBlock}`].join("\n\n") },
        ],
        temperature: 0.2,
      });
      const parsed = parseJsonResponse(response.choices?.[0]?.message?.content || "{}");
      return {
        assistant_reply: parsed.assistant_reply || fallback.assistant_reply,
        intent: parsed.intent || fallback.intent,
        memories_to_write: Array.isArray(parsed.memories_to_write) ? parsed.memories_to_write.map((memory) => ({ text: String(memory.text || "").trim(), kind: memory.kind || "note", importance: clampImportance(memory.importance), tags: Array.isArray(memory.tags) ? memory.tags.slice(0, 5) : extractTags(memory.text) })).filter((memory) => memory.text) : [],
        reminders_to_create: Array.isArray(parsed.reminders_to_create) ? parsed.reminders_to_create.map((reminder) => ({ title: String(reminder.title || "").trim(), due_at_iso: reminder.due_at_iso, recurrence: reminder.recurrence || "none" })).filter((reminder) => reminder.title && reminder.due_at_iso) : [],
        memory_indexes_to_delete: Array.isArray(parsed.memory_indexes_to_delete) ? parsed.memory_indexes_to_delete.map(Number).filter((value) => value > 0) : [],
        reminder_indexes_to_delete: Array.isArray(parsed.reminder_indexes_to_delete) ? parsed.reminder_indexes_to_delete.map(Number).filter((value) => value > 0) : [],
      };
    } catch (error) {
      console.warn("OpenAI request failed, using heuristic mode:", error?.message || error);
      return fallback;
    }
  }
};
