#!/usr/bin/env python3
"""Writes results/rq3/localsend/hand-<mutant>.json, the hand baseline of protocol amendment 5.

Usage: hand_results.py <out dir of hand/edits.py> <SHA256SUMS of the frozen traces> <out dir> <lines file>...
Each lines file is the public lines of one run that replayed hand/<mutant> 3 times; a later file for the same
mutant (hand2-*) replaces the outcome of the traces it replays. lines_changed counts the lines added or removed
in the compiled Maestro flow (comments left out), as the protocol defines it.
"""
import hashlib, json, pathlib, re, sys

edits = pathlib.Path(sys.argv[1]); changes = json.load(open(edits / 'lines_changed.json'))
sums_file, out = pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
sums = {pathlib.Path(p).name.replace('.trace.json', ''): h for h, p in (l.split() for l in sums_file.read_text().splitlines() if l.strip())}
REPLAYS = re.compile(r'^replays: (\S+): (\d+) of (\d+) replays give what the trace recorded', re.M)
outcomes = {}
for f in sys.argv[4:]:
    text = pathlib.Path(f).read_text(encoding='utf-8')
    run = int(re.search(r'^Run (\d+)', text, re.M).group(1))
    mutant = re.search(r'apply of drift-bench/mutants/localsend/([a-z0-9-]+)\.patch|mutant ([a-z0-9-]+)', text)
    mutant = mutant.group(1) or mutant.group(2)
    for m in REPLAYS.finditer(text):
        outcomes.setdefault(mutant, {})[m.group(1)] = {'same_as_recorded': int(m.group(2)), 'of': int(m.group(3)), 'run': run}
for mutant, per in sorted(changes.items()):
    rows = []
    for tid, v in sorted(per.items()):
        o = outcomes.get(mutant, {}).get(tid)
        rows.append({'kind': 'hand_baseline', 'trace_id': tid, 'trace_sha256': sums[tid],
                     'flow_sha256': hashlib.sha256(next((edits / '.flows' / mutant / tid).glob('*.yaml')).read_bytes()).hexdigest(),
                     'lines_changed': v['lines_changed'], 'replays': o,
                     'kept_green': bool(o and o['same_as_recorded'] == o['of'])})
    (out / f'hand-{mutant}.json').write_text(json.dumps({'rq': 'rq3', 'kind': 'hand_baseline_run', 'system': 'localsend', 'mutant': mutant,
        'edited_by': 'an AI assistant (protocol amendment 5)', 'branch': 'eval-localsend-1-hand', 'traces': rows}, indent=1) + '\n')
    print(mutant, [(r['trace_id'][:5] + r['trace_id'][-4:], r['lines_changed'], r['replays'] and f"{r['replays']['same_as_recorded']}/{r['replays']['of']}") for r in rows])
