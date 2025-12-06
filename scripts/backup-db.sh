#!/bin/bash
# Database backup script for report submission changes
# Usage: ./scripts/backup-db.sh

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/delhi_breathes}"
BACKUP_DIR="./db-backup-$(date +%Y%m%d%H%M)"

echo "Creating database backup..."
echo "MongoDB URI: $MONGO_URI"
echo "Backup directory: $BACKUP_DIR"

mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR"

if [ $? -eq 0 ]; then
  echo "✓ Backup created successfully at: $BACKUP_DIR"
  echo "To restore: mongorestore --uri=\"$MONGO_URI\" $BACKUP_DIR"
else
  echo "✗ Backup failed!"
  exit 1
fi

