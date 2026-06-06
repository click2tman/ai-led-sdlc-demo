#!/usr/bin/env bash
# statusline.sh - one-line workspace state for the Claude Code status bar
# format:  [branch] issue:<id|none>  session:<id|none>  diff:+a -d
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

branch="$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no-branch')"
branch="${branch//$'\n'/ }"

# Issue id from branch name pattern issue-<n>-... / fix-<n>-... / hotfix-<n>-...
issue="$(echo "$branch" | grep -oE '^(issue|fix|hotfix)-[0-9]+' | grep -oE '[0-9]+' || echo 'none')"

# Active session id (the persistent-memory anchor)
session="none"
pointer=".claude/sessions/.current-session"
if [ -f "$pointer" ]; then
  raw="$(tr -d '[:space:]' < "$pointer" 2>/dev/null || true)"
  [ -n "$raw" ] && session="${raw%.md}"
fi

# Diff stats vs HEAD
stats="$(git diff --shortstat 2>/dev/null | sed -E 's/.*([0-9]+) insertions?\(\+\),?\s*([0-9]+)?.*/+\1 -\2/' || echo '')"

printf "[%s] issue:%s  session:%s  %s" "$branch" "$issue" "$session" "$stats"
