# Experimental log

Input file for the writing of the paper. Only what was run and observed. Each entry gives the date, the commit, the command and what came out.

## 2026-11-25, repository at commit f6bcf4b

- Between 9737ba6 and f6bcf4b only the Maestro adapter changed. Same commands at f6bcf4b: 68 tests, 68 pass, 0 fail; the conformance report is the same as below; CI run 45658528918, job `no-network`: L4 pass; `pnpm size`: adapter-maestro 298 (adapter 295, index 3), adapter-fixture unchanged.

## 2026-11-25, repository at commit 9737ba6

- `pnpm install --frozen-lockfile && pnpm check`: types, schema, examples, tests and conformance. 67 tests, 67 pass, 0 fail.
- `pnpm conformance`, network open: L1 pass, L2 pass, L3 pass, L4 partial, L5 pass, L6 partial (4 patches), L7 pass (1 secret value searched). On the system with a defect: L6 partial (2 patches), L7 skipped.
- CI run 45628579367, job `no-network`: the same report inside a network namespace that has only the loopback. L4 pass.
- `pnpm size`: adapter-fixture 415 (adapter 271, example data 75, index 3, instrumented system 28, toy system 38). adapter-maestro 284 (adapter 281, index 3).
- `node paper/scripts/code_lines.ts`: schema 85, contract 57, core 218 and 119, conformance kit 260.

## 2026-11-25, device runs, commits 1efc8ad and 9737ba6

- Workflow `device`, started by hand, runs 45627233597 (commit 1efc8ad) and 45628577713 (commit 9737ba6). Android 11 emulator (API level 30), Maestro 2.12.1, the demo application of mobile-agent-testers built at its commit a4135e2. No model. Both runs printed the two lines below.
- `pass  tiny-todo-first-task`.
- `bug   tiny-todo-one-tasks`: `oracle_failed  step search  oracle counter-singular: Assertion is false: "1 task" is visible`. The oracle is recorded as failed in the trace: the counter reads "1 tasks".
- Both traces were written by hand from the source of the application. Trials, not measures: the times are not used.
- An earlier run of the same workflow, 45625317225 at commit f4b7564, failed: the flows ran, but the target could not read which command had failed. Fixed in 1efc8ad and 9737ba6.

## 2026-11-25, replay of the path of an agent, mobile-agent-testers at commit d04b821

- Workflow `Agent testers`, run 45631069149, started by hand with the input `replay_path`: one persona (anna), Android 11 emulator, the demo application. ECR checked out at 9737ba6, Maestro 2.12.1.
- The job explores with the agent, writes the trace (`scripts/ecr_trace.py`), then validates, compiles and replays it (`scripts/ecr_replay.py`) with every secret removed from the environment of the tools. No one edits the trace in between.
- Public lines of the job: `trace: 72 steps, 6 typed texts kept apart, 1 commands left out` and `replay: stopped at step 12 of 72 (target_not_found, tapOn by name, one of several), after 59 s`.
- The details (`replay.json`, what the tools printed, the record of Maestro) are in the encrypted results of the run and were not read.
- Cause: see the replay check below.
- A trial, not a measure: one agent, one run. The turns, the cost and the times of the log are not used.

## 2026-11-25, replay check with no model, mobile-agent-testers at commits 8f57c23 and b30e5e3

- Workflow `Replay check`, started by hand, runs 45634188843 (commit 8f57c23) and 45636520387 (commit b30e5e3). Android 11 emulator, the demo application, ECR at 9737ba6, Maestro 2.12.1. No model and no secret.
- A script follows a fixed path with the tools of an agent (`scripts/android/replay_check.py`). The recorder writes the trace, then the same replay as above runs.
- Run 45634188843: `trace: 22 steps, 4 typed texts kept apart, 0 commands left out`, `replay: pass, 22 steps with no model in 71 s`.
- Run 45636520387: `trace: 23 steps, 4 typed texts kept apart, 0 commands left out`, `replay: pass, 23 steps with no model in 79 s`, `check: "Continue" names 2 elements of the tree, 1 for the replay`, `check: counted the old way, replay: stopped at step 12 of 23 (target_not_found, tapOn by name, one of several), after 61 s`.
- Step 12 of that path is the tap on "Continue", a button whose label has the same name. With the count of the recorder at d04b821 the replay stops there. With the count at b30e5e3 it passes.
- A later run of the same check, 45655373891 at commit 3905258, with a longer path: `trace: 35 steps, 6 typed texts kept apart, 0 commands left out`, `replay: pass, 35 steps with no model in 86 s`, `check: counted the old way, replay: stopped at step 12 of 35 (target_not_found, tapOn by name, one of several, after eraseText, inputText, pressKey), after 52 s`. The paper does not use it.
- Trials: one run each, a scripted path, not an exploration by an agent. The times are not used.

## 2026-11-25, second replay of the path of an agent, mobile-agent-testers at commit 65dfbbc

- Workflow `Agent testers`, run 45653019790, started by hand with the input `replay_path`: one persona (anna), Android 11 emulator, the demo application. ECR checked out at 9737ba6, Maestro 2.12.1. The recorder counts same-name elements the corrected way (commit f6204b8).
- Public lines of the job: `trace: 62 steps, 5 typed texts kept apart, 1 commands left out (keyevent KEYCODE_MOVE_END)` and `replay: stopped at step 58 of 62 (target_not_found, tapOn by name), after 120 s`.
- Cause: not established. The details are in the encrypted results of the run and were not read. The command that the trace left out moves the cursor to the end of a field. A later commit of the tool, 3905258, records the emptying of a field as a step; no run of an agent shows that this was the cause.
- A trial, not a measure: one agent, one run. The turns, the cost and the times of the log are not used.

## 2026-11-25, repair guard, reference adapter

- `packages/adapter-fixture/test/repair.test.ts`, 7 tests, all pass.
- System where an item is no longer found by its title: the replay reports `target_not_found` on step `s3`. A proposal that ticks the item by position is accepted. Refused: a proposal for another step (`wrong_step`), a proposal that removes the item and one that ticks another item (`still_diverges`, with `oracle_failed`), an action outside the vocabulary and an undeclared parameter (`invalid_action`).
- System where a new item starts ticked: the replay reports `oracle_failed`, and the guard refuses (`oracle_failed`).
- These are unit tests on one trace, with proposals written by hand.

## 2026-11-25, public runs of mobile-agent-testers, commit 65dfbbc (same files as at a4135e2)

- `python3 paper/scripts/public_runs.py <repository>`.
- LocalSend: 20 agents, 103 reports, 69 minutes, $4.62. Per agent: $0.13 to $0.37, 17 to 57 turns. 46 distinct defects, grouped by hand.
- AnkiDroid: 10 agents, 83 reports, 9 minutes, $4.69. Per agent: $0.37 to $0.56, 43 to 68 turns.
- These runs are context: they were made before ECR and measure nothing about it.

## 2026-11-25, third replay of the path of an agent, mobile-agent-testers at commit eeab9e0

- Workflow `Agent testers`, run 45659193124, started by hand with the input `replay_path` and the brief `briefs/map.md` (the agent maps the screens): one persona (anna), Android 11 emulator, the demo application. ECR checked out at f6bcf4b, Maestro 2.12.1.
- Public lines of the job: `trace: 37 steps, 6 typed texts kept apart, 0 commands left out` and `replay: pass, 37 steps with no model in 91 s`.
- The trace has no oracle: the replay checks that the 37 steps can be carried out.
- A trial, not a measure: one agent, one run. The turns, the cost and the times of the log are not used.

## 2026-11-25, fourth replay of the path of an agent, mobile-agent-testers at commit 7d5b4a7

- Workflow `Agent testers`, run 45665811130, started by hand with the input `replay_path`, map `none`, brief `AGENT_BRIEF.md` (a tester): one persona (anna), Android 11 emulator, the demo application. ECR checked out at f6bcf4b, Maestro 2.12.1.
- Public lines of the job: `trace: 25 steps, 5 typed texts kept apart, 0 commands left out` and `replay: pass, 25 steps with no model in 72 s`.
- The trace has no oracle. A trial, not a measure: the turns, the cost and the times are not used.

## 2026-11-25, first trial on LocalSend, mobile-agent-testers at commit 3825fc3

- Workflow `Agent testers`, run 45673574711, input `replay_path`, LocalSend `v1.19.0` built from source, four personas (layla, malik, anna, lucia) on four Android emulators, ECR at f6bcf4b, Maestro 2.12.1.
- Public lines: traces of 16, 14, 19 and 9 steps; the four replays stopped at step 3 or 4 with `target_not_found` on a `tapOn by name` that follows a `tapOn by id`.
- Cause deduced by the operator of the run, not read in a trace (the traces are encrypted). The free robot run 45671573034 (same commit, no model, 27 paths, only named controls tapped) stopped 25 of its paths at step 3 with the same line, so the likely cause is a tab named on two lines ("Send", line break, "Tab 2 of 3"): the recorder refused a name on several lines and fell back on the identifier of the whole window. Fixes in mobile-agent-testers 3347c79 (an identifier that covers half of the screen or more is no longer a target, the tap becomes a point) and 436f842 (names on several lines). Not yet tried: robot run 45679029656 then one persona.
- A trial, not a measure. Its traces are not measured traces.

## 2026-11-25, second trial on LocalSend, mobile-agent-testers at commit 18cb14e

- Workflow `Agent testers`, run 45680749827, input `replay_path`, LocalSend `v1.19.0` built from source, one persona (anna), model `claude-sonnet-5-5`, with the fixes 3347c79 and 436f842.
- Public lines: `trace: 8 steps, 1 typed texts kept apart, 0 commands left out`, `trace: 4 taps: 4 by name, 0 by id, 0 by position, 1 at a place inside the element`, `replay: pass, 8 steps with no model in 32 s`.
- The first path of an agent on LocalSend that replays in full. Short (8 steps), no oracle, one run: a trial, not a measure. The cause of the first trial's stops (names on two lines) stays inferred until the robot rerun 45679029656 reports on its paths.

## 2026-11-25, robot rerun on LocalSend, mobile-agent-testers at commit 436f842

- Run 45679029656, map maker with no model, LocalSend `v1.19.0` built from source. Public line: `map: 18 screens, 138 taps, 27 starts of the app, 0 forms not passed`.
- As reported by the operator of the run: 24 of 27 starts gave a trace; 20 of the 24 replays pass with no model, from 4 to 41 steps (before the fixes: 2 of 27). The 4 stops are `target_not_found` on a tap by name: three right after a tap by position on an element with no name and no identifier, one after a text was erased, typed and a key pressed.
- Robot paths, not agent paths, and a trial: none of its numbers is cited as a result.

## 2026-11-25, repository at commit c35dfed, and start of the measured runs

- ECR at c35dfed: `pnpm check` gives 69 tests, all pass; `pnpm size` and the conformance report are unchanged (L4 partial with the network open, pass in the job `no-network` 139455256600 of CI run 45685034575; L6 partial). Only the command line changed since f6bcf4b (`ecr replay --times N --report file.json`).
- A first launch of the measured explorations (run 45689384581 of mobile-agent-testers at commit efad76b) was cancelled while the app was being built, before any agent ran: no exploration exists from it. The campaign waits for the cause of the unstable trial replay below, then runs from one commit tagged by the author.
- Trial of repeated replays on hand-written demo traces (run 45685787626, 3 replays per trace, one with the network closed): `tiny-todo-first-task` 3 of 3 pass; `tiny-todo-one-tasks` 2 known bug as recorded and 1 `oracle_failed` at the step `open`, the launch of the app, cause not visible in the public lines. A trial, but a warning for RQ2: a replay of an unchanged app was not stable 3 times out of 3.

## 2026-11-25, cause of the unstable trial replay (mobile-agent-testers at 4b0d2a9)

- Runs 45691491055 and 45691503497, one persona, 10 replays per demo trace with one public line per replay that does not give what the trace records. One emulator gave 15 of 20 as recorded, the other 20 of 20.
- As reported by the operator: the 5 failed replays all stop on the oracle `sign-up-shown` after 27 to 29 s, with the app in front and running, no start of the app in the system log (median start 0.8 s in the passing replays), no unresponsive window, no crash, low load. Reading: the app was not restarted and still showed the last screen of the previous replay; the `clearState` of Maestro's `launchApp` did not take effect. A harness artefact of replays chained on one emulator, not of ECR.
- Fix in the harness (cd31933): before each replay of a trace that starts with `launchApp` and `clearState`, the app is stopped and its data cleared, and the public line says how often the replay had to clear the app itself. This is the fresh state that protocol section 2 asks for. Being checked by three free runs (45696959001, 45696967906, 45696981152).

## 2026-11-25, check of the fix, then start of the measured explorations

- Three free runs at mobile-agent-testers cd31933 (45696959001, 45696967906, 45696981152), as reported by the operator: 60 of 60 replays of the demo traces give what the trace records (30 pass, 30 known bug, 6 with the network closed); the harness cleared the app before 60 of 60; Maestro's own `clearState` also took effect in 60 of 60 (the defect did not come back on these emulators). A trial.
- Measured explorations started: run 45701272440 of mobile-agent-testers at cd31933fee2d8e9821d5ec626fe8082ef635ef89, ECR c35dfed, 10 Android personas, model `claude-sonnet-5-5`, LocalSend `v1.19.0` built from source. The tag `eval-localsend-1` on that commit is to be set by the author.

## 2026-11-25, measured explorations on LocalSend (results)

- Run 45701272440 (10 personas) and run 45706788156 (10 personas, from the tag `eval-localsend-1`), both mobile-agent-testers cd31933, ECR c35dfed, model `claude-sonnet-5-5`, LocalSend `v1.19.0` at 44f48f1. Result files: `results/rq1/localsend/explore-<run>-<persona>.json`, written by `scripts/explore_results.py` from the public logs. Tokens are empty until the author decrypts the outputs.
- The two builds of the same source have different SHA-256: amendment 3 of the protocol.
- The first path replay passes for 10 of the 20 paths. The other 10 stop with `target_not_found` on a tap by name. Causes inferred by the operator, not read in traces: leaving the app with Back on its root screen (the agent's relaunch is not in the trace at cd31933), the device name drawn at random on first launch, and a stop right after typed text (open).

## Not done

- No rate of agent paths that replay has been measured: four trials on the demo app, two stopped (step 12 of 72, step 58 of 62), two replayed in full (37 and 25 steps, no oracle); on LocalSend, four paths stopped at step 3 or 4, then one path of 8 steps replayed in full after the fixes.
- No drift has been injected on a device. No repair has been tried on a device.
- Exploration cost measured on LocalSend (20 runs, see claims 2b). No cost of a replay or of a repair yet.
- The web adapter and the drift benchmark are not started.

## 2026-11-25, evening: tokens and checks

- Tokens of the 20 explorations read from the decrypted `agent-output.json` (zip of both runs uploaded by the author) and merged by `scripts/merge_tokens.py`: counts only, no text. Turns, prices and the resolved model agree with the public logs for all 20.
- Checks of the 10 passing paths written by the AI assistant under amendment 4: 78 `visible` checks, ids `ai-*`. Steps compared by script, `ecr validate` and `ecr compile` pass with the c35dfed adapter. Each check text is a whole element text on the screen captured after its step.
- Not checked: scrolls, a section opening in place (olga, advanced settings), the system file picker (grace). No failed check: findings wait for the author.
- Branch `eval-localsend-1-traces` pushed by the ECR thread, tip 983557a, parent cd31933, diff only under traces/localsend/. Typed texts go in the `REPLAY_PARAMS` secret, to be set by the author.

## 2026-11-25 ~22:45 UTC: robot run 45708814456 (main 6f8d330, trial, not measured)

- map=robot on the phones of grace and anna, free. 34 of 43 replays pass (grace 14/19, anna 20/24). 9 stops, all target_not_found on tapOn by name; no ANR, no crash, app running.
- Patterns (from the ECR thread): 3 after eraseText+inputText+pressKey with the keyboard closed at the stop; 3 at step 3 after launchApp and a tap by point; 2 with the keyboard open; 1 with another system window in front.
- Cause of the first pattern, from the code: in exploration Back only closed the keyboard; Maestro types by injected key events and the keyboard is already closed at replay, so the same Back goes back a screen or leaves the app. Fix proposed on main only (Back written as hideKeyboard, compiled as a conditional Back). Not on cd31933 or c35dfed. Gives a likely cause for the campaign stops right after typing, not a measured one.

## 2026-11-25 22:39-22:48 UTC: keep-or-drop run 45715086835 (measured, amendment 4)

- Branch eval-localsend-1-traces at 983557a, APK 23301784..., replay_times=1 (network not cut with one replay, by design of replay_set.py). No inputText lacked a value.
- Kept 7 (62 checks): felipe x2, lucia x2, malik, ravi x2, so 4 personas. Dropped 3 (16 checks): grace s4 target_not_found (system file picker), layla s7 target_not_found (confirm after typing), olga oracle_failed ai-s16-about-page (system window in front).
- Freeze 3a700fc (SHA256SUMS). 20 replays: run 45717206733 started 22:55 UTC on 3a700fc.
- The protocol says "the set has at least 10 traces from at least 4 personas": 10 traces were written, 7 are kept. Decision asked of the author.
- Author's decision (card, 23:01 UTC): keep the 7 traces, no further exploration; the paper reports 10 written and 7 kept.

## 2026-11-25 22:55-23:48 UTC: 20 replays, run 45717206733 (measured)

- Branch at 3a700fc (7 frozen traces), APK 23301784.... 137 of 140 replays give what the trace records. Six traces 20/20; ravi-20261125T212224 17/20, oracle_failed on ai-s15-settings-tab after s15 (Back) in replays 6, 11, 19, app in front, cause not established (campaign diagnostics lack keyboard state). Last replay of each trace with the tools' network cut: 7/7 pass. Medians 52 to 101 s.
- By the protocol, an unstable replay on an unchanged system counts against ECR; the paper says so.
- On main only (not cd31933, not c35dfed): tools write dumps to /data/local/tmp (cause of grace), keyboard-closing Back becomes hideKeyboard (ECR f89aa13). Robot run 45719910644: no stop right after typing, 32/42 paths pass. Trial, not measured.

## 2026-11-26: mutants written and committed; build control

- Pierre: "Lance les mutants" (free step). 25 mutants by the rule of protocol section 3, committed to ECR main e5425f2 before any replay (D2 not applicable). Each applies to v1.19.0 and passes `flutter analyze` with no error.
- Build control, run 45772317572 (no patch, built in the job, APK SHA-256 1bd882f4..., not the campaign APK): 20 of 21 replays as recorded. The one failure is ravi-20261125T212224, replay 3 (network closed), oracle ai-s15-settings-tab after s15: the known instability. The 6 other traces 3 of 3.
- D1 runs: 45775019891, 45775034633, 45775048523, 45775062876, 45775075855.

## 2026-11-26: proposals, reruns, hand baseline, results in the paper

- All runs of RUN-PLAN (A repairs on 21 mutants, B 20 reruns, C 15 malik runs on D6, D 12 hand runs + 2 hand2) are done; lines in `results/lines/`. Paid total from the files: $15.08 (repairs $8.22, reruns $3.90, D6 runs $2.96), plus one cancelled agent whose cost was not printed.
- Three builds failed in the job (encrypted build log) and passed on `gh run rerun --failed`: hand-d1-address-confirm, repair-d6-message-dialog-gone, repair-d6-address-dialog-gone. Attempt 2 is the one recorded.
- Hand baseline: two edits of malik were wrong at first (malik taps Text at s3 and s7); fixed in `071f0f3` of eval-localsend-1-hand and replayed (hand2-*). This also explains the only D1 trace the proposer could not repair: two steps.
- Break-even counts every proposal asked, D6 included, and the time of repairs as the job step "Emulator + agent" above the same step for the same persona in repair runs that repaired nothing (`scripts/repair_job_seconds.sh`).
- Section 6 rewritten with results; numbers that moved are macros of `sections/numbers.tex` (`scripts/breakeven.py`, `scripts/tex_numbers.py`). 8 pages, 0 overfull box.
- The author finished reading the draft (12:20 UTC). By his choice, an AI assistant judged the 25 accepted repairs: 25 right (`results/rq3/localsend/judgments-of-repairs.json`); the findings of the 15 D6 runs are not read (amendment 6).
- Final review of the paper by an AI assistant: 63 edits applied (claims brought in line with the result files and the protocol, wording, anonymity, references). 8 pages, 0 overfull box in both builds.
