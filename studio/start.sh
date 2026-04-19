#!/bin/bash
cd "$(dirname "$0")"
echo "Starting UC Studio..."
node server.js &
SERVER_PID=$!
npx vite --port 5200
kill $SERVER_PID 2>/dev/null
