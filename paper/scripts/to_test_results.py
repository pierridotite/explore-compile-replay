#!/usr/bin/env python3
"""Writes one `to_test` result file per checked trace (protocol section 10, amendments 1 and 4).

Usage: to_test_results.py <traces dir> <lines of the keep-or-drop run> <out dir>

<traces dir>/<persona>/<id>.trace.json are the 10 checked traces (commit 983557a of the branch
eval-localsend-1-traces). The lines file holds the public lines of the run page of the
keep-or-drop run. No typed text is read.
"""
import hashlib, json, pathlib, re, sys

traces, lines_file, out = map(pathlib.Path, sys.argv[1:4])
text = lines_file.read_text(encoding='utf-8')
run = int(re.search(r'^Run (\d+)', text, re.M).group(1))
apk = re.search(r'APK SHA-256 ([0-9a-f]{64})', text).group(1)
tip = re.search(r'at ([0-9a-f]{40})', text).group(1)
freeze = re.search(r'Freeze commit: ([0-9a-f]{40})', text).group(1)
causes = {
    'grace-20261125T215820': 'target_not_found at s4: a tap on a file of the system file picker; the file is the screen dump written on the phone of the agent (inferred)',
    'layla-20261125T212314': 'target_not_found at s7: the confirm button right after typing, the app in front; cause unknown',
    'olga-20261125T215851': 'oracle_failed on ai-s16-about-page with another system window in front; probably a scroll that stopped on another row (inferred)',
}
out.mkdir(parents=True, exist_ok=True)
for f in sorted(traces.glob('*/*.trace.json')):
    t = json.loads(f.read_text(encoding='utf-8'))
    tid = t['id']
    line = re.search(r'^replays: ' + re.escape(tid) + r': (.*)$', text, re.M).group(1)
    passed = line.startswith('1 of 1')
    stop = re.search(r'stops: (\w+) at step (\w+)', line)
    taps = [s['action'].get('target') for s in t['steps'] if s['action']['kind'] in ('tapOn', 'longPressOn')]
    checks = [c for s in t['steps'] for c in s['checkpoints']]
    r = {
        'rq': 'rq1', 'kind': 'to_test', 'system': 'localsend',
        'ecr_commit': 'c35dfed3ef7fe6a5ab7b4e5ad20e3a964e606d38',
        'mat_commit': 'cd31933fee2d8e9821d5ec626fe8082ef635ef89',
        'traces_commit': tip, 'freeze_commit': freeze,
        'app_tag': 'v1.19.0', 'app_commit': '44f48f18a5503c43873570ff489d27ff1983e198',
        'apk_sha256': apk, 'mutant': None, 'run': run,
        'trace_id': tid, 'persona': t['persona']['id'],
        'trace_sha256': hashlib.sha256(f.read_bytes()).hexdigest(),
        'checks_written_by': 'AI assistant, rule of protocol amendment 4 (ECR d9e3931)',
        'minutes_noted': None, 'check_seconds': None,
        'time_note': 'not measured: amendment 4',
        'checks_added': len(checks), 'oracles': len(checks), 'known_bugs': 0,
        'targets_by_name': sum(1 for x in taps if 'text' in x),
        'targets_by_id': sum(1 for x in taps if 'id' in x),
        'targets_by_point': sum(1 for x in taps if 'point' in x),
        'first_replay': {'outcome': 'pass' if passed else 'fail',
                         'divergence': None if passed else {'step': stop.group(2), 'type': stop.group(1)},
                         'seconds': int(re.search(r'median (\d+) s', line).group(1))},
        'kept': passed, 'drop_reason': None if passed else causes[tid],
        'source': 'public lines of the run page, results/lines/run-%d-lines.txt' % run,
    }
    (out / f'to_test-{tid}.json').write_text(json.dumps(r, indent=2) + '\n', encoding='utf-8')
    print(tid, r['first_replay']['outcome'], r['checks_added'], r['targets_by_name'], r['targets_by_point'])
