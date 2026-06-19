---
name: rag-memory-search
description: Perform RAG memory semantic search using Qdrant vector database at localhost:6333 with nomic-embed-text embeddings from llama.cpp text-embedding-server at localhost:8081. Use when building retrieval-augmented generation pipelines, implementing vector search, storing/retrieving embeddings, or working with Qdrant collections.
---

# RAG Memory Semantic Search

Use this skill for semantic search workflows with Qdrant + nomic-embed-text embeddings.

## When to use

- Implementing RAG (Retrieval-Augmented Generation) pipelines
- Storing and retrieving vector embeddings in Qdrant
- Performing similarity search on text data
- Building memory/context systems for LLM applications
- Creating, managing Qdrant collections and points

## When NOT to use

- Simple keyword/search operations (use full-text search instead)
- Non-vector database operations
- Embedding model training (use a different skill)

## Services

| Service | URL | Purpose |
|---------|-----|---------|
| Qdrant DB | `http://localhost:6333` | Vector database |
| llama.cpp text-embedding-server (nomic-embed-text) | `http://localhost:8081` | Embedding generation |

## Inputs required

- Text to embed or search query
- Collection name (or create one if new)
- Optional: metadata payload, top-k for search results

## Workflow

### 1. Generate Embeddings

Send the text to llama.cpp text-embedding-server for embedding (OpenAI-compatible `/v1/embeddings` endpoint):

```bash
curl -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed-text",
    "input": "your text here"
  }'
```

Read [`references/qdrant-api-endpoints.md`](references/qdrant-api-endpoints.md) for full API reference.

### 2. Create Collection (if needed)

If the collection does not exist, create it with dimension matching nomic-embed-text (768):

**Collection naming convention:** Workspace-scoped collections use a hex suffix that is a hash of the workspace root path (e.g., `ws-038204cd35e49cb8`). Shared collections like `rag-memory` and `checkpoint-memory` are project-agnostic. When creating a new collection, choose a descriptive name or check if a workspace-scoped variant already exists.

```bash
curl -X PUT http://localhost:6333/collections/my-collection \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

### 3. Upsert Points

Upload embeddings with metadata to Qdrant:

```bash
curl -X PUT http://localhost:6333/collections/my-collection/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, ...],
        "payload": {"text": "original text", "source": "page-url"}
      }
    ]
  }'
```

### 4. Search Similarity

Query the collection for similar vectors:

```bash
curl -X POST http://localhost:6333/collections/my-collection/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "top": 5,
    "with_payload": true
  }'
```

### 5. Filter Search (optional)

Add pre-filtering for metadata:

```bash
curl -X POST http://localhost:6333/collections/my-collection/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "top": 5,
    "with_payload": true,
    "filter": {
      "must": [
        {"key": "source", "match": {"value": "homepage"}}
      ]
    }
  }'
```

## Examples

### Store a page for RAG memory

```bash
# Step 1: Embed (llama.cpp OpenAI-compatible endpoint)
EMBED=$(curl -s -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "input": "House of Mornii offers luxury jewelry"}')

# Step 2: Extract vector and upsert
VECTOR=$(echo $EMBED | jq '.embedding')
curl -X PUT http://localhost:6333/collections/rag-memory/points \
  -H "Content-Type: application/json" \
  -d "{
    \"points\": [{
      \"id\": 1,
      \"vector\": $VECTOR,
      \"payload\": {
        \"text\": \"House of Mornii offers luxury jewelry\",
        \"source\": \"about-page\",
        \"created_at\": \"2026-06-18\"
      }
    }]
  }"
```

### Retrieve context for LLM prompt

```bash
QUERY=$(curl -s -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "input": "What products do they sell?"}')
QVEC=$(echo $QUERY | jq '.embedding')

RESULTS=$(curl -s -X POST http://localhost:6333/collections/rag-memory/points/search \
  -H "Content-Type: application/json" \
  -d "{
    \"vector\": $QVEC,
    \"top\": 3,
    \"with_payload\": true
  }")

echo $RESULTS | jq '.result[].payload'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused on :6333 | Ensure Qdrant is running: `docker run -p 6333:6333 qdrant/qdrant` |
| Connection refused on :8081 | Ensure llama.cpp text-embedding-server is running with nomic-embed-text model loaded |
| Vector dimension mismatch | nomic-embed-text outputs 768-dim vectors; ensure collection uses `size: 768` |
| Distance metric error | Use `Cosine`, `Dot`, or `Euclidean`; Cosine is recommended for nomic-embed-text |
| Empty search results | Check that points were successfully upserted; verify with `/collections/{name}/points/count` |
