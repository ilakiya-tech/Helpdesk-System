#!/bin/bash
# test_server.sh - Start helpdesk server and run endpoint tests

EXE="/c/Users/Dell/Helpdesk-System/backend-c/src/helpdesk.exe"

echo "============================================"
echo "  Helpdesk C Server - Build & Test Script"
echo "============================================"

# Kill any existing instance
pkill -f helpdesk.exe 2>/dev/null
sleep 1

# Start server in background
echo "[*] Starting server..."
"$EXE" &
SERVER_PID=$!
sleep 2

# Check it's running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "[FAIL] Server failed to start"
    exit 1
fi
echo "[OK] Server running (PID $SERVER_PID) on port 9090"
echo ""

# ----- Test 1: Login as admin -----
echo "--- TEST 1: Login (Hash Table O(1) lookup) ---"
R=$(curl -s -X POST http://localhost:9090/api/auth \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
echo "Response: $R"
echo ""

# ----- Test 2: Wrong password -----
echo "--- TEST 2: Wrong password (expect 401) ---"
R=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:9090/api/auth \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpass"}')
echo "Response: $R"
echo ""

# ----- Test 3: Login as staff -----
echo "--- TEST 3: Login as staff ---"
R=$(curl -s -X POST http://localhost:9090/api/auth \
    -H "Content-Type: application/json" \
    -d '{"username":"staff","password":"staff123"}')
echo "Response: $R"
echo ""

# ----- Test 4: Create Critical ticket -----
echo "--- TEST 4: Create Critical Ticket (AVL Tree + Priority Queue) ---"
R=$(curl -s -X POST http://localhost:9090/api/tickets \
    -H "Content-Type: application/json" \
    -d '{"title":"Server Down","description":"Production server is unreachable","priority":"Critical","createdBy":"admin"}')
echo "Response: $R"
echo ""

# ----- Test 5: Create High ticket -----
echo "--- TEST 5: Create High Priority Ticket ---"
R=$(curl -s -X POST http://localhost:9090/api/tickets \
    -H "Content-Type: application/json" \
    -d '{"title":"VPN Not Working","description":"Remote access VPN keeps dropping","priority":"High","createdBy":"staff"}')
echo "Response: $R"
echo ""

# ----- Test 6: Create Medium ticket -----
echo "--- TEST 6: Create Medium Priority Ticket ---"
R=$(curl -s -X POST http://localhost:9090/api/tickets \
    -H "Content-Type: application/json" \
    -d '{"title":"Printer Jam","description":"Office printer paper jam","priority":"Medium","createdBy":"client"}')
echo "Response: $R"
echo ""

# ----- Test 7: Get ticket by ID (AVL + LRU Cache) -----
echo "--- TEST 7: Get Ticket #1001 (AVL Tree O(log n) + LRU Cache) ---"
R=$(curl -s http://localhost:9090/api/tickets/1001)
echo "Response: $R"
echo ""

# ----- Test 8: Get ticket by ID again (LRU cache hit) -----
echo "--- TEST 8: Get Ticket #1001 again (LRU Cache hit) ---"
R=$(curl -s http://localhost:9090/api/tickets/1001)
echo "Response: $R"
echo ""

# ----- Test 9: Get top urgent from Priority Queue -----
echo "--- TEST 9: Priority Queue - Peek Top Urgent Ticket ---"
R=$(curl -s http://localhost:9090/api/queue)
echo "Response: $R"
echo ""

# ----- Test 10: Get non-existent ticket -----
echo "--- TEST 10: Get Non-existent Ticket #9999 (404) ---"
R=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:9090/api/tickets/9999)
echo "Response: $R"
echo ""

echo "============================================"
echo "  All tests complete!"
echo "  Server is still running on port 9090"
echo "  PID: $SERVER_PID"
echo "  Press Ctrl+C to stop server"
echo "============================================"

# Keep server running
wait $SERVER_PID
