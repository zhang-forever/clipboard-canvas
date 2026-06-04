# Clipboard Canvas

A local-first clipboard manager that turns your copy history into a visual canvas. Drag, arrange, annotate, and export.

## Why
Clipboard history is ephemeral. This makes it spatial and persistent.

## Tech
- **Tauri 2** for native clipboard access & system tray
- **React** canvas via HTML5 Canvas API
- **SQLite** local storage (via rusqlite)
- Zero cloud. Everything stays on your machine.

## Features (MVP)
- Ctrl+C auto-capture text, images, links
- Infinite canvas: drag & arrange clips spatially
- Annotate clips with sticky notes
- Search & filter timeline
- Export canvas as PNG / JSON

## Dev
```bash
npm install
npm run tauri dev
```

## Build
```bash
npm run tauri build
```
