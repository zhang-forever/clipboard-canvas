# Clipboard Canvas

[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

**Clipboard Canvas** is a desktop app that captures your clipboard history and displays it on an infinite canvas. Built with Tauri 2 and React 19.

## Screenshots

> Infinite canvas with draggable clip cards, minimap, and dark-themed UI. Toggle between canvas and grid view.

## Features

- **Auto-capture** — Polls clipboard every second, captures new text on copy (Ctrl+C)
- **Infinite canvas** — Pan with WASD/arrow keys, zoom with scroll wheel
- **Clip cards** — Draggable cards with content preview, timestamp, type icon, and color-coded borders
- **Type detection** — Auto-classifies clips as Text (blue), Link (green), Code (yellow), or Image URL (pink)
- **Context menu** — Right-click any card to copy, pin, expand, export, or delete
- **Search** — Filter clips by content in real time
- **Minimap** — Corner overlay showing all clip positions and viewport bounds
- **Pin clips** — Lock clips at a fixed canvas position
- **Expand/Collapse** — Double-click a card to see full content
- **Grid view** — Toggle between infinite canvas and compact list layout
- **Export** — Save all clips as JSON, or export individual clips as text files
- **Stats** — Real-time counts: total clips, oldest clip age, type breakdown
- **Persistence** — All clips saved to localStorage, restored between sessions
- **Smooth animations** — Cards animate on add, remove, and move
- **Keyboard shortcuts** — Press `?` to see all shortcuts

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Desktop    | Tauri 2 (Rust)                      |
| Frontend   | React 19 + TypeScript               |
| Bundler    | Vite 6                              |
| Clipboard  | tauri-plugin-clipboard-manager      |
| Styling    | Inline styles (zero CSS dependencies) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://www.rust-lang.org/) toolchain (rustup)
- Windows: [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- macOS: Xcode Command Line Tools
- Linux: `build-essential`, `libwebkit2gtk`, etc. (see [Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Install & Run

```bash
cd clipboard-canvas
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

The packaged app will be in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Shortcut            | Action                        |
| ------------------- | ----------------------------- |
| `Ctrl+C` (anywhere) | Capture clipboard to canvas   |
| `W` `A` `S` `D`    | Pan canvas                    |
| `↑` `↓` `←` `→`    | Pan canvas (arrows)           |
| Scroll wheel        | Zoom in/out                   |
| Drag card           | Move clip on canvas           |
| Double-click card   | Expand / collapse clip        |
| Right-click card    | Context menu                  |
| `?`                 | Show shortcuts panel          |
| `Escape`            | Close menus / modals          |

## Privacy

All clipboard data stays on your machine. Clips are stored in the browser's `localStorage` and never leave your device. The Tauri clipboard plugin only reads the system clipboard locally — nothing is sent to any server.

## Project Structure

```
clipboard-canvas/
├── index.html              # Entry HTML
├── src/
│   ├── main.tsx            # React mount point
│   ├── App.tsx             # Main app with all UI
│   ├── store.ts            # Clip state (context, reducer, localStorage)
│   └── canvas.ts           # Canvas hooks (pan, zoom, transform)
├── src-tauri/
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri config
│   └── src/
│       ├── main.rs          # Rust entry point
│       └── lib.rs           # Tauri plugin setup
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## License

MIT
