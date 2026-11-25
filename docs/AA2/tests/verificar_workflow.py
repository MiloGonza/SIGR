from pathlib import Path
import yaml

ruta = Path(".github/workflows/ci-cd-simulado.yml")
wf = yaml.safe_load(ruta.read_text())
trigger = wf.get("on") or wf[True]  # PyYAML 1.1 convierte "on" en True
jobs = wf["jobs"]

assert "main" in trigger["push"]["branches"]
assert "main" in trigger["pull_request"]["branches"]
assert set(jobs) == {"backend", "frontend", "despliegue-simulado"}

backend = str(jobs["backend"])
for cmd in [
    "python -m venv Back/.venv",
    "manage.py check",
    "makemigrations --check --dry-run",
    "run-tests.sh test",
    "ruff check --select E9,F63,F7,F82",
    "pip-audit",
    "manage.py check --deploy",
]:
    assert cmd in backend, cmd
for key in ["DB_NAME", "DB_USER", "DB_PASSWORD", "DEBUG", "SECRET_KEY"]:
    assert key in backend, key

deployStep = next(
    step
    for step in jobs["backend"]["steps"]
    if "check --deploy" in str(step.get("run", ""))
)
assert "cd Back" in deployStep["run"]
for key in ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT"]:
    assert key in deployStep["env"], key

frontend = str(jobs["frontend"])
for cmd in ["pnpm/action-setup@v4", "'version': 12", "pnpm install --frozen-lockfile", "pnpm lint", "pnpm audit", "pnpm build"]:
    assert cmd in frontend, cmd
assert "vars.VITE_API_URL" in frontend

deploy = str(jobs["despliegue-simulado"])
assert "github.event_name == 'push'" in deploy
assert "refs/heads/main" in deploy
assert "needs" in deploy and "backend" in deploy and "frontend" in deploy
assert "frontend-dist" in deploy
assert "GITHUB_STEP_SUMMARY" in deploy
