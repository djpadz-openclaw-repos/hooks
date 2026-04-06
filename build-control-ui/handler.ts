import { execSync } from "child_process";
import { existsSync, cpSync, rmSync } from "fs";
import { join } from "path";

export const metadata = {
  openclaw: {
    emoji: "🔨",
    events: ["gateway:startup"],
  },
};

export async function handler() {
  // Find the openclaw package root
  const openclaw = require.resolve("openclaw/package.json");
  const pkgRoot = openclaw.replace("/package.json", "");
  const controlUiDist = join(pkgRoot, "dist", "control-ui", "index.html");

  if (existsSync(controlUiDist)) {
    // Already present, nothing to do
    return;
  }

  console.log("[build-control-ui] Control UI missing — rebuilding...");

  // Get installed version
  const pkg = require(join(pkgRoot, "package.json"));
  const version = pkg.version;
  const tag = `v${version}`;
  const srcDir = `/tmp/openclaw-ui-build-${version}`;
  const destDir = join(pkgRoot, "dist", "control-ui");

  try {
    // Find pnpm
    const pnpm = (() => {
      try { return execSync("which pnpm", { encoding: "utf8" }).trim(); } catch {}
      try { return execSync("npm exec --yes -- pnpm --version && npm exec -- which pnpm", { encoding: "utf8" }).trim(); } catch {}
      // Install pnpm if missing
      execSync("npm install -g pnpm", { stdio: "inherit" });
      return execSync("which pnpm", { encoding: "utf8" }).trim();
    })();

    // Clone source at the matching tag (shallow)
    if (!existsSync(srcDir)) {
      execSync(
        `git clone --depth 1 --branch ${tag} https://github.com/openclaw/openclaw.git ${srcDir}`,
        { stdio: "inherit" }
      );
    }

    // Install deps and build UI
    execSync(`${pnpm} install`, { cwd: srcDir, stdio: "inherit" });
    execSync(`${pnpm} ui:build`, { cwd: srcDir, stdio: "inherit" });

    // Copy built assets into the installed package
    const builtDir = join(srcDir, "dist", "control-ui");
    if (!existsSync(builtDir)) {
      throw new Error(`Build succeeded but output not found at ${builtDir}`);
    }
    cpSync(builtDir, destDir, { recursive: true });

    console.log("[build-control-ui] ✅ Control UI built and installed successfully.");
  } catch (err) {
    console.error("[build-control-ui] ❌ Failed to build Control UI:", err);
  } finally {
    // Clean up source clone
    if (existsSync(srcDir)) {
      try { rmSync(srcDir, { recursive: true, force: true }); } catch {}
    }
  }
}
