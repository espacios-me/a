"use strict";

const crypto = require("crypto");
const { urlencoded, json } = require("body-parser");
require("dotenv").config();
const express = require("express");

const config = require("./config");
const Conversation = require("./conversation");
const Memory = require("./memory");

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json({ verify: verifyRequestSignature }));

app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] !== "subscribe" || req.query["hub.verify_token"] !== config.verifyToken) {
    return res.sendStatus(403);
  }

  return res.status(200).send(req.query["hub.challenge"]);
});

app.post("/webhook", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  try {
    if (req.body.object !== "whatsapp_business_account") return;

    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        const senderPhoneNumberId = value.metadata?.phone_number_id;
        if (!senderPhoneNumberId) continue;

        for (const status of value.statuses || []) {
          await Conversation.handleStatus(senderPhoneNumberId, status);
        }

        for (const rawMessage of value.messages || []) {
          await Conversation.handleMessage(senderPhoneNumberId, rawMessage);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error?.message || error);
  }
});

app.get("/check-reminders", async (req, res) => {
  if (config.cronSecret && req.headers["x-cron-secret"] !== config.cronSecret) {
    return res.sendStatus(403);
  }

  try {
    const senderPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;
    if (!senderPhoneNumberId) {
      return res.status(400).json({ error: "Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_PHONE_ID" });
    }

    const sent = await Conversation.checkAndSendReminders(senderPhoneNumberId);
    return res.json({ sent });
  } catch (error) {
    console.error("Reminder check error:", error?.message || error);
    return res.status(500).json({ error: error?.message || "Reminder check failed" });
  }
});

app.get("/", (req, res) => {
  res.json({
    service: "atom-memory-whatsapp-bot",
    status: "ok",
    endpoints: ["GET /webhook", "POST /webhook", "GET /check-reminders"],
  });
});

config.checkEnvVariables();
Memory.init().catch((error) => {
  console.error("Memory init failed:", error?.message || error);
});

function verifyRequestSignature(req, res, buf) {
  if (config.disableSignatureValidation) return;

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    console.warn("Missing x-hub-signature-256 header");
    return;
  }

  const [scheme, signatureHash] = String(signature).split("=");
  if (scheme !== "sha256" || !signatureHash) {
    throw new Error("Malformed signature header.");
  }

  const expectedHash = crypto.createHmac("sha256", config.appSecret).update(buf).digest("hex");
  const sigBuffer = Buffer.from(signatureHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error("Could not validate the request signature.");
  }
}

const listener = app.listen(config.port, () => {
  console.log(`Atom Memory bot listening on port ${listener.address().port}`);
});
