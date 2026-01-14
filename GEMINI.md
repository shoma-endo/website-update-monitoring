# Website Update Monitoring

## Project Overview
This project is a website update monitoring tool built with Next.js. It allows users to register URLs and CSS selectors to monitor specific parts of a webpage. The system periodically checks these pages, detects content changes by comparing content hashes, and sends notifications via Lark (Feishu).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS
- **Database/Storage**: Lark Base (BitTable)
- **Notification**: Lark Bot
- **Crawling**: Axios + Cheerio
- **Package Manager**: pnpm
- **Tools**: tsx (for scripts), dotenv (for environment variable loading in scripts)

## Architecture
The application is structured as a Next.js application using the App Router.

### Key Directories
- **`src/app/`**: Next.js App Router structure. Contains the frontend UI and API routes.
  - **`api/monitors/`**: CRUD endpoints for monitoring tasks.
  - **`api/cron/`**: Endpoint for triggering the monitoring check (intended for Vercel Cron).
  - **`api/debug/`**: Endpoints for debugging information.
  - **`api/test-extract/`**: Endpoints for testing content extraction.
- **`src/engine/`**: Core logic for monitoring.
  - **`crawler.ts`**: Fetches URL content and extracts text using Cheerio.
  - **`runner.ts`**: Orchestrates the check process: fetches monitors from Lark, crawls, compares hashes, and triggers notifications/updates.
- **`src/lib/`**: Shared libraries.
  - **`lark.ts`**: Client for Lark Open Platform API (Bitable for storage, IM for notifications).
  - **`notification.ts`**: Utility for formatting and sending notifications.
  - **`constants.ts`**: Project-wide constants.
- **`scripts/`**: Utility scripts (e.g., Base field verification).
  - **`verify-lark-base.ts`**: Script to verify and update Lark Base fields and types.

## Data Model (Lark Base)
The application relies on a Lark Base table (Bitable) with the following fields:
- `Label`: Name of the monitor (Text).
- `URL`: Target URL to scrape (Text).
- `Selector`: CSS selector to target specific content (Text).
- `LastHash`: SHA256 hash of the content from the last check (Text).
- `LastChecked`: Timestamp of the last check (DateTime).

## Environment Variables
The application requires the following environment variables (stored in `.env` or `.env.local`):
- `LARK_APP_ID`: Lark App ID.
- `LARK_APP_SECRET`: Lark App Secret.
- `LARK_BASE_URL`: Lark Base URL. Used to automatically extract Base and Table IDs.
- `LARK_NOTIFY_CHAT_ID`: The Chat ID to send notifications to.
- `CRON_SECRET`: Secret for securing the cron API endpoint.

## Development

### Setup
1.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running
1.  Start the development server:
    ```bash
    pnpm dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts
- Verify Lark Base:
  ```bash
  npx tsx scripts/verify-lark-base.ts
  ```

### Building
```bash
pnpm build
```

## Monitoring Logic
The `checkAllMonitors` function in `src/engine/runner.ts` (triggered via `api/cron`) iterates through all records in Lark. For each record:
1.  Fetches the HTML from `URL`.
2.  Extracts text using `Selector`.
3.  Calculates a SHA256 hash.
4.  Compares with `LastHash`.
5.  If different: Updates `LastHash` in Lark and sends a notification to `LARK_NOTIFY_CHAT_ID`.
6.  Updates `LastChecked`.
