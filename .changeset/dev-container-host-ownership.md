---
"seamless-templates": patch
---

The Express and FastAPI dev containers no longer write into the bind-mounted source. On a Linux host the generated stack runs them as root, so the Express logger's `logs/app.log` and FastAPI's `__pycache__` directories ended up owned by root and `rm -rf` of the project failed without sudo. The Express dev stage now sets `LOG_DIR=/tmp/logs` (the logger reads `LOG_DIR`, and still writes `./logs` when run on the host), and the FastAPI dev stage sets `PYTHONPYCACHEPREFIX=/tmp/pycache`.
