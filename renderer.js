const CONTENT_WIDTH = 48;
const CONTENT_HEIGHT = 28;
const FULL_WIDTH = 50;
const FULL_HEIGHT = 30;

function padLine(str, width) {
  const safe = String(str);
  if (safe.length >= width) {
    return safe.slice(0, width);
  }
  return safe + " ".repeat(width - safe.length);
}

function frameLine(content48) {
  return "|" + content48 + "|";
}

function normalizeLines(lines, width, height) {
  const normalized = Array.isArray(lines) ? lines.slice(0, height) : [];
  while (normalized.length < height) {
    normalized.push("");
  }
  return normalized.map((line) => padLine(line, width));
}

function buildScreen(lines48x28) {
  const lines = normalizeLines(lines48x28, CONTENT_WIDTH, CONTENT_HEIGHT);

  const framed = [];
  framed.push("+" + "-".repeat(CONTENT_WIDTH) + "+");
  for (let i = 0; i < CONTENT_HEIGHT; i += 1) {
    framed.push(frameLine(padLine(lines[i], CONTENT_WIDTH)));
  }
  framed.push("+" + "-".repeat(CONTENT_WIDTH) + "+");
  const full = normalizeLines(framed, FULL_WIDTH, FULL_HEIGHT);
  return full.join("\n");
}

export { padLine, frameLine, normalizeLines, buildScreen };
