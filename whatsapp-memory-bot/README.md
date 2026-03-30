# Atom Memory WhatsApp Bot

A production-minded WhatsApp memory assistant for Atom built on top of the Meta sample starter.

It supports:
- free-text memory capture
- memory recall
- reminder creation
- reminder delivery via cron
- delete memory / delete reminder commands
- delete my data / export my data
- opt-out and resume flows
- Redis-backed short-term session state with in-memory fallback
- local JSON persistence or Google Sheets persistence
- OpenAI planning with heuristic fallback

## Example commands

- `Remember that I prefer calls after 6pm`
- `What do you remember about travel?`
- `Show my memories`
- `Delete memory 2`
- `Remind me tomorrow at 10am to call Ahmed`
- `Show my reminders`
- `Delete reminder 1`
- `Export my data`
- `Delete my data`
- `STOP` / `START`

## Quick start

```bash
cp .sample.env .env
npm install
npm run check
npm start
```

Webhook endpoints:
- `GET /webhook`
- `POST /webhook`
- `GET /check-reminders`

## Storage backends

### Local JSON

```env
MEMORY_BACKEND=local
DATA_FILE=./data/store.json
```

### Google Sheets

```env
MEMORY_BACKEND=sheets
GOOGLE_SHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON={...}
```

The app creates three sheets when missing:
- `users`
- `memories`
- `reminders`

## Reminder delivery

Text reminders work inside the WhatsApp customer service window.

If you want reliable reminders outside the 24-hour window, set an approved template and configure:

```env
REMINDER_TEMPLATE_NAME=atom_reminder
REMINDER_TEMPLATE_LOCALE=en_US
```

## Safety choices

- Explicit opt-out is honored with `STOP`, `UNSUBSCRIBE`, `CANCEL`, `END`, or `OPT OUT`
- `START` and `RESUME` turn it back on
- Sensitive patterns are not saved as memory
- Webhook signature comparison uses `crypto.timingSafeEqual`
- Duplicate message processing is blocked with Redis or in-memory idempotency
