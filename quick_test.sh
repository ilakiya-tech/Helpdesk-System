#!/bin/bash
curl -s -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
echo ""
echo "---"
curl -s http://localhost:3000/api/tickets \
  -H 'Authorization: Bearer PLACEHOLDER' | head -c 200
