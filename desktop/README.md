# SparsileX Desktop

Tauri-based desktop wrapper for the SparsileX web app.

## Prerequisites

1. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. Install Tauri CLI: `cargo install tauri-cli`

## Development

```bash
# Start the API server first
cd ../api && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Then run the desktop app in dev mode
cargo tauri dev
```

## Build

```bash
cargo tauri build
```

This produces a native app in `src-tauri/target/release/bundle/`.
