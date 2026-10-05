# Security review

What a reviewer does when the target is `--security`, or when the user's
worry is security. A security audit, not a style check: the goal is findings
an attacker could act on today, each backed by a request or input that would
trigger it, never a checklist recited against code that was never read.

## 1. Map the attack surface first

Read the code, don't ask the user. Find:

- **Entry points:** server functions, server routes, webhooks, scheduled
  jobs reading outside state, file parsers, CLI arguments; anywhere
  untrusted data gets in.
- **Where each input goes:** a query, a file path, a shell command, a log
  line, a response, a cache key, another service. The categories below are
  by sink, so once you know the sinks an input reaches you know which
  categories are live for it.
- **Trust boundaries:** signed in or anonymous, internal or public, ids
  that are guessable or opaque.
- **State a request writes that a later request can read:** the database,
  a cache, a session store, the filesystem.

## 2. Apply the categories that are reachable

For each one, say first whether it's reachable on the surface you mapped;
skip it with one line ("no uploads, N/A") rather than silently.

1. **Injection:** SQL built from strings, shell commands, log lines, headers;
   anywhere untrusted input is concatenated into something a parser reads as
   structure. Includes line breaks in headers and logs.
2. **Requests to user-supplied URLs and redirects:** scheme allowlists (no
   `file:`, `javascript:`, `data:`), internal hosts, loopback, cloud metadata
   addresses (`169.254.169.254`), private ranges.
3. **Access:** a server function with no auth check; a check of identity but
   not ownership (user A acts on user B's record by guessing an id);
   sequential ids where opacity was the only protection.
4. **Input and resource limits:** fields with no length cap, no rate limit on
   expensive or anonymous calls, regexes that backtrack on user input.
5. **Information leaks:** stack traces, class names or paths in a response;
   "not found" and "forbidden" that differ; debug or admin routes reachable
   without auth.
6. **Caching and races:** cache keys from unvalidated input; a check followed
   by a separate write.
7. **Secrets and config:** credentials in the repo; permissive CORS;
   insecure defaults (TLS verification off, cookie flags, debug mode).
8. **Dependencies:** `bun audit` or `npm audit`; packages left floating.
9. **Browser side:** XSS through `dangerouslySetInnerHTML` or unescaped
   output; state-changing calls authenticated by cookies alone with no
   same-site protection; missing or permissive CSP; tokens in `localStorage`.

This list is a floor. A risk the surface suggests that isn't here goes in
too.

## 3. Report

Report only; never fix. Each finding goes in the feature file in
`reviews/<date>-<target>/` with the full report shape, plus:

- **Severity:** Critical / High / Medium / Low, by realistic impact and
  reachability (an unauthenticated remote code path is Critical; a missing
  rate limit on a cheap read is Low).
- **Mechanism:** the data flow from entry point to sink, in a sentence or
  two.
- **Demonstration:** the exact request, payload or input that triggers it.
  "An attacker could craft an input" is not a finding.

Skip a finding an earlier review in `reviews/` already records for the same
location and cause. Categories ruled out get one summary line each.
