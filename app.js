import { buildScreen, padLine } from "./renderer.js";

const CONTENT_WIDTH = 48;
const CITY_STORAGE_KEY = "ascii-weather-city";
const TEMP_STORAGE_KEY = "ascii-weather-temp";
const WIND_STORAGE_KEY = "ascii-weather-wind";
const HUM_STORAGE_KEY = "ascii-weather-hum";
const TEMP_LABEL_COL = 17;
const DEFAULT_TEMP = "-- C";
const DEFAULT_WIND = "-- m/s";
const DEFAULT_HUM = "--%";
const DEFAULT_UPDATED = "--:--";
const LOADING_TEMP = "-- C";
const LOADING_WIND = "-- m/s";
const LOADING_HUM = "--%";
const LOADING_UPDATED = "--:--";
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

const CYRILLIC_MAP = {
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "ZH",
  З: "Z",
  И: "I",
  Й: "Y",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "KH",
  Ц: "TS",
  Ч: "CH",
  Ш: "SH",
  Щ: "SHCH",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "YU",
  Я: "YA"
};

function transliterateCyrillic(input) {
  return input.replace(/[А-ЯЁ]/g, (char) => CYRILLIC_MAP[char] || "");
}

function toAsciiUpper(value) {
  const raw = String(value || "");
  const upper = raw.toUpperCase();
  const cyrillic = transliterateCyrillic(upper);
  const deaccented = cyrillic.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const asciiOnly = deaccented.replace(/[^A-Z0-9 ]/g, " ");
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

function formatWind(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return DEFAULT_WIND;
  }
  const rounded = Math.round(num);
  return String(rounded) + " m/s";
}

function formatHum(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return DEFAULT_HUM;
  }
  const rounded = Math.round(num);
  const clamped = Math.max(0, Math.min(rounded, 100));
  const padded = clamped < 10 ? "0" + clamped : String(clamped);
  return padded + "%";
}

function buildLines(cityName, tempValue, windValue, humValue, updatedValue) {
  const city = toAsciiUpper(cityName) || "-----";
  const temp = String(tempValue || DEFAULT_TEMP);
  const wind = String(windValue || DEFAULT_WIND);
  const hum = String(humValue || DEFAULT_HUM);
  const updated = String(updatedValue || DEFAULT_UPDATED);
  const hr = "-".repeat(CONTENT_WIDTH);
  const empty = " ".repeat(CONTENT_WIDTH);

  let tempLine = empty;
  tempLine = placeAt(tempLine, "TEMP:", TEMP_LABEL_COL, CONTENT_WIDTH);
  tempLine = placeAt(tempLine, "  " + temp, TEMP_LABEL_COL + 5, CONTENT_WIDTH);

  let cityLine = empty;
  cityLine = placeAt(cityLine, "CITY:", TEMP_LABEL_COL, CONTENT_WIDTH);
  cityLine = placeAt(cityLine, "  " + city, TEMP_LABEL_COL + 5, CONTENT_WIDTH);

  return [
    centerLine("URSULA WEATHER", CONTENT_WIDTH),
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
    padLine("  updated: " + updated + "   wind: " + wind + "   hum: " + hum, CONTENT_WIDTH),
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

  lastRenderedLines = screenText.split("\n");
  const lengths = new Set(lastRenderedLines.map((line) => line.length));
  console.log("ASCII screen check:", lastRenderedLines.length, Array.from(lengths));
  if (lastRenderedLines.length !== 30) {
    console.warn("ASCII screen height mismatch:", lastRenderedLines.length);
  }
  lastRenderedLines.forEach((line, index) => {
    if (line.length !== 50) {
      console.warn("ASCII screen width mismatch at line", index + 1, "len:", line.length);
    }
  });
}

function getCharMetrics(pre) {
  if (cachedCharMetrics) {
    return cachedCharMetrics;
  }
  const style = window.getComputedStyle(pre);
  const lineHeight = parseFloat(style.lineHeight) || 1;
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.fontFamily = style.fontFamily;
  probe.style.fontSize = style.fontSize;
  probe.style.fontWeight = style.fontWeight;
  probe.style.letterSpacing = style.letterSpacing;
  document.body.appendChild(probe);
  const charWidth = probe.getBoundingClientRect().width || 1;
  document.body.removeChild(probe);
  cachedCharMetrics = { lineHeight, charWidth };
  return cachedCharMetrics;
}

function getCellFromEvent(pre, event) {
  const rect = pre.getBoundingClientRect();
  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0] && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0] && event.changedTouches[0].clientY) ||
    0;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const metrics = getCharMetrics(pre);
  const col = Math.floor(x / metrics.charWidth);
  const row = Math.floor(y / metrics.lineHeight);
  return { row, col };
}

function isRefreshCell(row, col) {
  if (row < 0 || col < 0 || row >= lastRenderedLines.length) {
    return false;
  }
  const line = lastRenderedLines[row];
  if (!line) {
    return false;
  }
  const label = "[R] refresh";
  const start = line.indexOf(label);
  if (start === -1) {
    return false;
  }
  return col >= start && col < start + label.length;
}

function bindRefreshControls() {
  const screen = document.getElementById("screen");
  if (screen) {
    const handler = (event) => {
      const cell = getCellFromEvent(screen, event);
      if (isRefreshCell(cell.row, cell.col)) {
        refreshLocation();
      }
    };
    screen.addEventListener("click", handler);
    screen.addEventListener("touchend", handler);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
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

function saveWind(wind) {
  if (!wind) {
    return;
  }
  try {
    localStorage.setItem(WIND_STORAGE_KEY, String(wind));
  } catch (error) {
    // ignore storage errors
  }
}

function loadWind() {
  try {
    return localStorage.getItem(WIND_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function saveHum(hum) {
  if (!hum) {
    return;
  }
  try {
    localStorage.setItem(HUM_STORAGE_KEY, String(hum));
  } catch (error) {
    // ignore storage errors
  }
}

function loadHum() {
  try {
    return localStorage.getItem(HUM_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function sanitizeCityName(value) {
  return toAsciiUpper(value);
}

function reverseGeocode(lat, lon) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=" +
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

function formatUpdateTime(value) {
  if (!value) {
    return DEFAULT_UPDATED;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return DEFAULT_UPDATED;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return hours + ":" + minutes;
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
let currentWind = loadWind() || DEFAULT_WIND;
let currentHum = loadHum() || DEFAULT_HUM;
let currentUpdated = DEFAULT_UPDATED;
let locationRequestId = 0;
let lastRenderedLines = [];
let cachedCharMetrics = null;

function refreshLocation() {
  if (isLocating) {
    return;
  }
  isLocating = true;
  locationRequestId += 1;
  const requestId = locationRequestId;
  renderScreen(buildLines("-----", LOADING_TEMP, LOADING_WIND, LOADING_HUM, LOADING_UPDATED));
  const watchdog = setTimeout(() => {
    if (isLocating && requestId === locationRequestId) {
      isLocating = false;
      renderScreen(buildLines(currentCity, currentTemp, currentWind, currentHum, currentUpdated));
    }
  }, 12000);
  requestLocation()
    .then((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      return Promise.allSettled([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
    })
    .then((results) => {
      if (requestId !== locationRequestId) {
        return;
      }
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
        const nextWind = formatWind(weatherResult.value.wind_speed_10m);
        const nextHum = formatHum(weatherResult.value.relative_humidity_2m);
        const nextUpdated = formatUpdateTime(weatherResult.value.time);
        currentTemp = nextTemp;
        currentWind = nextWind;
        currentHum = nextHum;
        currentUpdated = nextUpdated;
        saveTemp(nextTemp);
        saveWind(nextWind);
        saveHum(nextHum);
      }

      renderScreen(buildLines(currentCity, currentTemp, currentWind, currentHum, currentUpdated));
    })
    .catch((error) => {
      if (error && error.code === 1) {
        renderScreen(buildLines("DENIED", currentTemp, currentWind, currentHum, currentUpdated));
      } else {
        renderScreen(buildLines(currentCity, currentTemp, currentWind, currentHum, currentUpdated));
      }
    })
    .finally(() => {
      isLocating = false;
      clearTimeout(watchdog);
    });
}

renderScreen(buildLines(currentCity, currentTemp, currentWind, currentHum, currentUpdated));

refreshLocation();
bindRefreshControls();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
