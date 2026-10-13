<p align="center">
  <img src="https://raw.githubusercontent.com/Glitchtit/HA-stock/main/stock/logo.png" alt="Stock" height="72">
</p>

<p align="center">
  <b>Phone-first view of what's in stock and what to buy</b><br>
  Part of Glitchtit's HA apps — a dashboard on top of the Storage add-on.
</p>

<p align="center">
  <a href="https://github.com/Glitchtit/HA-apps"><img alt="Home Assistant add-on" src="https://img.shields.io/badge/Home%20Assistant-add--on-0047AB?style=flat-square&logo=homeassistant&logoColor=white"></a>
  <img alt="Version" src="https://img.shields.io/badge/dynamic/json?style=flat-square&color=FF4F00&label=version&url=https%3A%2F%2Fraw.githubusercontent.com%2FGlitchtit%2FHA-stock%2Fmain%2Fstock%2Fconfig.json&query=%24.version">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Glitchtit/HA-stock/main/docs/screenshots/hero.png" alt="Stock screenshot" width="100%">
</p>

## ✨ Features

- **Stock at a glance** — products grouped by product group with photos, location tabs, favourite groups pinned to the top, and an estimated value of what's on the shelf.
- **One-gesture changes** — swipe a row right to add one, left to consume one, or long-press and drag down to mark it opened. Changes show a 5-second undo toast.
- **Barcode scanning** — use the phone camera or a Bluetooth scanner to scan shopping, count inventory, consume, or add to the shopping list. Unknown barcodes are looked up through the Scraper. A photo of a receipt can also be parsed by AI and added to stock in one go.
- **Shopping list in aisle order** — "Ostoslista" groups rows by Finnish grocery aisle, shows which stores carry each item, the product to buy under a generic row, and an estimated total. Low-stock items are added automatically.
- **Suggestions** — "Ehdotus" proposes what will run out within a week, "Toistuvat ostokset" what is due by purchase rhythm, "Suositukset" what was recently used up, and "Setit" pushes bundles made in Recipes onto the list.
- **Use soon** — "Käytä pian" lists lots sorted by best-before date, with a header badge for expired or nearly expired items.
- **Print the list** — 🖨 Tulosta sends the list to the Print add-on, filtered to the store you pick.

## 🚀 Installation

### Add-on

1. In Home Assistant open **Settings → Add-ons → Add-on Store → ⋮ → Repositories** and add `https://github.com/Glitchtit/HA-apps`
2. Install **Storage** first, then **Stock**
3. No setup needed: Stock finds the Storage, Scraper, Chores and Print add-ons on its own and keeps checking every 30 seconds for any that start later
4. Start it and open **Stock** from the sidebar

## ⚙️ Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `debug` | `false` | Log every request. When off, routine polling and static files are left out of the log. |
| `storage_url` / `scraper_url` / `chores_url` / `print_url` | auto-detected | Optional overrides for where the other add-ons are reached. Leave empty to auto-detect. |

## 🧩 The family

<p align="center">
  <a href="https://github.com/Glitchtit/HA-storage"><img src="https://raw.githubusercontent.com/Glitchtit/HA-storage/main/storage/icon.png" width="56" alt="Storage"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-scraper"><img src="https://raw.githubusercontent.com/Glitchtit/HA-scraper/main/addon/icon.png" width="56" alt="Scraper"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-stock"><img src="https://raw.githubusercontent.com/Glitchtit/HA-stock/main/stock/icon.png" width="56" alt="Stock"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-recipes"><img src="https://raw.githubusercontent.com/Glitchtit/HA-recipes/main/recipes/icon.png" width="56" alt="Recipes"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-chores"><img src="https://raw.githubusercontent.com/Glitchtit/HA-chores/main/chores/icon.png" width="56" alt="Chores"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-lists"><img src="https://raw.githubusercontent.com/Glitchtit/HA-lists/main/lists/icon.png" width="56" alt="Lists"></a>&nbsp;
  <a href="https://github.com/Glitchtit/HA-print"><img src="https://raw.githubusercontent.com/Glitchtit/HA-print/main/print/icon.png" width="56" alt="Print"></a>
</p>

<p align="center"><sub>Stock reads and writes everything through Storage; Scraper looks up unknown barcodes, Chores credits whoever shopped, and Print turns the shopping list into a receipt.</sub></p>

## 🛠️ Development

```bash
cd stock/frontend
npm install
npm run dev      # dev server
npm test         # unit tests for the shopping and stock helpers (node --test)
```
