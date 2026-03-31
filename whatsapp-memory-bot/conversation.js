"use strict";

const constants = require("./constants");
const GraphApi = require("./graph-api");
const Message = require("./message");
const Status = require("./status");
const Session = require("./redis");
const Memory = require("./memory");
const OpenAIService = require("./openai-service");

function isOptOut(text) {
  const value = String(text || "").toLowerCase();
  return ["stop", "unsubscribe", "cancel", "end", "opt out"].some((term) => value.includes(term));
}
function isResume(text) {
  const value = String(text || "").trim().toLowerCase();
  return value === "start" || value === "resume";
}
function containsSensitivePattern(text) {
  const value = String(text || "");
  return /\b(?:otp|one-time code|password|passcode|cvv|security code)\b/i.test(value) || /\b\d{13,19}\b/.test(value) || /\b[A-Z]\d{7,8}\b/i.test(value);
}
function formatExport(data) {
  const memories = data.memories?.length ? data.memories.map((memory, index) => `${index + 1}. ${memory.text}`).join("\n") : "(none)";
  const reminders = data.reminders?.length ? data.reminders.map((reminder, index) => `${index + 1}. ${reminder.title} — ${new Date(reminder.dueAt).toLocaleString()}`).join("\n") : "(none)";
  return ["Here’s your current memory export:", "", "Memories:", memories, "", "Reminders:", reminders].join("\n");
}
async function sendReply(messageId, senderPhoneNumberId, recipientPhoneNumber, text) {
  return GraphApi.messageText(messageId, senderPhoneNumberId, recipientPhoneNumber, String(text || "").slice(0, 4096));
}

module.exports = class Conversation {
  static async handleMessage(senderPhoneNumberId, rawMessage) {
    const message = new Message(rawMessage);
    if (!message.from) return;

    await Memory.touchUser(message.from);
    await Memory.setUserState(message.from, { lastInboundAt: new Date().toISOString() });
    await Session.setLastInboundAt(message.from, new Date().toISOString());

    if (!message.text) {
      await sendReply(message.id, senderPhoneNumberId, message.from, constants.UNSUPPORTED_MESSAGE);
      return;
    }

    const firstSeen = await Session.markProcessed(message.id, 3600);
    if (!firstSeen) return;

    if (isResume(message.text)) {
      await Session.setOptOut(message.from, false);
      await Memory.setUserState(message.from, { optedOut: false });
      await sendReply(message.id, senderPhoneNumberId, message.from, constants.RESUMED_MESSAGE);
      return;
    }

    if (isOptOut(message.text)) {
      await Session.setOptOut(message.from, true);
      await Memory.setUserState(message.from, { optedOut: true });
      await sendReply(message.id, senderPhoneNumberId, message.from, constants.OPTED_OUT_MESSAGE);
      return;
    }

    if (await Session.isOptedOut(message.from)) return;

    const recentTurns = await Session.getRecentTurns(message.from, 12);
    const memories = await Memory.retrieveRelevantMemories(message.from, message.text, { limit: 8 });
    const reminderList = await Memory.listReminders(message.from, 20);
    const ai = await OpenAIService.respond({ userPhone: message.from, userText: message.text, recentTurns, memories, reminders: reminderList });

    let reply = ai.assistant_reply || constants.HELP_MESSAGE;
    if (containsSensitivePattern(message.text) && ai.memories_to_write?.length) {
      ai.memories_to_write = [];
      reply = `${reply}\n\n${constants.PRIVACY_WARNING}`;
    }
    if (ai.intent === "delete_data") {
      await Memory.clearUserData(message.from);
      await sendReply(message.id, senderPhoneNumberId, message.from, "Done. I deleted your memories and reminders for this number.");
      return;
    }
    if (ai.intent === "export_data") {
      await sendReply(message.id, senderPhoneNumberId, message.from, formatExport(await Memory.exportUserData(message.from)));
      return;
    }
    if (Array.isArray(ai.memory_indexes_to_delete) && ai.memory_indexes_to_delete.length) {
      const removedCount = await Memory.deleteMemoryIndexes(message.from, ai.memory_indexes_to_delete);
      reply = removedCount ? `Deleted ${removedCount} memory item${removedCount === 1 ? "" : "s"}.` : "I couldn’t find those memory numbers.";
    }
    if (Array.isArray(ai.reminder_indexes_to_delete) && ai.reminder_indexes_to_delete.length) {
      const removedCount = await Memory.deleteReminderIndexes(message.from, ai.reminder_indexes_to_delete);
      reply = removedCount ? `Deleted ${removedCount} reminder${removedCount === 1 ? "" : "s"}.` : "I couldn’t find those reminder numbers.";
    }
    if (Array.isArray(ai.memories_to_write) && ai.memories_to_write.length) await Memory.upsertMemories(message.from, ai.memories_to_write);
    if (Array.isArray(ai.reminders_to_create) && ai.reminders_to_create.length) await Memory.createReminders(message.from, ai.reminders_to_create);

    await Session.appendTurn(message.from, { role: "user", text: message.text, ts: Date.now() });
    await Session.appendTurn(message.from, { role: "assistant", text: reply, ts: Date.now() });
    await sendReply(message.id, senderPhoneNumberId, message.from, reply);
  }

  static async handleStatus(senderPhoneNumberId, rawStatus) {
    const status = new Status(rawStatus);
    return status;
  }

  static async checkAndSendReminders(senderPhoneNumberId) {
    const dueReminders = await Memory.getDueReminders(new Date());
    let sent = 0;
    for (const reminder of dueReminders) {
      const lastInboundAt = (await Session.getLastInboundAt(reminder.phone)) || (await Memory.getUser(reminder.phone))?.lastInboundAt;
      const withinServiceWindow = lastInboundAt && Date.now() - new Date(lastInboundAt).getTime() <= 24 * 60 * 60 * 1000;
      try {
        if (!withinServiceWindow && process.env.REMINDER_TEMPLATE_NAME) {
          await GraphApi.messageTemplate(undefined, senderPhoneNumberId, reminder.phone, process.env.REMINDER_TEMPLATE_NAME, process.env.REMINDER_TEMPLATE_LOCALE || "en_US", [reminder.title]);
        } else {
          await GraphApi.messageText(undefined, senderPhoneNumberId, reminder.phone, `⏰ Reminder\n\n${reminder.title}`);
        }
        await Memory.markReminderSent(reminder.id);
        sent += 1;
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error?.message || error);
      }
    }
    return sent;
  }
};
