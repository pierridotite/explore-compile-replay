#!/usr/bin/env python3
"""Break-even of protocol section 6: smallest n with explore + n x replay + repairs < n x rerun, in price and in time.

Per kept trace, averaged over the 7 kept traces. Inputs, all in results/:
- explore: the exploration that produced each kept trace (rq1 explore-*.json), price and agent seconds;
- replay: median seconds of the trace on the unchanged app (rq2), price 0 (no model);
- rerun: median price and agent seconds of the 20 reruns (rq1 rerun-*.json, seconds from rerun-seconds.json);
- repairs: proposer price of every repair run (rq3 repair-*.json); time = seconds of the job step of the repair
  run above the same step in a run of the same persona that repaired nothing (rq1 repair-job-seconds.json).
A second figure adds one exploration for each (trace, mutant) that diverged and was not repaired, D6 left out
(a failed oracle goes to a person, not to a new exploration).
"""
import glob, json, math, statistics
from collections import defaultdict

R = 'results/'
KEPT = {'felipe-20261125T212237': '45701272440-felipe', 'lucia-20261125T212222': '45701272440-lucia',
        'malik-20261125T212400': '45701272440-malik', 'ravi-20261125T212224': '45701272440-ravi',
        'felipe-20261125T215845': '45706788156-felipe', 'lucia-20261125T215848': '45706788156-lucia',
        'ravi-20261125T215801': '45706788156-ravi'}
ex = {t: json.load(open(f'{R}rq1/localsend/explore-{k}.json')) for t, k in KEPT.items()}
rq2 = json.load(open(glob.glob(f'{R}rq2/localsend/replay-*.json')[0]))['per_trace']
reruns = [json.load(open(f)) for f in glob.glob(f'{R}rq1/localsend/rerun-*.json') if json.load(open(f)).get('kind') == 'rerun' and json.load(open(f)).get('mutant') is None]
rsec = json.load(open(f'{R}rq1/localsend/rerun-seconds.json'))['seconds']
repairs = [json.load(open(f)) for f in sorted(glob.glob(f'{R}rq3/localsend/repair-*.json'))]
jobs = json.load(open(f'{R}rq1/localsend/repair-job-seconds.json'))['jobs']

n_traces = len(KEPT)
explore_price = statistics.mean(e['price_usd'] for e in ex.values())
explore_sec = statistics.mean(e['seconds_agent'] for e in ex.values())
replay_sec = statistics.mean(rq2[t]['median_seconds'] for t in KEPT)
rerun_price = statistics.median(r['price_usd'] for r in reruns)
rerun_sec = statistics.median(rsec)

attempted = {f['run'] for f in repairs if f['attempts']}
base = defaultdict(list)
for j in jobs:
    if j['run'] not in attempted:
        base[j['persona']].append(j['seconds'])
base = {p: statistics.median(v) for p, v in base.items()}
repair_sec_total = sum(max(0, j['seconds'] - base[j['persona']]) for j in jobs if j['run'] in attempted)
repair_price_total = sum(f['proposer_price_usd'] for f in repairs)
unrepaired = sum(len(set(f['traces_diverged_in_this_run']) - set(f['traces_repaired'])) for f in repairs if not f['mutant'].startswith('d6'))
mutants_with_repairs = sorted(f['mutant'] for f in repairs)

def n_star(fixed, per_run_gain):
    return math.floor(fixed / per_run_gain) + 1 if per_run_gain > 0 else None

rp, rs = repair_price_total / n_traces, repair_sec_total / n_traces
re_p, re_s = unrepaired * explore_price / n_traces, unrepaired * explore_sec / n_traces
res = {'rq': 'rq1', 'kind': 'break_even', 'system': 'localsend', 'per': 'kept trace, mean over the 7 kept traces',
       'explore_price_usd': round(explore_price, 3), 'explore_seconds': round(explore_sec),
       'replay_price_usd': 0, 'replay_seconds': round(replay_sec), 'rerun_price_usd': rerun_price, 'rerun_seconds': rerun_sec,
       'repair_runs': mutants_with_repairs, 'repair_price_usd_per_trace': round(rp, 3), 'repair_seconds_per_trace': round(rs),
       'persona_baseline_seconds': base, 'unrepaired_trace_mutant_pairs_not_d6': unrepaired,
       'break_even_price': n_star(explore_price + rp, rerun_price),
       'break_even_time': n_star(explore_sec + rs, rerun_sec - replay_sec),
       'break_even_price_with_new_explorations': n_star(explore_price + rp + re_p, rerun_price),
       'break_even_time_with_new_explorations': n_star(explore_sec + rs + re_s, rerun_sec - replay_sec)}
json.dump(res, open(f'{R}rq1/localsend/break-even.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
