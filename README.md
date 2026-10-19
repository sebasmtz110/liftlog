# Training UI

A standalone strength-training prototype for Sebas. Light screens for browsing, a dark screen for the set you are in. Vanilla HTML, CSS, and JavaScript. No build step, no account, no remote API.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 41791
```

Then visit `http://127.0.0.1:41791`.

## Screens

- **Home** — today's session, the week, and what is next
- **Workouts** — history, templates, and a finished-session summary
- **Progress** — strength trend, top lifts, volume, body notes
- **Library** — search, muscle filters, exercise detail
- **More** — profile, programs, settings, help
- **Workout** — load, reps, log, rest, sequence, finish
- **Movement** — still frame with a timeline Muse can replace

Weights are stored in pounds and can be shown in kilograms from Settings. A session in progress is kept in `localStorage` under `alder-state`.

## Muse

Unzip this project and upload the folder. The prototype is static.

### Motion slot

The active set and the movement screen expose:

```html
<div data-muse-slot="exercise-motion" data-exercise-id="shoulder-press"></div>
```

Mount your own view by assigning this before the page loads, or any time after:

```js
window.ALDER_MOTION_MOUNT = (slot) => {
  const view = document.createElement("canvas");
  view.dataset.exerciseId = slot.dataset.exerciseId;
  slot.append(view);
};
```

While the timeline plays, the page emits:

```js
document.addEventListener("alder:motion", (event) => {
  const { exerciseId, phase, time, duration } = event.detail;
  // phase is "setup", "movement", or "finish"
});
```

Until a source is mounted, the still image stays in the frame. The hero photo uses `data-muse-slot="hero-still"`.

### Replace the photography

Everything visible lives in `assets/`. Swap a file and keep the same name.

| File | Where it shows |
| --- | --- |
| `hero-skyline.jpg` | Dashboard hero |
| `avatar.jpg` | Profile and home |
| `bench-press.jpg` | Bench press, active set |
| `bench-detail.jpg` | Bench press detail |
| `seated-press.jpg` | Seated press movement |
| `better-yesterday.jpg` | Profile card |
| `gym-dark.jpg` | Rest clock background |
| `thumb-*.jpg` | Library rows |

### Tokens

```css
:root {
  --page: #F4F5F2;
  --surface: #FFFFFF;
  --text: #101916;
  --muted: #69746F;
  --border: #DFE4DF;
  --green: #0F706E;
  --workout-bg: #0C1312;
  --workout-surface: #151E1C;
  --mint: #A7F2CF;
}
```

Browsing stays on the light tokens. The workout, rest clock, log pad, and progress screen use the dark ones.
