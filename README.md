<h1 align="center">📋 Clipboard Canvas</h1>

<p align="center">
  <strong>Your clipboard history on an infinite canvas. Drag, search, pin, and organize everything you copy — all local, all private.</strong>
</p>

<p align="center">
  <a href="https://github.com/zhang-forever/clipboard-canvas/stargazers"><img src="https://img.shields.io/github/stars/zhang-forever/clipboard-canvas?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/zhang-forever/clipboard-canvas/network"><img src="https://img.shields.io/github/forks/zhang-forever/clipboard-canvas?style=social" alt="GitHub forks"></a>
  <a href="https://github.com/zhang-forever/clipboard-canvas/issues"><img src="https://img.shields.io/github/issues/zhang-forever/clipboard-canvas" alt="GitHub issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/zhang-forever/clipboard-canvas" alt="License"></a>
  <br>
  <a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=white" alt="Tauri 2"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite"></a>
</p>

<p align="center">
  <a href="#features">Features</a> · <a href="#getting-started">Getting Started</a> · <a href="#keyboard-shortcuts">Shortcuts</a> · <a href="#privacy">Privacy</a>
</p>

## Why Clipboard Canvas?

Most clipboard managers show a boring list. **Clipboard Canvas** turns your copy history into a visual, spatial workspace — drag clips around an infinite canvas, organize by position, and find anything instantly with search. Built with Tauri 2 for a tiny footprint and native performance. All data stays on your machine.

<p align="center">
  <img src="https://raw.githubusercontent.com/zhang-forever/clipboard-canvas/main/docs/screenshot.png" alt="Clipboard Canvas — Infinite canvas with color-coded clip cards" width="800">
</p>

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
