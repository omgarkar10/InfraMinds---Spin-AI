# Backend Deployment Guide (AWS ECS/Docker)

This document outlines the necessary codebase modifications and environment configurations required to successfully deploy the FastAPI backend and AI Agents using Docker on AWS (ECS, Fargate, or App Runner).

## 1. Python Path Configuration (Critical for Docker)

When running the application locally via a Virtual Environment (`venv`), relative imports generally resolve successfully based on the active directory. However, when the application is packaged into a Docker container, Python may fail to locate the `schemas` and `spin_agents` modules, throwing a `ModuleNotFoundError`.

### Required Dockerfile Modification
To fix the import resolution, the `PYTHONPATH` environment variable must be explicitly augmented to include both `/app` and `/app/backend`.

In both `deploy/Dockerfile.api` and `deploy/Dockerfile.agent`, update the `PYTHONPATH` instruction:

```dockerfile
# Change this:
ENV PYTHONPATH=/app

# To this:
ENV PYTHONPATH=/app:/app/backend
```

## 2. Docker Environment Variable Parsing (Quotes Issue)

Docker's `--env-file` parameter and AWS ECS Task Definitions inject environment variables differently than a local `.env` file parser (like `python-dotenv`). Specifically, Docker **does not strip surrounding quotation marks** from values. 

If your environment variables are wrapped in quotes (e.g., `BHASHINI_DAILY_CALL_LIMIT="5000"`), they will be passed into Python *with the literal string quotes included*. This will cause `ValueError` crashes during startup when Python attempts to cast them (e.g., `int('"5000"')`).

### Solutions:
**Option A (Infrastructure Level):** Ensure that the AWS Secrets Manager, ECS Task Definition, or `.env` file supplied to the container does **not** contain any quotation marks around the values.

**Option B (Codebase Level):** Sanitize the inputs within `backend/spin_agents/config.py` by implementing a stripping utility:

```python
import os

def _clean_env(name: str, default: str = "") -> str:
    val = os.getenv(name, default)
    if isinstance(val, str):
        return val.strip().strip("'").strip('"')
    return val

def _clean_int_env(name: str, default: int) -> int:
    val = _clean_env(name, "")
    if val:
        try:
            return int(val)
        except ValueError:
            pass
    return default
```
*Note: You would then need to replace `os.getenv` calls in the `SpinConfig` dataclass with `_clean_env` and `_clean_int_env`.*

## 3. Port Binding

Ensure your AWS ECS Task Definition or App Runner configuration correctly routes traffic to the exposed port. By default, `deploy/Dockerfile.api` starts Uvicorn on port `8080`. 

```dockerfile
CMD ["uvicorn", "backend.spin_agents.api:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
```
*If AWS requires dynamic port binding, you can inject an environment variable and modify the CMD to use `${PORT:-8080}` via a shell execution format.*
