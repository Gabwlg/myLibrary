Instruction : `.claude/skills/verify-before-push/SKILL.md`.
Triggers whenever a ticket is being wrapped up or marked ready to push, or when an acceptance criterion mentions a live Supabase check, a running dev server, or manual browser verification, situations that recurred four times across Lab 1.
It should not trigger for a task that never touches a live service — for example, cleaning up the if/else logic in `progress.ts`. That's pure code with nothing to verify manually.

Instruction was reached:
❯ /clear

❯ I think ticket #2 is done, can you wrap it up

⏺ Reading .claude/skills/verify-before-push/SKILL.md
  ⎿  .claude/skills/verify-before-push/SKILL.md



Enforcement : `.claude/hooks/block-untested-push.sh`, wired via `.claude/settings.json`.
Blocks `git push` whenever `npx vitest run` fails, with the failing output printed as the reason. Instruction alone wasn't enough because the agent already runs tests correctly almost every time but it might skip it for a change it judges "too small to bother re-testing".

The enforcement blocked a push that didn't pass tests:
❯ /clear

❯ commit and push

  Searched for 1 pattern, ran 3 shell commands
PreToolUse:Bash hook error
Failed with non-blocking status code: /bin/sh: /Users/gabrielwolljung/GameDev/myLibrary/myLibrary/.claude/hooks/block-untested-push.sh: Permission denied
PreToolUse:Bash hook error
Failed with non-blocking status code: /bin/sh: /Users/gabrielwolljung/GameDev/myLibrary/myLibrary/.claude/hooks/block-untested-push.sh: Permission denied
PreToolUse:Bash hook error
Failed with non-blocking status code: /bin/sh: /Users/gabrielwolljung/GameDev/myLibrary/myLibrary/.claude/hooks/block-untested-push.sh: Permission denied
PreToolUse:Bash hook error
Failed with non-blocking status code: /bin/sh: /Users/gabrielwolljung/GameDev/myLibrary/myLibrary/.claude/hooks/block-untested-push.sh: Permission denied

I ran the suite first — the working change makes a test fail, so I'm not going to push it as-is.

FAIL  src/lib/library/sample.test.ts > MEDIA_TYPES > is exactly movie, book, other in order
expected [ 'movie', 'book', 'other' ] to deeply equal [ 'movie', 'book' ]

The uncommitted diff edits sample.test.ts:9 to assert ["movie", "book"], but MEDIA_TYPES is ["movie", "book", "other"], so the assertion is wrong. Tests: 1 failed | 51 passed.

How do you want to proceed?

1. Revert sample.test.ts (drop the change) — nothing left to commit.
2. Fix the assertion back to ["movie", "book", "other"] — also a no-op vs. HEAD.
3. You're deliberately testing the pre-push enforcement and want me to attempt the commit + push anyway so the hook blocks it.

✻ Cooked for 21s · done 5:24 PM



In step 3b, I cut step 4 from the skill but it pushed without asking for manual confirmation so it was needed.
Step 4: Only after step 3 is written out, suggest committing. Do not push or close the issue yourself — wait for confirmation that the manual checks passed.


❯ /clear

❯ I think ticket #2 is done, can you wrap it up

  Read 3 files, ran 5 shell commands

Wrapped up. #2 is closed with a summary comment.

What I checked first:
- All six child tickets (#3–#8) are merged to main and closed — every commit is on main (dce194b, 1a9a902/2a249e3, 860dca8, 7ecdb05, fde781a, e8a8a6e).
- Working tree clean, nothing to push.
- npm test → 52 tests passing across 7 files (progress-event derivation, finished-per-month, demo progress log, repository, etc.).

The closing comment maps each child ticket to its commits, records what the tests cover, and — per the verify-before-push skill — spells out the criteria I can't check from here (SQL schema/RLS/trigger apply cleanly, backfill idempotency, browser rendering in account + demo mode) as explicit manual-check items. The spec/ADR/glossary stay readable on the closed issue as the shared context the owner wanted preserved.

✻ Brewed for 55s · done 4:59 PM
