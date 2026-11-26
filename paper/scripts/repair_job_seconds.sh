#!/usr/bin/env bash
# Writes results/rq1/localsend/repair-job-seconds.json: the duration of the step "Emulator + agent" of each Android
# job of each repair run listed in run-ids.txt (GitHub API, last attempt). Usage: repair_job_seconds.sh <run-ids.txt>
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp)
grep '^repair-' "$1" | while read -r name run; do
  gh api "repos/pierridotite/mobile-agent-testers/actions/runs/$run/jobs" --paginate \
    -q '.jobs[] | select(.name|startswith("android")) | [.name, (.steps[]|select(.name=="Emulator + agent")|.started_at,.completed_at)] | @tsv' |
  while IFS=$'\t' read -r jn s e; do
    p=$(sed -E 's/android \(([a-z]+),.*/\1/' <<<"$jn")
    printf '%s\t%s\t%s\t%s\n' "${name#repair-}" "$run" "$p" $(( $(date -d "$e" +%s) - $(date -d "$s" +%s) ))
  done
done > "$tmp"
python3 - "$tmp" <<'PY'
import json, sys
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[1]) if l.strip()]
json.dump({'rq': 'rq1', 'kind': 'repair_job_seconds', 'system': 'localsend',
           'definition': 'duration of the step "Emulator + agent" of each Android job of each repair run (GitHub API, last attempt); it holds the emulator start, one replay of each trace of the persona, and the repairs',
           'jobs': [{'mutant': m, 'run': int(r), 'persona': p, 'seconds': int(s)} for m, r, p, s in rows]},
          open('results/rq1/localsend/repair-job-seconds.json', 'w'), indent=1)
print(len(rows), 'jobs')
PY
