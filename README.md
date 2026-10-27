# Pet-Link

A demo app for a fictional smart pet collar: live location, heart rate and activity tracking, logs, and a just-for-fun pet translator. You can talk to your pet and hear it answer, or listen in on its made-up thoughts, out loud in seven languages. The whole app is available in the same seven languages.

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
| Translator | A conversation with your pet: type, tap a suggestion or use the microphone, and it answers out loud. **Listen in** hears what it's thinking. Also the collar's voice box: power, volume and mute, language (English, Spanish, French, German, Italian, Portuguese, Japanese), voice, voice style and a speaker test |
| Logs | Thoughts and feelings plus activity (walks, meals, naps, location, health and collar events), with filters, search, your own entries, and CSV or JSON export |
| Settings | Manage up to six pets (dogs, cats, rabbits, birds, hamsters, horses and turtles), app language, theme, animation, units, demo options, the language you speak to your pets, data, and the legal notes |

## Talking to your pet

On the Translator page, say something to the selected pet. Your words play through its collar as its own made-up animal sounds (barks for a dog, meows for a cat, chirps for a bird, and so on), shown under what you said, and then it answers. It understands greetings, walks, food, play, bedtime, baths and vet visits, praise, scolding and "How are you?" in all seven languages, and answers in a way that suits its species and mood. Anything else gets a playful answer anyway. Replies are always in the pet's translator language, so you can ask in English and hear the answer in French. Every exchange is saved in Logs with what you said.

- **Typing** works in every browser.
- **The microphone** works in Chrome, Edge and Safari. Firefox doesn't support speech recognition, so the button is hidden there. Pet-Link asks before using it the first time. It listens in the app's language unless you pick another in Settings → Talking to pets.

## Languages

The globe button in the top bar switches the whole app between English, Spanish, French, German, Italian, Portuguese and Japanese. The same choice is in Settings → Language and appearance and on the welcome screen. On first visit the app follows the browser's language. Changing it also changes the quick phrases, the language the microphone listens for, and the default translator language for new pets. Each pet keeps speaking its own translator language.

Interface text is written in English and looked up with `t('English text')`. The translations live in `js/i18n/<language>.js`, keyed by that English text; anything missing falls back to English. When you add or change interface text, add the same key to all six language files. Log entries are stored in English and translated when shown, so changing language also changes older entries.

## Voices

Pets speak with the text-to-speech voices on your device. Each pet's voice box has a **Voice** menu that lists the voices for its language.

If a language has no voice on the device, French on some computers for example, the voice box says so, shows how to add one on that kind of device, and speaks the same line in a language that does have a voice until you add it. The text still appears in the original language. After adding a voice, reload the page.

## Presenting tips

- **Demo controls** (top bar) make a pet sleep, eat, walk (dogs and horses), play or run, say something on cue, wander past the safe zone, get spooked (heart rate jumps) or drain the battery. You can also speed the simulation up to 4×.
- **Quiet mode** (speaker icon) silences every voice box. Translations still appear as text.
- **Pause** (pause icon) freezes all live data. On phones it's in Demo controls and Settings.
- **Globe** switches the app's language.
- **Sun/moon** switches between the light "day at the park" theme and the dark "evening walk" theme. Settings also has a "Match device" option.
- Browsers only allow sound after the first click or tap on the page.
- On iPhone and iPad, speech always follows the device volume; the in-app slider can't change it there.

## Project structure

```
index.html            App shell, navigation and icon set
css/styles.css        Design tokens (top of file), layout, components, light and dark themes
js/config.js          App name, species, activities, moods, languages, the fictional map
js/i18n.js            The app's language: looks up interface text, dates and numbers
js/i18n/              Interface text in Spanish, French, German, Italian, Portuguese and Japanese
js/phrases.js         The invented translations in all seven languages
js/talk.js            Understands what you say to a pet and picks its answer
js/petsounds.js       Plays what you say as the pet's own synthesized animal sounds
js/avatars.js         The pet illustrations
js/sim.js             The simulated collar: activity, GPS, heart rate, battery, translations
js/store.js           Pets, settings and logs, saved in this browser
js/voice.js           Text-to-speech, voice choice, speech recognition and generated sounds
js/map.js, charts.js  The illustrated map and the charts
js/ui.js, dialogs.js  Shared components and dialogs
js/util.js            Small helpers: formatting, storage, files
js/views/             One file per page
js/app.js             Routing and wiring
sw.js                 Offline support
```

## Accessibility

Built to meet WCAG 2.2 AA: landmarks and headings, full keyboard support, visible focus, screen-reader labels and announcements, at least 4.5:1 text contrast in both themes, status never shown by color alone, reduced-motion support, pausable live data, and table or text versions of the map and every chart. Automated checks with axe-core report no violations at phone and desktop sizes in both themes. It hasn't been audited by a third party, so test with real users and assistive technology before a public launch.

## Privacy and legal notes

- **Name.** Before launching publicly, run a trademark search on "Pet-Link": "PetLink" is a registered trademark of Datamars, Inc. for a pet microchip registry and lost-pet recovery service. The name is set by `APP_NAME` in `js/config.js`, plus the `<title>` and both brand `aria-label`s in `index.html`, `manifest.webmanifest` and this README.
- **No data collection.** No accounts, analytics, cookies or third-party requests. Pets, settings and logs stay in the browser's local storage. Settings → Data and privacy can export or delete them.
- **Not a medical device, and the translations are fiction.** Disclaimers appear on first launch, on the Health and Translator pages, and in Settings → About and legal.
- **Assets.** All illustrations, icons and the map were made for this project; no map service is used. Typefaces: Inter and Fredoka, both under the SIL Open Font License 1.1 (license texts in `assets/fonts/`).
- **Speech** uses the device's built-in voices. If a language has no voice installed, some browsers fall back to an online voice from the browser maker, which receives the text being spoken.
- **Microphone.** It's used only when someone taps it, after a one-time consent prompt. The browser's speech recognition turns speech into text, and some browsers (Chrome, for example) send the audio to their maker to do that. Pet-Link doesn't record or keep audio. The privacy text in Settings → About and legal says the same.
