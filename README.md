# Polymarket Copy Trading Bot

**Copy any Polymarket trader automatically.** This bot monitors a chosen wallet and mirrors their prediction market orders on your wallet in real time.

## Table of Contents

- [What You Get](#what-you-get)
- [What's New in Version 2](#whats-new-in-version-2)
- [Key Features (This Version)](#key-features-this-version)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Geographic Restrictions](#geographic-restrictions)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## What You Get

- **One trader, one config** — Set the wallet you want to copy; the bot does the rest.
- **Real-time monitoring** — Polls Polymarket for the target’s activity at an interval you choose (default 1 second).
- **Automated execution** — New trades are detected, then placed on your wallet via the official CLOB.
- **Persistence & retries** — MongoDB stores activity and pending trades; failed copies are retried up to a limit you set.
- **Full control** — Adjust poll interval, order age cutoff, and retry count via environment variables.

---

## What's New in Version 2

Version 2 is a step up from a basic copy-trading script. Here’s what’s **advanced and added** in this release.

### Core principle

The bot runs on a simple loop:

| Step | What it does |
|------|----------------|
| **Monitor** | Scans the target wallet’s activity every `FETCH_INTERVAL` seconds (default 1 s). |
| **Analyze** | Compares the target’s positions with yours and finds trades to copy. |
| **Execute** | Places buy/sell orders on your wallet to mirror the target’s positions. |
| **Persist** | Saves activity and pending trades in MongoDB so the bot can resume and retry. |

### Advanced features added in Version 2

| Feature | Description |
|--------|-------------|
| **Real-time trade monitoring** | Continuously polls Polymarket for the target’s activity and keeps MongoDB in sync so you don’t miss trades after a restart. |
| **Automated trade execution** | Reads pending trades from MongoDB, compares positions and balances, then places orders on your wallet via the official CLOB client. |
| **MongoDB integration** | Stores user activities and positions per wallet. Enables resume-after-restart and a clear history of what was copied. |
| **Retry logic** | Failed executions (e.g. network errors) are retried up to `RETRY_LIMIT` times so temporary issues don’t drop trades. |
| **Order age filter** | Ignores trades older than `TOO_OLD_TIMESTAMP` (hours) so you only copy recent, relevant orders. |
| **Configurable timing** | `FETCH_INTERVAL` (seconds) lets you balance speed vs API load; default is 1 second for near real-time copying. |
| **Official CLOB client** | Uses `@polymarket/clob-client` for signing and submitting orders correctly on Polymarket. |
| **Balance & position checks** | Before placing orders, the bot checks your USDC balance and compares your positions to the target’s so execution is consistent. |

### What this version is

- **Single target** — Copy one wallet at a time (one `USER_ADDRESS`).
- **Standard wallet** — Uses your own wallet and private key (e.g. MetaMask/Phantom); no multi-sig or Safe wallet in this version.
- **Simple config** — No RPC rotation, blacklist, or auto-redemption in v2; those may appear in later versions.

Start small, monitor your positions, and keep your private key secure.

---

## Key Features (This Version)

| Feature | What it does |
|--------|----------------|
| **Trade monitor** | Fetches the target wallet’s activity on a timer, keeps your MongoDB in sync so you don’t miss trades after restarts. |
| **Trade executor** | Reads pending trades from MongoDB, compares your positions vs the target’s, checks balances, and places orders on your wallet. |
| **MongoDB history** | Stores activities and positions per wallet so the bot can resume and retry without re-fetching everything. |
| **Retry logic** | Copies that fail (e.g. network) are retried up to `RETRY_LIMIT` times so temporary errors don’t drop trades. |
| **Order age filter** | Ignores trades older than `TOO_OLD_TIMESTAMP` (hours) so you only copy recent, relevant orders. |
| **Official CLOB client** | Uses `@polymarket/clob-client` and your private key to sign and submit orders correctly. |
| **Configurable timing** | `FETCH_INTERVAL` (seconds) controls how often the monitor runs; tune for speed vs API load. |

---

## How It Works

1. **Start the bot** — It connects to MongoDB and the Polymarket CLOB using your `.env`.
2. **Monitor** — On a loop, it fetches the target wallet’s activity and updates MongoDB.
3. **Execute** — In parallel, it reads pending trades from MongoDB and places matching orders on your wallet (with balance and position checks).
4. **Retry** — Failed executions are retried according to `RETRY_LIMIT`.

You need: the **target wallet address** to copy, **your Polymarket wallet** (and its private key), **MongoDB**, and a **Polygon RPC** URL. Your wallet must hold USDC on Polygon to place orders.

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Polygon RPC** — e.g. [Infura](https://infura.io), [Alchemy](https://www.alchemy.com)
- **Wallets** — The Polymarket wallet you want to copy, and your own wallet (with USDC on Polygon) that will execute copies

---

## Installation

1. **Clone and enter the project**

   ```bash
   git clone https://github.com/OnChainMee/polymarket-copy-trading-bot.git
   cd polymarket-copy-trading-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root (see [Configuration](#configuration)).

4. **Build and run**

   ```bash
   npm run build
   npm start
   ```

**Development (with ts-node):**

```bash
npm run dev
```

---

## Configuration

Create a `.env` file in the project root. Do **not** commit `.env` or share keys.

| Variable | Required | Description | Example / default |
|----------|----------|-------------|-------------------|
| `USER_ADDRESS` | Yes | Polymarket wallet address to **copy** | `0x...` |
| `PROXY_WALLET` | Yes | **Your** Polymarket wallet (executes copies) | `0x...` |
| `PRIVATE_KEY` | Yes | Private key for `PROXY_WALLET` (no `0x` prefix) | — |
| `CLOB_HTTP_URL` | Yes | Polymarket CLOB API base URL | `https://clob.polymarket.com/` |
| `CLOB_WS_URL` | Yes | Polymarket CLOB WebSocket URL | `wss://ws-subscriptions-clob.polymarket.com/ws` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `RPC_URL` | Yes | Polygon mainnet RPC URL | `https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `USDC_CONTRACT_ADDRESS` | Yes | USDC on Polygon | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| `FETCH_INTERVAL` | No | Poll interval in **seconds** | `1` |
| `TOO_OLD_TIMESTAMP` | No | Ignore orders older than this (**hours**) | `24` |
| `RETRY_LIMIT` | No | Max retries per execution | `3` |

**Example `.env`** (replace placeholders; never commit real keys):

```env
USER_ADDRESS=0xTargetTraderAddress
PROXY_WALLET=0xYourPolymarketWallet
PRIVATE_KEY=your_private_key_no_0x_prefix

CLOB_HTTP_URL=https://clob.polymarket.com/
CLOB_WS_URL=wss://ws-subscriptions-clob.polymarket.com/ws

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/your_db
RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

FETCH_INTERVAL=1
TOO_OLD_TIMESTAMP=24
RETRY_LIMIT=3
```

---

## Usage

- **Production:** `npm run build` then `npm start`
- **Development:** `npm run dev`

On startup the bot connects to MongoDB, then starts the **trade monitor** (target wallet) and **trade executor** (your wallet). Ensure your proxy wallet has USDC on Polygon so orders can be placed.

---

## Geographic Restrictions

Polymarket may restrict access from some regions. If you hit IP-based blocks:

- Run the bot from a supported region (e.g. VPS in the Netherlands or another allowed location).
- Use a low-latency provider close to Polymarket’s infrastructure if you care about execution speed.

This project does not endorse any specific VPS provider. Choose a host that meets your legal and performance needs.

---

## Contributing

Contributions are welcome. Open an issue to discuss larger changes, then submit a pull request. If you find the project useful, consider giving it a star.

## License

ISC — see [package.json](package.json) for details.

## Contact

For questions or updates: [Telegram](https://t.me/OnChainMee).
