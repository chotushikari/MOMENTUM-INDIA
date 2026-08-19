# Environment

## Local demo

```bash
DATA_MODE=demo
```

No provider credentials are required. Fixture data is labeled in the UI.

## Live YouTube

```bash
DATA_MODE=live
YOUTUBE_API_KEY=...
```

The key is read only by the server-side adapter. Do not prefix it with
`NEXT_PUBLIC_` and do not commit `.env.local`.

## AI

`OPENAI_API_KEY` and `OPENAI_MODEL` are reserved for grounded interpretation
requests. The product should pass observed evidence to the model and validate
the structured response before presenting it as interpretation.
