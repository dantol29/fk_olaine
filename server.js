// Custom Node entry point for cPanel's Node.js Selector (Phusion Passenger),
// which needs a plain script to run rather than the `next start` CLI.
// Passenger sets PORT itself; see node_modules/next/dist/docs/01-app/02-guides/custom-server.md.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server listening on port ${port}`);
  });
});
