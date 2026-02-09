import { buildScreen, padLine } from "./renderer.js";

const CONTENT_WIDTH = 48;
const CITY_STORAGE_KEY = "ascii-weather-city";
const TEMP_STORAGE_KEY = "ascii-weather-temp";
const TEMP_LABEL_COL = 17;
const DEFAULT_TEMP = "+03 C";
const OPEN_METEO_CURRENT_PARAMS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "weather_code",
  "cloud_cover",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "is_day"
].join(",");

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

function placeAt(baseLine, text, col, width) {
  const safeBase = padLine(baseLine, width);
  if (!text) {
    return safeBase;
  }
  const safeText = String(text);
  if (col >= width) {
    return safeBase;
  }
  const prefix = safeBase.slice(0, col);
  const suffixStart = Math.min(width, col + safeText.length);
  const suffix = safeBase.slice(suffixStart);
  return padLine(prefix + safeText, width).slice(0, width - suffix.length) + suffix;
}

function toAsciiUpper(value) {
  const raw = String(value || "");
  const deaccented = raw.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const upper = deaccented.toUpperCase();
  const asciiOnly = upper.replace(/[^A-Z0-9 ]/g, " ");
  return asciiOnly.replace(/\s+/g, " ").trim();
}

function formatTempC(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return DEFAULT_TEMP;
  }
  const rounded = Math.round(num);
  const sign = rounded >= 0 ? "+" : "-";
  const absValue = Math.abs(rounded);
  const padded = absValue < 10 ? "0" + absValue : String(absValue);
  return sign + padded + " C";
}

function buildLines(cityName, tempValue) {
  const city = toAsciiUpper(cityName) || "UNKNOWN";
  const temp = String(tempValue || DEFAULT_TEMP);
  const hr = "-".repeat(CONTENT_WIDTH);
  const empty = " ".repeat(CONTENT_WIDTH);

  let tempLine = empty;
  tempLine = placeAt(tempLine, "TEMP:", TEMP_LABEL_COL, CONTENT_WIDTH);
  tempLine = placeAt(tempLine, "  " + temp, TEMP_LABEL_COL + 5, CONTENT_WIDTH);

  let cityLine = empty;
  cityLine = placeAt(cityLine, "CITY:", TEMP_LABEL_COL, CONTENT_WIDTH);
  cityLine = placeAt(cityLine, "  " + city, TEMP_LABEL_COL + 5, CONTENT_WIDTH);

  return [
    centerLine("ASCII WEATHER", CONTENT_WIDTH),
    hr,
    empty,
    centerLine(".--.", CONTENT_WIDTH),
    centerLine(".-(    ).", CONTENT_WIDTH),
    centerLine("(___.__)__)", CONTENT_WIDTH),
    empty,
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    centerLine("_-_-_-_-_-_-_-_-_-_-_-_-_", CONTENT_WIDTH),
    empty,
    empty,
    tempLine,
    empty,
    cityLine,
    empty,
    hr,
    padLine("  updated: 12:34   wind: 3 m/s   hum: 86%", CONTENT_WIDTH),
    hr,
    padLine("  [R] refresh     [L] location     [A] about", CONTENT_WIDTH),
    empty,
    padLine("  tip: add to home screen for full PWA vibe", CONTENT_WIDTH),
    empty,
    empty,
    empty,
    empty,
    empty
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

function bindLocationHotkeys() {
  const screen = document.getElementById("screen");
  if (screen) {
    screen.addEventListener("click", () => {
      refreshLocation();
    });
    screen.addEventListener("touchend", () => {
      refreshLocation();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "l" || event.key === "L") {
      event.preventDefault();
      refreshLocation();
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

function saveTemp(temp) {
  if (!temp) {
    return;
  }
  try {
    localStorage.setItem(TEMP_STORAGE_KEY, String(temp));
  } catch (error) {
    // ignore storage errors
  }
}

function loadTemp() {
  try {
    return localStorage.getItem(TEMP_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function sanitizeCityName(value) {
  return toAsciiUpper(value);
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

function fetchWeather(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    encodeURIComponent(lat) +
    "&longitude=" +
    encodeURIComponent(lon) +
    "&current=" +
    encodeURIComponent(OPEN_METEO_CURRENT_PARAMS) +
    "&temperature_unit=celsius&wind_speed_unit=ms&precipitation_unit=mm&timezone=auto";

  return fetch(url)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || !data.current) {
        return null;
      }
      return data.current;
    })
    .catch(() => null);
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

let isLocating = false;
let currentCity = loadCity() || "BERLIN";
let currentTemp = loadTemp() || DEFAULT_TEMP;

function refreshLocation() {
  if (isLocating) {
    return;
  }
  isLocating = true;
  renderScreen(buildLines("LOCATING...", currentTemp));
  requestLocation()
    .then((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      return Promise.allSettled([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
    })
    .then((results) => {
      const cityResult = results[0];
      if (cityResult && cityResult.status === "fulfilled") {
        const normalized = sanitizeCityName(cityResult.value);
        if (normalized.length > 0) {
          currentCity = normalized;
          saveCity(normalized);
        }
      }

      const weatherResult = results[1];
      if (weatherResult && weatherResult.status === "fulfilled" && weatherResult.value) {
        const nextTemp = formatTempC(weatherResult.value.temperature_2m);
        currentTemp = nextTemp;
        saveTemp(nextTemp);
      }

      renderScreen(buildLines(currentCity, currentTemp));
    })
    .catch(() => {
      renderScreen(buildLines(currentCity, currentTemp));
    })
    .finally(() => {
      isLocating = false;
    });
}

renderScreen(buildLines(currentCity, currentTemp));

refreshLocation();
bindLocationHotkeys();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
