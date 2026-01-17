// helpdesk.c - Advanced Helpdesk System with Data Structures
// Implements: Hash Table, AVL Tree, Priority Queue, Trie, LRU Cache

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

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

#define PORT 9090
#define BUFFER_SIZE 8192
#define MAX_STRING 256
#define HASH_SIZE 101
#define CACHE_SIZE 100
#define TRIE_SIZE 26

// ==================== DATA STRUCTURES ====================

// User structure
typedef struct User {
    int userId;
    char username[MAX_STRING];
    char password[MAX_STRING];
    char role[MAX_STRING];
    struct User* next; // For hash table chaining
} User;

// Ticket structure
typedef struct Ticket {
    int ticketId;
    char title[MAX_STRING];
    char description[MAX_STRING];
    char status[MAX_STRING];
    char priority[MAX_STRING]; // Critical, High, Medium, Low
    char assignedTo[MAX_STRING];
    char createdBy[MAX_STRING];
    char createdDate[MAX_STRING];
} Ticket;

// 1. HASH TABLE - O(1) User Lookup
typedef struct {
    User* buckets[HASH_SIZE];
    int count;
} HashTable;

// 2. AVL TREE NODE - O(log n) Ticket Search
typedef struct AVLNode {
    Ticket* ticket;
    struct AVLNode* left;
    struct AVLNode* right;
    int height;
} AVLNode;

// 3. PRIORITY QUEUE - Urgent Tickets First
typedef struct {
    Ticket** heap;
    int size;
    int capacity;
} PriorityQueue;

// 4. TRIE NODE - Username Autocomplete
typedef struct TrieNode {
    struct TrieNode* children[TRIE_SIZE];
    int isEndOfWord;
    User* user;
} TrieNode;

// 5. LRU CACHE - Recently Accessed Tickets
typedef struct CacheNode {
    int ticketId;
    Ticket* ticket;
    struct CacheNode* prev;
    struct CacheNode* next;
} CacheNode;

typedef struct {
    CacheNode* head;
    CacheNode* tail;
    CacheNode** hashTable;
    int size;
    int capacity;
} LRUCache;

// Global data structures
HashTable* userHashTable;
AVLNode* ticketTree = NULL;
PriorityQueue* urgentQueue;
TrieNode* usernamesTrie;
LRUCache* ticketCache;

int nextUserId = 1001;
int nextTicketId = 1001;

// ==================== HASH TABLE FUNCTIONS ====================

unsigned int hash(const char* str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c;
    return hash % HASH_SIZE;
}

HashTable* createHashTable() {
    HashTable* table = (HashTable*)malloc(sizeof(HashTable));
    for (int i = 0; i < HASH_SIZE; i++) {
        table->buckets[i] = NULL;
    }
    table->count = 0;
    return table;
}

void hashTableInsert(HashTable* table, User* user) {
    unsigned int index = hash(user->username);
    user->next = table->buckets[index];
    table->buckets[index] = user;
    table->count++;
}

User* hashTableFind(HashTable* table, const char* username) {
    unsigned int index = hash(username);
    User* current = table->buckets[index];
    while (current != NULL) {
        if (strcmp(current->username, username) == 0) {
            return current;
        }
        current = current->next;
    }
    return NULL;
}

// ==================== AVL TREE FUNCTIONS ====================

int max(int a, int b) {
    return (a > b) ? a : b;
}

int getHeight(AVLNode* node) {
    return node ? node->height : 0;
}

int getBalance(AVLNode* node) {
    return node ? getHeight(node->left) - getHeight(node->right) : 0;
}

AVLNode* createAVLNode(Ticket* ticket) {
    AVLNode* node = (AVLNode*)malloc(sizeof(AVLNode));
    node->ticket = ticket;
    node->left = node->right = NULL;
    node->height = 1;
    return node;
}

AVLNode* rightRotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}

AVLNode* leftRotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    return y;
}

AVLNode* avlInsert(AVLNode* node, Ticket* ticket) {
    if (node == NULL)
        return createAVLNode(ticket);
    
    if (ticket->ticketId < node->ticket->ticketId)
        node->left = avlInsert(node->left, ticket);
    else if (ticket->ticketId > node->ticket->ticketId)
        node->right = avlInsert(node->right, ticket);
    else
        return node;
    
    node->height = 1 + max(getHeight(node->left), getHeight(node->right));
    int balance = getBalance(node);
    
    // Left Left
    if (balance > 1 && ticket->ticketId < node->left->ticket->ticketId)
        return rightRotate(node);
    
    // Right Right
    if (balance < -1 && ticket->ticketId > node->right->ticket->ticketId)
        return leftRotate(node);
    
    // Left Right
    if (balance > 1 && ticket->ticketId > node->left->ticket->ticketId) {
        node->left = leftRotate(node->left);
        return rightRotate(node);
    }
    
    // Right Left
    if (balance < -1 && ticket->ticketId < node->right->ticket->ticketId) {
        node->right = rightRotate(node->right);
        return leftRotate(node);
    }
    
    return node;
}

Ticket* avlSearch(AVLNode* root, int ticketId) {
    if (root == NULL)
        return NULL;
    if (ticketId == root->ticket->ticketId)
        return root->ticket;
    if (ticketId < root->ticket->ticketId)
        return avlSearch(root->left, ticketId);
    return avlSearch(root->right, ticketId);
}

// ==================== PRIORITY QUEUE FUNCTIONS ====================

int getPriorityValue(const char* priority) {
    if (strcmp(priority, "Critical") == 0) return 4;
    if (strcmp(priority, "High") == 0) return 3;
    if (strcmp(priority, "Medium") == 0) return 2;
    return 1; // Low
}

PriorityQueue* createPriorityQueue(int capacity) {
    PriorityQueue* pq = (PriorityQueue*)malloc(sizeof(PriorityQueue));
    pq->heap = (Ticket**)malloc(capacity * sizeof(Ticket*));
    pq->size = 0;
    pq->capacity = capacity;
    return pq;
}

void swap(Ticket** a, Ticket** b) {
    Ticket* temp = *a;
    *a = *b;
    *b = temp;
}

void heapifyUp(PriorityQueue* pq, int index) {
    int parent = (index - 1) / 2;
    while (index > 0 && getPriorityValue(pq->heap[index]->priority) > 
           getPriorityValue(pq->heap[parent]->priority)) {
        swap(&pq->heap[index], &pq->heap[parent]);
        index = parent;
        parent = (index - 1) / 2;
    }
}

void heapifyDown(PriorityQueue* pq, int index) {
    int left, right, largest;
    while (1) {
        left = 2 * index + 1;
        right = 2 * index + 2;
        largest = index;
        
        if (left < pq->size && getPriorityValue(pq->heap[left]->priority) > 
            getPriorityValue(pq->heap[largest]->priority))
            largest = left;
        
        if (right < pq->size && getPriorityValue(pq->heap[right]->priority) > 
            getPriorityValue(pq->heap[largest]->priority))
            largest = right;
        
        if (largest == index)
            break;
        
        swap(&pq->heap[index], &pq->heap[largest]);
        index = largest;
    }
}

void priorityQueuePush(PriorityQueue* pq, Ticket* ticket) {
    if (pq->size >= pq->capacity) {
        pq->capacity *= 2;
        pq->heap = (Ticket**)realloc(pq->heap, pq->capacity * sizeof(Ticket*));
    }
    pq->heap[pq->size] = ticket;
    heapifyUp(pq, pq->size);
    pq->size++;
}

Ticket* priorityQueuePeek(PriorityQueue* pq) {
    return (pq->size > 0) ? pq->heap[0] : NULL;
}

// ==================== TRIE FUNCTIONS ====================

TrieNode* createTrieNode() {
    TrieNode* node = (TrieNode*)malloc(sizeof(TrieNode));
    node->isEndOfWord = 0;
    node->user = NULL;
    for (int i = 0; i < TRIE_SIZE; i++) {
        node->children[i] = NULL;
    }
    return node;
}

void trieInsert(TrieNode* root, User* user) {
    TrieNode* current = root;
    for (int i = 0; user->username[i]; i++) {
        int index = tolower(user->username[i]) - 'a';
        if (index < 0 || index >= TRIE_SIZE) continue;
        if (!current->children[index]) {
            current->children[index] = createTrieNode();
        }
        current = current->children[index];
    }
    current->isEndOfWord = 1;
    current->user = user;
}

User* trieSearch(TrieNode* root, const char* username) {
    TrieNode* current = root;
    for (int i = 0; username[i]; i++) {
        int index = tolower(username[i]) - 'a';
        if (index < 0 || index >= TRIE_SIZE || !current->children[index])
            return NULL;
        current = current->children[index];
    }
    return (current && current->isEndOfWord) ? current->user : NULL;
}

// ==================== LRU CACHE FUNCTIONS ====================

LRUCache* createLRUCache(int capacity) {
    LRUCache* cache = (LRUCache*)malloc(sizeof(LRUCache));
    cache->capacity = capacity;
    cache->size = 0;
    cache->head = NULL;
    cache->tail = NULL;
    cache->hashTable = (CacheNode**)calloc(10000, sizeof(CacheNode*));
    return cache;
}

void moveToFront(LRUCache* cache, CacheNode* node) {
    if (node == cache->head) return;
    
    // Remove from current position
    if (node->prev) node->prev->next = node->next;
    if (node->next) node->next->prev = node->prev;
    if (node == cache->tail) cache->tail = node->prev;
    
    // Move to front
    node->next = cache->head;
    node->prev = NULL;
    if (cache->head) cache->head->prev = node;
    cache->head = node;
    if (!cache->tail) cache->tail = node;
}

void cacheInsert(LRUCache* cache, int ticketId, Ticket* ticket) {
    CacheNode* existing = cache->hashTable[ticketId % 10000];
    if (existing) {
        existing->ticket = ticket;
        moveToFront(cache, existing);
        return;
    }
    
    if (cache->size >= cache->capacity) {
        // Remove LRU
        CacheNode* lru = cache->tail;
        if (lru) {
            cache->hashTable[lru->ticketId % 10000] = NULL;
            cache->tail = lru->prev;
            if (cache->tail) cache->tail->next = NULL;
            else cache->head = NULL;
            free(lru);
            cache->size--;
        }
    }
    
    CacheNode* newNode = (CacheNode*)malloc(sizeof(CacheNode));
    newNode->ticketId = ticketId;
    newNode->ticket = ticket;
    newNode->prev = NULL;
    newNode->next = cache->head;
    
    if (cache->head) cache->head->prev = newNode;
    cache->head = newNode;
    if (!cache->tail) cache->tail = newNode;
    
    cache->hashTable[ticketId % 10000] = newNode;
    cache->size++;
}

Ticket* cacheGet(LRUCache* cache, int ticketId) {
    CacheNode* node = cache->hashTable[ticketId % 10000];
    if (node) {
        moveToFront(cache, node);
        return node->ticket;
    }
    return NULL;
}

// ==================== UTILITY FUNCTIONS ====================

char* getCurrentDateTime() {
    static char buffer[MAX_STRING];
    time_t now = time(NULL);
    struct tm* t = localtime(&now);
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", t);
    return buffer;
}

char* extractValue(const char* json, const char* key) {
    static char value[MAX_STRING];
    char searchKey[MAX_STRING];
    snprintf(searchKey, sizeof(searchKey), "\"%s\":", key);
    
    char* pos = strstr(json, searchKey);
    if (!pos) return NULL;
    
    pos += strlen(searchKey);
    while (*pos == ' ' || *pos == '\t') pos++;
    
    if (*pos == '"') {
        pos++;
        int i = 0;
        while (*pos && *pos != '"' && i < MAX_STRING - 1) {
            value[i++] = *pos++;
        }
        value[i] = '\0';
        return value;
    }
    return NULL;
}

void sendResponse(int clientSocket, int statusCode, const char* body) {
    char response[BUFFER_SIZE];
    const char* status;
    
    switch(statusCode) {
        case 200: status = "OK"; break;
        case 400: status = "Bad Request"; break;
        case 401: status = "Unauthorized"; break;
        case 404: status = "Not Found"; break;
        default: status = "Internal Server Error";
    }
    
    snprintf(response, sizeof(response),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Content-Length: %zu\r\n"
        "\r\n"
        "%s",
        statusCode, status, strlen(body), body);
    
    send(clientSocket, response, strlen(response), 0);
}

// ==================== INITIALIZATION ====================

void initializeDataStructures() {
    userHashTable = createHashTable();
    urgentQueue = createPriorityQueue(100);
    usernamesTrie = createTrieNode();
    ticketCache = createLRUCache(CACHE_SIZE);
    
    // Add default users
    User* admin = (User*)malloc(sizeof(User));
    admin->userId = nextUserId++;
    strcpy(admin->username, "admin");
    strcpy(admin->password, "admin123");
    strcpy(admin->role, "admin");
    hashTableInsert(userHashTable, admin);
    trieInsert(usernamesTrie, admin);
    
    User* staff = (User*)malloc(sizeof(User));
    staff->userId = nextUserId++;
    strcpy(staff->username, "staff");
    strcpy(staff->password, "staff123");
    strcpy(staff->role, "staff");
    hashTableInsert(userHashTable, staff);
    trieInsert(usernamesTrie, staff);
    
    User* client = (User*)malloc(sizeof(User));
    client->userId = nextUserId++;
    strcpy(client->username, "client");
    strcpy(client->password, "client123");
    strcpy(client->role, "client");
    hashTableInsert(userHashTable, client);
    trieInsert(usernamesTrie, client);
    
    printf("✅ Data structures initialized\n");
    printf("   📊 Hash Table: O(1) user lookup\n");
    printf("   🌳 AVL Tree: O(log n) ticket search\n");
    printf("   ⬆️  Priority Queue: Urgent tickets first\n");
    printf("   🔍 Trie: Username autocomplete\n");
    printf("   💾 LRU Cache: %d tickets cached\n\n", CACHE_SIZE);
}

// ==================== REQUEST HANDLERS ====================

void handleRequest(int clientSocket, const char* request) {
    char response[BUFFER_SIZE];
    
    // Handle CORS
    if (strncmp(request, "OPTIONS", 7) == 0) {
        sendResponse(clientSocket, 200, "{}");
        return;
    }
    
    // POST /api/auth
    if (strstr(request, "POST /api/auth")) {
        char* body = strstr(request, "\r\n\r\n");
        if (!body) {
            sendResponse(clientSocket, 400, "{\"success\":false}");
            return;
        }
        body += 4;
        
        char* username = extractValue(body, "username");
        char* password = extractValue(body, "password");
        
        if (!username || !password) {
            sendResponse(clientSocket, 400, "{\"success\":false}");
            return;
        }
        
        // Use Hash Table for O(1) lookup
        User* user = hashTableFind(userHashTable, username);
        if (user && strcmp(user->password, password) == 0) {
            snprintf(response, sizeof(response),
                "{\"success\":true,\"userId\":%d,\"username\":\"%s\",\"role\":\"%s\"}",
                user->userId, user->username, user->role);
            sendResponse(clientSocket, 200, response);
            printf("✅ Login: %s (Hash Table lookup)\n", username);
        } else {
            sendResponse(clientSocket, 401, "{\"success\":false}");
        }
        return;
    }
    
    // Default
    sendResponse(clientSocket, 404, "{\"success\":false,\"message\":\"Not found\"}");
}

// ==================== MAIN ====================

int main(int argc, char* argv[]) {
    #ifdef _WIN32
        WSADATA wsaData;
        WSAStartup(MAKEWORD(2, 2), &wsaData);
    #endif
    
    printf("\n🚀 Carbochem Helpdesk System\n");
    printf("================================\n\n");
    
    initializeDataStructures();
    
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));
    
    struct sockaddr_in serverAddr;
    memset(&serverAddr, 0, sizeof(serverAddr));
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(PORT);
    
    bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr));
    listen(serverSocket, 10);
    
    printf("✅ C Backend Server running on port %d\n", PORT);
    printf("📡 Waiting for connections...\n\n");
    
    while (1) {
        struct sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
        
        if (clientSocket < 0) continue;
        
        char buffer[BUFFER_SIZE];
        memset(buffer, 0, BUFFER_SIZE);
        recv(clientSocket, buffer, BUFFER_SIZE - 1, 0);
        
        handleRequest(clientSocket, buffer);
        close(clientSocket);
    }
    
    #ifdef _WIN32
        WSACleanup();
    #endif
    
    return 0;
}