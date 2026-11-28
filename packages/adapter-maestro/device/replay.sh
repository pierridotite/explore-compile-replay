#!/usr/bin/env bash
# Runs once the emulator is up (.github/workflows/device.yml): installs the
# demo app and replays each trace of this folder. No model is called.
# Usage: bash packages/adapter-maestro/device/replay.sh <path of the .apk>
set -uo pipefail
adb wait-for-device
adb install -r -g "$1" || exit 1

# A test account that exists nowhere: the demo app keeps nothing and calls no server.
export ECR_PARAM_NAME=Anna ECR_PARAM_EMAIL=anna@example.com ECR_PARAM_PASSWORD=only-for-this-test
# Exercise replay-time selector escaping on the device, including a literal dollar.
export ECR_PARAM_TASK_TITLE='Total: $4.50 (2 items)?'
export ECR_MAESTRO_DEBUG="$PWD/maestro-debug"

failed=0
for trace in packages/adapter-maestro/device/*.trace.json; do
  pnpm -s ecr replay "$trace" --adapter packages/adapter-maestro/src/index.ts || failed=1
done

# What Maestro recorded for each flow: one line per command, with its status.
node packages/adapter-maestro/device/record.ts "$ECR_MAESTRO_DEBUG" || true
exit $failed
