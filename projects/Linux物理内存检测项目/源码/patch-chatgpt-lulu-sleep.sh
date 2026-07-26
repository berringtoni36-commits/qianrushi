#!/usr/bin/env bash
set -euo pipefail

# Patch the currently installed ChatGPT pet animation so Lulu sleeps until
# the pointer enters the mascot. ChatGPT updates may replace app.asar; rerun
# this script after an update.

APP_PATH="${CHATGPT_APP_PATH:-/Applications/ChatGPT.app}"
ASAR_PATH="$APP_PATH/Contents/Resources/app.asar"
BACKUP_DIR="${LULU_BACKUP_DIR:-$HOME/.codex/pets/lulu/chatgpt-app-backups}"

if [[ ! -d "$APP_PATH" || ! -f "$ASAR_PATH" ]]; then
    echo "ChatGPT.app not found at: $APP_PATH" >&2
    exit 1
fi

if [[ "${1:-}" == "--restore" ]]; then
    BACKUP_PATH="${2:-}"
    if [[ -z "$BACKUP_PATH" || ! -f "$BACKUP_PATH" ]]; then
        echo "Usage: $0 --restore /path/to/app.asar.backup" >&2
        exit 2
    fi
    if pgrep -x ChatGPT >/dev/null 2>&1; then
        echo "Quit ChatGPT before restoring app.asar." >&2
        exit 3
    fi
    cp -p "$BACKUP_PATH" "$ASAR_PATH"
    codesign --force --deep --sign - "$APP_PATH" >/dev/null
    echo "Restored: $BACKUP_PATH"
    exit 0
fi

if [[ "${1:-}" == "--watch-once" ]]; then
    # The monitor runs periodically. Never touch a live app bundle; wait for
    # the next interval after ChatGPT has quit or after an app update.
    if pgrep -x ChatGPT >/dev/null 2>&1; then
        exit 0
    fi
    exec "$0"
fi

if pgrep -x ChatGPT >/dev/null 2>&1; then
    echo "Quit ChatGPT before patching app.asar." >&2
    exit 3
fi

NPX_BIN="$(command -v npx 2>/dev/null || true)"
if [[ -z "$NPX_BIN" ]]; then
    # launchd supplies a minimal PATH, while this Mac's bundled Node runtime
    # lives under ~/.local. Keep a few standard Homebrew paths as fallbacks.
    for candidate in \
        "$HOME/.local/node-v22.16.0-darwin-arm64/bin/npx" \
        "$HOME/.local/node/bin/npx" \
        /opt/homebrew/bin/npx \
        /usr/local/bin/npx; do
        if [[ -x "$candidate" ]]; then
            NPX_BIN="$candidate"
            break
        fi
    done
fi
if [[ -z "$NPX_BIN" ]]; then
    echo "npx is required to unpack app.asar." >&2
    exit 4
fi
# npx uses /usr/bin/env node in its shebang; make the matching Node directory
# visible when this script is launched by launchd with its minimal PATH.
export PATH="$(dirname -- "$NPX_BIN"):$PATH"

ASAR_TOOL=("$NPX_BIN" --yes asar)
ASSET_PATH="$("${ASAR_TOOL[@]}" list "$ASAR_PATH" \
    | sed 's#^/##' \
    | rg '^webview/assets/codex-avatar-[^/]+\.js$' \
    | head -n 1 || true)"
if [[ -z "$ASSET_PATH" ]]; then
    echo "Could not find the versioned codex-avatar asset in app.asar." >&2
    exit 5
fi

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lulu-sleep-patch.XXXXXX")"
cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

EXTRACTED_DIR="$TEMP_DIR/extracted"
"${ASAR_TOOL[@]}" extract "$ASAR_PATH" "$EXTRACTED_DIR"
ASSET_FILE="$EXTRACTED_DIR/$ASSET_PATH"
if [[ ! -f "$ASSET_FILE" ]]; then
    echo "Resolved asset is missing after extraction: $ASSET_PATH" >&2
    exit 6
fi

PATCH_RESULT="$(python3 - "$ASSET_FILE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
old = (
    "L=[{rowIndex:0,columnIndex:0,frameDurationMs:280},"
    "{rowIndex:0,columnIndex:1,frameDurationMs:110},"
    "{rowIndex:0,columnIndex:2,frameDurationMs:110},"
    "{rowIndex:0,columnIndex:3,frameDurationMs:140},"
    "{rowIndex:0,columnIndex:4,frameDurationMs:140},"
    "{rowIndex:0,columnIndex:5,frameDurationMs:320}]"
)
new = "L=[{rowIndex:0,columnIndex:1,frameDurationMs:280}]"
old_count = text.count(old)
new_count = text.count(new)
if old_count == 0 and new_count == 1:
    print("already-patched")
    raise SystemExit(0)
if old_count != 1 or new_count != 0:
    raise SystemExit(
        f"unexpected idle animation structure (old={old_count}, new={new_count})"
    )
path.write_text(text.replace(old, new), encoding="utf-8")
print("patched")
PY
       )"
echo "$PATCH_RESULT"
if [[ "$PATCH_RESULT" == "already-patched" ]]; then
    echo "No changes needed."
    exit 0
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/app.asar.$STAMP.bak"
cp -p "$ASAR_PATH" "$BACKUP_PATH"

PATCHED_ASAR="$TEMP_DIR/app.asar"
"${ASAR_TOOL[@]}" pack "$EXTRACTED_DIR" "$PATCHED_ASAR"
cp -p "$PATCHED_ASAR" "$ASAR_PATH.new"
mv -f "$ASAR_PATH.new" "$ASAR_PATH"

codesign --force --deep --sign - "$APP_PATH" >/dev/null

echo "Patched idle animation: $ASSET_PATH"
echo "Backup: $BACKUP_PATH"
echo "Run after ChatGPT updates: $0"
