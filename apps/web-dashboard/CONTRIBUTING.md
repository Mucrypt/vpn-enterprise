# Contributing to Web Dashboard

This document describes coding conventions, component patterns, naming rules, testing templates and accessibility guidance for `apps/web-dashboard`. Follow these rules to keep the UI consistent, testable and production-ready.

1) Branches & PRs
  - Create a short-lived feature branch: `feature/<jira>-short-description` or `fix/<issue>-short`.
  - Open a PR against `main`. The PR title should include the feature/issue id and a short description.
  - Reference related issues and include screenshots (UI) and acceptance criteria.

2) Code style & linting
  - Follow existing ESLint and Prettier config in the repo root and `apps/web-dashboard`.
  - Run `npm run lint` and `npm run format` before opening a PR.

3) Component patterns
  - Prefer small, focused components. Each component file under `components/` should export a single default component.
  - Keep presentational components stateless and pure. Move side-effects and data fetching to hooks or server components.
  - File naming: use kebab-case for files (e.g., `server-status-grid.tsx`) and PascalCase for React components when exported.
  - Directory layout: group related components under a folder. Example:

```
components/
  dashboard/
    server-status-grid.tsx    # composite component
    server-card.tsx
```

4) Hooks & data fetching
  - Use hooks in `hooks/` for reusable logic (e.g., `useClientDate.ts`).
  - For server-side data, prefer Next.js server components or the App Router's server-side data fetching.
  - Keep network/fetch logic in `lib/api.ts` to centralize retry, auth refresh, and error handling.

5) Testing
  - Unit tests: place under `__tests__` near components or in a `tests/` folder. Use Jest or Vitest.
  - E2E: we provide a Playwright scaffold in `apps/web-dashboard/e2e/`. Keep smoke tests minimal: critical flows only (login, dashboard load, notifications).
  - PRs should include tests for new behaviour where meaningful.

6) Accessibility
  - Use semantic HTML (buttons, main, nav, header, footer) and ARIA attributes where required.
  - Ensure all interactive elements are keyboard accessible and have visible focus styles.
  - Provide alt text for images and aria-labels for controls without visible text.
  - Run an accessibility check (axe or Playwright's accessibility snapshot) for new UIs.

7) Performance
  - Avoid heavy client-side computation. Prefer server rendering for heavy data transforms.
  - Use Next.js static rendering (ISR) where appropriate for public content.

8) Documentation
  - Small features: add a short note to `CHANGELOG.md` or the PR description.
  - Large features: update `apps/web-dashboard/README.md` with usage notes, and add examples to per-component README if needed.

9) Ownership & reviews
  - Add CODEOWNERS entries (see repository `.github/CODEOWNERS`) so UI owners review changes to `apps/web-dashboard`.

10) Checklist before merging
  - Tests pass (unit + CI checks)
  - Lint & format pass
  - No exposed secrets
  - Accessibility smoke check performed
  - Screenshots or demo link included if UI changed

Thanks for contributing — consistent small changes keep the project healthy and safe for production.
