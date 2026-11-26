# Mobile adapter: traces to Maestro flows

Status: draft. The vocabulary and the compiler exist. The flows are checked for syntax in CI. Two of them replay on an Android emulator, in a run started by hand ([`device.yml`](../../.github/workflows/device.yml)). On a real app, LocalSend, 7 traces replay on Android emulators with no model, and 137 of 140 replays on the unchanged app gave what the trace records ([results](../../README.md#results-on-localsend)). Nothing has been tried on iOS.

## What it does

It turns a trace of what a tester did in a mobile app into a [Maestro](https://maestro.dev) flow: a plain YAML file that `maestro test` runs on an Android emulator or an iOS Simulator, with no model.

```sh
pnpm ecr validate examples/anna-first-item-mobile.trace.json --adapter src/index.ts
pnpm ecr compile  examples/anna-first-item-mobile.trace.json --adapter src/index.ts
maestro test -e ITEM_TITLE="Buy bread" -e ACCOUNT_PASSWORD=... examples/anna-first-item-mobile.flow.yaml
```

Read the two files side by side: [the trace](examples/anna-first-item-mobile.trace.json) and [the flow](examples/anna-first-item-mobile.flow.yaml).

## The vocabulary

Actions: `launchApp`, `tapOn`, `longPressOn`, `inputText`, `eraseText`, `pressKey`, `swipe`, `scrollUntilVisible`, `hideKeyboard`.
Oracles: `visible`, `notVisible`.

A step finds its target by accessibility id, by visible text, or as a last resort by a point in percent of the screen. A check cannot be made on a point. The first step must be `launchApp`: it names the app.

A tap or a long press lands on the centre of its element. An optional `at`, in percent of the element's box, says where else: `"at": "97%,50%"` is its right end. In a text field written from left to right, a tap there puts the cursor after the text, and `eraseText` then erases the end of the text: Maestro erases before the cursor. A swipe has a `direction`. With an optional `from` and `to`, two points in percent of the screen, the replay moves the finger between the same two points, at Maestro's own speed. Without them it makes a gesture of Maestro's own length. A second example uses the three: [the trace](examples/anna-renames-an-item-mobile.trace.json) and [the flow](examples/anna-renames-an-item-mobile.flow.yaml).

`hideKeyboard` hides the keyboard only while one is on the screen. On Android, Maestro 2.12.1 hides it with Back, also when no keyboard is open, and Back then leaves the screen. So on Android the flow hides it only when a key of Gboard or of the emulator's keyboard is on the screen, and waits up to Maestro's usual 7 s to see one. On iOS it is Maestro's own `hideKeyboard`. A path that pressed Back to close the keyboard should record `hideKeyboard`, not `pressKey` Back: after typing, the keyboard may be open while exploring and closed during a replay.

The types are in [`src/adapter.ts`](src/adapter.ts).

## How a trace is written

This adapter has no driver yet, so `ecr` cannot explore a phone by itself. The trace format is the meeting point: any tool that drives a phone can write one, in any language, against [`spec/trace.schema.json`](../../spec/trace.schema.json).

The intended first writer is [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers). Its testers already see each screen as a list of named elements and tap one of them. Recording the name of the element with each tap, instead of its coordinates, is what makes a path replayable.

## Evidence, for tools that show a trace

A step may carry an `evidence` object: what was seen while exploring. It is for people and for tools such as a dashboard. It is never used to compile or to replay, and a flow compiled with or without it runs the same commands.

For mobile traces, the convention is:

| Key | Value |
|---|---|
| `screen` | The number of the screenshot taken just before the action, as text: `"03"` for `03.png` |
| `point` | Where the finger landed, `[x, y]` in real screen pixels |
| `from`, `to` | The two ends of a swipe, `[x, y]` each |
| `size` | The screen, `[width, height]` in the same pixels |
| `bounds` | The element that was under the finger, `[left, top, right, bottom]` |

The screen after a step is the `screen` of the next step. The screen after the last step is `evidence.lastScreen`, at the top of the trace. No key is required, and a tool must accept a step with no evidence.

The vocabulary is also published as a JSON Schema, for tools that are not written in TypeScript: [`vocabulary.schema.json`](vocabulary.schema.json). The schema of a whole trace is [`spec/trace.schema.json`](../../spec/trace.schema.json).

## A finding becomes a check

When the agent reports a problem, write what should be true as a checkpoint of the step where it was seen, with `"observed": "failed"`:

```json
{ "id": "error-is-explained", "check": { "kind": "visible", "target": { "text": "Password too short" } }, "observed": "failed" }
```

The flow asserts it like any other oracle, with a comment above it. The flow is red until the app is fixed, which makes it a reproduction to attach to a bug report. [The command](../../docs/command.md#a-bug-is-a-test-too) gives the rules.

## On a device

[`device/`](device) holds two traces written by hand for Tiny Todo, the demo app of mobile-agent-testers, and the flows they compile to. The `device` workflow builds the app, starts an Android 11 emulator and runs `ecr replay` on them. No model is called.

```text
pass  tiny-todo-first-task (maestro, 61927 ms)
bug   tiny-todo-one-tasks (maestro, 65996 ms)
      oracle_failed  step search  oracle counter-singular: Assertion is false: "1 task" is visible
```

When a flow fails, the replay names the command that failed: a step, or an oracle. It reads this from the record that Maestro keeps under `--debug-output`, and if there is none, from the lines Maestro prints. A step that fails is reported as `target_not_found`, `timeout` or `action_failed`, from the words of Maestro's message. Only the assertion case has been seen on a device so far.

To keep what Maestro wrote for one replay (its record, its screenshots), set `ECR_MAESTRO_DEBUG` to a folder. The record holds the values that were typed: keep it out of public logs.

## Known limits

- Maestro matches text as a regular expression. Literal texts are escaped. The value of a parameter is not: a value with `(` or `.` in it is read as a pattern.
- A literal text cannot contain `${`.
- Values are passed as `maestro test -e NAME=value`, so they are visible in the process list while the flow runs.
- How a failed step is classified (`target_not_found`, `timeout`, `action_failed`) is read from the words of Maestro's message. This is not yet checked on a device.
- A repair has not been tried on a device.
- A tap on a point is replayed as is. It breaks on another screen size.
- `eraseText` erases before the cursor, and Maestro has no command that moves the cursor to the end of a text. A tap with `at` on the end of the field puts it there when the text is shorter than the field.
- Two rules are checked by `ecr validate` and are not in [`vocabulary.schema.json`](vocabulary.schema.json), which cannot say them: `at` is refused when the target is a point, and `from` and `to` go together and move in the `direction`.
