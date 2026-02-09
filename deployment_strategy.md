# Deployment Strategy: Industry Grade

## Recommendation: GitHub Actions (CI/CD Pipeline)

For an "Industry Grade" application where reliability is paramount, we should **NOT** use the simple "Automatic Cloudflare Integration" (where Cloudflare just pulls from `main`).

Instead, we should use **GitHub Actions** to control the pipeline.

### Why?
1.  **Gatekeeping:** We can prevent a broken build from being deployed.
2.  **Testing:** We can run the Playwright E2E tests *before* the deploy happens. If tests fail, the deploy is cancelled.
3.  **Control:** We can run linting, type-checking, and build verification in parallel.

### The Pipeline (`.github/workflows/ci.yml`)
1.  **Trigger:** Push to `main` or Pull Request.
2.  **Job 1: Quality Check**
    *   Install Deps
    *   Lint (`npm run lint`)
    *   Type Check (`tsc`)
3.  **Job 2: Test**
    *   Install Playwright Browsers
    *   Run E2E Tests (`npx playwright test`)
4.  **Job 3: Deploy (Only if 1 & 2 pass)**
    *   Build Next.js app
    *   Push to Cloudflare Pages via API Token

This is the "Trustworthy" way to deploy software. I have added this to the Task Plan.
