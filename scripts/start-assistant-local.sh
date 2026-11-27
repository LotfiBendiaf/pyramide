#!/bin/sh
set -eu
task_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$task_root"
task_db="$task_root/.local-data/mongodb"
mkdir -p "$task_db"
if ! lsof -nP -iTCP:27029 -sTCP:LISTEN >/dev/null 2>&1; then
  mongod --dbpath "$task_db" --port 27029 --bind_ip 127.0.0.1 --fork --logpath "$task_db/mongo.log"
fi
exec "$task_root/node_modules/.bin/next" dev --hostname 0.0.0.0 --port 3017
