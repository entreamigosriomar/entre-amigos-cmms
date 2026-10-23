#!/bin/bash
cd /home/claude/e2e
./start_pg.sh >/dev/null
for p in $(pgrep -x postgrest) $(pgrep -f '^node gateway.js$'); do kill $p; done; sleep 0.8
nohup ./postgrest pgrst.conf > pgrst.log 2>&1 &
nohup node gateway.js > gateway.log 2>&1 &
sleep 2
cat gateway.log; grep -i "listen\|error" pgrst.log | tail -2
