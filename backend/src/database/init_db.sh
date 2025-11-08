#!/bin/sh
set -e

DB_PATH="/data/db.sqlite"
INIT_SQL="/init/init.sql"

mkdir -p /data

if [ ! -f "$DB_PATH" ]; then
  echo "DB not found, initializing..."
  sqlite3 "$DB_PATH" < "$INIT_SQL"
  sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON;"
  echo "✅ SQLite database initialized at $DB_PATH"
else
  echo "DB already exists, skipping init."
fi
