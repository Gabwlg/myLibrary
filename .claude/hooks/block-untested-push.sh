#!/usr/bin/env bash
set -euo pipefail

input=$(cat)

tool_name=$(printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_name',''))")
[ "$tool_name" = "Bash" ] || exit 0

command=$(printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))")
cwd=$(printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('cwd','.'))")

printf '%s' "$command" | grep -Eq '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)' || exit 0

if ! (cd "$cwd" && npx vitest run --silent) >/tmp/vitest-pre-push.log 2>&1; then
  echo "Blocked: the test suite is failing. Fix it before pushing." >&2
  tail -n 20 /tmp/vitest-pre-push.log >&2
  exit 2
fi

exit 0