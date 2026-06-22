import "dotenv/config";
import { defineConfig } from "prisma/config";

// Para migrations usa DIRECT_URL (sem pgbouncer)
// Para runtime usa DATABASE_URL (com pgbouncer/pooler)
const migrationUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
