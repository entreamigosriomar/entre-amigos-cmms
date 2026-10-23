#!/bin/bash
pg_isready -h /tmp -p 5433 -q || (rm -f /home/claude/pgtest/data/postmaster.pid; su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /home/claude/pgtest/data -o '-p 5433 -k /tmp' -l /home/claude/pgtest/log.txt start" >/dev/null; sleep 2)
pg_isready -h /tmp -p 5433
