"use strict";

module.exports = class Message {
  constructor(rawMessage) {
    this.id = rawMessage?.id;
    this.from = rawMessage?.from;
    this.timestamp = rawMessage?.timestamp ? Number(rawMessage.timestamp) : undefined;
    this.rawType = rawMessage?.type;
    this.kind = "unknown";
    this.type = "unknown";
    this.text = undefined;
    this.payload = undefined;

    if (rawMessage?.type === "text") {
      this.kind = "text";
      this.type = "text";
      this.text = rawMessage?.text?.body?.trim();
      return;
    }

    if (rawMessage?.type === "interactive") {
      this.kind = "interactive";
      const interactive = rawMessage.interactive || {};
      if (interactive.button_reply) {
        this.type = "interactive_button";
        this.payload = interactive.button_reply.id;
        this.text = interactive.button_reply.title;
        return;
      }
      if (interactive.list_reply) {
        this.type = "interactive_list";
        this.payload = interactive.list_reply.id;
        this.text = interactive.list_reply.title;
      }
    }
  }
};
