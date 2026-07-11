import { loadKb } from "../src/kb.js";

const KB_DIR = "kb";
const DEFAULT_DAYS = 90;

function parseDaysArg(argv: string[]): number {
  const idx = argv.indexOf("--days");
  if (idx === -1 || idx === argv.length - 1) return DEFAULT_DAYS;
  const parsed = Number(argv[idx + 1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAYS;
}

function daysSince(isoDate: string, now: Date): number {
  const then = new Date(isoDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((now.getTime() - then.getTime()) / msPerDay);
}

function main() {
  const days = parseDaysArg(process.argv.slice(2));
  const now = new Date();
  const entries = loadKb(KB_DIR);

  const stale = entries
    .filter((e) => daysSince(e.last_verified, now) > days)
    .sort((a, b) => a.last_verified.localeCompare(b.last_verified));

  for (const e of stale) {
    console.log(`STALE ${e.name} ${e.last_verified} ${e.source_url}`);
  }

  console.log("");
  console.log(`${stale.length}/${entries.length} entries stale (last_verified older than ${days} days)`);

  process.exit(0);
}

main();
