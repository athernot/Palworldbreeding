# Python Adapter

External Python process used by the Electron main process through `PythonBridgeService`.

## Role

- Acts as an isolated adapter boundary (Clean Architecture — infrastructure).
- Communicates with Node only via stdout/stderr JSON.
- Must never be imported or invoked directly from the React renderer.

## Current stage

`main.py` only returns a health payload:

```json
{ "success": true, "message": "Python Bridge Ready" }
```

No save reading. No decoding. No `palworld-save-tools` usage yet.

## Run manually

```bash
python python/main.py
```

## Later stages

Additional commands and dependencies will be added here when parsing is implemented.
