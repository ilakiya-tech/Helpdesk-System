#!/bin/bash
# full_test.sh – Tests all C backend endpoints

BASE="http://localhost:9090"
PASS=0; FAIL=0

check() {
    local label="$1" expect="$2" got="$3"
    if echo "$got" | grep -q "$expect"; then
        echo "  PASS  $label"
        ((PASS++))
    else
        echo "  FAIL  $label"
        echo "        expected: $expect"
        echo "        got:      ${got:0:120}"
        ((FAIL++))
    fi
}

# Kill any existing server
pkill -f helpdesk.exe 2>/dev/null; sleep 1

echo "Starting C backend..."
/c/Users/Dell/Helpdesk-System/backend-c/src/helpdesk.exe &
PID=$!; sleep 2
if ! kill -0 $PID 2>/dev/null; then echo "Server failed to start"; exit 1; fi
echo "Server running (PID $PID)"
echo ""

# ── AUTH ───────────────────────────────────────────────
echo "=== AUTH ==="
R=$(curl -s -X POST $BASE/api/auth -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}')
check "admin login"  '"success":true'  "$R"
check "admin role"   '"role":"admin"'  "$R"
TOKEN_ADMIN=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s -X POST $BASE/api/auth -H 'Content-Type: application/json' \
    -d '{"username":"staff","password":"staff123"}')
check "staff login"  '"success":true'  "$R"
TOKEN_STAFF=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s -X POST $BASE/api/auth -H 'Content-Type: application/json' \
    -d '{"username":"client","password":"client123"}')
check "client login" '"success":true'  "$R"
TOKEN_CLIENT=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s -X POST $BASE/api/auth -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"wrong"}')
check "bad password" '"success":false' "$R"

echo ""
echo "=== TICKETS ==="
# Get seeded tickets
R=$(curl -s $BASE/api/tickets -H "Authorization: Bearer $TOKEN_ADMIN")
check "GET all tickets"     '"success":true'          "$R"
check "tickets array"       '"tickets":\['            "$R"
check "seeded ticket title" 'System Login Issue'      "$R"
check "Critical ticket"     'Inspection Required'     "$R"

# Create ticket
R=$(curl -s -X POST $BASE/api/tickets \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_CLIENT" \
    -d '{"title":"Network Outage","description":"No internet at head office","priority":"Critical","category":"Network","customerName":"Test User"}')
check "Create ticket"     '"success":true'    "$R"
check "Ticket ID"         '"id":'             "$R"
NEW_ID=$(echo "$R" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# Get ticket by ID
R=$(curl -s $BASE/api/tickets/$NEW_ID -H "Authorization: Bearer $TOKEN_ADMIN")
check "GET ticket by ID"  '"success":true'    "$R"
check "Title matches"     'Network Outage'    "$R"

# Update status
R=$(curl -s -X PUT $BASE/api/tickets/$NEW_ID/status \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_ADMIN" \
    -d '{"status":"In Progress"}')
check "Update status"     'In Progress'       "$R"

# Assign ticket
R=$(curl -s -X PUT $BASE/api/tickets/1/assign \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_ADMIN" \
    -d '{"staffUsername":"staff"}')
check "Assign ticket"     'Ticket assigned'   "$R"

echo ""
echo "=== FILTERS ==="
R=$(curl -s $BASE/api/mytickets -H "Authorization: Bearer $TOKEN_CLIENT")
check "My tickets (client)"  '"success":true' "$R"

R=$(curl -s $BASE/api/assigned -H "Authorization: Bearer $TOKEN_STAFF")
check "Assigned (staff)"     '"success":true' "$R"

echo ""
echo "=== STATS ==="
R=$(curl -s $BASE/api/stats -H "Authorization: Bearer $TOKEN_ADMIN")
check "Stats total"   '"total":'      "$R"
check "Stats open"    '"open":'       "$R"
check "Stats crit"    '"critical":'   "$R"

echo ""
echo "=== QUEUE ==="
R=$(curl -s $BASE/api/queue -H "Authorization: Bearer $TOKEN_ADMIN")
check "Priority queue"  '"success":true' "$R"

echo ""
echo "=== REGISTER ==="
R=$(curl -s -X POST $BASE/api/register \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_ADMIN" \
    -d '{"username":"newstaff","password":"pass123","role":"staff"}')
check "Register user"   '"success":true' "$R"

echo ""
echo "============================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "  Server still running on port 9090 (PID $PID)"
echo "  Open: http://localhost:3000"
echo "============================================"
wait $PID
