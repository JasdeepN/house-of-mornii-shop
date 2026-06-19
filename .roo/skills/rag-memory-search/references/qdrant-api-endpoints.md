# Qdrant + llama.cpp text-embedding-server API Reference

## Table of Contents

- [llama.cpp text-embedding-server Embedding Endpoints](#llamacpp-text-embeddingserver-embedding-endpoints)
- [Qdrant Core Endpoints](#qdrant-core-endpoints)
- [Qdrant Collection Management](#qdrant-collection-management)
- [Qdrant Point Operations](#qdrant-point-operations)
- [Qdrant Search & Query](#qdrant-search--query)
- [Qdrant Discovery & Recommend](#qdrant-discovery--recommend)
- [Health Checks](#health-checks)

---

## llama.cpp text-embedding-server Embedding Endpoints

**Base URL:** `http://localhost:8081`

The llama.cpp text-embedding-server provides an OpenAI-compatible API.

### `/v1/embeddings` (OpenAI-compatible)

Generate embeddings for input text.

```bash
curl -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed-text",
    "input": "text to embed"
  }'
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {"object": "embedding", "index": 0, "embedding": [0.01, 0.02, ...]}
  ],
  "model": "nomic-embed-text",
  "usage": {"prompt_tokens": 12, "total_tokens": 12}
}
```

### Batch embeddings (multiple inputs)

```bash
curl -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed-text",
    "input": ["text one", "text two", "text three"]
  }'
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {"object": "embedding", "index": 0, "embedding": [0.01, ...]},
    {"object": "embedding", "index": 1, "embedding": [0.11, ...]},
    {"object": "embedding", "index": 2, "embedding": [0.21, ...]}
  ],
  "model": "nomic-embed-text",
  "usage": {"prompt_tokens": 30, "total_tokens": 30}
}
```

### List available models

```bash
curl http://localhost:8081/v1/models -s | jq '.data[].id'
```

---

## Qdrant Core Endpoints

**Base URL:** `http://localhost:6333`

### Collection Management

#### Create collection

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {"m": 16, "ef_construct": 100},
    "optimizers_config": {"memmap_threshold": 20000}
  }'
```

#### Update collection

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H "Content-Type: application/json" \
  -d '{
    "optimizers_config": {"memmap_threshold": 30000}
  }'
```

#### List collections

```bash
curl http://localhost:6333/collections | jq
```

#### Get collection info

```bash
curl http://localhost:6333/collections/{collection_name} | jq
```

#### Delete collection

```bash
curl -X DELETE http://localhost:6333/collections/{collection_name} \
  -d '{"wait": true}'
```

---

### Point Operations

#### Upsert points

```bash
curl -X PUT http://localhost:6333/collections/{collection_name}/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, ...],
        "payload": {"key": "value"}
      }
    ],
    "wait": true
  }'
```

#### Delete points

```bash
curl -X PUT http://localhost:6333/collections/{collection_name}/points/delete \
  -H "Content-Type: application/json" \
  -d '{
    "points": [1, 2, 3],
    "wait": true
  }'
```

#### Get point count

```bash
curl http://localhost:6333/collections/{collection_name}/points/count \
  -H "Content-Type: application/json" \
  -d '{"exact": true}' | jq
```

#### List points (with filtering)

```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/points/select \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "must": [{"key": "source", "match": {"value": "about"}}]
    },
    "with_payload": true,
    "with_vector": false
  }'
```

---

### Search & Query

#### Basic search

```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "top": 10,
    "with_payload": true,
    "with_vector": false
  }'
```

#### Search with filter

```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "top": 5,
    "with_payload": true,
    "filter": {
      "must": [
        {"key": "category", "match": {"value": "jewelry"}},
        {"key": "price", "range": {"gte": 100, "lte": 500}}
      ]
    }
  }'
```

#### Search request body fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vector` | number[] | Yes | Embedding vector (768 dims) |
| `top` | int | No | Number of results (default: 10) |
| `with_payload` | bool\|string[] | No | Include payload fields |
| `with_vector` | bool | No | Include vectors in response |
| `filter` | Filter | No | Pre-search metadata filter |
| `params` | SearchParams | No | Additional search params |
| `limit` | int | No | Result limit (alternative to top) |
| `score_threshold` | float | No | Minimum similarity score |

---

### Discovery & Recommend

#### Discover (minimize loss by target)

```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/discover \
  -H "Content-Type: application/json" \
  -d '{
    "target": [0.1, 0.2, ...],
    "context": [
      {
        "positive_vectors": [1],
        "negative_vectors": [2]
      }
    ],
    "top": 5
  }'
```

#### Recommend best scores

```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/search/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "positive": [1, 2, 3],
    "negative": [4],
    "top": 10,
    "with_payload": true
  }'
```

---

### Health Checks

#### Qdrant health

```bash
curl http://localhost:6333/ -s | jq
# Returns {"title":"Qdrant","version":"..."}
```

#### llama.cpp text-embedding-server health

```bash
curl http://localhost:8081/v1/models -s | jq '.data[].id'
# Or simple ping:
curl http://localhost:8081/health -s
```

---

### Filter Syntax

Qdrant uses a JSON-based filter syntax:

```json
{
  "filter": {
    "must": [...],      // ALL conditions must match (AND)
    "must_not": [...],  // NONE of these can match (NOT)
    "should": [...]     // AT LEAST ONE must match (OR)
  }
}
```

Condition types:
- `{"key": "field", "match": {"value": "exact"}}` — exact match
- `{"key": "field", "match": {"any": ["a", "b"]}}` — any of values
- `{"key": "field", "range": {"gte": 10, "lte": 100}}` — numeric range
- `{"key": "field", "values_count": {"lower": 1, "upper": 10}}` — array size
- `{"key": "field", "empty": true}` — null/missing check
