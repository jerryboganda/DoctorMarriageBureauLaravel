@C:\Users\Dr Faisal Maqsood PC\.codex\RTK.md
@C:\Users\Dr Faisal Maqsood PC\.codex\ANDY_UNIVERSAL_AGENT_RULES.md

# Doctor Marriage Bureau Project Rules

## CircleCI Validation Mandate

- Use CircleCI as the default validation runner for this project whenever a requested task can reasonably be validated there.
- Prefer the configured `.circleci/config.yml` workflow for backend tests, linting, static analysis, frontend lint/typecheck/build, mobile web build, Docker Compose validation, E2E-style smoke checks, load-heavy validation, and deployment-gated checks.
- Do not skip CircleCI just because local PHP, Composer, Node, Docker, database services, or browser tooling is missing or expensive locally. If CircleCI can run the check, use CircleCI or clearly report why CircleCI access is unavailable.
- Local checks are allowed for fast feedback, but they do not replace CircleCI validation when CircleCI is available for the same work.
- Before finalizing implementation work, report CircleCI status or the exact blocker that prevented using CircleCI.
