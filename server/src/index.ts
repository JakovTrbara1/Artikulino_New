import { createPrototypeApp } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);
const { app, database } = createPrototypeApp();
const server = app.listen(port, () => {
  console.log(`Artikulino prototype server: http://localhost:${port}`);
});

function shutdown(): void {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
