import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(projectRoot, ".env");

if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  schema: path.resolve(projectRoot, "prisma/schema.prisma"),
  migrations: {
    path: path.resolve(projectRoot, "prisma/migrations"),
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
