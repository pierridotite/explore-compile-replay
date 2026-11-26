#!/usr/bin/env python3
"""Prints the numbers of the paper from the result files (protocol sections 6 and 8, amendment 5).

Usage: summary.py [results dir]   (default: paper/results)
"""
import json, math, pathlib, statistics, sys
from collections import defaultdict

R = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent / 'results')
KNOWN = ('ravi-20261125T212224', 's15', 'ai-s15-settings-tab')   # the instability measured on the unchanged app (rq2)
EXPECTED = {'d1': {'target_not_found'}, 'd3': {'target_not_found', 'action_failed'}, 'd4': {'target_not_found', 'unexpected_state'},
            'd5': {'timeout'}, 'd6': {'oracle_failed'}}

def wilson(k, n, z=1.96):
    if n == 0: return (0, 0)
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (round((c - h) / d, 2), round((c + h) / d, 2))

def load(pattern):
    return [json.loads(p.read_text(encoding='utf-8')) for p in sorted(R.glob(pattern))]

# ---- RQ3: detection and classification, from the 3 replays of each trace on each mutant
mutants = {}
for f in load('rq3/localsend/replay-*.json'):
    if f['mutant'] == 'control-no-patch':
        control = f; continue
    if f['mutant'] in mutants and f['run'] < mutants[f['mutant']]['run']: continue
    mutants[f['mutant']] = f
print('control (no patch):', sum(r['outcome'] == 'pass' for r in control['replays']), 'of', len(control['replays']))
by_class = defaultdict(list)
for m, f in sorted(mutants.items()):
    per = defaultdict(list)
    for r in f['replays']: per[r['trace_id']].append(r)
    always, sometimes, types = [], [], set()
    for t, rs in per.items():
        bad = [r for r in rs if r['outcome'] != 'pass' and (t, r['divergence']['step'], r['divergence'].get('oracle')) != KNOWN]
        if len(bad) == len(rs): always.append(t); types |= {r['divergence']['type'] for r in bad}
        elif bad: sometimes.append(t)
    known = sum(1 for t, rs in per.items() for r in rs if r['outcome'] != 'pass' and (t, r['divergence']['step'], r['divergence'].get('oracle')) == KNOWN)
    cls = m[:2]
    detected = bool(always)
    right = detected and types <= EXPECTED[cls]
    by_class[cls].append((m, detected, right, len(always), sometimes, sorted(types), known))
    print(f"{m:30} stopped {len(always)} traces every time{(', sometimes ' + ','.join(t[:5] + t[-4:] for t in sometimes)) if sometimes else ''}; types {sorted(types)}; known instability x{known}")
for cls, rows in sorted(by_class.items()):
    d = sum(r[1] for r in rows); c = sum(r[2] for r in rows)
    print(f"{cls}: detected {d} of {len(rows)} (Wilson {wilson(d, len(rows))}), expected type {c} of {d}")
fg = [r[0] for r in by_class['d6'] if not r[1]]
print('D6 false greens:', len(fg), 'of', len(by_class['d6']))

# ---- RQ3: repairs
reps = {}
for f in load('rq3/localsend/repair-*.json'):
    if f['mutant'] in reps and f['run'] < reps[f['mutant']]['run']: continue
    reps[f['mutant']] = f
price = 0; reasons = defaultdict(int); accepted = []
for m, f in sorted(reps.items()):
    price += f['proposer_price_usd']
    for a in f['attempts']:
        if not a['accepted']: reasons[(m[:2], a['refusal_reason'])] += 1
        else: accepted.append((m, a))
    print(f"repair {m:28} {len(f['traces_repaired'])} of {len(f['traces_diverged_in_this_run'])} diverged traces, {len(f['attempts'])} attempts, ${f['proposer_price_usd']}")
full = [m for m, f in reps.items() if m[:2] in ('d1', 'd2', 'd3') and f['traces_diverged_in_this_run'] and set(f['traces_repaired']) == set(f['traces_diverged_in_this_run'])]
d13 = [m for m in mutants if m[:2] in ('d1', 'd2', 'd3')]
stopped13 = [m for m in d13 if any(r[0] == m and r[1] for r in by_class[m[:2]])]
print('D1-D3 mutants repaired (every diverged trace):', len(full), 'of', len(stopped13), 'that stop a trace, of', len(d13), 'in all:', sorted(full))
print('refusals by class and reason:', dict(sorted(reasons.items())))
print('accepted proposals:', len(accepted), '; by position:', sum(1 for m, a in accepted if a['action_kind'].endswith('position')),
      '; replays after, all pass:', sum(1 for m, a in accepted if a['replays_after_pass'] == 3), '; checks kept:', sum(1 for m, a in accepted if a['oracles_kept']))
print('proposer price, all repair runs: $%.2f' % price)
jf = json.loads((R / 'rq3/localsend/judgments-of-repairs.json').read_text())
verdicts = [j['judgment']['verdict'] for j in jf['judgments']]
print('accepted repairs judged:', len(verdicts), 'of', len(accepted), '; by:', jf['judged_by'], '; right:', verdicts.count('right'), '; wrong:', verdicts.count('wrong'))

# ---- RQ1/RQ2: reruns
reruns = [f for f in load('rq1/localsend/rerun-*.json') if f.get('kind') == 'rerun' and not f['mutant']]
prices = [f['price_usd'] for f in reruns if f['price_usd'] is not None]
print('reruns:', len(reruns), 'agent runs; price median $%.2f (%.2f to %.2f), total $%.2f' % (statistics.median(prices), min(prices), max(prices), sum(prices)))
goal = defaultdict(list)
for f in reruns:
    for t in f['traces']: goal[t['trace_id']].append(t['reached_goal'])
for t, v in sorted(goal.items()): print('  goal', t, sum(v), 'of', len(v))
k = sum(sum(v) for v in goal.values()); n = sum(len(v) for v in goal.values())
print('  trace reruns that reach the goal:', k, 'of', n, wilson(k, n))
paths = [f['path_replay'] for f in reruns]
print('  path of the rerun replays once:', sum(1 for p in paths if p == 'pass'), 'of', len(paths))
d6 = [f for f in load('rq1/localsend/rerun-*.json') if f.get('kind') == 'rerun' and f['mutant']]
if d6: print('D6 agent runs:', len(d6), 'goal reached:', sum(1 for f in d6 for t in f['traces'] if t['reached_goal']))

# ---- hand baseline
for f in load('rq3/localsend/hand-*.json'):
    rows = f['traces']
    print(f"hand {f['mutant']:28} lines changed {sorted({r['lines_changed'] for r in rows})}, kept green {sum(r['kept_green'] for r in rows)} of {len(rows)}, "
          f"no outcome {sum(1 for r in rows if not r['replays'])}")
