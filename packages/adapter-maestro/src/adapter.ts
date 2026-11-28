/**
 * Mobile adapter, first slice: a vocabulary for mobile apps and a target
 * that compiles a trace to a Maestro flow (https://maestro.dev).
 *
 * What is here: the vocabulary, the compiler, and a replay that runs
 * `maestro test` and names the command that failed.
 * What is not: a driver (exploring is done outside, see the README of this
 * package).
 *
 * Status: draft.
 */
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import {
  defineAdapter,
  type Adapter,
  type ReplayOptions,
  type SystemDriver,
  type Target,
  type TypedTrace,
} from "../../../spec/contract.ts";
import type { CompiledArtifact, Divergence, ReplayResult, SourceRange } from "../../../spec/schema.ts";
import { hashTrace, isParamRef } from "../../core/src/index.ts";

/** A literal, or the name of a parameter supplied at replay time. */
const Text = z.union([z.string().min(1), z.strictObject({ param: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/) })]);
type Text = z.infer<typeof Text>;

/** A point in percent, from "0%,0%" to "100%,100%": of the screen, or of an element when it says where in the element. */
const Percent = z.string().regex(/^(100|\d{1,2})%,(100|\d{1,2})%$/);

/**
 * How a step finds its target. In order of preference: an accessibility id,
 * a visible text, and as a last resort a point on the screen in percent.
 */
const Selector = z.union([
  z.strictObject({ id: z.string().min(1), index: z.number().int().nonnegative().optional() }),
  z.strictObject({ text: Text, index: z.number().int().nonnegative().optional() }),
  z.strictObject({ point: Percent }),
]);
type Selector = z.infer<typeof Selector>;

/**
 * `at` says where in the element a press lands, in percent of its box
 * ("0%,0%" is its top left corner). Without it the press lands on the centre.
 * It has no meaning on a point of the screen.
 */
const atIsInsideAnElement = (action: { target: Selector; at?: string | undefined }): boolean => action.at === undefined || !("point" in action.target);
const atNeedsAnElement = { message: "`at` says where in an element: the target cannot be a point", path: ["at"] };

/**
 * A swipe has the direction the finger moves in. `from` and `to` are the two
 * points of the screen where it starts and stops: with them the replay moves
 * the finger between the same two points, without them over Maestro's own length.
 */
const Direction = z.enum(["UP", "DOWN", "LEFT", "RIGHT"]);
function movesIn(direction: z.infer<typeof Direction>, from: string, to: string): boolean {
  const [x1 = 0, y1 = 0] = from.split(",").map((part) => parseInt(part, 10));
  const [x2 = 0, y2 = 0] = to.split(",").map((part) => parseInt(part, 10));
  return { UP: y2 < y1, DOWN: y2 > y1, LEFT: x2 < x1, RIGHT: x2 > x1 }[direction];
}
const swipeEndsAgree = (action: { direction: z.infer<typeof Direction>; from?: string | undefined; to?: string | undefined }): boolean =>
  action.from === undefined || action.to === undefined ? action.from === action.to : movesIn(action.direction, action.from, action.to);
const swipeEndsMustAgree = { message: "`from` and `to` go together, and the finger must move in the `direction` of the swipe" };

/** A selector that names an element. A check cannot be made on a point. */
const ElementSelector = z.union([
  z.strictObject({ id: z.string().min(1), index: z.number().int().nonnegative().optional() }),
  z.strictObject({ text: Text, index: z.number().int().nonnegative().optional() }),
]);

export const actions = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("launchApp"), appId: z.string().regex(/^[A-Za-z0-9._-]+$/), clearState: z.boolean().optional() }),
  z.strictObject({ kind: z.literal("tapOn"), target: Selector, at: Percent.optional() }).refine(atIsInsideAnElement, atNeedsAnElement),
  z.strictObject({ kind: z.literal("longPressOn"), target: Selector, at: Percent.optional() }).refine(atIsInsideAnElement, atNeedsAnElement),
  z.strictObject({ kind: z.literal("inputText"), text: Text }),
  z.strictObject({ kind: z.literal("eraseText"), characters: z.number().int().positive().optional() }),
  z.strictObject({ kind: z.literal("pressKey"), key: z.enum(["Enter", "Backspace", "Home", "Back"]) }),
  z.strictObject({ kind: z.literal("swipe"), direction: Direction, from: Percent.optional(), to: Percent.optional() }).refine(swipeEndsAgree, swipeEndsMustAgree),
  z.strictObject({ kind: z.literal("scrollUntilVisible"), target: ElementSelector, direction: Direction.optional() }),
  z.strictObject({ kind: z.literal("hideKeyboard") }),
]);
export type MobileAction = z.infer<typeof actions>;

export const oracles = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("visible"), target: ElementSelector }),
  z.strictObject({ kind: z.literal("notVisible"), target: ElementSelector }),
]);
export type MobileOracle = z.infer<typeof oracles>;

export type MobileTrace = TypedTrace<MobileAction, MobileOracle>;

/** The keys of a keyboard on an Android phone: Gboard, or the keyboard of the emulator. */
const ANDROID_KEYBOARD = "com\\.(google\\.)?android\\.inputmethod\\.latin:id/.*";

/** A YAML double-quoted string. JSON strings are valid YAML. */
function quoted(value: string): string {
  return JSON.stringify(value);
}

/** Maestro reads `${...}` as an expression. A literal cannot contain one. */
function literal(value: string, where: string): string {
  if (value.includes("${")) throw new Error(`${where}: a literal text cannot contain "\${". Use a parameter.`);
  return value;
}

/** Text typed as is: a literal, or `${NAME}`, which Maestro replaces at run time. */
function plainText(text: Text, where: string): string {
  return quoted(isParamRef(text) ? `\${${text.param}}` : literal(text as string, where));
}

/** Maestro matches regular expressions: escape literals now and parameter values at replay time. */
function matchedText(text: Text, where: string): string {
  if (isParamRef(text)) return quoted("${" + text.param + String.raw`.replace(/[\\^\x24.|?*+()[\]{}]/g, '\\\x24&')}`);
  return quoted(literal(text as string, where).replace(/[\\^$.|?*+()[\]{}]/g, "\\$&"));
}

function selectorLines(selector: Selector, where: string): string[] {
  if ("point" in selector) return [`    point: ${quoted(selector.point)}`];
  const first = "id" in selector ? `    id: ${quoted(literal(selector.id, where))}` : `    text: ${matchedText(selector.text, where)}`;
  return selector.index === undefined ? [first] : [first, `    index: ${selector.index}`];
}

function actionLines(action: MobileAction, where: string): string[] {
  switch (action.kind) {
    case "launchApp":
      return action.clearState === undefined ? ["- launchApp"] : ["- launchApp:", `    clearState: ${action.clearState}`];
    case "tapOn":
    case "longPressOn":
      return [`- ${action.kind}:`, ...selectorLines(action.target, where), ...(action.at === undefined ? [] : [`    point: ${quoted(action.at)}`])];
    case "inputText":
      return [`- inputText: ${plainText(action.text, where)}`];
    case "eraseText":
      return [action.characters === undefined ? "- eraseText" : `- eraseText: ${action.characters}`];
    case "pressKey":
      return [action.key === "Back" ? "- back" : `- pressKey: ${action.key}`];
    case "swipe":
      return action.from === undefined || action.to === undefined
        ? ["- swipe:", `    direction: ${action.direction}`]
        : ["- swipe:", `    start: ${quoted(action.from)}`, `    end: ${quoted(action.to)}`];
    case "scrollUntilVisible":
      return [
        "- scrollUntilVisible:",
        "    element:",
        ...selectorLines(action.target, where).map((line) => `  ${line}`),
        ...(action.direction === undefined ? [] : [`    direction: ${action.direction}`]),
      ];
    case "hideKeyboard":
      // On Android, Maestro 2.12.1 hides the keyboard with Back, also when no keyboard is open,
      // and Back then leaves the screen. So the flow hides it only while a keyboard is on the screen.
      return [
        "- runFlow:",
        "    when:",
        "      platform: Android",
        "      visible:",
        `        id: ${quoted(ANDROID_KEYBOARD)}`,
        "    commands:",
        "      - hideKeyboard",
        "- runFlow:",
        "    when:",
        "      platform: iOS",
        "    commands:",
        "      - hideKeyboard",
      ];
  }
}

function oracleLines(oracle: MobileOracle, where: string): string[] {
  const command = oracle.kind === "visible" ? "assertVisible" : "assertNotVisible";
  return [`- ${command}:`, ...selectorLines(oracle.target, where)];
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function paramNames(value: unknown): string[] {
  if (isParamRef(value)) return [value.param];
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(paramNames);
  return [];
}

/** Pure: the same trace gives the same bytes. */
export function compileToMaestro(trace: MobileTrace): CompiledArtifact {
  const first = trace.steps[0]?.action;
  if (first?.kind !== "launchApp") throw new Error("The first step of a mobile trace must be launchApp: it names the app");
  const declared = trace.params.map((entry) => entry.name);
  for (const name of paramNames([trace.steps, trace.invariants])) {
    if (!declared.includes(name)) throw new Error(`The trace uses parameter ${name} but does not declare it`);
  }

  const traceHash = hashTrace(trace);
  const lines: string[] = [
    "# Compiled by Explore-Compile-Replay: https://github.com/pierridotite/explore-compile-replay",
    `# Trace: ${oneLine(trace.id)}`,
    `# Trace hash: sha256:${traceHash}`,
    "# Do not edit by hand. Change the trace and compile again.",
    declared.length === 0
      ? "# Run: maestro test <this file>"
      : `# Run: maestro test ${declared.map((name) => `-e ${name}=<value>`).join(" ")} <this file>`,
    `appId: ${first.appId}`,
    `name: ${quoted(oneLine(`${trace.persona.id}: ${trace.persona.goal}`))}`,
    "---",
  ];
  const sourceMap: SourceRange[] = [];

  for (const step of trace.steps) {
    const startLine = lines.length + 1;
    const where = `step ${step.id}`;
    lines.push(`# Step ${oneLine(step.id)}${step.intent === undefined ? "" : `: ${oneLine(step.intent)}`}`);
    lines.push(...actionLines(step.action, where));
    for (const oracle of [...step.checkpoints, ...trace.invariants]) {
      lines.push(`# Oracle ${oneLine(oracle.id)}`);
      if (oracle.observed === "failed") {
        lines.push("# Known bug: this check was false when the trace was recorded. It fails until the bug is fixed.");
      }
      lines.push(...oracleLines(oracle.check, `oracle ${oracle.id}`));
    }
    sourceMap.push({ stepId: step.id, startLine, endLine: lines.length });
  }
  lines.push("");

  return {
    target: "maestro",
    path: `${trace.id.replace(/[^A-Za-z0-9._-]/g, "-")}.flow.yaml`,
    content: lines.join("\n"),
    traceHash,
    sourceMap,
  };
}

export interface MaestroTargetOptions {
  /** The Maestro command. Default: `maestro`, found on the PATH. */
  readonly command?: string;
}

/** Where a command of the flow comes from: a step, or an oracle checked after a step. */
export interface FlowCommand {
  readonly stepId: string;
  readonly oracleId?: string;
}

/**
 * The commands of a compiled flow, in the order Maestro runs them.
 * A command is a line that starts a list item. Its step comes from the
 * source map, and the comment above an oracle names it.
 */
export function flowCommands(artifact: CompiledArtifact): FlowCommand[] {
  const lines = artifact.content.split("\n");
  const commands: FlowCommand[] = [];
  let oracleId: string | undefined;
  lines.forEach((line, index) => {
    if (line.startsWith("# Step ")) oracleId = undefined;
    else if (line.startsWith("# Oracle ")) oracleId = line.slice("# Oracle ".length);
    else if (line.startsWith("- ")) {
      const range = artifact.sourceMap.find((entry) => entry.startLine <= index + 1 && index + 1 <= entry.endLine);
      if (!range) throw new Error(`Line ${index + 1} of the flow is a command outside of every step`);
      commands.push(oracleId === undefined ? { stepId: range.stepId } : { stepId: range.stepId, oracleId });
    }
  });
  return commands;
}

/**
 * One entry of the `commands.json` file that Maestro writes under `--debug-output`,
 * in a folder named after the flow. Seen with Maestro 2.12.1. The file holds the
 * values that were typed, so it is read here and never copied into a report.
 */
interface RecordedCommand {
  readonly command?: Record<string, unknown>;
  readonly metadata?: { readonly status?: string; readonly sequenceNumber?: number; readonly error?: { readonly message?: string } };
}

/** Commands that Maestro adds by itself before the ones of the flow. */
const ADDED_BY_MAESTRO = new Set(["applyConfigurationCommand", "defineVariablesCommand"]);

/**
 * Commands that a flow runs only inside a `runFlow`. Maestro records them too, next to
 * their `runFlow`, when they run. The `runFlow` is the command of the step: a failure
 * inside it fails the `runFlow` too.
 */
const NESTED = new Set(["hideKeyboardCommand"]);
/** The same commands, as Maestro prints them. */
const NESTED_LINE = /^\s*Hide keyboard\.\.\. [A-Z]+$/i;

/**
 * Reads what Maestro recorded and names the command that failed.
 * Returns nothing when the record does not have the expected shape: the
 * caller then reports that the flow could not be read, never a guess.
 */
export function failedCommand(recorded: unknown, commands: readonly FlowCommand[]): { command: FlowCommand; message?: string } | undefined {
  if (!Array.isArray(recorded)) return undefined;
  const inOrder = [...(recorded as RecordedCommand[])].sort((a, b) => (a.metadata?.sequenceNumber ?? 0) - (b.metadata?.sequenceNumber ?? 0));
  const ours = inOrder.filter((entry) => {
    const kinds = Object.keys(entry.command ?? {});
    return kinds.length > 0 && !kinds.some((kind) => ADDED_BY_MAESTRO.has(kind) || NESTED.has(kind));
  });
  if (ours.length > commands.length) return undefined;
  const index = ours.findIndex((entry) => entry.metadata?.status === "FAILED");
  const command = commands[index];
  if (index === -1 || !command) return undefined;
  const message = ours[index]?.metadata?.error?.message;
  return message === undefined ? { command } : { command, message };
}

/**
 * The same answer from what Maestro prints when it is not in a terminal:
 * one line per command, in order, that ends with its status.
 *
 *   Tap on "Continue"... COMPLETED
 *   Assert that "1 task" is visible... FAILED
 *
 *   Assertion is false: "1 task" is visible
 *
 * Seen with Maestro 2.12.1 on an Android emulator. Used when the record is missing.
 */
export function failedCommandFromOutput(output: string, commands: readonly FlowCommand[]): { command: FlowCommand; message?: string } | undefined {
  const lines = output.split("\n").map((line) => line.trimEnd());
  let index = -1;
  for (const [at, line] of lines.entries()) {
    const status = /\.\.\. ([A-Z]+)$/.exec(line)?.[1];
    if (status === undefined || NESTED_LINE.test(line)) continue;
    index += 1;
    if (status !== "FAILED") continue;
    const command = commands[index];
    if (!command) return undefined;
    const message = lines.slice(at + 1).find((next) => next.trim() !== "")?.trim();
    return message === undefined ? { command } : { command, message };
  }
  return undefined;
}

function toDivergence(failed: { command: FlowCommand; message?: string }): Divergence {
  const message = failed.message === undefined ? {} : { message: failed.message };
  const { stepId, oracleId } = failed.command;
  if (oracleId !== undefined) return { type: "oracle_failed", oracleId, stepId, ...message };
  const text = failed.message ?? "";
  const type = /timed? ?out/i.test(text) ? "timeout" : /not found|no visible element/i.test(text) ? "target_not_found" : "action_failed";
  return { type, stepId, ...message };
}

/** Values of parameters must not reach a report: each one is replaced by its name. */
function withoutValues(text: string, params: Readonly<Record<string, string>>): string {
  let result = text;
  for (const [name, value] of Object.entries(params)) {
    if (value.length >= 3) result = result.split(value).join(`\${${name}}`);
  }
  return result;
}

export function maestroTarget(options: MaestroTargetOptions = {}): Target<MobileAction, MobileOracle> {
  return {
    id: "maestro",
    compile: compileToMaestro,
    async replay(artifact: CompiledArtifact, replayOptions?: ReplayOptions): Promise<ReplayResult> {
      const params = replayOptions?.params ?? {};
      const dir = await mkdtemp(join(tmpdir(), "ecr-maestro-"));
      const started = performance.now();
      try {
        const file = join(dir, "replay.flow.yaml");
        const debug = join(dir, "debug");
        await writeFile(file, artifact.content);
        // Maestro takes values as `-e NAME=value`. They are visible in the process list while the flow runs.
        const values = Object.entries(params).flatMap(([name, value]) => ["-e", `${name}=${value}`]);
        const args = ["test", "--debug-output", debug, "--flatten-debug-output", ...values, file];
        const run = await new Promise<{ code: number; output: string }>((done, fail) => {
          execFile(options.command ?? "maestro", args, { timeout: 15 * 60_000 }, (error, stdout, stderr) => {
            if (error && typeof error.code !== "number") fail(new Error(`Could not run Maestro: ${error.message}`));
            else done({ code: error ? (error.code as number) : 0, output: `${stdout}\n${stderr}` });
          });
        });
        const durationMs = performance.now() - started;
        if (run.code === 0) return { verdict: "pass", divergences: [], durationMs };

        // Which command failed is read from the record Maestro keeps, and if it has none, from what it prints.
        const commands = flowCommands(artifact);
        const report = (failed: { command: FlowCommand; message?: string }): ReplayResult => {
          const divergence = toDivergence(failed);
          const message = divergence.message === undefined ? {} : { message: withoutValues(divergence.message, params) };
          return { verdict: "fail", divergences: [{ ...divergence, ...message }], durationMs };
        };
        const names = (await readdir(debug, { recursive: true }).catch(() => [])).filter((name) => /(^|[\\/])commands[^\\/]*\.json$/.test(name)).sort();
        for (const name of names) {
          let recorded: unknown;
          try {
            recorded = JSON.parse(await readFile(join(debug, name), "utf8"));
          } catch {
            continue;
          }
          const failed = failedCommand(recorded, commands);
          if (failed) return report(failed);
        }
        const printed = failedCommandFromOutput(run.output, commands);
        if (printed) return report(printed);
        throw new Error(`The flow failed, and Maestro does not say on which command. Its output:\n${withoutValues(run.output, params)}`);
      } finally {
        // For someone who debugs a flow: keep what Maestro wrote (its record, its screenshots).
        const keep = process.env.ECR_MAESTRO_DEBUG;
        if (keep) await cp(dir, join(keep, artifact.path), { recursive: true }).catch(() => undefined);
        await rm(dir, { recursive: true, force: true });
      }
    },
  };
}

const notWritten = async (): Promise<never> => {
  throw new Error("The mobile adapter has no driver yet: explore with your own tool and write the trace (see packages/adapter-maestro/README.md)");
};

/** Exploring through ECR is not written yet for mobile. The trace format is the meeting point. */
const driver: SystemDriver<unknown, MobileAction, MobileOracle> = {
  capabilities: { snapshot: false },
  setup: notWritten,
  teardown: notWritten,
  observe: notWritten,
  execute: notWritten,
  verify: notWritten,
};

export function createMaestroAdapter(options: MaestroTargetOptions = {}): Adapter<unknown, MobileAction, MobileOracle> {
  return defineAdapter({ id: "mobile-maestro", actions, oracles, driver, targets: [maestroTarget(options)] });
}
