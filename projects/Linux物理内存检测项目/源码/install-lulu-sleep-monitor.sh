#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PATCH_SCRIPT="$SCRIPT_DIR/patch-chatgpt-lulu-sleep.sh"
LABEL="com.openai.lulu-sleep-patch"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/.codex/pets/lulu"
RUNTIME_SCRIPT="$LOG_DIR/patch-chatgpt-lulu-sleep.sh"

if [[ ! -x "$PATCH_SCRIPT" ]]; then
    echo "Patch script is missing or not executable: $PATCH_SCRIPT" >&2
    exit 1
fi

mkdir -p "$(dirname -- "$PLIST")" "$LOG_DIR"
# LaunchAgents can be blocked by macOS privacy rules from executing files in
# Desktop folders. Keep the source script in the repository, but run a synced
# copy from the user's private data directory.
cp -p "$PATCH_SCRIPT" "$RUNTIME_SCRIPT"
chmod 755 "$RUNTIME_SCRIPT"
# Generate the small LaunchAgent plist without relying on a long-lived
# heredoc Python process. The current installation path contains no XML
# metacharacters; keep this block easy to inspect and re-run.
{
    printf '%s\n' '<?xml version="1.0" encoding="UTF-8"?>'
    printf '%s\n' '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
    printf '%s\n' '<plist version="1.0">' '<dict>'
    printf '%s\n' '    <key>Label</key>' "    <string>$LABEL</string>"
    printf '%s\n' '    <key>ProgramArguments</key>' '    <array>'
    printf '%s\n' '        <string>/bin/bash</string>' "        <string>$RUNTIME_SCRIPT</string>" '        <string>--watch-once</string>' '    </array>'
    printf '%s\n' '    <key>RunAtLoad</key>' '    <true/>'
    printf '%s\n' '    <key>StartInterval</key>' '    <integer>15</integer>'
    printf '%s\n' '    <key>StandardOutPath</key>' "    <string>$LOG_DIR/lulu-sleep-patch.log</string>"
    printf '%s\n' '    <key>StandardErrorPath</key>' "    <string>$LOG_DIR/lulu-sleep-patch.err.log</string>"
    printf '%s\n' '</dict>' '</plist>'
} > "$PLIST"

launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed automatic Lulu sleep patch monitor: $PLIST"
