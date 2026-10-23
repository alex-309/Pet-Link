# Pawlyglot

A demo app for a fictional smart pet collar: live location, heart rate and activity tracking, logs, and a just-for-fun pet translator that reads your pet's made-up thoughts out loud in seven languages.

> **Everything is simulated.** The app isn't connected to any device. Locations, health readings and translations are generated for demonstration. They are not real, medical or veterinary information.

## Run it

There's nothing to install or build.

- **Quickest:** open `index.html` in Chrome, Edge, Safari or Firefox.
- **Recommended:** run a small local server from this folder, which also enables offline mode and "Install app":
  ```sh
  python3 -m http.server 8000
  ```
  Then open <http://localhost:8000>.
- **Phone or tablet:** keep the server running, connect the device to the same Wi-Fi, and open `http://<your-computer's-IP>:8000`.

## What's in the demo

| Page | What it shows |
|---|---|
| Home | Every pet at a glance: live heart rate, activity, location, latest translation and a translator switch |
| Map | An illustrated neighborhood with each collar's position and recent path, a resizable safe zone, alerts when a pet leaves it on its own, and **Ping collar** |
| Health | Live heart rate with an ECG-style trace and the usual resting range, today's distance, steps, active time, sleep, temperature and breathing, plus 5-minute, 1-hour and 12-hour history |
| Translator | The collar's voice box: power, volume and mute, language (English, Spanish, French, German, Italian, Portuguese, Japanese), voice style, **Listen now**, replay and a speaker test |
| Logs | Thoughts and feelings plus activity (walks, meals, naps, location, health and collar events), with filters, search, your own entries, and CSV or JSON export |
| Settings | Manage up to six pets, theme, animation, units, demo options, data, and the legal notes |

## Presenting tips

- **Demo controls** (top bar) make a pet sleep, eat, walk, play or run, say something on cue, wander past the safe zone, get spooked (heart rate jumps) or drain the battery. You can also speed the simulation up to 4×.
- **Quiet mode** (speaker icon) silences every voice box. Translations still appear as text.
- **Pause** (pause icon) freezes all live data.
- Browsers only allow sound after the first click or tap on the page.
- On iPhone and iPad, speech always follows the device volume; the in-app slider can't change it there.

## Project structure

```
index.html            App shell, navigation and icon set
css/styles.css        Design tokens (top of file), layout, components, light and dark themes
js/config.js          App name, species, activities, moods, languages, the fictional map
js/phrases.js         The invented translations in all seven languages
js/sim.js             The simulated collar: activity, GPS, heart rate, battery, translations
js/store.js           Pets, settings and logs, saved in this browser
js/voice.js           Text-to-speech and generated sounds
js/map.js, charts.js  The illustrated map and the charts
js/ui.js, dialogs.js  Shared components and dialogs
js/views/             One file per page
js/app.js             Routing and wiring
sw.js                 Offline support
```

## Accessibility

Built to meet WCAG 2.2 AA: landmarks and headings, full keyboard support, visible focus, screen-reader labels and announcements, at least 4.5:1 text contrast in both themes, status never shown by color alone, reduced-motion support, pausable live data, and table or text versions of the map and every chart. Automated checks with axe-core report no violations at phone and desktop sizes in both themes. It hasn't been audited by a third party, so test with real users and assistive technology before a public launch.

## Privacy and legal notes

- **Name.** "Pawlyglot" is a working name. The app isn't called Pet-Link because **PetLink is a registered trademark of Datamars, Inc.** for a pet microchip registry and lost-pet recovery service, which overlaps with a pet-tracking product. A web search found no app named Pawlyglot, but several pet apps use "Pawly". Get a proper trademark search before using any name publicly. To rename the app, change `APP_NAME` in `js/config.js`, the `<title>` and both brand `aria-label`s in `index.html`, `manifest.webmanifest` and this README.
- **No data collection.** No accounts, analytics, cookies or third-party requests. Pets, settings and logs stay in the browser's local storage. Settings → Data and privacy can export or delete them.
- **Not a medical device, and the translations are fiction.** Disclaimers appear on first launch, on the Health and Translator pages, and in Settings → About and legal.
- **Assets.** All illustrations, icons and the map were made for this project; no map service is used. Typeface: Inter, under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
- **Speech** uses the device's built-in voices. If a language has no voice installed, some browsers fall back to an online voice from the browser maker.
