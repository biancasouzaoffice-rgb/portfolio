const { app } = require("./app");
const { env } = require("./config/env");
const { initDb, ensureAdmin } = require("./db/init");

async function bootstrap() {
  await initDb();
  await ensureAdmin();

  app.listen(env.port, () => {
    console.log(`API executando em http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar servidor:", error);
  process.exit(1);
});
