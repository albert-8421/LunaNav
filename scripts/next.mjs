import { spawn } from "node:child_process";
import { resolve } from "node:path";

const nextCli = resolve("node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_USE_SYSTEM_CA: process.env.NODE_USE_SYSTEM_CA ?? "1" },
});

child.on("error", (error) => {
  console.error("Could not start Next.js:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
