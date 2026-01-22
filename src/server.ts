import { createApp } from "./app.js";
import { initStore } from "./data/store.js";

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  await initStore();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});