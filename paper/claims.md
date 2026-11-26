# Claims and their sources

Status: version of 2026-11-26, the first public version. Every number and every fact of the paper is listed here with the file that holds it and the command that reads it. A number that is not in this file must not be in the paper.

Every result of Section 6 of the paper comes from a file in `results/`. The public lines of each run page are copied in `results/lines/`.

## 1. Facts about the code of ECR

All of them were checked at commit `c35dfed3ef7fe6a5ab7b4e5ad20e3a964e606d38` of the repository, on 2026-11-25, with Node 22 and pnpm 10: the commit to which the measured runs on LocalSend pin ECR. Between `f6bcf4b` and `c35dfed` the code changed only in the command line (`ecr replay --times`, `--report`) and its tests, so the sizes below are the same; the test count went from 68 to 69. The first draft cited `9737ba6`; between it and `f6bcf4b`, only the Maestro adapter changed (its source, its tests, its README, its vocabulary schema and one new example), so the rows on the schema, the contract, the core, the kit and the reference adapter give the same numbers at both commits.

| Claim in the paper | Where | Source | Command |
|---|---|---|---|
| The test suite passes: 69 tests | Sections 5 and 6.4 | Output of the test runner: `# tests 69`, `# pass 69`, `# fail 0` | `pnpm install --frozen-lockfile && pnpm check` |
| Conformance report of the reference adapter: L1, L2, L3, L5 and L7 pass, L6 is partial, L4 is partial with the network open | Table 2, Sections 4 and 6.4 | Report printed by the kit | `pnpm conformance` |
| L4 passes with the network closed | Table 2, Section 4 | Job `no-network` (139455256600) of the CI run 45685034575 on that commit (earlier: run 45658528918 at `f6bcf4b`, run 45628579367 at `9737ba6`). Its log holds the line `L4  No model      pass     no artifact imports a known model SDK, and every compile and replay ran with the network closed` | `gh api repos/<owner>/explore-compile-replay/commits/c35dfed/check-runs`, then the log of the job |
| The kit compiles each trace twice, replays three times, compares with an instrumented system, searches the value of each secret parameter, tries the action of another step on each step | Section 4 | `packages/conformance/src/index.ts` | Reading |
| Schema: 85 lines. Contract: 57 lines | Section 5 | `spec/schema.ts`, `spec/contract.ts` | `node paper/scripts/code_lines.ts spec/schema.ts spec/contract.ts` |
| Core: 337 lines | Section 5 | `packages/core/src/index.ts` (218) and `repair.ts` (119) | `node paper/scripts/code_lines.ts packages/core/src/index.ts packages/core/src/repair.ts` |
| Conformance kit: 260 lines | Section 5 | `packages/conformance/src/index.ts` | `node paper/scripts/code_lines.ts packages/conformance/src/index.ts` |
| Reference adapter: 302 lines | Section 5 | `adapter.ts` (271), `index.ts` (3), `instrumented.ts` (28). The toy system (`todo.ts`, 38) and the example data (`example.ts`, 75) are left out | `pnpm size` |
| Mobile adapter: 298 lines | Section 5 | `adapter.ts` (295), `index.ts` (3) | `pnpm size` |
| Mobile vocabulary: nine actions, two checks | Section 5 | `packages/adapter-maestro/src/adapter.ts`, the two unions `actions` and `oracles` | Reading |
| A press can say where in its element it lands, a swipe can keep its two ends | Section 5 | Same file: the optional `at` of `tapOn` and `longPressOn` (refused on a point target, compiled to Maestro's relative `point`), the optional `from` and `to` of `swipe` (compiled to `start` and `end`). Commit `542d5c9` | Reading, and `packages/adapter-maestro/test/maestro.test.ts` |
| Five types of divergence, four outcomes of a replay | Sections 3.3 and 3.4 | `spec/schema.ts` (`Divergence`), `packages/core/src/index.ts` (`outcomeOf`) | Reading |
| The five checks of the repair guard, in that order | Section 3.5 | `packages/core/src/repair.ts` | Reading |
| What the guard accepts and refuses on the reference adapter | Section 6.4 | `packages/adapter-fixture/test/repair.test.ts`, 7 tests | `node --test packages/adapter-fixture/test/repair.test.ts` |
| Figure 2: step `s8` and the lines it compiles to | Section 3.3 | `packages/adapter-maestro/examples/anna-first-item-mobile.trace.json` and `.flow.yaml`, lines 54 to 65 | Reading. A test checks that the file is what the compiler gives |
| Figure 3: the contract | Section 4 | `spec/contract.ts`, without its comments and `readonly` modifiers | Reading |
| A compiled test file imports only the test runner of Node.js and the system under test | Abstract, Section 3 | `packages/adapter-fixture/examples/anna-first-item.test.mjs`, lines 6 to 9 | Reading |
| The Maestro target maps a failed command to a step or an oracle, and reads the type of a step failure from the message | Section 5 | `packages/adapter-maestro/src/adapter.ts`: `flowCommands`, `failedCommand`, `failedCommandFromOutput`, `toDivergence` | Reading, and the tests of `packages/adapter-maestro/test/maestro.test.ts` |
| Licence, language, one runtime dependency, Node 22 | Section 5 | `LICENSE`, `package.json` | Reading |

The sizes are lines that are neither blank nor comments. `pnpm size` lists the adapters only. `paper/scripts/code_lines.ts` applies the same function to other files.

## 2. Runs on a device

| Claim in the paper | Where | Source |
|---|---|---|
| A CI job replays two compiled flows on an Android 11 emulator, with no model | Section 5 | `.github/workflows/device.yml` (API level 30, Maestro 2.12.1), `packages/adapter-maestro/device/replay.sh` |
| The two traces were written by hand | Section 5 | `provenance.agent` of `packages/adapter-maestro/device/*.trace.json`: "written by hand from the source of the demo app" |
| The first replay passed, the second stopped on the oracle recorded as failed and was reported as a known bug | Section 5 | Log of the job `android` of the run 45628577713 (2026-11-25, commit `9737ba6`): `pass  tiny-todo-first-task` and `bug   tiny-todo-one-tasks`, with `oracle_failed  step search  oracle counter-singular`. The run 45627233597, one commit earlier (`1efc8ad`), gave the same two lines |
| The counter reads "1 tasks" | Section 5 | Bug 8 of `demo-app/BUGS.md` in mobile-agent-testers, and the intent of the last step of `tiny-todo-one-tasks.trace.json` |

The device workflow has not been run again at `f6bcf4b` or `c35dfed`: the paper says these runs were at `9737ba6`. These runs are trials, not measures: two traces, two runs. Their times are in the logs and are not cited in the paper. The first run of the workflow (45625317225, commit `f4b7564`) failed: the flows ran, but the target could not yet read which command had failed.

Two more trials replayed the path of an agent. They are runs of mobile-agent-testers, not of ECR. The first one:

| Claim in the paper | Where | Source |
|---|---|---|
| The tool replayed the path of an agent on the same emulator right after the exploration | Section 7 | Run 45631069149 of mobile-agent-testers (2026-11-25, commit `d04b821`, input `replay_path`), job `android (anna, ...)`, on the demonstration application. Its log shows ECR checked out at `9737ba6` and Maestro 2.12.1 |
| No model key in the environment | Section 7 | `scripts/ecr_replay.py` at that commit: `tool_env` removes every variable whose name contains `KEY`, `TOKEN`, `SECRET`, `PASSPHRASE` or `PASSWORD`, and every variable that starts with `LLM_` or with the prefix of the model vendor or of its agent |
| No edit in between | Section 7 | `scripts/android/run_agent.sh` at that commit: the same job writes the trace (`scripts/ecr_trace.py`), then validates, compiles and replays it (`scripts/ecr_replay.py`) |
| 72 steps. The replay stopped at step 12 with `target_not_found`, on a tap that names one of several elements with the same text | Section 7 | Two lines of the public log of the job: `trace: 72 steps, 6 typed texts kept apart, 1 commands left out` and `replay: stopped at step 12 of 72 (target_not_found, tapOn by name, one of several), after 59 s`. "one of several" is printed when the target of the step has an `index` (`kind_of` in `scripts/ecr_replay.py`) |
| The recorder counted a button and its label as two elements where Maestro finds one | Section 7 | `target_at` in `scripts/ecr_trace.py` at `d04b821` gives the position of the tapped element among all the elements with the same name, in the order of the screen dump. At `65dfbbc`, `found_by` keeps only the deepest elements with that name, counted from the top then from the left. The run below prints `check: "Continue" names 2 elements of the tree, 1 for the replay` |
| A check with no model reproduced the stop on the emulator: a scripted path of 23 steps, recorded with the tools of an agent, replays in full with the corrected count and stops at its twelfth step with the old one | Section 7 | Run 45636520387 of the workflow `Replay check` of mobile-agent-testers (2026-11-25, commit `b30e5e3`, ECR at `9737ba6`, Maestro 2.12.1, Android 11 emulator). Its log: `trace: 23 steps, 4 typed texts kept apart, 0 commands left out`, `replay: pass, 23 steps with no model in 79 s`, `check: counted the old way, replay: stopped at step 12 of 23 (target_not_found, tapOn by name, one of several), after 61 s`. In `scripts/android/replay_check.py` the path is a fixed list of taps and texts, and the old count is put back on the tap on "Continue", step 12. An earlier run of the same check, 45634188843 at `8f57c23`, replayed 22 steps |

"Reproduced" means the same step number, the same type of divergence and the same form of target as in the trial of the agent. The trace of the agent is in the encrypted results of its run and was not read. A later run of the same check, 45655373891 at `3905258`, has a path of 35 steps: it replays in full and stops at step 12 with the old count. The paper does not use it.

The second one:

| Claim in the paper | Where | Source |
|---|---|---|
| In a second trial, with the corrected recorder, the replay of another path of 62 steps stopped at step 58, again with `target_not_found` | Section 7 | Run 45653019790 of mobile-agent-testers (2026-11-25, commit `65dfbbc`, input `replay_path`), job `android (anna, ...)`, on the demonstration application, with an Android 11 emulator, ECR at `9737ba6` and Maestro 2.12.1. Two lines of the public log of the job: `trace: 62 steps, 5 typed texts kept apart, 1 commands left out (keyevent KEYCODE_MOVE_END)` and `replay: stopped at step 58 of 62 (target_not_found, tapOn by name), after 120 s`. "The corrected recorder": `65dfbbc` contains `f6204b8`, the commit that changed the count |
| Its cause is not established | Section 7 | The details of the replay are in the encrypted results of the run and were not read. The log shows one command of the agent that the trace left out, a key that moves the cursor to the end of a field. A later commit of the tool, `3905258`, records the emptying of a field as a step. No run of an agent shows that this was the cause |

The third and the fourth:

| Claim in the paper | Where | Source |
|---|---|---|
| After further changes to the recorder and to the mobile vocabulary, two more trials replayed in full: the path of 37 steps of an agent that maps the screens of the application ... | Section 7 | Run 45659193124 of mobile-agent-testers (2026-11-25, commit `eeab9e0`, input `replay_path`), job `android (anna, ...)`, with the brief `briefs/map.md`, on the demonstration application, Android 11 emulator, ECR checked out at `f6bcf4b`, Maestro 2.12.1. Two lines of the public log: `trace: 37 steps, 6 typed texts kept apart, 0 commands left out` and `replay: pass, 37 steps with no model in 91 s`. The changes: `3905258` and `eeab9e0` in the tool (an emptied field is a step; a tap before a field is emptied from its end lands where its text ends; a swipe keeps its two ends), `542d5c9` and `f6bcf4b` in ECR |
| These traces had no oracle yet | Section 7 | The recorder writes every step with empty `checkpoints` and `invariants: []` (`scripts/ecr_trace.py`), and the same job replays the trace right after writing it, with no edit |
| ... and the path of 25 steps of an agent that tests it | Section 7 | Run 45665811130 of mobile-agent-testers (2026-11-25, commit `7d5b4a7`, input `replay_path`, map `none`), job `android (anna, ...)`, brief `AGENT_BRIEF.md`, demonstration application, Android 11 emulator, ECR at `f6bcf4b`, Maestro 2.12.1. Public log: `trace: 25 steps, 5 typed texts kept apart, 0 commands left out` and `replay: pass, 25 steps with no model in 72 s` |
| A scripted path of 23 steps reproduced the stop with the old count and replays in full with the corrected one | Section 7 | Same check as above, sentence shortened on 2026-11-25 |
| Section 6 gives the rate on LocalSend | Section 7 | Section 6, first measures, below |

These are trials, not measures: one persona and four runs of an agent, then a scripted path and three runs. Their turns, their costs and their times are in the logs and are not cited.


## 2b. First measures on LocalSend (Section 6, "First measures")

| Claim in the paper | Source |
|---|---|
| Twenty explorations of LocalSend v1.19.0 with `claude-sonnet-5-5` | `results/rq1/localsend/explore-*.json` (20 files), runs 45701272440 and 45706788156 of mobile-agent-testers at cd31933 (tag `eval-localsend-1`); `models_resolved` in each file is `["claude-sonnet-5-5"]`, read in the decrypted `agent-output.json` |
| Median \$0.20 (0.16 to 0.36), \$4.24 in all | `price_usd_exact` (the `total_cost_usd` of each decrypted output); the public log lines, rounded to the cent, agree for all 20. The rounded values sum to \$4.27 |
| 23.5 turns, 112.5 s of agent time, 16 steps (medians) | `turns` (equal to `num_turns` of the output for all 20), `seconds_agent` (public log timestamps, install to "finished"), `steps` |
| Of 171 taps, 168 target a text, 3 a position, none an identifier; so D2 does not apply | `taps`, `targets_by_name`, `targets_by_point`, `targets_by_id`; protocol section on D2 |
| Replayed once with no model, 10 of the 20 paths passed (Wilson 95%: 0.30 to 0.70), from 7 of 10 personas; the others stopped with `target_not_found` | `path_replay` of each file; passing: run 1 malik, layla, ravi, lucia, felipe; run 2 olga, ravi, grace, lucia, felipe |
| An AI assistant wrote their 78 checks, under a rule fixed before any output was opened | Amendment 4 of `protocol.md` (commit d9e3931, pushed before the outputs were opened); traces on branch `eval-localsend-1-traces` of mobile-agent-testers (tip 983557a), `traces/localsend/CHECKS.md`; every check id starts with `ai-`; script `apply.py` in the project files |
| RQ1 counts no human time | Amendment 4: the human time of RQ1 is not measured |
| On the unchanged app, 137 of 140 replays gave what the trace records: six traces 20 of 20, one 17 times, failing each time on the check right after a Back | `results/rq2/localsend/replay-45717206733.json` (`scripts/replay_results.py`), from the public lines of run 45717206733 (branch tip 3a700fc, APK 23301784...): ravi-20261125T212224 replays 6, 11, 19, oracle_failed on ai-s15-settings-tab after s15 (pressKey Back). Cause not established |
| By the protocol, this instability counts against ECR | `protocol.md`, section on what counts against ECR: a replay that is not stable on an unchanged system |
| The last replay of each trace, with the network of the tools cut, passed | Same file, index 20, `internet: cut`, 7 of 7 pass |
| Time of a replay 52 to 101 s; no model key | `per_trace.median_seconds`; `replay_set.py` at cd31933 runs with no model key |
| An AI assistant wrote 78 checks on these 10 paths | Traces at commit 983557a of `eval-localsend-1-traces` |
| Replayed once with their checks, 7 traces from 4 personas passed and were kept (62 checks); the 3 dropped stopped on a tap in the system file picker, a tap right after typing, and a check under a system window | `results/rq1/localsend/to_test-*.json` (10 files, `scripts/to_test_results.py`), from the public lines of run 45715086835 (branch tip 983557a, APK 23301784...); freeze commit 3a700fc with `traces/localsend/SHA256SUMS` (7 hashes, equal to `trace_sha256` of the kept files). Causes of the drops are inferred by the ECR thread, not read in the encrypted debug output |

## 2c. Results of the campaign on LocalSend (Section 6.4, Table 3, abstract, conclusion)

Every number below is printed by `python3 scripts/summary.py` or comes from `results/rq1/localsend/break-even.json` (`scripts/breakeven.py`); the numbers that moved while runs came in are macros of `sections/numbers.tex`, written by `scripts/tex_numbers.py`. Raw lines: `results/lines/` (one file per run, copied from the public run pages). Mutants: ECR `e5425f2`, `drift-bench/mutants/localsend/`. Proposer and reruns: mobile-agent-testers `385a721` (branch `eval-localsend-1-traces`); hand-kept traces: branch `eval-localsend-1-hand` at `071f0f3`. Protocol amendment 5 (ECR `65f8064`) fixed all of it before the first proposal, rerun or hand flow.

| Claim in the paper | Source |
|---|---|
| A replay takes 52 to 101 s per trace; mean of the per-trace medians 67 s | `results/rq2/localsend/replay-45717206733.json`, `per_trace.median_seconds`; `break-even.json` `replay_seconds` |
| An agent run of the same persona: median \$0.20 (0.12 to 0.31) and 121.5 s (20 runs) | `results/rq1/localsend/rerun-<run>-<persona>.json` (20 files, `price_usd`), `rerun-seconds.json` (public log timestamps, install to "finished", as for explorations) |
| Repairs per trace (\$ and minutes of device time), break-even in price and time, with and without one new exploration per unrepaired pair | `break-even.json`. Time of repairs: `repair-job-seconds.json` (`scripts/repair_job_seconds.sh`, GitHub API step "Emulator + agent"), minus the median of the same step for the same persona in repair runs that repaired nothing. Every proposal is counted, D6 included |
| The build with no patch: 20 of 21, the failure on the unstable trace | `results/rq3/localsend/replay-control-no-patch-45772317572.json` |
| The agent reached the goal of a trace in 30 of 35 trace-runs, never for ravi-20261125T212224; its own path replayed in full in 12 of 20 | `rerun-*.json`, `traces[].reached_goal` (`scripts/goal_check.py`), `path_replay` |
| Detection and type per class (Table 3) | `results/rq3/localsend/replay-<mutant>-<run>.json` (25 files); rule of `summary.py`: a trace that sees the mutant fails its 3 replays, the known instability of ravi-212224 at s15 left out |
| No D6 mutant ended green; every proposal on D6 refused | `replay-d6-*`, `repair-d6-*` |
| 25 accepted proposals, all D1, 22 by text and 3 by position, 21 at the first attempt; hashes of the oracles kept; 24 of 25 then 3 replays of 3 | `repair-*.json`, `accepted`, `action_kind`, `attempt`, `oracles_kept` ("checks unchanged" of the run page, which compares the SHA-256 of the canonical JSON of the checks before and after), `replays_after_pass` |
| A median of one turn and \$0.03 per attempt | `proposer.turns`, `proposer.price_usd` over all attempts |
| The tab swap needed two steps changed in every trace; the refused D1 trace taps the reworded button twice | Hand edits (README of branch `eval-localsend-1-hand`): `d3-receive-tab-order` changes the send tab and the settings tab; malik taps Text at s3 and s7 (`traces/localsend/malik/`) |
| 4 of the 7 D1 and D3 mutants that stop a trace repaired for every trace; 4 of 10 | `summary.py`, line "D1-D3 mutants repaired" |
| On D4 the proposer declined in most attempts | `refusal_reason: no_proposal` in `repair-d4-*` |
| Hand-kept: 2 to 4 lines changed, all 3 of 3 apart from the unstable trace | `results/rq3/localsend/hand-<mutant>.json` (`scripts/hand_results.py`), runs `hand-*` and `hand2-*` of `run-ids.txt`. Two edits of malik needed a second try (`071f0f3`) |
| On D6 the agent reached its goal screen in 12 of 15 runs | `rerun-d6-*.json` |
| Mobile adapter: L3 and L4 pass, L1 and part of L2 for 6 traces of 7, L6 on the campaign, L5 and L7 not checked; no change to the contract | `results/rq4/adapters.json` |

| An AI assistant judged all 25 accepted repairs right (amendment 6); no person checked the judgments | `results/rq3/localsend/judgments-of-repairs.json`; `summary.py`, line "accepted repairs judged" |
| In five accepted repairs (#1 to #4 and #25 of the judgment file) no check that follows could tell a miss | `judgments-of-repairs.json`, `check_that_follows_can_tell_a_miss` |
| The findings of the 15 agent runs on D6 were not read | Amendment 6: they are encrypted outputs |
| On D5, 102 of 105 replays passed; a 5 s delay failed one trace on an oracle in 2 replays of 3 (`lucia-20261125T215848` at `s9`, `d5-address-confirm-5s`) | `replay-d5-*` |
| The 54 taps of the 7 traces all target a text, so D2 does not apply | The 7 frozen traces, branch `eval-localsend-1-traces` |
| No kept trace records a defect (62 checks) | `to_test-*.json`; amendment 5 (`reported_bug_again` is null) |
| 7 traces kept, fewer than the 10 planned | `protocol.md` section 2 and amendment 6; `to_test-*.json` |
| Every added dialog detected, mostly as a failed oracle | `replay-d4-*`; `summary.py` lists the stop types per mutant: `oracle_failed` on all five, `target_not_found` also on two |
| The artifact is archived on Zenodo, concept DOI 10.5281/zenodo.24565052 (all versions; 0.1.0 is 10.5281/zenodo.24565053), named build only | Release v0.1.0 of the repository, tag on 0446150 |
| Six dated amendments | `protocol.md`, section Amendments |
| The cells of D4 and D6 count 34 pairs of a trace and a mutant, not 35: the unstable trace never opens the address dialog | `replay-d4-address-dialog-before-*`, `replay-d6-address-dialog-gone-*` |

Wilson 95% intervals not printed in the paper (formula of `summary.py`): 137 of 140, 0.94 to 0.99; 6 of 7, 0.49 to 0.97; 12 of 20, 0.39 to 0.78; 25 of 26, 0.81 to 0.99; 4 of 10, 0.17 to 0.69; 4 of 7, 0.25 to 0.84; 12 of 15, 0.55 to 0.93; 102 of 105, 0.92 to 0.99.

Stray failures on mutant builds that Table 3 does not show: `lucia-20261125T212222` once at `s7` on `d1-address-confirm`, a mutant that does not touch that step; the unstable trace once at `s15` on `d3-address-buttons-swapped`, `d3-send-text-last` and `d5-settings-content-1s`.

Failed runs, each run again and the second attempt recorded: the builds of the mutant runs `d1-receive-send-tab` and `d4-address-dialog-before`, a hung job of `d4-settings-tab-dialog`, and the builds of `hand-d1-address-confirm`, `repair-d6-message-dialog-gone` and `repair-d6-address-dialog-gone` (`raw/experimental_log.md`). One agent rerun was cancelled and its cost was not printed. The version of the program that runs the agent is not recorded in the result files.

## 3. Public data of mobile-agent-testers

Checked at commit `65dfbbc2f3386ce9dacb6905024d047425f0999e` of that repository. The files behind the first eight rows are the same as at `a4135e2`, the commit that the first draft cited, except `docs/replay.md` and `scripts/ecr_trace.py`, which were read again.

| Claim in the paper | Where | Source | Command |
|---|---|---|---|
| LocalSend: 20 agents, 103 reports, 69 minutes, $4.62 | Sections 1 and 7 | `docs/runs/data/localsend-20.json`, `docs/runs/localsend-20.md` | `python3 paper/scripts/public_runs.py <repository>` |
| LocalSend: 46 distinct defects, grouped by hand | Section 1 | `docs/runs/localsend-20.md`, row "Distinct bugs" | Reading |
| AnkiDroid: 10 agents, 83 reports, $4.69 | Section 7 | `docs/runs/data/ankidroid-10.json` | Same script |
| In these two runs, one agent costs between $0.13 and $0.56 and takes between 17 and 68 turns | Section 7 | The per-agent rows of the two data files | Same script, last line |
| A demonstration application with 11 planted defects | Section 7 | `demo-app/BUGS.md` | Reading |
| The trials ran on the demonstration application, then on LocalSend, before the measured runs; the evaluation uses LocalSend, an open-source file-sharing app that the author did not write, built from source at a pinned version, on Android | Sections 6 and 7 | The trial rows of section 2 name the application of each run; `protocol.md`, section 2 (revised 2026-11-25, before any run, on the author's choice of LocalSend as the only real application). The tag, its commit and the SHA-256 of the APK are recorded by the first measured run | Reading |
| "two runs never take the same path: expect the same kinds of bugs, not the same list", and the advice to keep scripted tests for regressions | Section 1 | `docs/faq.md`, under "Will two runs give the same result?" | Reading |
| The documentation advised writing a Maestro flow by hand for each defect | Section 7 | `docs/compare.md` | Reading |
| Before ECR, the path to a defect survived only as prose in the report | Section 7 | `AGENT_BRIEF.md`: each issue of a report gives its screenshots and its steps to reproduce | Reading |
| The recorder: a pass-through in front of the device bridge, a script that writes the trace, a tap stored by name, then identifier, then position, typed texts in a separate file not to commit, Android only | Section 7 | `docs/replay.md`, `scripts/ecr_trace.py` | Reading |
| The map: the screens of the application, the paths of the agents, a heat map of their taps on each screen, their findings | Section 7 | `docs/dashboard.md`, section "The map" | Reading |
| A person picks an element on a screen and says whether it must be visible or not. The check becomes a checkpoint of the step that led to that screen. From a finding, it is recorded as `observed: "failed"` | Section 7 | `docs/dashboard.md`, section "From a finding to a test", and `dashboard/app.js` (`addCheck`, "Make it a test") | Reading |
| Only checks can change: the page refuses a trace whose steps differ from the explored ones | Section 7 | `save` in `scripts/dashboard.py`: the steps without their checkpoints are compared with `trace.explored.json`, and with `--ecr` the save goes through `ecr validate` | Reading, and `tests/test_dashboard.py` |
| The map has not been tried on a real run | Section 7 | `docs/dashboard.md`, section "Limits": "tried on the demo run and on traces written by the offline tests" | Reading |
| On a device, the reading of a step failure has been checked for one cause only, an element that is not found | Section 5 | The run 45636520387 above: an index that names no element gives `target_not_found`. No run shows a `timeout` or an `action_failed` of known cause | Reading |

The sum of the per-agent amounts of the LocalSend run is $4.61. The paper gives the total that the run page gives, $4.62.

## 4. What other tools do

Each cell of Table 1 comes from a file of the tool at a pinned commit, or from the paper cited. Read on 2026-11-25.

| System | Source | What the source says |
|---|---|---|
| Playwright test agents | `packages/playwright/src/agents/*.agent.md` at `d70f422f491cfb875dd5dc05f01c61207e7382b4` of microsoft/playwright | The healer fixes "assertions and expected values" and continues "until the test runs successfully" |
| Stagehand | `packages/docs/v4/best-practices/caching.mdx` at `9a5b63d18b1d2fab7e118332324f85567fc5e8b7` of browserbase/stagehand | The cache is on the servers of the vendor. "If the recorded selector no longer resolves, Stagehand falls back to full inference" |
| Midscene | `apps/site/docs/en/caching.mdx` at `8a0f9949e6ad615b9bb3678e1b2147fe2b418d78` of web-infra-dev/midscene | Plans and element paths are cached. Assertion results "will never be cached" |
| Shortest | `packages/shortest/src/core/runner/index.ts` at `45a8dcfe89992b37ed2dfb1f76618048cff0f45c` of antiwork/shortest | `markPassedFromCache`, with the reason "All actions successfully replayed from cache". A cache error starts a full run |
| Arbigent | README at `f28f63d32bb5b1aa5482b26b7cc60e8f89cdd5c8` of takahirom/arbigent | Replays the actions of the last successful run, "leaving only the image assertions to pay for". When a target is gone or an assertion fails, "only that task is re-run by the AI" |
| Skyvern | Developer notes in `skyvern/core/script_generations/` at `7cc074c36001e2a1c880d648b6e50996dec8ae66` of Skyvern-AI/skyvern | Workflow runs become Python scripts. Without a script for a block, the system "falls back to `run_with: agent`" |
| workflow-use | README at `f00e27edd7f17600463ce37effa951f42ccb91c8` of browser-use/workflow-use | Recorded workflows that fall back to the agent |
| muscle-mem | README at `cee5db185f1781c1df9731d0e9cbffc5b330a9b6` of pig-dot-dev/muscle-mem | A behaviour cache for agents, with a check that decides between cache and agent |
| Auto | arXiv:2607.04542 | A signed WebAssembly module, checked by differential replay against a declared contract before it is emitted. Guards at run time hand over to the reference agent |
| TraceCompiler | arXiv:2608.02680 | Residual LLM nodes. "executing a compiled workflow requires a runtime for its Workflow IR, and we have none". "We make no conformance claim" |
| Agentic Compilation | arXiv:2604.09718 | A JSON blueprint run by a runtime with no model call. On a missing selector or a schema violation, the model is called again |
| Compiled AI | arXiv:2604.05150 | No model in the control plane. A validation in four stages when the code is generated |
| Case study of test repair | arXiv:2605.01471 | "assertion weakening and test-case deletion used as workaround mechanisms to achieve superficial convergence". It advises treating changes to assertions as high risk |

## 5. The other references

Each entry of `refs.bib` was checked against the page of its publisher, its arXiv page, or its OpenAlex record on 2026-11-25: authors, title, venue, year, pages and DOI. No entry was written from memory. Three points to know:

- Agentic Plan Caching is cited in its arXiv version (2506.14852, four authors). OpenAlex also lists a conference version with three authors.
- The title of AgentA/B is written as on its arXiv page.
- GPTDroid and UXAgent are cited in their arXiv versions, whose titles differ from the conference versions.
- To save space, five entries list their first three authors and "others": Baltes et al. (22 authors), AgentRR (11), SkillWeaver (11), UXAgent (10) and AgentA/B (12).
- Remotion: the two pages of its documentation cited were read on 2026-11-25. "The core idea": "A video is a function of images over time", with the current frame read by `useCurrentFrame()`. "Using randomness": frames are rendered by "multiple instances of the webpage ... in parallel", so `Math.random()` breaks rendering and `random()` takes a seed, "as long as the seed is the same, the return value will be the same". That a person or a model writes the code is the paper's illustration, not a claim of these pages.
- LLMDroid was checked against its OpenAlex record (authors, volume 2, issue FSE, pages 1001 to 1022, DOI 10.1145/3715763) and its abstract on the FSE 2025 page, on 2026-11-25.

What the paper says of each work, in one line:

| Key | What the paper says |
|---|---|
| `barr2015oracle` | Oracles remain the hard part of test automation |
| `gomez2013reran` | Tools replay recorded streams of events |
| `lam2017record` | A study of record and replay tools in industrial cases reports where they fall short |
| `hammoudi2016why` | A study of recorded web tests classifies why they break as the application changes |
| `dong2022webrobot` | Synthesis from demonstrations generalises a recording into a program |
| `liu2023gptdroid`, `yoon2024droidagent`, `wang2024survey` | LLM agents operate and test applications through their interface |
| `lu2025uxagent`, `lu2025agentab` | Agents with personas stand in for participants of usability tests and A/B tests |
| `kapoor2025agents` | Evaluations of agents often leave out cost |
| `ouyang2025nondeterminism`, `yao2025taubench` | The same model with the same instructions can act differently from one run to the next |
| `luo2014flaky` | Flaky tests |
| `wang2024voyager`, `wang2025awm`, `zheng2025skillweaver` | Agents keep what they learn as reusable skills or workflows |
| `feng2025agentrr` | Summarised experience replayed under check functions |
| `zhang2025plancaching` | Cached plan templates |
| `daniel2009reassert` | Suggests repairs for failing unit tests |
| `choudhary2011water`, `stocco2018vista` | Repair of web test scripts after the interface has changed |
| `xu2023guiding` | LLMs extend test repair |
| `jia2011mutation` | Mutation analysis |
| `baltes2025guidelines` | Guidelines for empirical studies that involve LLMs: versions, prompts and traces published |
| `remotion` | An analogy outside testing: code written once, rendered as often as needed, randomness seeded so that parallel renders agree. Not a tool ECR uses |
| `wang2025llmdroid` | An existing automated testing tool explores, and an LLM guides it when coverage growth slows (it also uses an LLM to summarise explored pages, which the paper does not need to say). Abstract: "When code coverage growth slows, it transitions to LLM Guidance" |

## 6. Readings of step 5

The 25 accepted repairs were judged by an AI assistant at the author's request, and the findings of the 15 agent runs on D6 were not read (amendment 6). The paper says both.

Rows of section 3 that the paper no longer uses since 2026-11-26 (cut to fit 8 pages): AnkiDroid, the per-agent range, the 11 planted defects, and the details of the demo-app trials (section 2 keeps them).

## 7. Confirmed by the author, and still to confirm

Confirmed on 2026-11-26: the author finished reading the draft and accepts the statement on the use of generative AI. Confirmed on 2026-11-25: the affiliation (Paris, France; on 2026-11-26 the author asked to drop "Independent Researcher"), the e-mail address printed under his name, and the wording of the statement on the use of generative AI.

Still open:

- The anonymised copy of the artifact for the double-blind version. The anonymous PDF already hides the name of the author, the address of the repository and the name of the mobile tool.
- When a named preprint is published, on Zenodo: HAL refused the deposit on 2026-11-25 because it does not accept independent researchers without a doctorate. The named build does not say where the paper is submitted.

Done on 2026-11-25: `paper/protocol.md` alone is in the repository at commit `5699a39`, before any measured run (the author's choice).
