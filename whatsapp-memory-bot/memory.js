"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
let google = null;
try { ({ google } = require("googleapis")); } catch { google = null; }
const config = require("./config");

const MEMORY_SHEET = "memories";
const REMINDER_SHEET = "reminders";
const USER_SHEET = "users";
let writeQueue = Promise.resolve();

function nowIso() { return new Date().toISOString(); }
function makeId(prefix) { return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`; }
function serializeWrite(fn) { writeQueue = writeQueue.then(fn, fn); return writeQueue; }
function tokenize(text) { return String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1); }
function scoreMemory(memory, queryTokens) {
  let score = Number(memory.importance || 1) * 10;
  const hay = `${memory.text} ${(memory.tags || []).join(" ")}`.toLowerCase();
  for (const token of queryTokens) if (hay.includes(token)) score += 12;
  return score;
}
function nextRecurringDate(dueAtIso, recurrence) {
  const date = new Date(dueAtIso);
  if (recurrence === "daily") date.setUTCDate(date.getUTCDate() + 1);
  if (recurrence === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  if (recurrence === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString();
}
function ensureLocalStoreFile() {
  const filePath = path.resolve(config.dataFile);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({ users: {}, memories: [], reminders: [] }, null, 2));
  return filePath;
}
function readLocalStore() { return JSON.parse(fs.readFileSync(ensureLocalStoreFile(), "utf8")); }
function writeLocalStore(store) { fs.writeFileSync(ensureLocalStoreFile(), JSON.stringify(store, null, 2)); }
function normalizeUser(phone, existing = {}) {
  return { id: existing.id || makeId("usr"), phone, createdAt: existing.createdAt || nowIso(), lastInboundAt: existing.lastInboundAt || null, optedOut: Boolean(existing.optedOut) };
}
function sheetsEnabled() { return config.memoryBackend === "sheets"; }
function getGoogleAuth() {
  if (!google) throw new Error("googleapis is not installed. Run npm install before using the sheets backend.");
  if (!config.googleServiceAccountJson || !config.googleSheetId) throw new Error("Google Sheets backend requires GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_ID");
  return new google.auth.GoogleAuth({ credentials: JSON.parse(config.googleServiceAccountJson), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
}
async function getSheetsClient() { return google.sheets({ version: "v4", auth: getGoogleAuth() }); }
async function ensureSheetsReady() {
  const sheets = await getSheetsClient();
  const spreadsheetId = config.googleSheetId;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  const missing = [USER_SHEET, MEMORY_SHEET, REMINDER_SHEET].filter((name) => !existing.has(name));
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) } });
  }
  const headers = {
    [USER_SHEET]: [["id", "phone", "created_at", "last_inbound_at", "opted_out"]],
    [MEMORY_SHEET]: [["id", "phone", "text", "kind", "importance", "tags", "created_at", "last_used_at"]],
    [REMINDER_SHEET]: [["id", "phone", "title", "due_at", "recurrence", "status", "created_at", "last_sent_at"]],
  };
  for (const [sheetName, values] of Object.entries(headers)) {
    const current = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A1:H1` });
    if (!current.data.values || !current.data.values.length) {
      await sheets.spreadsheets.values.update({ spreadsheetId, range: `${sheetName}!A1`, valueInputOption: "RAW", requestBody: { values } });
    }
  }
}
async function readSheetRows(sheetName, range = "A:H") {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: config.googleSheetId, range: `${sheetName}!${range}` });
  return response.data.values || [];
}
async function appendSheetRow(sheetName, values) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({ spreadsheetId: config.googleSheetId, range: `${sheetName}!A:H`, valueInputOption: "RAW", requestBody: { values: [values] } });
}
async function updateSheetRange(range, values) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({ spreadsheetId: config.googleSheetId, range, valueInputOption: "RAW", requestBody: { values } });
}
async function clearSheetRange(range) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({ spreadsheetId: config.googleSheetId, range });
}

const localBackend = {
  async init() { ensureLocalStoreFile(); },
  async touchUser(phone) { return serializeWrite(async () => { const store = readLocalStore(); store.users[phone] = normalizeUser(phone, store.users[phone]); writeLocalStore(store); }); },
  async setUserState(phone, partial) { return serializeWrite(async () => { const store = readLocalStore(); store.users[phone] = { ...normalizeUser(phone, store.users[phone]), ...partial }; writeLocalStore(store); }); },
  async getUser(phone) { const store = readLocalStore(); return store.users[phone] ? normalizeUser(phone, store.users[phone]) : null; },
  async listMemories(phone, limit = 50) { const store = readLocalStore(); return store.memories.filter((m) => m.phone === phone).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, limit); },
  async retrieveRelevantMemories(phone, queryText, { limit = 8 } = {}) {
    const memories = await this.listMemories(phone, 200);
    const tokens = tokenize(queryText);
    if (!tokens.length) return memories.slice(0, limit);
    return memories.map((memory) => ({ memory, score: scoreMemory(memory, tokens) })).sort((a,b)=>b.score-a.score).slice(0, limit).map((item)=>item.memory);
  },
  async upsertMemories(phone, memories) { return serializeWrite(async () => { const store = readLocalStore(); const created = []; for (const memory of memories) { const record = { id: makeId("mem"), phone, text: memory.text, kind: memory.kind || "note", importance: Number(memory.importance || 3), tags: Array.isArray(memory.tags) ? memory.tags : [], createdAt: nowIso(), lastUsedAt: null }; store.memories.push(record); created.push(record); } writeLocalStore(store); return created; }); },
  async deleteMemoryIndexes(phone, indexes) { return serializeWrite(async () => { const store = readLocalStore(); const ordered = store.memories.filter((m)=>m.phone===phone).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); const ids = indexes.map((i)=>ordered[i-1]?.id).filter(Boolean); store.memories = store.memories.filter((m)=>!ids.includes(m.id)); writeLocalStore(store); return ids.length; }); },
  async listReminders(phone, limit = 50) { const store = readLocalStore(); return store.reminders.filter((r)=>r.phone===phone && r.status !== "deleted").sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)).slice(0, limit); },
  async createReminders(phone, reminders) { return serializeWrite(async () => { const store = readLocalStore(); const created = []; for (const reminder of reminders) { const record = { id: makeId("rem"), phone, title: reminder.title, dueAt: reminder.due_at_iso, recurrence: reminder.recurrence || "none", status: "scheduled", createdAt: nowIso(), lastSentAt: null }; store.reminders.push(record); created.push(record); } writeLocalStore(store); return created; }); },
  async deleteReminderIndexes(phone, indexes) { return serializeWrite(async () => { const store = readLocalStore(); const ordered = store.reminders.filter((r)=>r.phone===phone && r.status!=="deleted").sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)); const ids = indexes.map((i)=>ordered[i-1]?.id).filter(Boolean); store.reminders = store.reminders.map((r)=>ids.includes(r.id)?{...r,status:"deleted"}:r); writeLocalStore(store); return ids.length; }); },
  async getDueReminders(now = new Date()) { const store = readLocalStore(); return store.reminders.filter((r)=>r.status==="scheduled" && new Date(r.dueAt) <= now); },
  async markReminderSent(reminderId) { return serializeWrite(async () => { const store = readLocalStore(); store.reminders = store.reminders.flatMap((r) => { if (r.id !== reminderId) return [r]; if (r.recurrence && r.recurrence !== "none") { return [{ ...r, dueAt: nextRecurringDate(r.dueAt, r.recurrence), lastSentAt: nowIso() }]; } return [{ ...r, status: "sent", lastSentAt: nowIso() }]; }); writeLocalStore(store); }); },
  async clearUserData(phone) { return serializeWrite(async () => { const store = readLocalStore(); delete store.users[phone]; store.memories = store.memories.filter((m)=>m.phone!==phone); store.reminders = store.reminders.filter((r)=>r.phone!==phone); writeLocalStore(store); }); },
  async exportUserData(phone) { return { user: await this.getUser(phone), memories: await this.listMemories(phone, 500), reminders: await this.listReminders(phone, 500) }; },
};

const sheetsBackend = {
  async init() { await ensureSheetsReady(); },
  async touchUser(phone) {
    const user = await this.getUser(phone);
    if (user) return;
    const record = normalizeUser(phone);
    await appendSheetRow(USER_SHEET, [record.id, phone, record.createdAt, record.lastInboundAt || "", String(record.optedOut)]);
  },
  async setUserState(phone, partial) {
    const rows = await readSheetRows(USER_SHEET, "A:E");
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === phone);
    const existing = rowIndex >= 0 ? normalizeUser(phone, { id: rows[rowIndex][0], createdAt: rows[rowIndex][2], lastInboundAt: rows[rowIndex][3] || null, optedOut: rows[rowIndex][4] === "true" }) : normalizeUser(phone);
    const updated = { ...existing, ...partial };
    if (rowIndex >= 0) {
      await updateSheetRange(`${USER_SHEET}!A${rowIndex + 1}:E${rowIndex + 1}`, [[updated.id, phone, updated.createdAt, updated.lastInboundAt || "", String(Boolean(updated.optedOut))]]);
    } else {
      await appendSheetRow(USER_SHEET, [updated.id, phone, updated.createdAt, updated.lastInboundAt || "", String(Boolean(updated.optedOut))]);
    }
  },
  async getUser(phone) {
    const rows = await readSheetRows(USER_SHEET, "A:E");
    const row = rows.find((entry, i) => i > 0 && entry[1] === phone);
    return row ? normalizeUser(phone, { id: row[0], createdAt: row[2], lastInboundAt: row[3] || null, optedOut: row[4] === "true" }) : null;
  },
  async listMemories(phone, limit = 50) {
    const rows = await readSheetRows(MEMORY_SHEET, "A:H");
    return rows.slice(1).filter((r)=>r[1]===phone && r[2]).map((r)=>({ id:r[0], phone:r[1], text:r[2], kind:r[3]||"note", importance:Number(r[4]||3), tags:(r[5]||"").split(",").filter(Boolean), createdAt:r[6]||nowIso(), lastUsedAt:r[7]||null })).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, limit);
  },
  async retrieveRelevantMemories(phone, queryText, { limit = 8 } = {}) { const memories = await this.listMemories(phone, 200); const tokens = tokenize(queryText); if (!tokens.length) return memories.slice(0, limit); return memories.map((memory)=>({memory,score:scoreMemory(memory,tokens)})).sort((a,b)=>b.score-a.score).slice(0,limit).map((x)=>x.memory); },
  async upsertMemories(phone, memories) { const created=[]; for (const memory of memories) { const record={ id:makeId("mem"), phone, text:memory.text, kind:memory.kind||"note", importance:Number(memory.importance||3), tags:Array.isArray(memory.tags)?memory.tags:[], createdAt:nowIso(), lastUsedAt:"" }; await appendSheetRow(MEMORY_SHEET,[record.id, record.phone, record.text, record.kind, record.importance, record.tags.join(","), record.createdAt, record.lastUsedAt]); created.push(record); } return created; },
  async deleteMemoryIndexes(phone, indexes) { const rows = await readSheetRows(MEMORY_SHEET, "A:H"); const ordered = rows.slice(1).map((row,i)=>({sheetRow:i+2,id:row[0],phone:row[1],text:row[2],createdAt:row[6]||nowIso()})).filter((m)=>m.phone===phone && m.text).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); const selected = indexes.map((i)=>ordered[i-1]).filter(Boolean); for (const item of selected) await clearSheetRange(`${MEMORY_SHEET}!A${item.sheetRow}:H${item.sheetRow}`); return selected.length; },
  async listReminders(phone, limit = 50) { const rows = await readSheetRows(REMINDER_SHEET, "A:H"); return rows.slice(1).filter((r)=>r[1]===phone && r[2] && r[5]!=="deleted").map((r)=>({ id:r[0], phone:r[1], title:r[2], dueAt:r[3], recurrence:r[4]||"none", status:r[5]||"scheduled", createdAt:r[6]||nowIso(), lastSentAt:r[7]||null })).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)).slice(0,limit); },
  async createReminders(phone, reminders) { const created=[]; for (const reminder of reminders) { const record={ id:makeId("rem"), phone, title:reminder.title, dueAt:reminder.due_at_iso, recurrence:reminder.recurrence||"none", status:"scheduled", createdAt:nowIso(), lastSentAt:"" }; await appendSheetRow(REMINDER_SHEET,[record.id, record.phone, record.title, record.dueAt, record.recurrence, record.status, record.createdAt, record.lastSentAt]); created.push(record); } return created; },
  async deleteReminderIndexes(phone, indexes) { const rows=await readSheetRows(REMINDER_SHEET, "A:H"); const ordered=rows.slice(1).map((row,i)=>({sheetRow:i+2,id:row[0],phone:row[1],title:row[2],dueAt:row[3],status:row[5]||"scheduled"})).filter((r)=>r.phone===phone && r.title && r.status!=="deleted").sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)); const selected=indexes.map((i)=>ordered[i-1]).filter(Boolean); for (const item of selected) await updateSheetRange(`${REMINDER_SHEET}!F${item.sheetRow}:F${item.sheetRow}`, [["deleted"]]); return selected.length; },
  async getDueReminders(now = new Date()) { const rows=await readSheetRows(REMINDER_SHEET, "A:H"); return rows.slice(1).map((row,i)=>({sheetRow:i+2,id:row[0],phone:row[1],title:row[2],dueAt:row[3],recurrence:row[4]||"none",status:row[5]||"scheduled",createdAt:row[6]||nowIso(),lastSentAt:row[7]||null})).filter((r)=>r.title && r.status==="scheduled" && new Date(r.dueAt)<=now); },
  async markReminderSent(reminderId) { const rows=await readSheetRows(REMINDER_SHEET, "A:H"); const idx=rows.findIndex((row,i)=>i>0 && row[0]===reminderId); if (idx<0) return; const row=rows[idx]; const recurrence=row[4]||"none"; if (recurrence !== "none") await updateSheetRange(`${REMINDER_SHEET}!D${idx+1}:H${idx+1}`, [[nextRecurringDate(row[3], recurrence), recurrence, "scheduled", row[6] || nowIso(), nowIso()]]); else await updateSheetRange(`${REMINDER_SHEET}!F${idx+1}:H${idx+1}`, [["sent", row[6] || nowIso(), nowIso()]]); },
  async clearUserData(phone) { const memories = await readSheetRows(MEMORY_SHEET, "A:H"); const reminders = await readSheetRows(REMINDER_SHEET, "A:H"); const users = await readSheetRows(USER_SHEET, "A:E"); for (const [index,row] of memories.entries()) if (index>0 && row[1]===phone) await clearSheetRange(`${MEMORY_SHEET}!A${index+1}:H${index+1}`); for (const [index,row] of reminders.entries()) if (index>0 && row[1]===phone) await clearSheetRange(`${REMINDER_SHEET}!A${index+1}:H${index+1}`); for (const [index,row] of users.entries()) if (index>0 && row[1]===phone) await clearSheetRange(`${USER_SHEET}!A${index+1}:E${index+1}`); },
  async exportUserData(phone) { return { user: await this.getUser(phone), memories: await this.listMemories(phone, 500), reminders: await this.listReminders(phone, 500) }; },
};

function backend() { return sheetsEnabled() ? sheetsBackend : localBackend; }

module.exports = {
  init: () => backend().init(),
  touchUser: (phone) => backend().touchUser(phone),
  setUserState: (phone, partial) => backend().setUserState(phone, partial),
  getUser: (phone) => backend().getUser(phone),
  listMemories: (phone, limit) => backend().listMemories(phone, limit),
  retrieveRelevantMemories: (phone, queryText, options) => backend().retrieveRelevantMemories(phone, queryText, options),
  upsertMemories: (phone, memories) => backend().upsertMemories(phone, memories),
  deleteMemoryIndexes: (phone, indexes) => backend().deleteMemoryIndexes(phone, indexes),
  listReminders: (phone, limit) => backend().listReminders(phone, limit),
  createReminders: (phone, reminders) => backend().createReminders(phone, reminders),
  deleteReminderIndexes: (phone, indexes) => backend().deleteReminderIndexes(phone, indexes),
  getDueReminders: (date) => backend().getDueReminders(date),
  markReminderSent: (id) => backend().markReminderSent(id),
  clearUserData: (phone) => backend().clearUserData(phone),
  exportUserData: (phone) => backend().exportUserData(phone),
};
