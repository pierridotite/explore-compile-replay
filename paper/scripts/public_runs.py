"""Figures of the public runs of mobile-agent-testers, from docs/runs/data/*.json.
Usage: python3 public_runs.py <path of the repository>"""
import glob, json, sys
root = sys.argv[1]
low, high, tlow, thigh = [], [], [], []
for path in sorted(glob.glob(f"{root}/docs/runs/data/*.json")):
    run = json.load(open(path))
    detail = run["agents_detail"]
    costs = [agent["model_usage_usd"] for agent in detail]
    turns = [agent["turns"] for agent in detail]
    reports = sum(len(agent["reports"]) if isinstance(agent["reports"], list) else agent["reports"] for agent in detail)
    print(path.split("/")[-1], "| agents", run["agents"], len(detail), "| reports", run["reports"], reports,
          "| minutes", run["wall_clock_minutes"], "| usd", run["model_usage_usd"], round(sum(costs), 2),
          "| per agent usd", min(costs), max(costs), "| turns", min(turns), max(turns), "| grouping:", run["grouping"])
    low.append(min(costs)); high.append(max(costs)); tlow.append(min(turns)); thigh.append(max(turns))
print("both runs | per agent usd", min(low), max(high), "| turns", min(tlow), max(thigh))
