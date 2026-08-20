#!/usr/bin/env bash
# Cross-compiles the Rust core for every Android ABI the app ships.
# Requires: rustup targets + cargo-ndk (one-time setup, see BUILD_NOTES.md)
#   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
#   cargo install cargo-ndk
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v cargo-ndk >/dev/null 2>&1; then
  echo "[gitnative] cargo-ndk not found — skipping native core build." >&2
  echo "[gitnative] Install with: cargo install cargo-ndk" >&2
  echo "[gitnative] JS/TS fallback path will be used until this is built." >&2
  exit 0
fi

cargo ndk \
  -t arm64-v8a \
  -t armeabi-v7a \
  -t x86_64 \
  -o target \
  build --release

echo "[gitnative] Rust core built for arm64-v8a, armeabi-v7a, x86_64"
