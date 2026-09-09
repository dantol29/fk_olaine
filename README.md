This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying on cPanel

This app is deployed via cPanel's "Setup Node.js App" (Phusion Passenger), running `next start` as a persistent process — not a static export or serverless functions. Two things need somewhere to live outside the deployed app folder so a redeploy never wipes them:

- **Database** (`TURSO_DATABASE_URL`) — a local SQLite file works fine (no Turso account needed) since the process is long-running. Point it at an absolute path in a sibling folder, e.g. `file:/home/youruser/fk_olaine-data/app.db`; the parent directory is created automatically on startup if missing. Leave `TURSO_AUTH_TOKEN` empty. Back the file up yourself (e.g. a cPanel cron job copying it out on a schedule) — a local file has no built-in replication. See `.env.example` for the full comment.
- **Uploaded photos** (`UPLOADS_DIR`) — same idea: an absolute path outside the app folder, ideally inside `public_html/` so Apache/LiteSpeed can serve the files directly. See `.env.example`.

Set both env vars (plus `SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`) in the Node.js App's environment variable UI, then run `npm run db:push` once against production to create the schema.
