#!/usr/bin/env python3
"""Add token counts from decrypted agent-output.json files to explore result files.

Usage: merge_tokens.py <decrypted runs dir> <results dir>

<decrypted runs dir>/<run>/<persona>/results/agent-output.json is read.
Only counts, the resolved model and the exact cost are copied; no text of the
agent output is written.
"""
import json
import pathlib
import sys

runs_dir, out_dir = map(pathlib.Path, sys.argv[1:3])
problems = []
for res in sorted(out_dir.glob('explore-*.json')):
    r = json.loads(res.read_text())
    src = runs_dir / str(r['run']) / r['persona'] / 'results' / 'agent-output.json'
    a = json.loads(src.read_text())
    u = a['usage']
    models = sorted(a.get('modelUsage', {}))
    r.pop('tokens_cache', None)
    r.pop('tokens_note', None)
    r['tokens_in'] = u['input_tokens']
    r['tokens_cache_write'] = u['cache_creation_input_tokens']
    r['tokens_cache_read'] = u['cache_read_input_tokens']
    r['tokens_out'] = u['output_tokens']
    r['tokens_source'] = 'usage in agent-output.json, decrypted by the author; counts only'
    r['models_resolved'] = models
    r['price_usd_exact'] = a['total_cost_usd']
    r['duration_ms_agent'] = a['duration_ms']
    if a['num_turns'] != r['turns']:
        problems.append(f"{res.name}: turns {r['turns']} in log, {a['num_turns']} in output")
    if abs(round(a['total_cost_usd'], 2) - r['price_usd']) > 0.005:
        problems.append(f"{res.name}: price {r['price_usd']} in log, {a['total_cost_usd']} in output")
    if models != [r['model']]:
        problems.append(f"{res.name}: models {models}, expected {r['model']}")
    res.write_text(json.dumps(r, indent=2) + '\n')
print('\n'.join(problems) or 'all turns, prices and models agree')
