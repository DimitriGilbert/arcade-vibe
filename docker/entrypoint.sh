#!/bin/sh
set -e

echo "Starting application..."

# Wait for database to be ready
echo "Waiting for database..."
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1')
  .then(() => { pool.end(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "Database unavailable, retrying in 2 seconds..."
  sleep 2
done
echo "Database is ready!"

# Wait for Redis if configured
if [ -n "$REDIS_URL" ] && [ "$DISABLE_REDIS" != "1" ]; then
  echo "Waiting for Redis..."
  until node -e "
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    redis.ping()
      .then(() => { redis.quit(); process.exit(0); })
      .catch(() => process.exit(1));
  " 2>/dev/null; do
    echo "Redis unavailable, retrying in 2 seconds..."
    sleep 2
  done
  echo "Redis is ready!"
fi

# Run database migrations
echo "Running database migrations..."
cd /app
pnpm run db:migrate
echo "Migrations completed!"

# Start the application
echo "Starting Next.js server..."
exec node apps/web/server.js
