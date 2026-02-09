import { buildScreen, padLine } from "./renderer.js";

const CONTENT_WIDTH = 48;
const CITY_STORAGE_KEY = "ascii-weather-city";

function centerLine(text, width) {
  const safe = String(text || "");
  if (safe.length >= width) {
    return safe.slice(0, width);
  }
  const totalPadding = width - safe.length;
  const left = Math.floor(totalPadding / 2);
  const right = totalPadding - left;
  return " ".repeat(left) + safe + " ".repeat(right);
}

function buildLines(cityName) {
  const city = cityName && cityName.length > 0 ? cityName : "UNKNOWN";
  const hr = "-".repeat(CONTENT_WIDTH);

  return [
    centerLine("ASCII WEATHER", CONTENT_WIDTH),
    hr,
    " ".repeat(CONTENT_WIDTH),
    centerLine(".--.", CONTENT_WIDTH),
    centerLine(".-(    ).", CONTENT_WIDTH),
    centerLine("(___.__)__)", CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    centerLine("TEMP:  +03 C", CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    centerLine("CITY:  " + city, CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    hr,
    padLine("  updated: 12:34   wind: 3 m/s   hum: 86%", CONTENT_WIDTH),
    hr,
    padLine("  [R] refresh     [L] location     [A] about", CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    padLine("  tip: add to home screen for full PWA vibe", CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH),
    " ".repeat(CONTENT_WIDTH)
  ];
}

function renderScreen(lines) {
  const screen = document.getElementById("screen");
  if (!screen) {
    return;
  }
  const screenText = buildScreen(lines);
  screen.textContent = screenText;

  const renderedLines = screenText.split("\n");
  const lengths = new Set(renderedLines.map((line) => line.length));
  console.log("ASCII screen check:", renderedLines.length, Array.from(lengths));
  if (renderedLines.length !== 30) {
    console.warn("ASCII screen height mismatch:", renderedLines.length);
  }
  renderedLines.forEach((line, index) => {
    if (line.length !== 50) {
      console.warn("ASCII screen width mismatch at line", index + 1, "len:", line.length);
    }
  });
}

function saveCity(city) {
  if (!city) {
    return;
  }
  try {
    localStorage.setItem(CITY_STORAGE_KEY, city);
  } catch (error) {
    // ignore storage errors
  }
}

function loadCity() {
  try {
    return localStorage.getItem(CITY_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function sanitizeCityName(value) {
  const raw = String(value || "");
  return raw.replace(/\s+/g, " ").trim();
}

function reverseGeocode(lat, lon) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
    encodeURIComponent(lat) +
    "&lon=" +
    encodeURIComponent(lon);

  return fetch(url)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || !data.address) {
        return "";
      }
      const address = data.address;
      return (
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.municipality ||
        address.county ||
        ""
      );
    })
    .catch(() => "");
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("geolocation unsupported"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

const initialCity = loadCity() || "BERLIN";
renderScreen(buildLines(initialCity));

requestLocation()
  .then((position) => reverseGeocode(position.coords.latitude, position.coords.longitude))
  .then((city) => {
    const normalized = sanitizeCityName(city);
    if (normalized.length === 0) {
      return;
    }
    saveCity(normalized);
    renderScreen(buildLines(normalized));
  })
  .catch(() => {
    // keep existing city if user denies or request fails
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
