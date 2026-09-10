---
name: verify-before-push
description: How to close out a ticket when some acceptance criteria can't be verified by you alone — anything needing a live Supabase connection, a second running dev server, or clicking through the browser. Use before writing a "done" or "ready to push" summary for any ticket, and whenever an acceptance criterion mentions "real database", "live", "manual", or "Supabase".
---

# Verify before you say "done"

## What this is
You cannot open a browser, click through the UI, or confirm state in a live
Supabase project. On this repo (myLibrary) several acceptance criteria are
written exactly to need that: schema migrations, RLS policy checks, and
anything touching real user data. Guessing that they pass is worse than
saying plainly that you didn't check.

## Do this, in order
1. Before writing a completion summary for a ticket, go through its
   acceptance criteria one by one.
2. For each one you verified yourself, name the exact automated proof: the
   test file and test name, or the command you ran and its output.
   "Tests pass" is not enough on its own — name which test covers which
   criterion.
3. For each one you could NOT verify yourself (it needs a live Supabase
   connection, a second running dev server, clicking through the UI, or
   anything outside this sandbox), say so explicitly and give the exact
   steps to check it: which page, which action, and what result confirms
   success. Do this before you say the ticket is ready to push.
4. Only after step 3 is written out, suggest committing. Do not push or
   close the issue yourself — wait for confirmation that the manual checks
   passed.


## Done means
Every acceptance criterion in your summary is tagged either
`verified: <test name>` or `needs manual check: <exact steps>`. A summary
with an unlabeled or skipped acceptance criterion is not done.