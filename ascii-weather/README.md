# ASCII Weather

Simple PWA prototype that renders a static ASCII weather screen. No API yet, no animations.

## Run locally

Option 1:

```bash
python3 -m http.server
```

Option 2:

```bash
npx serve .
```

Then open `http://localhost:8000` (or the URL shown by the server).

## Open on iPhone (same Wi-Fi)

1. Find your computer IP address (for example, `192.168.1.50`).
2. Start the local server as above.
3. On iPhone Safari open `http://<your-ip>:8000`.

## Install to Home Screen

In Safari tap Share -> Add to Home Screen.

## TODO: Add weather API

- Use Yandex Weather API (requires API key; send in header `X-Yandex-Weather-Key` for REST or GraphQL).
- Extract temperature, condition, wind speed, humidity.
- Normalize data to the app state and ASCII scenes.
- Create `weatherProviderYandex.js` module.
- Support city selection or geolocation.
- Add animations for fog/rain/snow/thunder.
