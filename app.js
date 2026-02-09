import { buildScreen } from "./renderer.js";

const screenLines = [
  "                 ASCII WEATHER                  ",
  "------------------------------------------------",
  "                                                ",
  "                 .--.                           ",
  "              .-(    ).                         ",
  "             (___.__)__)                        ",
  "                                                ",
  "            _-_-_-_-_-_-_-_-_-_-_-_-_           ",
  "             _-_-_-_-_-_-_-_-_-_-_-_-_          ",
  "            _-_-_-_-_-_-_-_-_-_-_-_-_           ",
  "             _-_-_-_-_-_-_-_-_-_-_-_-_          ",
  "                                                ",
  "                                                ",
  "                 TEMP:  +03 C                   ",
  "                                                ",
  "                 CITY:  BERLIN                  ",
  "                                                ",
  "------------------------------------------------",
  "  updated: 12:34   wind: 3 m/s   hum: 86%       ",
  "------------------------------------------------",
  "  [R] refresh     [L] location     [A] about    ",
  "                                                ",
  "  tip: add to home screen for full PWA vibe     ",
  "                                                ",
  "                                                ",
  "                                                ",
  "                                                ",
  "                                                "
];

const screen = document.getElementById("screen");
if (screen) {
  const screenText = buildScreen(screenLines);
  screen.textContent = screenText;

  const lines = screenText.split("\n");
  const lengths = new Set(lines.map((line) => line.length));
  console.log("ASCII screen check:", lines.length, Array.from(lengths));
  if (lines.length !== 30) {
    console.warn("ASCII screen height mismatch:", lines.length);
  }
  lines.forEach((line, index) => {
    if (line.length !== 50) {
      console.warn("ASCII screen width mismatch at line", index + 1, "len:", line.length);
    }
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
