// helpdesk.c  –  Carbochem Helpdesk Backend
// Port 9090 | All API routes | Hash Table · AVL Tree · Priority Queue · Trie · LRU Cache

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    #define close closesocket
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
#endif

/* ── Constants ─────────────────────────────────────────────── */
#define PORT        9090
#define RECV_BUF    16384
#define RESP_BUF    131072   /* 128 KB – enough for ~200 tickets */
#define MAX_STR     256
#define HASH_SIZE   101
#define CACHE_CAP   50
#define TRIE_SIZE   26
#define MAX_TICKETS 1000

/* ── Ticket ─────────────────────────────────────────────────── */
typedef struct Ticket {
    int  id;
    char title[MAX_STR];
    char description[MAX_STR];
    char status[MAX_STR];       /* Open | In Progress | Resolved */
    char priority[MAX_STR];     /* Critical | High | Medium | Low */
    char category[MAX_STR];
    char assignedTo[MAX_STR];   /* "" = unassigned */
    char createdBy[MAX_STR];
    char customerName[MAX_STR];
    char email[MAX_STR];
    char mobile[MAX_STR];
    char createdAt[MAX_STR];    /* ISO-like date string */
} Ticket;

/* ── User ───────────────────────────────────────────────────── */
typedef struct User {
    int  userId;
    char username[MAX_STR];
    char password[MAX_STR];
    char role[MAX_STR];
    struct User* next;          /* hash chain */
} User;

/* ══ 1. HASH TABLE ──────────────────────────────────────────── */
typedef struct { User* buckets[HASH_SIZE]; int count; } HashTable;

static unsigned int ht_hash(const char* s) {
    unsigned int h = 5381;
    while (*s) h = ((h << 5) + h) + (unsigned char)*s++;
    return h % HASH_SIZE;
}
static HashTable* ht_create(void) { return calloc(1, sizeof(HashTable)); }
static void ht_insert(HashTable* t, User* u) {
    unsigned int i = ht_hash(u->username);
    u->next = t->buckets[i]; t->buckets[i] = u; t->count++;
}
static User* ht_find(HashTable* t, const char* name) {
    User* c = t->buckets[ht_hash(name)];
    while (c) { if (!strcmp(c->username, name)) return c; c = c->next; }
    return NULL;
}

/* ══ 2. AVL TREE ────────────────────────────────────────────── */
typedef struct AVLNode { Ticket* t; struct AVLNode *l, *r; int h; } AVLNode;

static int avl_h(AVLNode* n) { return n ? n->h : 0; }
static int avl_max(int a, int b) { return a > b ? a : b; }
static void avl_fix(AVLNode* n) { n->h = 1 + avl_max(avl_h(n->l), avl_h(n->r)); }
static AVLNode* avl_rr(AVLNode* y) {
    AVLNode* x = y->l; y->l = x->r; x->r = y; avl_fix(y); avl_fix(x); return x;
}
static AVLNode* avl_lr(AVLNode* x) {
    AVLNode* y = x->r; x->r = y->l; y->l = x; avl_fix(x); avl_fix(y); return y;
}
static AVLNode* avl_insert(AVLNode* n, Ticket* t) {
    if (!n) {
        AVLNode* nd = malloc(sizeof(AVLNode));
        nd->t = t; nd->l = nd->r = NULL; nd->h = 1; return nd;
    }
    if (t->id < n->t->id)      n->l = avl_insert(n->l, t);
    else if (t->id > n->t->id) n->r = avl_insert(n->r, t);
    else return n;
    avl_fix(n);
    int b = avl_h(n->l) - avl_h(n->r);
    if (b >  1 && t->id < n->l->t->id) return avl_rr(n);
    if (b < -1 && t->id > n->r->t->id) return avl_lr(n);
    if (b >  1 && t->id > n->l->t->id) { n->l = avl_lr(n->l); return avl_rr(n); }
    if (b < -1 && t->id < n->r->t->id) { n->r = avl_rr(n->r); return avl_lr(n); }
    return n;
}
static Ticket* avl_search(AVLNode* n, int id) {
    if (!n) return NULL;
    if (id == n->t->id) return n->t;
    return id < n->t->id ? avl_search(n->l, id) : avl_search(n->r, id);
}

/* ══ 3. PRIORITY QUEUE ──────────────────────────────────────── */
typedef struct { Ticket** heap; int size, cap; } PQueue;

static int pq_val(const char* p) {
    if (!strcmp(p, "Critical")) return 4;
    if (!strcmp(p, "High"))     return 3;
    if (!strcmp(p, "Medium"))   return 2;
    return 1;
}
static PQueue* pq_create(int cap) {
    PQueue* q = malloc(sizeof(PQueue));
    q->heap = malloc(cap * sizeof(Ticket*)); q->size = 0; q->cap = cap; return q;
}
static void pq_swap(Ticket** a, Ticket** b) { Ticket* t = *a; *a = *b; *b = t; }
static void pq_up(PQueue* q, int i) {
    int p = (i - 1) / 2;
    while (i > 0 && pq_val(q->heap[i]->priority) > pq_val(q->heap[p]->priority))
        { pq_swap(&q->heap[i], &q->heap[p]); i = p; p = (i-1)/2; }
}
static void pq_push(PQueue* q, Ticket* t) {
    if (q->size >= q->cap) { q->cap *= 2; q->heap = realloc(q->heap, q->cap * sizeof(Ticket*)); }
    q->heap[q->size++] = t; pq_up(q, q->size - 1);
}
static Ticket* pq_peek(PQueue* q) { return q->size ? q->heap[0] : NULL; }

/* ══ 4. TRIE ────────────────────────────────────────────────── */
typedef struct TrieNode { struct TrieNode* ch[TRIE_SIZE]; int end; User* user; } TrieNode;
static TrieNode* trie_new(void) { return calloc(1, sizeof(TrieNode)); }
static void trie_insert(TrieNode* root, User* u) {
    TrieNode* cur = root;
    for (int i = 0; u->username[i]; i++) {
        int idx = tolower((unsigned char)u->username[i]) - 'a';
        if (idx < 0 || idx >= TRIE_SIZE) continue;
        if (!cur->ch[idx]) cur->ch[idx] = trie_new();
        cur = cur->ch[idx];
    }
    cur->end = 1; cur->user = u;
}

/* ══ 5. LRU CACHE ───────────────────────────────────────────── */
typedef struct CNode { int id; Ticket* t; struct CNode *prev, *next; } CNode;
typedef struct { CNode* head; CNode* tail; CNode** map; int size, cap; } LRUCache;

static LRUCache* lru_create(int cap) {
    LRUCache* c = calloc(1, sizeof(LRUCache));
    c->cap = cap; c->map = calloc(10000, sizeof(CNode*)); return c;
}
static void lru_front(LRUCache* c, CNode* n) {
    if (n == c->head) return;
    if (n->prev) n->prev->next = n->next;
    if (n->next) n->next->prev = n->prev;
    if (n == c->tail) c->tail = n->prev;
    n->next = c->head; n->prev = NULL;
    if (c->head) c->head->prev = n;
    c->head = n; if (!c->tail) c->tail = n;
}
static void lru_put(LRUCache* c, int id, Ticket* t) {
    CNode* ex = c->map[id % 10000];
    if (ex) { ex->t = t; lru_front(c, ex); return; }
    if (c->size >= c->cap) {
        CNode* lru = c->tail;
        if (lru) {
            c->map[lru->id % 10000] = NULL;
            c->tail = lru->prev;
            if (c->tail) c->tail->next = NULL; else c->head = NULL;
            free(lru); c->size--;
        }
    }
    CNode* nd = malloc(sizeof(CNode));
    nd->id = id; nd->t = t; nd->prev = NULL; nd->next = c->head;
    if (c->head) c->head->prev = nd;
    c->head = nd; if (!c->tail) c->tail = nd;
    c->map[id % 10000] = nd; c->size++;
}
static Ticket* lru_get(LRUCache* c, int id) {
    CNode* n = c->map[id % 10000];
    if (n) { lru_front(c, n); return n->t; }
    return NULL;
}

/* ── Globals ────────────────────────────────────────────────── */
static HashTable* users;
static AVLNode*   ticketTree = NULL;
static PQueue*    urgentQ;
static TrieNode*  nameTrie;
static LRUCache*  cache;

static Ticket* allTickets[MAX_TICKETS];
static int     ticketCount  = 0;
static int     nextUserId   = 1001;
static int     nextTicketId = 1;

/* ── Helper: ISO timestamp ──────────────────────────────────── */
static void get_iso(char* buf, int len) {
    time_t now = time(NULL);
    struct tm* tm = localtime(&now);
    strftime(buf, len, "%Y-%m-%dT%H:%M:%S.000Z", tm);
}

/* ── extractValue: pull JSON string for 'key' into 'out' ─────── */
static char* extractValue(const char* json, const char* key, char* out) {
    char search[MAX_STR];
    snprintf(search, sizeof(search), "\"%s\":", key);
    const char* pos = strstr(json, search);
    if (!pos) { out[0] = '\0'; return NULL; }
    pos += strlen(search);
    while (*pos == ' ' || *pos == '\t') pos++;
    if (*pos != '"') { out[0] = '\0'; return NULL; }
    pos++;
    int i = 0;
    while (*pos && *pos != '"' && i < MAX_STR - 1) out[i++] = *pos++;
    out[i] = '\0';
    return out;
}

/* ── HTTP helpers ───────────────────────────────────────────── */
static void first_line(const char* req, char* buf, int len) {
    const char* end = strstr(req, "\r\n");
    if (!end) end = req + strlen(req);
    int n = (int)(end - req); if (n >= len) n = len - 1;
    strncpy(buf, req, n); buf[n] = '\0';
}
static const char* body_start(const char* req) {
    const char* p = strstr(req, "\r\n\r\n"); return p ? p + 4 : NULL;
}
/* Extract int after prefix inside first line, e.g. "GET /api/tickets/3" -> 3 */
static int path_id(const char* line, const char* prefix) {
    const char* p = strstr(line, prefix);
    return p ? atoi(p + strlen(prefix)) : -1;
}
/* Token format stored by frontend: "username|role" */
static void token_info(const char* req, char* username, char* role) {
    username[0] = role[0] = '\0';
    const char* p = strstr(req, "Authorization: Bearer ");
    if (!p) p = strstr(req, "authorization: bearer ");
    if (!p) return;
    p += strlen("Authorization: Bearer ");
    int i = 0;
    while (*p && *p != '\r' && *p != '\n' && *p != '|' && i < MAX_STR - 1) username[i++] = *p++;
    username[i] = '\0';
    if (*p == '|') { p++; i = 0; while (*p && *p != '\r' && *p != '\n' && i < MAX_STR - 1) role[i++] = *p++; role[i] = '\0'; }
}
static void send_resp(int sock, int code, const char* body) {
    const char* st = "OK";
    switch (code) { case 201: st="Created"; break; case 400: st="Bad Request"; break;
        case 401: st="Unauthorized"; break; case 403: st="Forbidden"; break;
        case 404: st="Not Found"; break; case 500: st="Internal Server Error"; break; }
    char hdr[512];
    int hlen = snprintf(hdr, sizeof(hdr),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type,Authorization\r\n"
        "Content-Length: %zu\r\n\r\n",
        code, st, strlen(body));
    send(sock, hdr, hlen, 0);
    send(sock, body, (int)strlen(body), 0);
}

/* ── JSON ticket builder ────────────────────────────────────── */
static int json_escape(const char* s, char* out, int max) {
    int n = 0;
    while (*s && n < max - 2) {
        char c = *s++;
        if      (c == '"')  { out[n++] = '\\'; out[n++] = '"'; }
        else if (c == '\\') { out[n++] = '\\'; out[n++] = '\\'; }
        else if (c == '\n') { out[n++] = '\\'; out[n++] = 'n'; }
        else if (c == '\r') { out[n++] = '\\'; out[n++] = 'r'; }
        else out[n++] = c;
    }
    out[n] = '\0'; return n;
}
static void ticket_json(Ticket* t, char* out, int max) {
    char eT[MAX_STR*2], eD[MAX_STR*2], eC[MAX_STR*2], eCu[MAX_STR*2];
    json_escape(t->title,        eT,  sizeof(eT));
    json_escape(t->description,  eD,  sizeof(eD));
    json_escape(t->category,     eC,  sizeof(eC));
    json_escape(t->customerName, eCu, sizeof(eCu));
    /* assignedTo: null or "username" */
    char asgn[MAX_STR + 3];
    if (t->assignedTo[0] == '\0') strcpy(asgn, "null");
    else snprintf(asgn, sizeof(asgn), "\"%s\"", t->assignedTo);

    snprintf(out, max,
        "{\"id\":%d,\"title\":\"%s\",\"description\":\"%s\","
        "\"status\":\"%s\",\"priority\":\"%s\",\"category\":\"%s\","
        "\"customerName\":\"%s\",\"email\":\"%s\",\"mobile\":\"%s\","
        "\"assignedTo\":%s,\"createdBy\":\"%s\",\"createdAt\":\"%s\"}",
        t->id, eT, eD, t->status, t->priority, eC,
        eCu, t->email, t->mobile, asgn, t->createdBy, t->createdAt);
}
/* Send {success:true, tickets:[...]} from a pointer array */
static void send_ticket_list(int sock, Ticket** list, int n) {
    char* buf = malloc(RESP_BUF);
    if (!buf) { send_resp(sock, 500, "{\"success\":false}"); return; }
    char* p = buf; int rem = RESP_BUF;
    int w = snprintf(p, rem, "{\"success\":true,\"tickets\":["); p += w; rem -= w;
    for (int i = 0; i < n && rem > 200; i++) {
        char tj[3000]; ticket_json(list[i], tj, sizeof(tj));
        if (i) { *p++ = ','; rem--; }
        int tl = (int)strlen(tj);
        if (tl < rem) { memcpy(p, tj, tl); p += tl; rem -= tl; }
    }
    w = snprintf(p, rem, "]}"); p += w; *p = '\0';
    send_resp(sock, 200, buf);
    free(buf);
}

/* ══ Route Handlers ═════════════════════════════════════════════ */

/* POST /api/auth */
static void r_auth(int sock, const char* body) {
    char u[MAX_STR], pw[MAX_STR];
    if (!extractValue(body, "username", u) || !extractValue(body, "password", pw)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"Credentials required\"}"); return;
    }
    User* usr = ht_find(users, u);
    if (usr && !strcmp(usr->password, pw)) {
        char resp[512];
        /* Token = username|role  (simple, no JWT needed for C backend) */
        snprintf(resp, sizeof(resp),
            "{\"success\":true,\"token\":\"%s|%s\","
            "\"user\":{\"userId\":%d,\"username\":\"%s\",\"role\":\"%s\"}}",
            usr->username, usr->role, usr->userId, usr->username, usr->role);
        send_resp(sock, 200, resp);
        printf("[AUTH]  Login OK  : %-10s  role=%s\n", usr->username, usr->role);
    } else {
        send_resp(sock, 401, "{\"success\":false,\"message\":\"Invalid credentials\"}");
        printf("[AUTH]  Login FAIL: %s\n", u);
    }
}

/* POST /api/register */
static void r_register(int sock, const char* body, const char* callerRole) {
    if (strcmp(callerRole, "admin") != 0) {
        send_resp(sock, 403, "{\"success\":false,\"message\":\"Admin access required\"}"); return;
    }
    char u[MAX_STR], pw[MAX_STR], role[MAX_STR];
    if (!extractValue(body, "username", u) || !extractValue(body, "password", pw) ||
        !extractValue(body, "role", role)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"All fields required\"}"); return;
    }
    if (ht_find(users, u)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"Username already exists\"}"); return;
    }
    User* nu = calloc(1, sizeof(User));
    nu->userId = nextUserId++;
    strncpy(nu->username, u,    MAX_STR-1);
    strncpy(nu->password, pw,   MAX_STR-1);
    strncpy(nu->role,     role, MAX_STR-1);
    ht_insert(users, nu); trie_insert(nameTrie, nu);
    char resp[256];
    snprintf(resp, sizeof(resp),
        "{\"success\":true,\"user\":{\"userId\":%d,\"username\":\"%s\",\"role\":\"%s\"}}",
        nu->userId, nu->username, nu->role);
    send_resp(sock, 201, resp);
    printf("[REG]   Registered: %s (%s)\n", nu->username, nu->role);
}

/* GET /api/tickets */
static void r_get_all(int sock) {
    send_ticket_list(sock, allTickets, ticketCount);
}

/* GET /api/mytickets  – tickets created by token user */
static void r_mytickets(int sock, const char* username) {
    Ticket* f[MAX_TICKETS]; int n = 0;
    for (int i = 0; i < ticketCount; i++)
        if (!strcmp(allTickets[i]->createdBy, username)) f[n++] = allTickets[i];
    send_ticket_list(sock, f, n);
}

/* GET /api/assigned  – tickets assigned to token user (staff) */
static void r_assigned(int sock, const char* username) {
    Ticket* f[MAX_TICKETS]; int n = 0;
    for (int i = 0; i < ticketCount; i++)
        if (!strcmp(allTickets[i]->assignedTo, username)) f[n++] = allTickets[i];
    send_ticket_list(sock, f, n);
}

/* POST /api/tickets */
static void r_create(int sock, const char* body, const char* creator) {
    char title[MAX_STR], desc[MAX_STR], pri[MAX_STR];
    char cat[MAX_STR], cust[MAX_STR], email[MAX_STR], mob[MAX_STR];
    if (!extractValue(body, "title", title)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"Title required\"}"); return;
    }
    if (!extractValue(body, "description",  desc))  desc[0]  = '\0';
    if (!extractValue(body, "priority",     pri))   strcpy(pri,  "Medium");
    if (!extractValue(body, "category",     cat))   strcpy(cat,  "General");
    if (!extractValue(body, "customerName", cust))  cust[0]  = '\0';
    if (!extractValue(body, "email",        email)) email[0] = '\0';
    if (!extractValue(body, "mobile",       mob))   mob[0]   = '\0';

    Ticket* t = calloc(1, sizeof(Ticket));
    t->id = nextTicketId++;
    strncpy(t->title,        title,  MAX_STR-1);
    strncpy(t->description,  desc,   MAX_STR-1);
    strncpy(t->status,       "Open", MAX_STR-1);
    strncpy(t->priority,     pri,    MAX_STR-1);
    strncpy(t->category,     cat,    MAX_STR-1);
    strncpy(t->createdBy,    creator[0] ? creator : "unknown", MAX_STR-1);
    strncpy(t->customerName, cust,   MAX_STR-1);
    strncpy(t->email,        email,  MAX_STR-1);
    strncpy(t->mobile,       mob,    MAX_STR-1);
    t->assignedTo[0] = '\0';
    get_iso(t->createdAt, MAX_STR);

    if (ticketCount < MAX_TICKETS) allTickets[ticketCount++] = t;
    ticketTree = avl_insert(ticketTree, t);
    pq_push(urgentQ, t);
    lru_put(cache, t->id, t);

    char tj[3000], resp[3200];
    ticket_json(t, tj, sizeof(tj));
    snprintf(resp, sizeof(resp),
        "{\"success\":true,\"ticket\":%s,\"message\":\"Ticket created successfully\"}", tj);
    send_resp(sock, 200, resp);
    printf("[TICKET] #%-4d  %-12s  [%s]  by %s\n", t->id, t->priority, t->title, creator);
}

/* GET /api/tickets/:id */
static void r_get_one(int sock, int id) {
    Ticket* t = lru_get(cache, id);      /* LRU cache hit O(1) */
    if (!t) t = avl_search(ticketTree, id); /* AVL tree O(log n) */
    if (!t) { send_resp(sock, 404, "{\"success\":false,\"message\":\"Ticket not found\"}"); return; }
    lru_put(cache, id, t);
    char tj[3000], resp[3200];
    ticket_json(t, tj, sizeof(tj));
    snprintf(resp, sizeof(resp), "{\"success\":true,\"ticket\":%s}", tj);
    send_resp(sock, 200, resp);
}

/* PUT /api/tickets/:id/status */
static void r_status(int sock, int id, const char* body) {
    char status[MAX_STR];
    if (!extractValue(body, "status", status)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"Status required\"}"); return;
    }
    Ticket* t = avl_search(ticketTree, id);
    if (!t) { send_resp(sock, 404, "{\"success\":false,\"message\":\"Ticket not found\"}"); return; }
    strncpy(t->status, status, MAX_STR-1);
    lru_put(cache, id, t);
    char tj[3000], resp[3200];
    ticket_json(t, tj, sizeof(tj));
    snprintf(resp, sizeof(resp), "{\"success\":true,\"ticket\":%s,\"message\":\"Status updated\"}", tj);
    send_resp(sock, 200, resp);
    printf("[STATUS] #%d -> %s\n", id, status);
}

/* PUT /api/tickets/:id/assign */
static void r_assign(int sock, int id, const char* body) {
    char staff[MAX_STR];
    if (!extractValue(body, "staffUsername", staff)) {
        send_resp(sock, 400, "{\"success\":false,\"message\":\"staffUsername required\"}"); return;
    }
    Ticket* t = avl_search(ticketTree, id);
    if (!t) { send_resp(sock, 404, "{\"success\":false,\"message\":\"Ticket not found\"}"); return; }
    strncpy(t->assignedTo, staff, MAX_STR-1);
    if (!strcmp(t->status, "Open")) strncpy(t->status, "In Progress", MAX_STR-1);
    lru_put(cache, id, t);
    char tj[3000], resp[3200];
    ticket_json(t, tj, sizeof(tj));
    snprintf(resp, sizeof(resp), "{\"success\":true,\"ticket\":%s,\"message\":\"Ticket assigned\"}", tj);
    send_resp(sock, 200, resp);
    printf("[ASSIGN] #%d -> %s\n", id, staff);
}

/* GET /api/stats */
static void r_stats(int sock) {
    int tot=0, open=0, inp=0, res=0, crit=0, hi=0, med=0, lo=0;
    for (int i = 0; i < ticketCount; i++) {
        Ticket* t = allTickets[i]; tot++;
        if      (!strcmp(t->status, "Open"))        open++;
        else if (!strcmp(t->status, "In Progress")) inp++;
        else if (!strcmp(t->status, "Resolved"))    res++;
        if      (!strcmp(t->priority, "Critical"))  crit++;
        else if (!strcmp(t->priority, "High"))      hi++;
        else if (!strcmp(t->priority, "Medium"))    med++;
        else                                        lo++;
    }
    char resp[512];
    snprintf(resp, sizeof(resp),
        "{\"success\":true,\"stats\":{"
        "\"total\":%d,\"open\":%d,\"inProgress\":%d,\"resolved\":%d,"
        "\"critical\":%d,\"high\":%d,\"medium\":%d,\"low\":%d}}",
        tot, open, inp, res, crit, hi, med, lo);
    send_resp(sock, 200, resp);
}

/* GET /api/queue – peek priority queue */
static void r_queue(int sock) {
    Ticket* top = pq_peek(urgentQ);
    if (top) {
        char tj[3000], resp[3200];
        ticket_json(top, tj, sizeof(tj));
        snprintf(resp, sizeof(resp), "{\"success\":true,\"ticket\":%s}", tj);
        send_resp(sock, 200, resp);
    } else {
        send_resp(sock, 200, "{\"success\":true,\"ticket\":null,\"message\":\"Queue empty\"}");
    }
}

/* ══ Request Dispatcher ═════════════════════════════════════════ */
static void handle(int sock, const char* req) {
    char line[512]; first_line(req, line, sizeof(line));
    const char* body = body_start(req);
    char tUser[MAX_STR], tRole[MAX_STR];
    token_info(req, tUser, tRole);

    /* CORS preflight */
    if (!strncmp(line, "OPTIONS", 7)) { send_resp(sock, 200, "{}"); return; }

    /* POST /api/auth */
    if (strstr(line, "POST /api/auth")) {
        body ? r_auth(sock, body) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* POST /api/register */
    if (strstr(line, "POST /api/register")) {
        body ? r_register(sock, body, tRole) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* PUT /api/tickets/:id/status  — check BEFORE generic PUT */
    if (strstr(line, "PUT /api/tickets/") && strstr(line, "/status")) {
        int id = path_id(line, "PUT /api/tickets/");
        (id > 0 && body) ? r_status(sock, id, body) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* PUT /api/tickets/:id/assign */
    if (strstr(line, "PUT /api/tickets/") && strstr(line, "/assign")) {
        int id = path_id(line, "PUT /api/tickets/");
        (id > 0 && body) ? r_assign(sock, id, body) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* POST /api/tickets */
    if (strstr(line, "POST /api/tickets")) {
        body ? r_create(sock, body, tUser) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* GET /api/tickets/:id  — more specific, check BEFORE list */
    if (strstr(line, "GET /api/tickets/")) {
        int id = path_id(line, "GET /api/tickets/");
        id > 0 ? r_get_one(sock, id) : send_resp(sock, 400, "{\"success\":false}");
        return;
    }
    /* GET /api/tickets */
    if (strstr(line, "GET /api/tickets"))  { r_get_all(sock);          return; }
    /* GET /api/mytickets */
    if (strstr(line, "GET /api/mytickets")) { r_mytickets(sock, tUser); return; }
    /* GET /api/assigned  */
    if (strstr(line, "GET /api/assigned"))  { r_assigned(sock, tUser);  return; }
    /* GET /api/stats     */
    if (strstr(line, "GET /api/stats"))     { r_stats(sock);            return; }
    /* GET /api/queue     */
    if (strstr(line, "GET /api/queue"))     { r_queue(sock);            return; }

    send_resp(sock, 404, "{\"success\":false,\"message\":\"Route not found\"}");
}

/* ══ Seed Data ══════════════════════════════════════════════════ */
static void add_user(const char* name, const char* pass, const char* role) {
    User* u = calloc(1, sizeof(User));
    u->userId = nextUserId++;
    strncpy(u->username, name, MAX_STR-1);
    strncpy(u->password, pass, MAX_STR-1);
    strncpy(u->role,     role, MAX_STR-1);
    ht_insert(users, u); trie_insert(nameTrie, u);
}
static Ticket* add_ticket(const char* title, const char* desc, const char* pri,
                           const char* cat, const char* by, const char* cust,
                           const char* status, const char* assigned) {
    Ticket* t = calloc(1, sizeof(Ticket));
    t->id = nextTicketId++;
    strncpy(t->title,       title,  MAX_STR-1);
    strncpy(t->description, desc,   MAX_STR-1);
    strncpy(t->priority,    pri,    MAX_STR-1);
    strncpy(t->category,    cat,    MAX_STR-1);
    strncpy(t->createdBy,   by,     MAX_STR-1);
    strncpy(t->customerName,cust,   MAX_STR-1);
    strncpy(t->status,      status, MAX_STR-1);
    if (assigned && assigned[0]) strncpy(t->assignedTo, assigned, MAX_STR-1);
    get_iso(t->createdAt, MAX_STR);
    if (ticketCount < MAX_TICKETS) allTickets[ticketCount++] = t;
    ticketTree = avl_insert(ticketTree, t);
    pq_push(urgentQ, t);
    lru_put(cache, t->id, t);
    return t;
}

/* ══ Main ═══════════════════════════════════════════════════════ */
int main(void) {
#ifdef _WIN32
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa)) { fprintf(stderr, "WSAStartup failed\n"); return 1; }
#endif

    /* Init data structures */
    users    = ht_create();
    urgentQ  = pq_create(200);
    nameTrie = trie_new();
    cache    = lru_create(CACHE_CAP);

    /* Default users (Hash Table + Trie) */
    add_user("admin",  "admin123",  "admin");
    add_user("staff",  "staff123",  "staff");
    add_user("client", "client123", "client");

    /* Seed tickets (AVL Tree + Priority Queue + LRU Cache) */
    add_ticket("System Login Issue",
               "Unable to login to the ERP system after password reset",
               "High",     "Technical",  "client", "John Doe",    "Open",        "");
    add_ticket("Product Quality Concern",
               "Damaged packaging found on latest batch delivery – photos attached",
               "Medium",   "Quality",    "client", "Jane Smith",  "In Progress", "staff");
    add_ticket("Delivery Issue",
               "Wrong items delivered to the construction site – needs urgent replacement",
               "Low",      "Delivery",   "client", "Bob Johnson", "Resolved",    "staff");
    add_ticket("Inspection Required",
               "On-site inspection needed for tank installation at Plant B",
               "Critical", "Inspection", "client", "Alice Brown", "Open",        "");

    printf("\nCarbochem Helpdesk System  –  C Backend\n");
    printf("==========================================\n");
    printf("Data structures:\n");
    printf("  Hash Table   O(1)      : %d users\n",   users->count);
    printf("  AVL Tree     O(log n)  : %d tickets\n", ticketCount);
    printf("  Priority Q   O(log n)  : max-heap\n");
    printf("  Trie         O(k)      : username autocomplete\n");
    printf("  LRU Cache    O(1)      : cap=%d\n\n",   cache->cap);
    printf("API routes on http://localhost:%d\n", PORT);
    printf("  POST /api/auth            POST /api/register\n");
    printf("  GET  /api/tickets         POST /api/tickets\n");
    printf("  GET  /api/tickets/:id     PUT  /api/tickets/:id/status\n");
    printf("  PUT  /api/tickets/:id/assign\n");
    printf("  GET  /api/mytickets       GET  /api/assigned\n");
    printf("  GET  /api/stats           GET  /api/queue\n\n");

    int srv = (int)socket(AF_INET, SOCK_STREAM, 0);
    if (srv < 0) { perror("socket"); return 1; }
    int opt = 1; setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET; addr.sin_addr.s_addr = INADDR_ANY; addr.sin_port = htons(PORT);
    if (bind(srv, (struct sockaddr*)&addr, sizeof(addr)) < 0) { perror("bind"); return 1; }
    listen(srv, 20);
    printf("Listening on port %d ...  (Ctrl-C to stop)\n\n", PORT);

    while (1) {
        struct sockaddr_in ca; int cl = sizeof(ca);
        int cli = (int)accept(srv, (struct sockaddr*)&ca, &cl);
        if (cli < 0) continue;
        char* buf = malloc(RECV_BUF);
        if (!buf) { close(cli); continue; }
        memset(buf, 0, RECV_BUF);
        recv(cli, buf, RECV_BUF - 1, 0);
        handle(cli, buf);
        free(buf);
        close(cli);
    }

#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}