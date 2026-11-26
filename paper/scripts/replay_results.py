#!/usr/bin/env python3
"""Writes the `replay` result file of one replay run (protocol section 10): the 20 replays on the
unchanged app (rq2), or the 3 replays on a mutant or on the build control (rq3).

Usage: replay_results.py <lines of the run page> <SHA256SUMS of the frozen traces> <out dir>

Replays not listed as FAIL on the run page are passes: the page gives one line per trace with
its counts and one line for each replay that does not give what the trace recorded.
The last replay of each trace ran with the network of the tools cut (replay_set.py).
"""
import json, pathlib, re, sys

lines_file, sums_file, out = map(pathlib.Path, sys.argv[1:4])
text = lines_file.read_text(encoding='utf-8')
run = int(re.search(r'^Run (\d+)', text, re.M).group(1))
times = int(re.search(r'replay_times=(\d+)', text).group(1))
sums = {pathlib.Path(p).name.replace('.trace.json', ''): h for h, p in
        (l.split() for l in sums_file.read_text().splitlines() if l.strip())}
replays, per_trace = [], {}
for m in re.finditer(r'^replays: (\S+): (\d+) of (\d+) replays give .*?median (\d+) s', text, re.M):
    tid, ok, n, med = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
    assert n == times and tid in sums
    fails = {int(f.group(1)): (f.group(2), f.group(3), f.group(4)) for f in re.finditer(
        r'^replays:\s+' + re.escape(tid) + r' replay (\d+) of \d+(?: \(network of the tools closed\))?: FAIL, (\w+) at step (\w+)(?: \(oracle ([\w-]+)\))?', text, re.M)}
    assert len(fails) == n - ok
    for i in range(1, n + 1):
        f = fails.get(i)
        replays.append({'kind': 'replay', 'trace_id': tid, 'trace_sha256': sums[tid], 'index': i,
                        'fresh_state': 'app data cleared by the harness, then clearState of launchApp',
                        'internet': 'cut' if i == n else 'open', 'model_key_present': False,
                        'outcome': 'fail' if f else 'pass',
                        'divergence': dict({'type': f[0], 'step': f[1]}, **({'oracle': f[2]} if f[2] else {})) if f else None})
    per_trace[tid] = {'same_as_recorded': ok, 'of': n, 'median_seconds': med}
head = text.split('\n', 1)[0]
mutant = re.search(r'\(mutant ([a-z0-9-]+),', head)
control = 'build control' in head
mutant = 'control-no-patch' if control else (mutant.group(1) if mutant else None)
rq = 'rq3' if mutant else 'rq2'
r = {'rq': rq, 'kind': 'replay_set', 'system': 'localsend', 'run': run,
     'ecr_commit': 'c35dfed3ef7fe6a5ab7b4e5ad20e3a964e606d38',
     'mat_commit': 'cd31933fee2d8e9821d5ec626fe8082ef635ef89',
     'traces_commit': re.search(r'at ([0-9a-f]{40})', text).group(1),
     'app_tag': 'v1.19.0', 'app_commit': '44f48f18a5503c43873570ff489d27ff1983e198',
     'apk_sha256': re.search(r'APK SHA-256 ([0-9a-f]{64})', text).group(1), 'mutant': mutant,
     'patch_from_ecr': re.search(r'from ECR ([0-9a-f]{40})', text).group(1) if mutant and not control else None,
     'device': 'Android emulator of the workflow at cd31933', 'per_trace': per_trace,
     'replays': replays,
     'source': 'public lines of the run page, ' + lines_file.name}
(out / (f'replay-{mutant}-{run}.json' if mutant else f'replay-{run}.json')).write_text(json.dumps(r, indent=1) + '\n', encoding='utf-8')
print(len(replays), sum(x['outcome'] == 'pass' for x in replays), per_trace)
