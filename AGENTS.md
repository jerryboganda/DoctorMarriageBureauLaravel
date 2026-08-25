@C:\Users\Dr Faisal Maqsood PC\.codex\RTK.md
@C:\Users\Dr Faisal Maqsood PC\.codex\ANDY_UNIVERSAL_AGENT_RULES.md

# Doctor Marriage Bureau Project Rules

## Core Directive: Active Stack vs. Legacy Systems

- **ONLY ACTIVE STACK**: The **Astro 5 + React Web App** in `Modernized-Platform/apps/web` (and Go backend in `Modernized-Platform/services/api`) is the **SINGLE active platform** to edit, develop, build, and maintain.
- **LEGACY SYSTEMS (DO NOT TOUCH / DO NOT DEVELOP)**:
  - The root Laravel PHP app (`app/`, `dmb-webapp`, `resources/`, `routes/`) is **LEGACY**.
  - The `New User Panel Frontend/` directory is **LEGACY**.
  - The WordPress marketing site and plugins are **LEGACY**.
  - All new features, pages, UI improvements, API integrations, and auth flows MUST ONLY be implemented in `Modernized-Platform/apps/web`.

## Demo & Testing Credentials

- **Primary Doctor Account**: `doctor@hospital.org` / `Doctor@123` (Dr. Faisal Maqsood — Cardiologist)
- **Female Doctor Account**: `ayesha@hospital.org` / `Doctor@123` (Dr. Ayesha Malik — Dermatologist)
- **Quick 1-Click Login**: Enabled directly on `/login/`.

## Live Product & Deployment

- Member Panel & Web Platform: `Modernized-Platform/apps/web` (Astro 5 + React + Tailwind CSS).
- Canonical application code: `Modernized-Platform/`.
- Repository source of truth: GitHub branch `main`.

## GitHub Actions Validation Mandate

- GitHub Actions is the only CI/CD and automated validation platform for this project.
- Use `.github/workflows/ci.yml` for backend quality, MySQL regression/backup smoke checks, and member-panel quality.
- Use the Hostinger workflows under `.github/workflows/` for production deploys, remote commands, and production status checks.
- Do not add, restore, or use CircleCI configuration or CircleCI-only validation scripts.
- Before finalizing implementation work, report the relevant GitHub Actions run status or the exact blocker that prevented using it.
