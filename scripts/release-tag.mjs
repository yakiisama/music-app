import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

function runGit(args, { capture = false } = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout?.trim() ?? "";
}

function main() {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  const inputVersion = process.argv[2]?.trim();
  const version = inputVersion || packageJson.version;

  if (!version) {
    console.error("无法读取版本号，请传入版本参数，例如: pnpm run release:tag -- 0.1.0");
    process.exit(1);
  }

  const tag = version.startsWith("v") ? version : `v${version}`;

  runGit(["rev-parse", "--is-inside-work-tree"], { capture: true });

  const statusOutput = runGit(["status", "--porcelain"], { capture: true });
  if (statusOutput) {
    console.error("工作区不干净，请先提交或清理改动后再发布。");
    process.exit(1);
  }

  const remoteName = runGit(["remote"], { capture: true })
    .split("\n")
    .find((name) => name.trim().length > 0);

  if (!remoteName) {
    console.error("未找到 git remote，请先配置远端仓库。");
    process.exit(1);
  }

  const localTag = runGit(["tag", "--list", tag], { capture: true });
  if (localTag === tag) {
    console.error(`本地 tag 已存在: ${tag}`);
    process.exit(1);
  }

  const remoteTag = runGit(["ls-remote", "--tags", remoteName, tag], { capture: true });
  if (remoteTag) {
    console.error(`远端 tag 已存在: ${tag}`);
    process.exit(1);
  }

  const headCommit = runGit(["rev-parse", "--short", "HEAD"], { capture: true });
  console.log(`准备发布 ${tag}（commit ${headCommit}）`);

  runGit(["tag", "-a", tag, "-m", `Release ${tag}`]);
  runGit(["push", remoteName, tag]);

  console.log(`已推送 ${tag}，Release workflow 应该已开始执行。`);
}

main();
