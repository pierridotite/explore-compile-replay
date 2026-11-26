#!/usr/bin/env python3
"""Writes one result file of kind `explore` per persona from the public logs of a run of
mobile-agent-testers. Usage: explore_results.py <run id> <logs dir> <out dir>
The logs dir holds one <persona>.log per Android job (gh api repos/O/R/actions/jobs/<id>/logs)
and build-android.log. Only public lines are read: no trace, report or typed text."""
import json, re, sys, datetime, pathlib

run, logs, out = sys.argv[1], pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)

def ts(line):
    return datetime.datetime.fromisoformat(line.split(' ', 1)[0][:26])

build = (logs / 'build-android.log').read_text()
m = re.search(r'Android app: (\S+) (\S+) at ([0-9a-f]{40}), APK SHA-256 ([0-9a-f]{64})', build)
source, tag, app_commit, apk = m.groups()

for f in sorted(logs.glob('*.log')):
    if f.stem == 'build-android':
        continue
    lines = f.read_text().splitlines()
    def find(rx):
        for l in lines:
            mm = re.search(rx, l)
            if mm:
                return l, mm
        return None, None
    lf, fin = find(r'(\w+): finished \((\d+) turns, \$([0-9.]+)\)')
    li, _ = find(r'Performing Streamed Install')
    _, tr = find(r'trace: (\d+) steps, (\d+) typed texts kept apart, (\d+) commands left out')
    _, tp = find(r'trace: (\d+) taps: (\d+) by name, (\d+) by id, (\d+) by position, (\d+) at a place')
    lr, rp = find(r'replay: (pass|stopped)(.*)')
    replay = {'outcome': rp.group(1)}
    if rp.group(1) == 'pass':
        replay['seconds'] = int(re.search(r'in (\d+) s', rp.group(2)).group(1))
    else:
        d = re.search(r'at step (\d+) of (\d+) \((\w+), ([^,]+), after ([^)]*)\), after (\d+) s', rp.group(2))
        replay.update(step=int(d.group(1)), of=int(d.group(2)), divergence=d.group(3), target=d.group(4),
                      after=d.group(5), seconds=int(d.group(6)))
        sc = re.search(r'on screen: ([^,;]+)', rp.group(2))
        if sc:
            replay['on_screen'] = sc.group(1)
    rec = {
        'rq': 'rq1', 'kind': 'explore', 'system': 'localsend',
        'run': int(run), 'mat_commit': 'cd31933fee2d8e9821d5ec626fe8082ef635ef89', 'ecr_commit': 'c35dfed3ef7fe6a5ab7b4e5ad20e3a964e606d38',
        'app_source': source, 'app_tag': tag, 'app_commit': app_commit, 'apk_sha256': apk,
        'persona': fin.group(1), 'model': 'claude-sonnet-5-5',
        'turns': int(fin.group(2)), 'price_usd': float(fin.group(3)), 'price_source': 'agent log line, public run page',
        'seconds_agent': round((ts(lf) - ts(li)).total_seconds()),
        'seconds_definition': 'from the install of the app to the line "finished" of the agent, public log timestamps',
        'tokens_in': None, 'tokens_out': None, 'tokens_cache': None,
        'tokens_note': 'in agent-output.json, encrypted with the author key; to fill after decryption',
        'steps': int(tr.group(1)), 'params_kept_apart': int(tr.group(2)), 'commands_left_out': int(tr.group(3)),
        'taps': int(tp.group(1)), 'targets_by_name': int(tp.group(2)), 'targets_by_id': int(tp.group(3)),
        'targets_by_point': int(tp.group(4)), 'taps_at_place_inside': int(tp.group(5)),
        'path_replay': replay,
    }
    (out / f'explore-{run}-{rec["persona"]}.json').write_text(json.dumps(rec, indent=2) + '\n')
    print(rec['persona'], rec['turns'], rec['price_usd'], rec['seconds_agent'], rec['steps'], replay['outcome'])
