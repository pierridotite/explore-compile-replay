# Evaluation protocol

Status: written on 2026-11-25, before any evaluation run, and revised the same day, still before any run, to make LocalSend the only real application. Committed on 2026-11-25, before any measured run.

This file says what the paper will measure, on what, and how each number is computed. It is written first so that the results cannot shape the questions. After the first run, this text is never edited in place: a change is added at the end as a dated amendment, with its reason.

Three rules hold for the whole paper:

1. A number that answers a research question appears in the paper only if a file in `paper/results/` holds it. Every other number (a count of tests, a size, a public run of another tool) is listed in `claims.md`, published with the paper, with the file and the command that give it. A trial run is not a result: the paper may say what happened in it, with the run listed in `claims.md`, and it cites none of the measures of section 6 from it. A trace from a trial run is not one of the measured traces.
2. Sample sizes, failed runs and excluded cases are reported as they are.
3. Compiling and replaying call no model. The runs check it, they do not assume it.

## 1. Questions

**RQ1. Cost.** What does a verdict cost with ECR, compared with running the agent again each time?

**RQ2. Determinism.** On a system that has not changed, does a replay give the same result every time? Does the agent, run again?

**RQ3. Drift.** When the system changes, does the replay break where it should? Is a correct repair accepted and a wrong one refused? Does a real regression stay red?

**RQ4. Generality.** What does a new adapter cost to write, and do the seven laws transfer to it?

## 2. Systems, personas and traces

| System | Adapter | Target | State today |
|---|---|---|---|
| To-do list in memory | `fixture-todo` | `node:test` file | Runs. Reference adapter: conformance kit and unit tests of the repair guard |
| LocalSend, an open-source app to share files on a local network, built from source at a tag fixed before the first run (proposed: `v1.19.0`) | `mobile-maestro` | Maestro flow, on an Android emulator | Not run yet. The trials so far ran on the demo app of mobile-agent-testers: two flows from traces written by hand, one scripted path, and four paths explored by an agent, of which two stopped (at step 12 of 72 and at step 58 of 62) and two, of 37 and 25 steps, replayed in full |

LocalSend is the only real application of this evaluation. It was chosen because public runs of mobile-agent-testers have already explored it, because its source is open so that mutants can be built, and because the author of ECR did not write it. iOS and a web application are left out. An amendment can add them, only before their first run.

The unchanged app and every mutant are built by the same recipe from the same source, so that they differ by the patch only. The store build is not used. The result files keep the tag, the commit and the SHA-256 of each APK. Before each replay the data of the app is cleared, so that each replay starts from a fresh state.

Personas are the ones shipped with mobile-agent-testers. Their ids are recorded in each trace.

One exploration gives one trace. The agent leaves a path and a report, and a person turns the path into a test on the map of mobile-agent-testers: a check added on a screen becomes an oracle of the step that led to it, and a finding becomes a check recorded as failed. The steps stay as the agent explored them. The time this takes is measured (section 6). The set has at least 10 traces from at least 4 personas.

LocalSend has no planted bugs. A trace that records a bug with `observed: "failed"` comes from a finding of an agent that a person has confirmed on the app at the pinned tag. Their number is reported. It can be under 3, and then the outcome `known_bug` is shown on fewer traces, which the paper says.

A trace is kept only if its first replay on the unchanged app gives what it recorded. The traces that are dropped are counted and the reason is given. Two causes are known in advance. A text that the app draws at random on first launch, such as the name of the device, changes with each fresh state, so a step or a check that names it fails. And a single emulator has no peer, so a check on a transfer between two devices cannot hold. The person who adds checks avoids both. Once the kept traces are known, the list of their SHA-256 is committed: the traces are then frozen.

## 3. Drift classes

A drift is one change to the system under test, applied alone to the app at the pinned tag. Each one is a patch in `drift-bench/mutants/localsend/`, with one line that says what it changes. A mutant must change something that a kept trace uses, so the mutants are written after the traces are frozen and committed before any replay on a mutant. They are chosen by a rule fixed now: for each class, the screens are taken in decreasing order of the number of kept traces that visit them, and on each a change of that class is written, until the class has 5 mutants. No proposer is run while they are written.

| Class | The change | Expected replay | Expected repair |
|---|---|---|---|
| D1 Text | A visible text that a step targets is reworded | `target_not_found` on that step | A correct new action is accepted |
| D2 Identifier | An accessibility id that a step targets is renamed | `target_not_found` on that step | A correct new action is accepted |
| D3 Structure | The target moves: another place in a list, another container, another position on the screen | `target_not_found`, or `action_failed` | A correct new action is accepted |
| D4 Added step | A new screen or dialog comes before the target | `target_not_found` or `unexpected_state` | Refused: a patch is one step and one action, and this needs a new step. Counted as "explore again" |
| D5 Delay | The target appears later: 1 s, 5 s, 15 s | Pass, or `timeout` | None today: the mobile vocabulary has no wait action, and Maestro waits by itself. If a wait action is added before the run, an amendment says so |
| D6 Behaviour | The app does something else: a state that an oracle checks is no longer reached | `oracle_failed` | Refused, always. This is a real regression |

At least 5 mutants per class on LocalSend, where the class applies. LocalSend is written with Flutter, which gives an element an identifier only where the code sets one. If no step of a kept trace targets an identifier, D2 is reported as not applicable on LocalSend, with that reason. The to-do list in memory has D3 and D6 only, in unit tests: its test systems are `target-moved` and `behaviour-change`.

A mutant that no trace can see is reported and set aside, with the reason. A trace that records a bug stops on it, so a mutant placed after that step is not visible to that trace and is not counted for it.

D6 is the control. If a D6 mutant ends green, by any path, the run counts as a false green and as a failure of law L6.

## 4. Procedure

On LocalSend:

0. **Build** the app at the pinned tag, and record its commit and the SHA-256 of the APK.
1. **Explore.** For each persona, the agent explores once. The result file holds the model identifier and version, the prompt, the settings, the tokens in and out, the price at the public rate on the day of the run, the number of turns and the time.
2. **Compile**, then **replay** once to keep or drop the trace (section 2), and freeze the kept traces. Then replay each kept trace N = 20 times on the unchanged app, from a fresh state each time, with no model key in the environment, and at least once per trace with access to the internet cut.
3. For each mutant: build the app once, then replay every kept trace 3 times in that job. Record the result and the type of each divergence.
4. If a step diverged: ask the proposer for a new action, at most 3 times. Each proposal goes through `ecr repair`. Record whether it is accepted, or the reason it is refused.
5. After an accepted repair: replay 3 times on the mutant, and compare the set of oracles before and after. A person then reads the new action next to the intent of the step and the mutant, and says whether it still does what the step meant. This judgment is written in the result file before the totals are computed.

The proposer is the same agent as the explorer, with a fixed prompt that is published. It sees the divergence and the current screen. It does not see the oracles.

## 5. Baselines

| Baseline | Used for | Runs |
|---|---|---|
| The same agent, with the same persona and goal, run again from the start | RQ1, RQ2, and D6 of RQ3 | 5 runs for each of 6 traces, then 3 runs for each of 5 D6 mutants |
| A Maestro flow written by a person for the same path, kept green by hand | RQ3: lines changed for each mutant | 1 flow for each of 6 traces |

Planned runs that call a model: about 10 explorations, 30 runs of the first baseline, 15 runs on D6 mutants, and at most 3 short proposals for each mutant that breaks a step. Each of these runs needs the agreement of the person who pays for them.

## 6. Measures

| Measure | Definition |
|---|---|
| Cost of an exploration | Tokens, price at the public rate, turns, time. One value per trace |
| Cost of turning a path into a test | For one trace: the minutes from opening its report to the last save of its checks, noted by the person, and the two counters that the map keeps, the number of checks added and the seconds between starting a check and adding it (at most 900 s for one check). The counters leave out the reading of the report and the search for the screen, so they are a lower bound. Reported next to the machine time, never added to it |
| Cost of a replay | Time. The number of model calls, which must be 0, checked by replaying with the network closed |
| Break-even | The smallest number of runs n for which `explore + n × replay + repairs` is under `n × rerun`, in price and in time, with the repairs that the drift runs needed |
| Stability of a replay | Share of pairs (trace, target) with the same result and the same divergences on all N replays |
| Stability of the agent | Share of runs that reach the goal, that is the screen of the last step of the trace, in the same screen group as the map computes it; a person decides from the screenshots when the group is unclear. For a trace that records a bug: share of runs whose findings report that bug again, as a person judges them |
| Detection | For each class: mutants where the replay result differs from the recorded one, over mutants that a trace can see |
| Classification | Share of detected mutants where the divergence has the expected type |
| Repair | Share of mutants of D1, D2 and D3 where a proposal is accepted. Reasons for refusal, counted by reason |
| Wrong accept | Accepted repairs that the reader of step 5 judges not to do what the step meant, over accepted repairs. Each one is described |
| Oracles kept | A property, not a finding: a proposal is one step id and one action, so it cannot name an oracle. The runs check it: after each accepted repair, the oracles are compared with the ones before, as canonical JSON |
| False green | D6 mutants that end green, over D6 mutants. Must be 0 |
| Size of an adapter | Lines of code that are neither blank nor comments, for the vocabulary, the driver and each target |
| Laws | For each adapter and each law: pass, partial, skipped or fail, as the conformance kit prints it. Partial and skipped are not counted as pass |

## 7. Models

The exact model identifiers are fixed in an amendment before the first run. Two configurations: the default model of the agent, and one open-weight model that reads images, so that the results do not depend on a single vendor. mobile-agent-testers can call such a model through any compatible API. The second configuration is optional: it is run only if a trial run, agreed by the person who pays, shows that the agent can explore LocalSend with it. If it is not run, an amendment says so before the first measured run. Each trace keeps the identifier in `provenance.model`. Each result file keeps the identifier, the version and the settings. When a run is started with an alias, the file keeps the resolved identifier if the output of the agent gives it, and otherwise the alias and the date.

## 8. Analysis

Counts and proportions, with a 95 % Wilson interval where a proportion is reported. Medians with the smallest and the largest value for costs and times. No significance test: the samples are small and the study is descriptive. Every result is given per class before any total.

## 9. What would count against ECR

Stated now, so that it cannot be moved later.

- A replay on an unchanged system that does not give the same result N times out of N. The share of unstable traces is reported with the cause, device included.
- One D6 mutant that ends green.
- A break-even above the number of runs a trace lives before it drifts.
- Fewer than half of the D1, D2 and D3 mutants repaired: the bounded repair would be too narrow to be useful.
- An accepted repair that does not do what the step meant: the guard is only as strong as the oracles of the trace, and each such case is reported with the oracles that let it through.
- An adapter that needs changes to the contract to pass the laws.

## 10. Result files

One JSON file per run in `paper/results/<question>/localsend/` (`rq1`, `rq2`, `rq3`; RQ4 is computed from the code in `paper/results/rq4/`). Figures and tables are generated from these files by scripts in `paper/scripts/`. A file never holds a secret, a typed text of `trace.params.json`, or a key.

Every file holds: `rq`, `kind`, `ecr_commit`, `mat_commit`, `app_tag`, `app_commit`, `apk_sha256`, `mutant` (null on the unchanged app), `device` (emulator image and API level), `run` (GitHub run id and job id), `started_at`, `seconds`.

| `kind` | Fields |
|---|---|
| `explore` | `persona`, `brief`, `model` (resolved identifier, or alias and date), `settings`, `tokens_in`, `tokens_out`, `tokens_cache`, `price_usd`, `price_rate_date`, `turns`, `trace_sha256`, `steps`, `params_kept_apart`, `commands_left_out`, `findings` |
| `to_test` | `trace_sha256`, `minutes_noted` (by the person), `check_seconds`, `checks_added`, `oracles`, `known_bugs`, `first_replay` (outcome and divergence), `kept`, `drop_reason` |
| `replay` | `trace_sha256`, `index` (1 to 20, or 1 to 3 on a mutant), `fresh_state` (how), `internet` (open or cut), `model_key_present` (must be false), `outcome` (pass, known_bug, fixed, fail), `divergence` (step id and type, or null) |
| `rerun` | `trace_sha256`, `index`, `persona`, `brief`, `model`, the cost fields of `explore`, `reached_goal`, `reported_bug_again` (null if the trace records no bug), `judged_by` |
| `repair` | `trace_sha256`, `divergence`, `attempt` (1 to 3), `proposal` (step id and action), `accepted`, `refusal_reason`, `oracles_sha256_before`, `oracles_sha256_after`, `replays_after` (3 outcomes), `judgment` (right or wrong, with a sentence), the cost fields of `explore` for the proposer |
| `hand_baseline` | `trace_sha256`, `flow_sha256`, `lines_changed` |

## Amendments

**1. 2026-11-25, before any measured run. Form of the targets.** Each result file of kind `to_test` also holds `targets_by_name`, `targets_by_id` and `targets_by_point`: the number of steps of the trace whose target is a name, an identifier or a point. The paper reports them for each trace. Reason: in the first trial on LocalSend (run 45673574711 of mobile-agent-testers), the four replays stopped at step 3 or 4 on a tap that followed a tap by identifier. LocalSend is written with Flutter, which gives its widgets no identifier, and the recorder now stores a tap as a point when the only identifier under it covers half of the screen or more. A point is the weakest form of target, so its share must be known to read the results of D3.

**2. 2026-11-25, before any measured run. Models.** The default configuration uses the model `claude-sonnet-5-5`, given in full to the workflow of mobile-agent-testers through its input `model`, so that no alias has to be resolved. The same model is the proposer of repairs. The trial run 45673574711 accepted this identifier. No trial has been run with an open-weight model, so the second configuration of section 7 is not planned. If such a trial works before the first measured run, an amendment adds it; otherwise the paper says that the results come from one model.

**3. 2026-11-25, after the explorations, before any replay of a measured trace. The binary of the app.** Two builds of LocalSend from the same commit `44f48f18a5503c43873570ff489d27ff1983e198`, by the same recipe, gave two APKs with different SHA-256 (`23301784…` in run 45701272440 and `776d184f…` in run 45706788156 of mobile-agent-testers): the build is not byte-reproducible. The app is therefore pinned by its source commit, and every result file keeps the SHA-256 of the APK it ran on. Every replay on the unchanged app, the one that keeps or drops a trace and the 20 that measure stability, uses one APK for all traces: the build of run 45701272440, kept as a file next to the results. A mutant is built by the same recipe from the source and its patch, so its binary differs from that APK by more than the patch; its source differs by the patch only.

**4. 2026-11-25, before any check is written. Who writes the checks.** The author chose that the checks of the measured traces are written by the AI assistant that helps write this paper, not by a person. The assistant works from the decrypted outputs of the two exploration runs: for each step, the trace, the screenshot and the element tree, and the report and findings of the agent. It follows a rule fixed now, before it opens any output:
- only the 10 paths whose first replay passed;
- the steps are never changed; only checks are added, each naming an element by its text or its identifier, never by an index or a position;
- on each screen that a step reaches and that differs from the screen before, at most two checks: one `visible` check on a text that names the screen (a title, a heading or a selected tab), and, when the intent of the step is to change something on screen, one check on that change;
- no check on a text that varies between installs or runs: the name of the device, addresses, times, the devices found nearby;
- a finding becomes a check recorded as failed only if the author confirms it from its screenshot.

Consequences. The time a person spends turning a path into a test (RQ1) is not measured, and the counters of the map are not used. The cost of this step for the assistant is not measured either. The paper says that the oracles of the evaluation were written by an AI assistant under this rule. A trace is still kept only if its first replay with its checks gives what it recorded. The reader who judges each accepted repair (section 4, step 5) is still the author.


**5. 2026-11-26, after the mutants were committed (e5425f2) and their replays started, before any proposal, rerun or hand flow. The proposer, the reruns and the hand baseline.** The author agreed to every run that calls a model and moves the paper to its end.

*Proposer (section 4, steps 4 and 5).* It is `scripts/repair.py` of mobile-agent-testers, with the prompt `briefs/repair.md`, at commit 385a721 of the branch `eval-localsend-1-traces` (the frozen traces plus this code). It runs Claude Code, the agent of the explorations, with the model `claude-sonnet-5-5`, at most 6 turns, and only the tool that reads files. It is given the steps of the trace without their checks, the type and the step of the stop, a screenshot and the list of elements of the screen where the replay stopped. It answers with one step id and one action, or with no action when it judges that one action is not enough. `ecr repair` decides. A refusal and its reason go into the next prompt, 3 attempts at most. It is asked for every trace that did not replay as recorded on a mutant, a failed oracle included: `ecr repair` refuses those whatever the proposal. An answer with no action counts as "explore again". The repair runs replay every kept trace once on the mutant (input `repair=3, public`, LocalSend is open source); this replay is not counted in detection, which comes from the 3 replays of step 3. A mutant of D1 or D3 counts as repaired when a proposal is accepted for every trace that diverged on it; the result is also given per trace. The author judges each accepted proposal (step 5) from its public line, next to the step it replaces and the check that follows.

*Reruns (section 5, first baseline).* The 7 kept traces come from 4 personas, and a rerun runs the same persona with the same brief. So each persona is run 5 times (20 runs instead of 30), with the inputs of the explorations, on the APK of amendment 3, and each run counts as a rerun of every kept trace of its persona: 5 reruns per trace. `reached_goal` is computed by `scripts/goal_check.py` of the same commit: the goal of a trace is the screen that the `visible` checks of its last checked step name, and it is reached when one screen saved during the run shows all their texts. The map's screen groups are not used, since the checks already name the screen. No kept trace records a bug, so `reported_bug_again` is null. On each D6 mutant, 3 runs of the persona `malik` (English, its trace sees all 5 D6 mutants). The author reads their findings and says whether they report the change. A run whose findings do not report it is a false green of the agent baseline, counted next to the false greens of ECR.

*Hand baseline (section 5, second baseline).* Like the checks (amendment 4), the hand-kept flow is written by the AI assistant, not by a person. The flow of a trace is its compiled Maestro flow at `c35dfed`. For each mutant on which a trace stops, the assistant edits the trace by hand (any change, steps added or removed) until its 3 replays on the mutant give what it recorded. `lines_changed` counts the lines added or removed in the compiled flow. A D6 mutant is never edited: a flow kept green there hides the regression. This baseline is weaker than one kept by a person who knows the app, and the paper says so.
