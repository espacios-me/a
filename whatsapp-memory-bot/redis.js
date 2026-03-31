"use strict";

let redis = null;
try { redis = require("redis"); } catch { redis = null; }
const config = require("./config");

const inMemory = { processed: new Map(), turns: new Map(), flags: new Map() };
let client = null;
let ready = false;

async function ensureClient() {
  if (ready) return client;
  try {
    if (!redis) throw new Error("redis package not installed");
    client = config.redisUrl ? redis.createClient({ url: config.redisUrl }) : redis.createClient({ socket: { host: config.redisHost, port: config.redisPort } });
    client.on("error", (err) => console.warn("Redis Client Error, falling back to in-memory store:", err?.message || err));
    await client.connect();
    ready = true;
    return client;
  } catch (error) {
    console.warn("Redis unavailable, using in-memory session store:", error?.message || error);
    client = null;
    ready = false;
    return null;
  }
}

function nowMs() { return Date.now(); }

function prune() {
  const now = nowMs();
  for (const [key, expiresAt] of inMemory.processed.entries()) if (expiresAt <= now) inMemory.processed.delete(key);
  for (const [key, entry] of inMemory.flags.entries()) if (entry.expiresAt <= now) inMemory.flags.delete(key);
}

module.exports = class Session {
  static async markProcessed(messageId, ttlSeconds = 3600) {
    const redisClient = await ensureClient();
    if (redisClient) {
      const result = await redisClient.set(`processed:${messageId}`, "1", { NX: true, EX: ttlSeconds });
      return result === "OK";
    }
    prune();
    if (inMemory.processed.has(messageId)) return false;
    inMemory.processed.set(messageId, nowMs() + ttlSeconds * 1000);
    return true;
  }

  static async appendTurn(phone, turn, maxTurns = 20, ttlSeconds = 86400 * 7) {
    const redisClient = await ensureClient();
    const key = `turns:${phone}`;
    if (redisClient) {
      await redisClient.rPush(key, JSON.stringify(turn));
      await redisClient.lTrim(key, -maxTurns, -1);
      await redisClient.expire(key, ttlSeconds);
      return;
    }
    const turns = inMemory.turns.get(key) || [];
    turns.push(turn);
    inMemory.turns.set(key, turns.slice(-maxTurns));
  }

  static async getRecentTurns(phone, limit = 12) {
    const redisClient = await ensureClient();
    const key = `turns:${phone}`;
    if (redisClient) {
      const values = await redisClient.lRange(key, -limit, -1);
      return values.map((item) => { try { return JSON.parse(item); } catch { return null; } }).filter(Boolean);
    }
    return (inMemory.turns.get(key) || []).slice(-limit);
  }

  static async setFlag(phone, name, value, ttlSeconds = 86400 * 30) {
    const redisClient = await ensureClient();
    const key = `flag:${phone}:${name}`;
    if (redisClient) {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    }
    inMemory.flags.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
  }

  static async getFlag(phone, name) {
    const redisClient = await ensureClient();
    const key = `flag:${phone}:${name}`;
    if (redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    prune();
    return inMemory.flags.get(key)?.value ?? null;
  }

  static async setOptOut(phone, value) { await this.setFlag(phone, "optout", Boolean(value), 86400 * 365); }
  static async isOptedOut(phone) { return Boolean(await this.getFlag(phone, "optout")); }
  static async setLastInboundAt(phone, isoTimestamp) { await this.setFlag(phone, "last_inbound_at", isoTimestamp, 86400 * 365); }
  static async getLastInboundAt(phone) { return this.getFlag(phone, "last_inbound_at"); }
};
