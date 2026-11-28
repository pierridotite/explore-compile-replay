import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { checkSourceMap, outcomeOf, parseTrace } from "../../core/src/index.ts";
import { compileToMaestro, createMaestroAdapter, failedCommand, failedCommandFromOutput, flowCommands, maestroTarget, type MobileAction, type MobileTrace } from "../src/adapter.ts";

const examples = join(import.meta.dirname, "..", "examples");
const adapter = createMaestroAdapter();

function example(): MobileTrace {
  return parseTrace(adapter, JSON.parse(readFileSync(join(examples, "anna-first-item-mobile.trace.json"), "utf8")));
}

/** The example with its steps after launchApp replaced. */
function withSteps(...actions: MobileAction[]): MobileTrace {
  const trace = example();
  return {
    ...trace,
    invariants: [],
    steps: [trace.steps[0]!, ...actions.map((action, index) => ({ id: `t${index + 1}`, action, checkpoints: [] }))],
  };
}

function commands(trace: MobileTrace): string {
  const content = compileToMaestro(trace).content;
  return content.slice(content.indexOf("# Step t1"));
}

test("the flows in examples/ are what the compiler gives today", () => {
  const traces = readdirSync(examples).filter((name) => name.endsWith(".trace.json"));
  assert.deepEqual(traces, ["anna-first-item-mobile.trace.json", "anna-renames-an-item-mobile.trace.json"]);
  for (const name of traces) {
    const artifact = compileToMaestro(parseTrace(adapter, JSON.parse(readFileSync(join(examples, name), "utf8"))));
    assert.equal(artifact.path, name.replace(".trace.json", ".flow.yaml"));
    assert.equal(artifact.content, readFileSync(join(examples, artifact.path), "utf8"));
  }
});

test("L1 and L3: the same trace gives the same bytes, and each step has its own range", () => {
  const trace = example();
  const artifact = compileToMaestro(trace);
  assert.deepEqual(compileToMaestro(trace), artifact);
  assert.deepEqual(checkSourceMap(artifact, trace.steps.map((step) => step.id)), []);
});

test("L7: the flow names its parameters and never holds a value", () => {
  const content = compileToMaestro(example()).content;
  assert.match(content, /- inputText: "\$\{ACCOUNT_PASSWORD\}"/);
  assert.match(content, /maestro test -e ITEM_TITLE=<value> -e ACCOUNT_PASSWORD=<value>/);
});

test("the header names the app of the first step", () => {
  const content = compileToMaestro(example()).content;
  assert.match(content, /^appId: com\.example\.todo$/m);
  assert.match(content, /^---$/m);
});

test("a literal text is escaped, because Maestro matches text as a regular expression", () => {
  const flow = commands(withSteps({ kind: "tapOn", target: { text: "Total: $4.50 (2 items)?" } }));
  assert.match(flow, /text: "Total: \\\\\$4\\\\\.50 \\\\\(2 items\\\\\)\\\\\?"/);
});

test("parameter selectors match replay-time text literally without embedding its value", () => {
  const trace = withSteps({ kind: "tapOn", target: { text: { param: "ITEM_TITLE" } } });
  const artifact = compileToMaestro(trace);
  const line = commands(trace).split("\n").find((line) => line.startsWith("    text:"))!;
  const expression = JSON.parse(line.slice("    text: ".length)) as string;
  // Maestro 2.12.1 Env.evaluateScripts only evaluates expressions without an inner $.
  const script = /\$\{([^$]*)}/.exec(expression);
  assert.equal(script?.[0], expression, "Maestro must evaluate the entire selector expression");
  const values = ["Total: $4.50 (2 items)?", "C++ [draft]", "a.b|c^d*e{2}", "a\\b", "value with (", "\u65e5\u672c\u8a9e + (1)"];
  for (const value of values) {
    assert.equal(artifact.content.includes(value), false);
    const pattern = runInNewContext(script![1]!, { ITEM_TITLE: value }) as string;
    const regex = new RegExp(`^(?:${pattern})$`);
    assert.equal(regex.test(value), true, value);
    assert.equal(regex.test(value + "extra"), false, value);
  }
  const pattern = runInNewContext(script![1]!, { ITEM_TITLE: "a.b" }) as string;
  assert.equal(new RegExp(`^(?:${pattern})$`).test("axb"), false);
  assert.deepEqual(checkSourceMap(artifact, trace.steps.map((step) => step.id)), []);
});

test("typed text is not escaped", () => {
  assert.match(commands(withSteps({ kind: "inputText", text: "a.b (c)" })), /- inputText: "a\.b \(c\)"/);
});

test("every action of the vocabulary compiles", () => {
  const flow = commands(
    withSteps(
      { kind: "tapOn", target: { id: "save_button", index: 1 } },
      { kind: "tapOn", target: { point: "50%,90%" } },
      { kind: "longPressOn", target: { text: "Buy bread" } },
      { kind: "eraseText" },
      { kind: "eraseText", characters: 5 },
      { kind: "pressKey", key: "Enter" },
      { kind: "pressKey", key: "Back" },
      { kind: "swipe", direction: "LEFT" },
      { kind: "scrollUntilVisible", target: { text: "Delete account" }, direction: "DOWN" },
      { kind: "hideKeyboard" },
      { kind: "tapOn", target: { text: "Title" }, at: "97%,50%" },
      { kind: "longPressOn", target: { id: "row", index: 2 }, at: "10%,50%" },
      { kind: "swipe", direction: "UP", from: "50%,80%", to: "50%,35%" },
    ),
  );
  assert.equal(
    flow,
    `# Step t1
- tapOn:
    id: "save_button"
    index: 1
# Step t2
- tapOn:
    point: "50%,90%"
# Step t3
- longPressOn:
    text: "Buy bread"
# Step t4
- eraseText
# Step t5
- eraseText: 5
# Step t6
- pressKey: Enter
# Step t7
- back
# Step t8
- swipe:
    direction: LEFT
# Step t9
- scrollUntilVisible:
    element:
      text: "Delete account"
    direction: DOWN
# Step t10
- runFlow:
    when:
      platform: Android
      visible:
        id: "com\\\\.(google\\\\.)?android\\\\.inputmethod\\\\.latin:id/.*"
    commands:
      - hideKeyboard
- runFlow:
    when:
      platform: iOS
    commands:
      - hideKeyboard
# Step t11
- tapOn:
    text: "Title"
    point: "97%,50%"
# Step t12
- longPressOn:
    id: "row"
    index: 2
    point: "10%,50%"
# Step t13
- swipe:
    start: "50%,80%"
    end: "50%,35%"
`,
  );
});

test("a trace that cannot become a valid flow is refused", () => {
  const trace = example();
  assert.throws(() => compileToMaestro({ ...trace, steps: trace.steps.slice(1) }), /launchApp/);
  assert.throws(() => compileToMaestro({ ...trace, params: [] }), /does not declare/);
  assert.throws(() => compileToMaestro(withSteps({ kind: "inputText", text: "costs ${price}" })), /cannot contain/);
});

test("the vocabulary refuses a check on a point, and an unknown action", () => {
  assert.equal(adapter.oracles.safeParse({ kind: "visible", target: { point: "50%,50%" } }).success, false);
  assert.equal(adapter.actions.safeParse({ kind: "shake" }).success, false);
  assert.equal(adapter.actions.safeParse({ kind: "inputText", text: { param: "not a name" } }).success, false);
});

test("the vocabulary refuses a place in a point, and a swipe whose ends do not go with its direction", () => {
  const ok = (action: unknown): boolean => adapter.actions.safeParse(action).success;
  assert.equal(ok({ kind: "tapOn", target: { text: "Title" }, at: "97%,50%" }), true);
  assert.equal(ok({ kind: "tapOn", target: { point: "50%,50%" }, at: "97%,50%" }), false);
  assert.equal(ok({ kind: "longPressOn", target: { id: "row" }, at: "right" }), false);
  assert.equal(ok({ kind: "tapOn", target: { id: "row" }, at: "100%,0%" }), true);
  assert.equal(ok({ kind: "tapOn", target: { id: "row" }, at: "101%,50%" }), false);
  assert.equal(ok({ kind: "tapOn", target: { point: "50%,120%" } }), false);
  assert.equal(ok({ kind: "swipe", direction: "UP", from: "50%,80%", to: "50%,35%" }), true);
  assert.equal(ok({ kind: "swipe", direction: "UP", from: "50%,80%" }), false);
  assert.equal(ok({ kind: "swipe", direction: "DOWN", from: "50%,80%", to: "50%,35%" }), false);
  assert.equal(ok({ kind: "swipe", from: "50%,80%", to: "50%,35%" }), false);
});

test("evidence is carried by the trace and changes no command of the flow", () => {
  const trace = example();
  assert.deepEqual(trace.steps[1]!.evidence, { screen: "01", point: [540, 460], size: [1080, 2400], bounds: [40, 400, 1040, 520] });
  const without: MobileTrace = { ...trace, steps: trace.steps.map(({ evidence: _evidence, ...step }) => step) };
  const commandsOf = (content: string): string => content.slice(content.indexOf("appId:"));
  assert.equal(commandsOf(compileToMaestro(without).content), commandsOf(compileToMaestro(trace).content));
});

test("an oracle recorded as a bug is asserted like the others, under a comment", () => {
  const trace = withSteps({ kind: "tapOn", target: { text: "Save" } });
  const last = trace.steps.at(-1)!;
  const flow = commands({
    ...trace,
    steps: [
      ...trace.steps.slice(0, -1),
      { ...last, checkpoints: [{ id: "saved", check: { kind: "visible", target: { text: "Saved" } }, observed: "failed" }] },
    ],
  });
  assert.match(flow, /# Oracle saved\n# Known bug: [^\n]+\n- assertVisible:\n {4}text: "Saved"/);
});

const device = join(import.meta.dirname, "..", "device");

function deviceTrace(name: string): MobileTrace {
  return parseTrace(adapter, JSON.parse(readFileSync(join(device, `${name}.trace.json`), "utf8")));
}

/**
 * A stand-in for the `maestro` command: it writes the record of a run in
 * which the command at `failAt` failed, in the shape Maestro gives to
 * `--debug-output`, and exits like Maestro does.
 */
function fakeMaestro(dir: string, total: number, failAt: number | undefined, message: string): string {
  const entries = [
    { command: { defineVariablesCommand: {} }, metadata: { status: "COMPLETED", sequenceNumber: 0 } },
    { command: { applyConfigurationCommand: {} }, metadata: { status: "COMPLETED", sequenceNumber: 1 } },
    ...Array.from({ length: failAt === undefined ? total : failAt + 1 }, (_, index) => ({
      command: { tapOnElement: {} },
      metadata: { sequenceNumber: index + 2, ...(index === failAt ? { status: "FAILED", error: { message, debugMessage: "longer text" } } : { status: "COMPLETED" }) },
    })),
  ];
  const record = join(dir, "record.json");
  writeFileSync(record, JSON.stringify(entries));
  const script = join(dir, "maestro");
  writeFileSync(
    script,
    [
      "#!/usr/bin/env bash",
      'while [ $# -gt 0 ]; do [ "$1" = "--debug-output" ] && out="$2"; shift; done',
      // Maestro 2.12.1 writes the record in a folder named after the flow.
      'mkdir -p "$out/anna: a flow" && cp "$(dirname "$0")/record.json" "$out/anna: a flow/commands.json"',
      `exit ${failAt === undefined ? 0 : 1}`,
      "",
    ].join("\n"),
  );
  chmodSync(script, 0o755);
  return script;
}

test("the flows in device/ are what the compiler gives today", () => {
  for (const name of ["tiny-todo-first-task", "tiny-todo-one-tasks"]) {
    const artifact = compileToMaestro(deviceTrace(name));
    assert.equal(artifact.content, readFileSync(join(device, artifact.path), "utf8"));
  }
});

test("flowCommands names the step and the oracle of each command, in order", () => {
  const trace = deviceTrace("tiny-todo-one-tasks");
  const commands = flowCommands(compileToMaestro(trace));
  // One command per step (two for hideKeyboard: one runFlow per platform),
  // and after each step its checkpoints then the invariant.
  const expected = trace.steps.flatMap((step) => [
    ...(step.action.kind === "hideKeyboard" ? [{ stepId: step.id }, { stepId: step.id }] : [{ stepId: step.id }]),
    ...[...step.checkpoints, ...trace.invariants].map((oracle) => ({ stepId: step.id, oracleId: oracle.id })),
  ]);
  assert.ok(trace.steps.some((step) => step.action.kind === "hideKeyboard"));
  assert.deepEqual(commands, expected);
});

test("replay: a failed assertion comes back as the oracle it checks, and a recorded bug is told from a regression", async () => {
  const trace = deviceTrace("tiny-todo-one-tasks");
  const artifact = compileToMaestro(trace);
  const commands = flowCommands(artifact);
  const params = { NAME: "Anna", EMAIL: "anna@example.com", PASSWORD: "long-enough-1" };
  const dir = mkdtempSync(join(tmpdir(), "ecr-fake-maestro-"));
  try {
    const run = (failAt: number | undefined, message = "Assertion is false") =>
      maestroTarget({ command: fakeMaestro(dir, commands.length, failAt, message) }).replay(artifact, { params });

    // The oracle recorded as a bug fails: the bug is still there.
    const bugAt = commands.findIndex((command) => command.oracleId === "counter-singular");
    const bug = await run(bugAt);
    assert.deepEqual(bug.divergences, [{ type: "oracle_failed", oracleId: "counter-singular", stepId: "search", message: "Assertion is false" }]);
    assert.equal(outcomeOf(trace, bug), "known_bug");

    // A guard fails earlier: a regression.
    const guard = await run(commands.findIndex((command) => command.oracleId === "four-tasks"));
    assert.equal(outcomeOf(trace, guard), "fail");

    // A step does not find its target. The value of a parameter never reaches the report.
    const stepAt = commands.findIndex((command) => command.stepId === "continue" && command.oracleId === undefined);
    const step = await run(stepAt, 'Element not found: Text matching regex: Continue (typed "long-enough-1")');
    assert.deepEqual(
      step.divergences.map((divergence) => [divergence.type, divergence.stepId]),
      [["target_not_found", "continue"]],
    );
    assert.equal(JSON.stringify(step).includes("long-enough-1"), false);
    assert.match(step.divergences[0]!.message!, /\$\{PASSWORD\}/);

    // Everything holds: the bug is gone.
    assert.equal(outcomeOf(trace, await run(undefined)), "fixed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("failedCommand gives nothing, rather than a guess, when the record has another shape", () => {
  const commands = flowCommands(compileToMaestro(deviceTrace("tiny-todo-first-task")));
  assert.equal(failedCommand({ not: "a list" }, commands), undefined);
  assert.equal(failedCommand([{ command: { tapOnElement: {} }, metadata: { status: "COMPLETED" } }], commands), undefined);
  const tooMany = Array.from({ length: commands.length + 1 }, () => ({ command: { tapOnElement: {} }, metadata: { status: "FAILED" } }));
  assert.equal(failedCommand(tooMany, commands), undefined);
});

test("failedCommandFromOutput reads what Maestro 2.12.1 prints on an emulator", () => {
  const trace = deviceTrace("tiny-todo-one-tasks");
  const commands = flowCommands(compileToMaestro(trace));
  // Copied from a run on an Android emulator, shortened in the middle.
  const done = (count: number): string[] => Array.from({ length: count }, (_, index) => `Command ${index + 1}... COMPLETED`);
  const failAt = commands.findIndex((command) => command.oracleId === "counter-singular");
  const output = [
    "Running on test",
    " > Flow anna: Find the task about apples.",
    'Launch app "com.example.tinytodo" with clear state... COMPLETED',
    ...done(failAt - 1),
    'Assert that "1 task" is visible... FAILED',
    "",
    'Assertion is false: "1 task" is visible',
    "",
    "Assertion '\"1 task\" is visible' failed. Check the UI hierarchy in debug artifacts to verify the element state and properties.",
    "",
    "==== Debug output (logs & screenshots) ====",
  ].join("\n");
  assert.deepEqual(failedCommandFromOutput(output, commands), {
    command: { stepId: "search", oracleId: "counter-singular" },
    message: 'Assertion is false: "1 task" is visible',
  });
  assert.equal(failedCommandFromOutput(done(3).join("\n"), commands), undefined);
  assert.equal(failedCommandFromOutput([...done(commands.length), "One more... FAILED"].join("\n"), commands), undefined);
});

test("the keyboard is hidden inside a runFlow, and what runs inside it shifts no later command", () => {
  const trace = deviceTrace("tiny-todo-one-tasks");
  const artifact = compileToMaestro(trace);
  assert.match(artifact.content, /# Step keyboard[^\n]*\n- runFlow:\n {4}when:\n {6}platform: Android\n {6}visible:\n/);
  const commands = flowCommands(artifact);
  const keyboard = commands.findIndex((command) => command.stepId === "keyboard");
  const failAt = commands.findIndex((command) => command.oracleId === "counter-singular");
  assert.ok(keyboard > 0 && failAt > keyboard);

  // The record: Maestro adds two commands, then one entry per command of the flow, and one
  // more for the hideKeyboard that ran inside the runFlow of the Android phone.
  const entry = (sequenceNumber: number, kind: string, status: string) => ({ command: { [kind]: {} }, metadata: { status, sequenceNumber } });
  const record = [entry(0, "defineVariablesCommand", "COMPLETED"), entry(1, "applyConfigurationCommand", "COMPLETED")];
  for (let index = 0; index <= failAt; index += 1) {
    record.push(entry(record.length, index === keyboard || index === keyboard + 1 ? "runFlowCommand" : "tapOnElement", index === failAt ? "FAILED" : index === keyboard + 1 ? "SKIPPED" : "COMPLETED"));
    if (index === keyboard) record.push(entry(record.length, "hideKeyboardCommand", "COMPLETED"));
  }
  assert.deepEqual(failedCommand(record, commands), { command: { stepId: "search", oracleId: "counter-singular" } });

  // A keyboard that cannot be hidden fails its runFlow too: the step is the one that hides it.
  const stuck = Array.from({ length: keyboard + 1 }, (_, index) =>
    entry(index, index === keyboard ? "runFlowCommand" : "tapOnElement", index === keyboard ? "FAILED" : "COMPLETED"),
  );
  stuck.push(entry(keyboard + 1, "hideKeyboardCommand", "FAILED"));
  assert.deepEqual(failedCommand(stuck, commands), { command: { stepId: "keyboard" } });

  // The same in what Maestro prints, where the command inside the runFlow is indented.
  const output = [
    ...Array.from({ length: keyboard }, (_, index) => `Command ${index + 1}... COMPLETED`),
    'Run flow when "com.(google.)?android.inputmethod.latin:id/.*" is visible... COMPLETED',
    "  Hide Keyboard... COMPLETED",
    "Run flow when platform is iOS... SKIPPED",
    ...Array.from({ length: failAt - keyboard - 2 }, (_, index) => `Command ${keyboard + 3 + index}... COMPLETED`),
    'Assert that "1 task" is visible... FAILED',
    "",
    'Assertion is false: "1 task" is visible',
  ].join("\n");
  assert.deepEqual(failedCommandFromOutput(output, commands), {
    command: { stepId: "search", oracleId: "counter-singular" },
    message: 'Assertion is false: "1 task" is visible',
  });
});
