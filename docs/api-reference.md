# API Reference

This document describes the currently implemented server routes in `apps/web/app/api`.

## `POST /api/chat`

Accepts a JSON request body and returns an answer generated from retrieved document chunks.

### Request

Content-Type:

```text
application/json
```

Request body fields:

| Field | Required | Type | Description |
| --- | --- | --- | --- |
| `question` | Yes | `string` | The user question. The route trims whitespace. An empty string after trimming is rejected. |
| `topK` | No | `number` | Number of chunks to retrieve. Non-numeric values do not cause a validation error; they fall back to the default. |
| `traceMode` | No | `boolean` | When set to `true`, the response includes a `trace` object. Any value other than literal `true` is treated as `false`. |

### `topK` default and clamping

- Default: `5`
- Minimum: `1`
- Maximum: `20`
- Non-numeric or non-finite values use the default `5`
- Numeric values are rounded down with `Math.floor(...)` before clamping
- Values below `1` become `1`
- Values above `20` become `20`

Examples:

- `topK: 5.9` becomes `5`
- `topK: 0` becomes `1`
- `topK: 100` becomes `20`
- `topK: "5"` uses the default `5`

### Example request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does the uploaded handbook say about onboarding?",
    "topK": 5,
    "traceMode": true
  }'
```

### Response

Success response:

```json
{
  "answer": "Onboarding starts with account setup and a manager review [Source 1].",
  "retrieved": [
    {
      "chunk_id": "CHUNK_ID_PLACEHOLDER",
      "document_id": "DOCUMENT_ID_PLACEHOLDER",
      "title": "Employee Handbook",
      "source": "https://example.com/handbook",
      "content": "Onboarding begins with account setup and a manager review...",
      "similarity": 0.92
    }
  ],
  "trace": {
    "question": "What does the uploaded handbook say about onboarding?",
    "topK": 5,
    "retrieved_count": 1
  }
}
```

Response fields:

| Field | Type | Included when | Description |
| --- | --- | --- | --- |
| `answer` | `string` | Always on success | Generated answer. If no chunks are retrieved, the implementation returns `I don't know based on the provided documents.` |
| `retrieved` | `array` | Always on success | Retrieved chunk records used for the answer. |
| `trace` | `object` | Only when `traceMode === true` | Debug metadata for the request. |

`retrieved` item fields:

| Field | Type | Description |
| --- | --- | --- |
| `chunk_id` | `string` | Chunk identifier |
| `document_id` | `string` | Parent document identifier |
| `title` | `string` | Document title |
| `source` | `string \| null` | Optional source value stored with the document |
| `content` | `string` | Chunk text |
| `similarity` | `number` | Similarity score returned by retrieval |

`trace` fields:

| Field | Type | Description |
| --- | --- | --- |
| `question` | `string` | Trimmed input question |
| `topK` | `number` | Effective `topK` after defaulting, flooring, and clamping |
| `retrieved_count` | `number` | Number of retrieved chunks in the response |

### Error responses

| Status | Error response | When it happens |
| --- | --- | --- |
| `400` | `{ "error": "Invalid JSON body" }` | The request body cannot be parsed as JSON |
| `400` | `{ "error": "Invalid request body" }` | The parsed JSON body is not an object, or it is an array |
| `400` | `{ "error": "Question is required" }` | `question` is missing, not a string, or trims to an empty string |
| `500` | `{ "error": "An unexpected error occurred." }` | Any other failure during retrieval or answer generation |

## `POST /api/ingest`

Accepts `multipart/form-data` only. This route does not implement a JSON request body.

### Authentication

This route requires the submitted `password` field to match the server environment variable:

```text
ADMIN_INGEST_PASSWORD=YOUR_ADMIN_PASSWORD
```

Use a placeholder value in examples. Do not place real secrets in requests or docs.

### Request

Content-Type:

```text
multipart/form-data
```

Form fields:

| Field | Required | Type | Description |
| --- | --- | --- | --- |
| `password` | Yes | `string` | Must match `ADMIN_INGEST_PASSWORD` exactly after trimming |
| `title` | Yes | `string` | Document title. Empty after trimming is rejected |
| `source` | No | `string` | Optional source value. Empty after trimming becomes `null` |
| `text` | Conditionally required | `string` | Manual text to ingest. Must be provided when `file` is not provided |
| `file` | Conditionally required | `file` | File upload to ingest. Must be provided when `text` is not provided |

Validation rules:

- Provide exactly one of `text` or `file`
- Sending both `text` and `file` returns `400`
- Sending neither `text` nor `file` returns `400`

### Text ingestion

Use the `text` field to ingest manual text content.

Example:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Policies Manual" \
  -F "source=https://example.com/policies" \
  -F "text=This is placeholder document content for ingestion."
```

### File ingestion

Use the `file` field to upload a supported file.

Supported file types:

- `.pdf`
- `.docx`
- `.txt`

Supported MIME types in the implementation:

- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`

Size limits:

- Maximum upload size: `10 MB`
- Empty files are rejected

Example `.pdf` upload:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Quarterly Report" \
  -F "source=https://example.com/reports/q1" \
  -F "file=@./DOCUMENT_PLACEHOLDER.pdf;type=application/pdf"
```

Example `.docx` upload:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Project Notes" \
  -F "source=https://example.com/project-notes" \
  -F "file=@./DOCUMENT_PLACEHOLDER.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document"
```

Example `.txt` upload:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Plain Text Notes" \
  -F "source=https://example.com/notes" \
  -F "file=@./DOCUMENT_PLACEHOLDER.txt;type=text/plain"
```

### Response

Success response:

```json
{
  "ok": true,
  "document_id": "DOCUMENT_ID_PLACEHOLDER",
  "chunks": 4,
  "latency_ms": 1234
}
```

Response fields:

| Field | Type | Description |
| --- | --- | --- |
| `ok` | `true` | Success flag |
| `document_id` | `string` | Inserted document identifier |
| `chunks` | `number` | Number of chunks created and stored |
| `latency_ms` | `number` | End-to-end request duration in milliseconds |

### Error responses

| Status | Error response | When it happens |
| --- | --- | --- |
| `400` | `{ "error": "Invalid form submission" }` | The request cannot be parsed as form data |
| `400` | `{ "error": "Title is required" }` | `title` is missing, not a string, or trims to an empty string |
| `400` | `{ "error": "Provide either manual text or a file upload, not both." }` | Both `text` and `file` are provided |
| `400` | `{ "error": "Provide manual text or upload a PDF, DOCX, or TXT file." }` | Neither `text` nor `file` is provided |
| `400` | `{ "error": "Unsupported file type. Upload a PDF, DOCX, or TXT file." }` | Uploaded file type is not supported |
| `400` | `{ "error": "Uploaded file is empty." }` | Uploaded file size is `0` |
| `400` | `{ "error": "Uploaded file is too large. Max size is 10 MB." }` | Uploaded file exceeds `10 MB` |
| `400` | `{ "error": "Uploaded TXT file is empty." }` | A `.txt` upload contains no text after normalization |
| `400` | `{ "error": "Could not extract any text from the DOCX file." }` | Text extraction from a `.docx` file returns no usable text |
| `400` | `{ "error": "Could not extract enough text from the PDF. It may be scanned, and OCR is not supported yet." }` | Extracted PDF text is empty or shorter than the minimum threshold |
| `400` | `{ "error": "No chunks generated" }` | Manual text or parsed file text becomes empty after chunking |
| `401` | `{ "error": "Unauthorized" }` | `password` does not match `ADMIN_INGEST_PASSWORD` |
| `500` | `{ "error": "Server misconfigured" }` | `ADMIN_INGEST_PASSWORD` is missing on the server |
| `500` | `{ "error": "Missing OPENAI_API_KEY" }` | The server is missing `OPENAI_API_KEY` during ingestion |
| `500` | `{ "error": "Ingestion failed" }` | Non-Error failure during ingestion |
| `500` | `{ "error": "<upstream message>" }` | Insert, embedding, or other ingestion errors that surface an `Error.message` |

## TODO

- TODO: The implementation does not enforce or document a maximum length for manual `text`; only uploaded files have an explicit 10 MB size limit.
- TODO: The implementation accepts supported uploads by file extension or MIME type. If both are present but disagree, the code path is determined by the extension-first checks in `parseUploadedDocument`; keep this in mind if stricter validation is added later.
