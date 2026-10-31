# MorallyAgainstThis
Only doing this for class

## RPG Quest Log

A static tracker for the 204 Enix and Square Enix RPGs listed in
`enix_square_enix_rpgs.json`. Plain HTML, CSS and JavaScript, with no build step.

- **Browse and filter** by title (English or Japanese), series, platform,
  publisher, RPG vs. hybrid, English availability and upcoming status.
- **Track** each game as *want to play*, *playing*, *finished* or *dropped*,
  rate it 1–5 stars, and keep the platform, dates, hours and notes in the
  details dialog. Upcoming games can be wish-listed but not rated.
- **What next?** suggests games based on your ratings, series and genres.
- **Export / Import** your log as JSON. The log is saved in your browser's
  `localStorage`, so export it to back it up or move it to another device.
- Covers are original pixel-art placeholders drawn from each game's `art`
  settings, not real box art.

### Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `style.css` | Styles, light and dark themes |
| `app.js` | Loads the JSON, filters, tracking, recommendations, backup |
| `art.js` | Draws the pixel-art covers |
| `enix_square_enix_rpgs.json` | Game data |

### Run locally

The page loads the JSON with `fetch`, which browsers block for `file://` pages,
so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Publish on GitHub Pages

In the repository's **Settings → Pages**, set **Source** to *Deploy from a
branch*, pick the branch and the `/ (root)` folder, and save.
