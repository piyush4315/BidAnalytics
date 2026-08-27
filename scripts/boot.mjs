import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

await run("npx", ["tsx", "prisma/seed.ts"]);
await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", String(port)]);
