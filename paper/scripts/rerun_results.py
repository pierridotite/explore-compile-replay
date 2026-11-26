#!/usr/bin/env python3
"""Writes the `rerun` result files (protocol section 10, amendment 5) from the public lines of the rerun runs.

Usage: rerun_results.py <SHA256SUMS of the frozen traces> <out dir> <lines file>...

One file per (run, persona): the cost of the agent, and for each kept trace of that persona whether the
agent reached its goal (scripts/goal_check.py). No kept trace records a bug: reported_bug_again is null.
"""
import json, pathlib, re, sys

sums_file, out, *files = map(pathlib.Path, sys.argv[1:])
sums = {pathlib.Path(p).name.replace('.trace.json', ''): h for h, p in (l.split() for l in sums_file.read_text().splitlines() if l.strip())}
out.mkdir(parents=True, exist_ok=True)
written = []
for f in files:
    text = f.read_text(encoding='utf-8')
    run = int(re.search(r'^Run (\d+)', text, re.M).group(1))
    head = text.split('\n', 1)[0]
    mutant = re.search(r'mutant ([a-z0-9-]+)', head)
    commit = re.search(r' at ([0-9a-f]{40})', text).group(1)
    index = re.search(r'rerun-(?:[a-z0-9-]+-)?(\d+)-lines', f.name)
    for block in re.finditer(r'^(\w+) \(job (\w+)[^)]*\):\n((?:  .*\n?)*)', text, re.M):
        persona, status, body = block.group(1), block.group(2), block.group(3)
        cost = re.search(r'^  \w+: finished \((\d+) turns, \$([\d.]+)\)', body, re.M)
        goals = {g.group(1): g.group(2).startswith('reached') for g in re.finditer(r'^  goal: (\S+): screen of step \S+ \(\d+ texts\), (reached|not reached)', body, re.M)}
        replay = re.search(r'^  replay: (pass|stopped at step (\d+) of (\d+) \((\w+))', body, re.M)
        r = {'rq': 'rq1', 'kind': 'rerun', 'system': 'localsend', 'run': run, 'index': int(index.group(1)) if index else None,
             'persona': persona, 'job': status, 'brief': 'AGENT_BRIEF.md (inputs of exploration run 45701272440)',
             'model': 'claude-sonnet-5-5', 'mat_commit': commit, 'mutant': mutant.group(1) if mutant else None,
             'app_tag': 'v1.19.0', 'app_commit': '44f48f18a5503c43873570ff489d27ff1983e198',
             'apk_sha256': (re.search(r'APK SHA-256 ([0-9a-f]{64})', text) or [None, None])[1],
             'turns': int(cost.group(1)) if cost else None, 'price_usd': float(cost.group(2)) if cost else None,
             'price_rate_date': '2026-11-26', 'path_replay': (replay.group(1) if replay and replay.group(1) == 'pass'
                                                               else {'stopped_at': int(replay.group(2)), 'of': int(replay.group(3)), 'type': replay.group(4)} if replay else None),
             'traces': [{'trace_id': t, 'trace_sha256': sums.get(t), 'reached_goal': ok, 'reported_bug_again': None,
                         'judged_by': 'scripts/goal_check.py (amendment 5)'} for t, ok in goals.items()],
             'source': 'public lines of the run page, ' + f.name}
        name = f"rerun-{r['mutant'] + '-' if r['mutant'] else ''}{run}-{persona}.json"
        (out / name).write_text(json.dumps(r, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
        written.append((persona, r['price_usd'], {t[:5] + t[-4:]: ok for t, ok in goals.items()}))
for w in written:
    print(*w)
