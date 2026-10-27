# Natural Sciences Innovation Lab

Static site. No build step, no dependencies to install.

## Running it

**Do not open index.html by double-clicking.** The page loads content with
`fetch()`, and browsers block that on `file://` URLs. You'll get the
"Content failed to load" message.

In VS Code: install the **Live Server** extension, then right-click
`index.html` and choose *Open with Live Server*.

Any static server works if you prefer the terminal:

```
python3 -m http.server 5500
```

then open http://localhost:5500

## Structure

```
index.html            markup only — nav, hero, empty containers
css/styles.css        all styling; design tokens at the top in :root
js/app.js             character field, page transition, routing, templates
data/projects.json    ALL project content — this is the file you edit
assets/ucl.png        logo (replace with the official SVG when you have it)
```

## Adding a project

Open `data/projects.json`. Each year is an object in the `years` array.
Projects render in the order they appear, so put the Best Project winner
first and the Student Choice winner second.

```json
{
  "title": "Project title",
  "award": "Best Project",
  "students": [
    { "name": "Ada Lovelace", "email": "ada.lovelace.24@ucl.ac.uk" },
    { "name": "Second Student", "email": null }
  ],
  "disciplines": ["Physics", "Maths"],
  "abstract": "Two or three sentences.",
  "report": "reports/2025-exoplanets.pdf"
}
```

- `award` — `"Best Project"`, `"Student Choice"`, or `null`
- `email` — `null` if you don't have one; the name still shows
- `disciplines` — must match exactly: `Biology`, `Chemistry`, `Physics`,
  `Maths`, `Earth Science`. Anything else renders without a colour.
- `report` — a path or URL. `null` shows "Report to follow".

## Adding a year

Add a new object to `years`. The menu, the gallery index and the year tabs
all read from this file, so nothing else needs changing.

## Landing page slideshow and timeline

Both live at the top of `data/projects.json`.

- `slides` — each has a `tag` (small label), a `caption`, an `image` and an
  `alt`. With `"image": null` the slide shows a placeholder. To add a photo,
  put it in `assets/slides/` and set `"image": "assets/slides/showcase-2025.jpg"`
  plus a short `alt` description. Landscape photos around 1600×900 work best.
- `timeline` — each step has `when`, `title` and `text`. Steps render in
  order; add or remove as many as you like.

## Other things you might want to change

| What | Where |
|---|---|
| Colours | `:root` at the top of `css/styles.css` |
| Fonts | the Google Fonts `<link>` in `index.html`, plus `--display`/`--serif`/`--sans`/`--mono` |
| Landing headline, intro and facts | the `#home` section in `index.html` |
| Symbols in the character field | `POOLS` at the top of `js/app.js` |
| Reveal radius / grid density | `RADIUS` and `CELL_W`/`CELL_H` in `js/app.js` |
| About and Contact copy | `ABOUT` and `CONTACT` constants in `js/app.js` |

## Before this goes live

- Replace `assets/ucl.png` with the official UCL asset. The current file was
  rebuilt from a screenshot and is not an approved brand asset.
- Replace the placeholder projects for 2024, 2021 and 2020. Those names are
  invented and must not be published.
- Confirm which years actually ran. The existing site lists 2025, 2024, 2021
  and 2020.
