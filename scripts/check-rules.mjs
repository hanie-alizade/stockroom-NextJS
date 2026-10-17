// Cheap, deterministic repo rules that do not need an AI reviewer.
// Zero dependencies. Run via `npm run check:rules` (part of `npm run check`).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const EXTENSIONS = new Set([".ts", ".tsx"]);

// Files that are allowed to define raw colors (theme sources only).
const COLOR_ALLOWED = [/globals\.css$/, /tailwind\.config\./];

const RULES = [
  {
    name: "no raw hex colors in components (use theme tokens)",
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    appliesTo: (file) => /\.(tsx)$/.test(file) && !COLOR_ALLOWED.some((r) => r.test(file)),
  },
  {
    name: "no ts-ignore",
    pattern: /@ts-ignore/,
    appliesTo: () => true,
  },
  {
    name: "no console.log (use a proper error path)",
    pattern: /console\.log\(/,
    appliesTo: (file) => !/\.test\.tsx?$/.test(file),
  },
  {
    name: "no float math on money: use *Sen integers",
    pattern: /(unitCost|price|cost)\w*\s*\*\s*100\b|parseFloat\(/,
    appliesTo: (file) => !/\.test\.tsx?$/.test(file),
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(full))) yield full;
  }
}

let failures = 0;
try {
  for (const file of walk(ROOT)) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (const rule of RULES) {
      if (!rule.appliesTo(file)) continue;
      lines.forEach((line, i) => {
        if (rule.pattern.test(line)) {
          failures += 1;
          console.error(`${file.replace(ROOT, "src")}:${i + 1}  ${rule.name}`);
        }
      });
    }
  }
} catch (error) {
  if (error && error.code === "ENOENT") {
    console.log("check-rules: no src folder yet, skipping");
    process.exit(0);
  }
  throw error;
}

if (failures > 0) {
  console.error(`\ncheck-rules: ${failures} problem(s)`);
  process.exit(1);
}
console.log("check-rules: ok");
