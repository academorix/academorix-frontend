# Shell Command Rules

Rules for shell commands executed through the agent's terminal tool
(`execute_bash`, `control_bash_process`, and hook `action.command` fields). The
tool runs under macOS `zsh`.

## Rule — no `for` / `while` in tool-invoked shell commands

Do **not** write `for` or `while` loops in commands you hand to `execute_bash` /
`control_bash_process`. One-liner loops under `zsh` are fragile:

- **Word-splitting differs from bash.** In `zsh`, unquoted `$var` and `$(cmd)`
  do NOT split on `IFS` by default, so `for f in $(ls *.ts)` loops **once** over
  the whole space-separated string, not once per file. The failure mode is
  silent — the command exits `0` with a nonsensical iteration count.
- **`; do ... ; done` is brittle in a single command string.** A stray glob that
  matches nothing, an empty variable, or a non-zero exit inside the body can
  hang, silently no-op, or blow past the tool's timeout — with no structured
  output the agent can consume.
- **Exit codes get swallowed.** A loop without `set -e` hides failing
  iterations; the tool call returns success while the loop actually did nothing
  useful.
- **Interactive-looking constructs stall.** `read`-driven `while` loops waiting
  on stdin will hang the whole tool call to timeout because the tool runs
  commands non-interactively.

### Use instead

- **Dedicated tools first.** `file_search`, `grep_search`, `read_files`,
  `list_directory` were built to iterate over files and return structured
  results. Prefer them over any shell loop.
- **`xargs` / `find -exec`** for genuine one-shot fan-out:

  ```sh
  # remove every dist directory in the repo
  find . -type d -name dist -prune -exec rm -rf {} +

  # format every changed TS file
  git diff --name-only --diff-filter=ACM \
    | grep -E '\.tsx?$' \
    | xargs -r pnpm prettier --write
  ```

- **Separate parallel tool calls.** When operations are independent, issue them
  as parallel `execute_bash` invocations in one response rather than looping in
  a single shell string. The tool driver reports each call's output separately,
  so you can attribute failures to a specific input.
- **`pnpm -r` / `pnpm --filter=...`** for anything that fans out over workspace
  packages. Never loop `pnpm --filter <pkg>` calls by hand.

### Scope

- **Applies to** every `execute_bash` / `control_bash_process` invocation and
  every hook `action.command` value — anything the agent hands to the shell as a
  one-shot command string.
- **Does NOT apply to** shell scripts the agent AUTHORS as file content (a `.sh`
  under `scripts/`, a fenced code block in documentation, a `package.json`
  script value). Those are read by humans and future shells; ordinary scripting
  rules apply and quoting can be made bulletproof.

## Enforcement

- Search a tool-invoked command string for `\bfor\b .* do\b` or
  `\bwhile\b .* do\b`. Zero hits allowed.
- If a task genuinely needs iterative shell work, wrap it as a committed script
  file and invoke it once — do not embed the loop in the tool call.
