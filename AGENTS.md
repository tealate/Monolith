# AGENTS.md

## Project

This repository is the development environment for **Monolith**, a Minecraft Java Edition **26.1** resource pack + data pack.

Specification and design reference:

`https://app.notion.com/p/3dd1fd1a6151819597c5c72cd34b8e22`

Use the repository as the primary source of implementation context.

Consult Notion only when:

* the requested behavior is unclear,
* an important design decision is missing from the repository,
* or the task explicitly requires it.

Do not read Notion preemptively for routine implementation.

---

## Version

Target:

`Minecraft Java Edition 26.1`

Use command, JSON, resource-pack, and data-pack formats valid for this version.

Do not copy older-version formats without verifying compatibility.

---

## Repository Layout

The repository root is the actual resource-pack root used by Minecraft.

```text
Monolith/
├─ pack.mcmeta
├─ assets/
│  └─ monolith/
├─ datapack/
├─ vanilla_reference/
│  └─ assets/
│     └─ minecraft/
├─ tools/
├─ AGENTS.md
└─ .git/
```

Do not create another nested resource pack.

The data pack lives under:

`datapack/`

Minecraft accesses it through a Junction from:

`MonolithTest/datapacks/Monolith`

Do not create build/output copies unless explicitly requested.

---

## Namespace

Primary namespace:

`monolith`

Resource-pack content normally belongs under:

`assets/monolith/`

Examples:

```text
monolith:item/example
monolith:block/example
monolith:entity/example
```

Avoid modifying the `minecraft` namespace unless required.

---

## Data Pack Architecture

Transform API and constraints:

`datapack/TRANSFORM.md`

Animation and Sequencer APIs:

```text
datapack/ANIMATION.md
datapack/SEQUENCER.md
```

Generic animation runtime:

`datapack/data/monolith_anim/`

`monolith_anim` must not depend on Dungeon content or `monolith:animation/demo/*`.

The legacy and new animation systems must not control the same entity Transform at the same time.

### Generated Transform Functions

Generators:

```text
tools/build-transform.mjs
tools/build-transform-debug.mjs
```

When generated Functions need changes, edit their generator/source rather than manually maintaining generated output.

Relevant regression test:

```text
node tools/test-transform.mjs
```

### Generated Animation Functions

Generators:

```text
tools/build-animation-layers.mjs
tools/build-animation-nodes.mjs
tools/build-animation-sequence.mjs
tools/build-animation-debug.mjs
```

Full regeneration:

```text
node tools/build-animation.mjs
```

Relevant regression test:

```text
node tools/test-animation.mjs
```

---

## Vanilla Reference

`vanilla_reference/` contains Minecraft 26.1 vanilla assets for reference only.

Use it only when vanilla structure or behavior must actually be checked.

Prefer targeted reads of specific files.

Do not scan the directory broadly.

Do not depend on `vanilla_reference/` at runtime.

If a vanilla asset is required by Monolith, copy or recreate the required file in the appropriate real resource-pack location.

---

## Editing Rules

Prefer minimal, task-focused changes.

* Follow existing naming and architecture.
* Reuse existing implementations where practical.
* Do not add unnecessary directory layers or copies.
* Do not move, rename, or delete unrelated files.
* Avoid unrelated cleanup and speculative refactoring.
* Do not rewrite working code only for style.
* Inspect one or two representative implementations instead of every similar file.
* Make large structural changes only when required by the task.

If a major structural change is necessary, explain it briefly in the final report.

---

## Context / Token Efficiency

Minimize context usage unless additional investigation is necessary for correctness.

### File reading

* Read only files relevant to the current task.
* Do not scan the entire repository without a concrete reason.
* Prefer exact filenames and directory-scoped searches.
* Do not repeatedly read unchanged files.
* Do not inspect unrelated systems for general understanding.
* Do not dump large files, diffs, or search results unless needed for diagnosis.

### Existing context

If the current session already established how a system works, reuse that knowledge unless the repository now contradicts it.

Do not repeatedly rediscover the same architecture.

For interrupted Codex work:

1. Treat existing changes as valid work in progress.
2. Check `git status`.
3. Inspect only the relevant portions of `git diff`.
4. Continue from the existing implementation.

Do not restart the investigation or implementation from scratch unless the existing work is unusable.

### Planning

For straightforward changes, implement directly.

Do not produce a long implementation plan unless:

* multiple systems are affected,
* there is genuine architectural ambiguity,
* or destructive migration is involved.

### Search

Use the narrowest search that can answer the question.

Prefer:

```text
exact identifier
exact filename
specific namespace
specific directory
specific function/tag
```

Avoid repeated differently-worded searches for the same information when the first search was sufficient.

---

## Validation Policy

Validation should be proportional to the change.

**Do not validate after every small edit.**

Preferred workflow:

```text
inspect
→ make a coherent batch of changes
→ regenerate if required
→ run targeted validation once
→ fix actual failures
→ re-run only affected validation
```

Do not repeatedly run a successful check.

### Transform changes

If the Transform generator/runtime was modified:

1. Regenerate the required output once after the implementation batch.
2. Run:

```text
node tools/test-transform.mjs
```

once near completion.

Do not run it for unrelated resource-pack or data-pack changes.

### Animation / Sequencer changes

If the animation generator/runtime was modified:

1. Run regeneration once near completion:

```text
node tools/build-animation.mjs
```

2. Run:

```text
node tools/test-animation.mjs
```

once near completion.

Do not run the animation regression suite for unrelated changes.

If both Transform and Animation systems were changed, run both relevant suites.

### Static validation

For ordinary resource-pack/data-pack changes, check only what is relevant:

* changed JSON parses,
* namespace/path is correct,
* referenced Functions/resources exist where reasonably checkable,
* obvious command syntax is valid,
* generated output is consistent with its source.

Do not perform repository-wide validation unless the change is repository-wide.

### Game runtime

Do not launch Minecraft or a Minecraft server solely for validation unless explicitly requested.

Resource-pack reload:

```text
F3 + T
```

Data-pack reload:

```text
/reload
```

These are different operations.

Do not claim that behavior was verified in-game unless it actually was.

Visual behavior, timing, entity movement, rendering, interaction, and other runtime behavior may be left for user-side verification when static validation is insufficient.

Report the specific unverified item instead of performing excessive indirect validation.

---

## Failure Handling

When validation fails:

1. Investigate the actual failure.
2. Fix the relevant issue.
3. Re-run only the affected validation.

Do not turn a local failure into a full repository audit.

If a required tool/runtime is unavailable, do not repeatedly retry it. Continue with other work and report the limitation.

---

## Git Rules

Codex may freely use Git for safe work management, including:

* branches,
* commits,
* push,
* stash,
* temporary branches,
* commits used to preserve existing work.

Existing uncommitted changes may belong to the user or a previous Codex session.

Preserve them.

It is acceptable to stash or commit existing changes when necessary to work safely.

No confirmation is required for normal safe Git operations.

Avoid destructive operations that can lose work, including:

```text
git reset --hard
git clean -fd
```

Do not discard unrelated changes or force-push shared history.

Do not repeatedly run `git status` or large repository-wide diffs without a reason.

Prefer targeted diffs for files relevant to the current task.

---

## Final Report

Keep the final report concise.

Include only:

* what was implemented,
* important design changes if any,
* validation actually performed,
* required user-side Minecraft verification,
* Git operations performed,
* remaining issues or unverified items.

Do not narrate routine file reads, searches, or commands.
