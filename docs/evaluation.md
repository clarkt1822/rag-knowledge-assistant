# RAG Evaluation

Base URL: `http://localhost:3000`

## Summary Metrics

- Total questions: 10
- Abstain accuracy: 4/10
- Abstain expected count: 1
- Answer keyword hit rate: 10/27
- Retrieved title hit rate: 7/18
- Total question pass count: 0/10

## Per-Question Results

| id | http status | abstain expected | abstain correct | answer keyword score | retrieved title score | retrieved count | answer preview |
| --- | --- | --- | --- | --- | --- | --- | --- |
| q1_overview_purpose | 200 | false | true | 3/4 | 1/2 | 5 | The main purpose of the RAG Knowledge Assistant project is to implement Retrieval Augmented Gener... |
| q2_architecture_flow | 200 | false | true | 3/5 | 1/2 | 5 | The main steps in the project's RAG pipeline from document ingestion to answer generation are as ... |
| q3_vector_store | 200 | false | false | 0/3 | 1/2 | 5 | I don't know based on the provided documents. |
| q4_design_principles | 200 | false | false | 0/2 | 1/2 | 5 | I don't know based on the provided documents. |
| q5_setup_secrets | 200 | false | false | 0/3 | 0/1 | 5 | I don't know based on the provided documents. |
| q6_ingest_examples | 200 | false | true | 2/4 | 1/2 | 5 | The ingestion flow example for POST /api/ingest shows that the API route accepts a valid admin pa... |
| q7_default_topk_behavior | 200 | false | false | 0/1 | 0/2 | 5 | I don't know based on the provided documents. |
| q8_trace_mode_shape | 200 | false | false | 0/3 | 0/2 | 5 | I don't know based on the provided documents. |
| q9_abstain_response | 200 | false | false | 1/1 | 1/1 | 5 | I don't know based on the provided documents. |
| q10_unknown_founder | 200 | true | true | 1/1 | 1/2 | 5 | I don't know based on the provided documents. |
