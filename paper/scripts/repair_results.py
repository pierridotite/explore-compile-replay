#!/usr/bin/env python3
"""Writes the `repair` result file of one repair run (protocol section 10, amendment 5).

Usage: repair_results.py <lines of the repair run> <SHA256SUMS of the frozen traces> <out dir>

One entry per attempt, from the `repairs:` lines of the run page. The run page says whether the checks
are unchanged; the two hashes are in the public replays.json, which this session cannot download, so
the file keeps `oracles_kept` and leaves the hashes null. `judgment` stays null: the judgments are in results/rq3/localsend/judgments-of-repairs.json (amendment 6).
"""
import json, pathlib, re, sys

lines_file, sums_file, out = map(pathlib.Path, sys.argv[1:4])
text = lines_file.read_text(encoding='utf-8')
sums = {pathlib.Path(p).name.replace('.trace.json', ''): h for h, p in (l.split() for l in sums_file.read_text().splitlines() if l.strip())}
run = int(re.search(r'^Run (\d+)', text, re.M).group(1))
mutant = re.search(r'mutant ([a-z0-9-]+)', text.split('\n', 1)[0]).group(1)
LINE = re.compile(r'^repairs: (\S+) attempt (\d+): stop (\w+) at step (\w+); proposed step (\w+), ([\w ]+): '
                  r'(accepted|refused: \w+|no_proposal)(?:, then (\d) of 3 replays pass, checks (unchanged|CHANGED))?; '
                  r'agent \$([\d.]+), (\d+) turns, (\d+) tokens out(?:, proposal (.*))?$', re.M)
attempts = []
for m in LINE.finditer(text):
    tid = m.group(1)
    result = m.group(7)
    proposal = json.loads(m.group(13)) if m.group(13) else None
    attempts.append({'kind': 'repair', 'trace_id': tid, 'trace_sha256': sums[tid],
                     'divergence': {'type': m.group(3), 'step': m.group(4)}, 'attempt': int(m.group(2)),
                     'proposal': proposal, 'action_kind': m.group(6),
                     'accepted': result == 'accepted',
                     'refusal_reason': None if result == 'accepted' else ('no_proposal' if result == 'no_proposal' else result.split(': ')[1]),
                     'oracles_kept': (m.group(9) == 'unchanged') if m.group(9) else None,
                     'oracles_sha256_before': None, 'oracles_sha256_after': None,
                     'replays_after_pass': int(m.group(8)) if m.group(8) else None,
                     'judgment': None,
                     'proposer': {'model': 'claude-sonnet-5-5', 'price_usd': float(m.group(10)), 'turns': int(m.group(11)), 'tokens_out': int(m.group(12))}})
nothing = re.findall(r'^repairs: (\S+) attempt \d+: the replay gave what the trace recorded', text, re.M)
diverged = sorted({a['trace_id'] for a in attempts})
r = {'rq': 'rq3', 'kind': 'repair_run', 'system': 'localsend', 'run': run, 'mutant': mutant,
     'mat_commit': re.search(r' at ([0-9a-f]{40})', text).group(1), 'ecr_commit': 'c35dfed3ef7fe6a5ab7b4e5ad20e3a964e606d38',
     'apk_sha256': re.search(r'APK SHA-256 ([0-9a-f]{64})', text).group(1),
     'traces_diverged_in_this_run': diverged, 'traces_with_nothing_to_repair': nothing,
     'traces_repaired': sorted({a['trace_id'] for a in attempts if a['accepted']}),
     'proposer_price_usd': round(sum(a['proposer']['price_usd'] for a in attempts), 4),
     'attempts': attempts, 'source': 'public lines of the run page, ' + lines_file.name}
(out / f'repair-{mutant}-{run}.json').write_text(json.dumps(r, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
print(mutant, len(attempts), 'attempts,', len(r['traces_repaired']), 'of', len(diverged), 'repaired, $', r['proposer_price_usd'])
