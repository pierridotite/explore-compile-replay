/**
 * Counts the lines of the files given as arguments that are neither blank
 * nor comments. Same rule as `spec/adapter-size.ts` (`pnpm size`), which
 * only lists the adapters: the function below is a copy of its `codeLines`.
 *
 *   node paper/scripts/code_lines.ts spec/schema.ts spec/contract.ts
 */
import { readFileSync } from "node:fs";

export function codeLines(source: string): number {
  let inBlock = false;
  let count = 0;
  for (const raw of source.split("\n")) {
    let line = raw.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      inBlock = false;
      line = line.slice(end + 2).trim();
    }
    line = line.replace(/\/\*.*?\*\//g, "").trim();
    const open = line.indexOf("/*");
    if (open !== -1) {
      inBlock = true;
      line = line.slice(0, open).trim();
    }
    if (line !== "" && !line.startsWith("//")) count += 1;
  }
  return count;
}

let total = 0;
for (const file of process.argv.slice(2)) {
  const lines = codeLines(readFileSync(file, "utf8"));
  total += lines;
  console.log(`${String(lines).padStart(5)}  ${file}`);
}
console.log(`${String(total).padStart(5)}  total`);
