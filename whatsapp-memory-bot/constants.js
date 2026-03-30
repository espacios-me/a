"use strict";

module.exports = Object.freeze({
  WELCOME_MESSAGE:
    "I’m your calm second brain on WhatsApp. Ask me to remember something, recall it later, or remind you at the right time.",
  HELP_MESSAGE: [
    "Here’s what I can do:",
    "• remember: ‘Remember that I prefer calls after 6pm’",
    "• recall: ‘What do you remember about travel?’",
    "• remind: ‘Remind me tomorrow at 10am to call Ahmed’",
    "• review: ‘Show my memories’ or ‘Show my reminders’",
    "• clean up: ‘Delete memory 2’ or ‘Delete my data’",
  ].join("\n"),
  OPTED_OUT_MESSAGE: "You’re unsubscribed. Reply START anytime to resume.",
  RESUMED_MESSAGE: "You’re back in. I’ll remember and remind again.",
  UNSUPPORTED_MESSAGE: "I can process text right now. Send a text note, question, or reminder request.",
  PRIVACY_WARNING: "I won’t save highly sensitive IDs, passwords, cards, or one-time codes.",
});
