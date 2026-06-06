#!/usr/bin/env bash
# copilot-review.sh - request a GitHub Copilot code review on a pull
# request, watch for the review in the background, and resolve review
# threads. This is the third reviewer in the /handoff loop, added after
# the two local review agents (code-reviewer, security-reviewer).
#
# The GitHub mechanics live here so there is one source of truth; the
# /handoff command drives the classify -> fix -> resolve policy and never
# merges. No silent fallbacks: every failure exits non-zero with context.
#
# usage:
#   copilot-review.sh request <pr>          add Copilot as a reviewer
#   copilot-review.sh watch <pr>            poll until Copilot reviews; emit JSON
#   copilot-review.sh resolve-thread <id>   resolve a review thread by node id
#
# env:
#   COPILOT_POLL_INTERVAL  seconds between polls (default 20)
#   COPILOT_POLL_TIMEOUT   seconds before giving up (default 1200)
#
# The watch result is printed to stdout and written to
# .claude/sessions/copilot-review-<pr>.json (threads authored by Copilot,
# each with its node id, resolution state, path, line, url, and body).
#
# See docs/dev-guide/copilot-review.md.
set -euo pipefail

COPILOT_LOGIN="Copilot"
POLL_INTERVAL="${COPILOT_POLL_INTERVAL:-20}"
POLL_TIMEOUT="${COPILOT_POLL_TIMEOUT:-1200}"

die() {
  >&2 echo "copilot-review: $*"
  exit 1
}

require_gh() {
  command -v gh >/dev/null 2>&1 || die "gh CLI not found on PATH"
}

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null \
    || die "not inside a git repository"
}

# repo_slug - OWNER/REPO for the current repository's default remote.
repo_slug() {
  gh repo view --json nameWithOwner --jq .nameWithOwner \
    || die "could not resolve OWNER/REPO via gh repo view"
}

# request_via_graphql <repo> <pr>
# Fallback path: some repo configurations reject bot logins through the
# REST requested_reviewers endpoint. The GraphQL requestReviews mutation
# accepts the Copilot bot by node id.
request_via_graphql() {
  local repo="$1" pr="$2" pr_id bot_id
  pr_id="$(gh api "repos/$repo/pulls/$pr" --jq .node_id)" \
    || return 1
  bot_id="$(gh api "users/$COPILOT_LOGIN" --jq .node_id)" \
    || return 1
  gh api graphql -f prId="$pr_id" -f botId="$bot_id" -f query='
    mutation($prId: ID!, $botId: ID!) {
      requestReviews(input: {pullRequestId: $prId, userIds: [$botId], union: true}) {
        pullRequest { id }
      }
    }' >/dev/null 2>&1
}

cmd_request() {
  local pr="$1" repo out rc
  [ -n "$pr" ] || die "usage: copilot-review.sh request <pr>"
  repo="$(repo_slug)"

  set +e
  out="$(gh api --method POST "repos/$repo/pulls/$pr/requested_reviewers" \
    -f "reviewers[]=$COPILOT_LOGIN" 2>&1)"
  rc=$?
  set -e

  if [ "$rc" -eq 0 ]; then
    echo "requested Copilot review on $repo#$pr"
    return 0
  fi

  # Already-requested is expected: the repo may auto-request Copilot.
  if printf '%s' "$out" | grep -qiE 'already|duplicate'; then
    echo "Copilot already requested on $repo#$pr"
    return 0
  fi

  if request_via_graphql "$repo" "$pr"; then
    echo "requested Copilot review on $repo#$pr (graphql)"
    return 0
  fi

  die "failed to request Copilot review on $repo#$pr: $out"
}

# emit_result <repo> <pr>
# Print Copilot's review threads as JSON and persist them for the resolve
# step. Each thread carries the node id needed by resolve-thread.
emit_result() {
  local repo="$1" pr="$2" owner name json outfile
  owner="${repo%%/*}"
  name="${repo##*/}"

  json="$(gh api graphql -f owner="$owner" -f name="$name" -F pr="$pr" -f query='
    query($owner: String!, $name: String!, $pr: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $pr) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 1) {
                nodes { author { login } path line originalLine url body }
              }
            }
          }
        }
      }
    }' --jq '{
      threads: [
        .data.repository.pullRequest.reviewThreads.nodes[]
        | select(.comments.nodes[0].author.login == "'"$COPILOT_LOGIN"'")
        | {
            id: .id,
            isResolved: .isResolved,
            isOutdated: .isOutdated,
            path: .comments.nodes[0].path,
            line: (.comments.nodes[0].line // .comments.nodes[0].originalLine),
            url: .comments.nodes[0].url,
            body: .comments.nodes[0].body
          }
      ]
    }')" || die "failed to fetch Copilot review threads for $repo#$pr"

  outfile="$(repo_root)/.claude/sessions/copilot-review-$pr.json"
  printf '%s\n' "$json" | tee "$outfile"
}

cmd_watch() {
  local pr="$1" repo start deadline now count
  [ -n "$pr" ] || die "usage: copilot-review.sh watch <pr>"
  repo="$(repo_slug)"
  start="$(date +%s)"
  deadline=$(( start + POLL_TIMEOUT ))

  while : ; do
    count="$(gh api "repos/$repo/pulls/$pr/reviews" \
      --jq "[.[] | select(.user.login == \"$COPILOT_LOGIN\")] | length")" \
      || die "failed to read reviews for $repo#$pr"
    if [ "${count:-0}" -gt 0 ]; then
      emit_result "$repo" "$pr"
      return 0
    fi
    now="$(date +%s)"
    if [ "$now" -ge "$deadline" ]; then
      die "timed out after ${POLL_TIMEOUT}s waiting for Copilot review on $repo#$pr (is Copilot review enabled and assigned?)"
    fi
    sleep "$POLL_INTERVAL"
  done
}

cmd_resolve_thread() {
  local tid="$1"
  [ -n "$tid" ] || die "usage: copilot-review.sh resolve-thread <thread-node-id>"
  gh api graphql -f threadId="$tid" -f query='
    mutation($threadId: ID!) {
      resolveReviewThread(input: {threadId: $threadId}) {
        thread { id isResolved }
      }
    }' --jq '.data.resolveReviewThread.thread
      | "resolved \(.id) -> isResolved=\(.isResolved)"' \
    || die "failed to resolve thread $tid"
}

main() {
  require_gh
  local cmd="${1:-}"
  case "$cmd" in
    request)
      shift
      cmd_request "${1:-}"
      ;;
    watch)
      shift
      cmd_watch "${1:-}"
      ;;
    resolve-thread)
      shift
      cmd_resolve_thread "${1:-}"
      ;;
    *)
      die "usage: copilot-review.sh {request|watch|resolve-thread} <arg>"
      ;;
  esac
}

main "$@"
