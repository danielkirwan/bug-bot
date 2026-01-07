# BugBot — Unity → Discord Bug Report Ticket Bot

BugBot is a lightweight Discord bot that turns bug reports sent from Unity (via a Discord webhook) into **per-bug ticket channels** with **one-click status buttons**.

## What it does

When a bug report is posted into your configured intake channel (via webhook):

1. **Detects the bug report** (only webhook messages in the intake channel).
2. Extracts a Bug ID from the message body using this format:
   - `ID: \`ABC123\``
3. Creates a new Discord channel named:
   - `bug-abc123`
   inside your configured **Bug Tickets category**.
4. Reposts the bug message (and any attachments like screenshots/logs) into that ticket channel.
5. Adds **status buttons** to the ticket message:
   - 🟩 Logged
   - 🔄 In Progress
   - 🟦 Needs Info
   - 🟫 Duplicate
   - 🟧 Won’t Fix
   - ✔️ Done
6. If **Done** is pressed:
   - Moves the channel into your configured **Archive category**
   - Renames the channel to `archived-bug-abc123`

---

## How it connects to Unity

Unity does **not** need the bot token.

Unity posts bug reports to Discord using a **Discord Webhook URL** (created on a channel in your server). BugBot listens for those webhook messages in that intake channel and automatically creates the ticket channels.

Typical Unity flow:

- Capture a bug report (player message, device info, build number)
- Attach `Player.log` and/or a screenshot
- POST to Discord webhook:
  - Text content includes `ID: \`SOMEID\``
  - Attachments are uploaded as multipart form-data

BugBot then mirrors that into a ticket channel and adds the status buttons.

---

## Requirements

- Node.js **18+** (uses built-in `fetch`)
- A Discord server where you can create:
  - a **Bug Intake channel** (where the webhook posts)
  - a **Bug Tickets category**
  - an **Archive category**

---

## Discord setup (server)

1. Create a text channel for incoming bug reports, e.g. `#bug-intake`.
2. Create two categories:
   - `Bug Tickets`
   - `Bug Archive`
3. Create a webhook in `#bug-intake`:
   - Channel settings → **Integrations** → **Webhooks** → New Webhook
   - Copy the webhook URL (Unity will use this)

---

## Discord bot setup (application)

1. Go to the Discord Developer Portal and create an application + bot.
2. Enable these **Privileged Gateway Intents** (important):
   - `Message Content Intent` (BugBot reads message content to extract the ID)
3. Invite the bot to your server with permissions:
   - Manage Channels
   - Read Messages / View Channels
   - Send Messages
   - Read Message History
   - Attach Files

---

## Installation

> ⚠️ Tip: Don’t commit `node_modules` to GitHub. Add it to `.gitignore`.

```bash
npm install
