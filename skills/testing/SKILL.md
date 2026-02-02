---
name: testing
description: Design and implement tests (unit, integration, e2e, accessibility, i18n), improve coverage, and run test suites. Use when the user asks to add tests, write tests, improve coverage, run tests, test accessibility, test translations, or implement test strategy.
triggers:
  - "/test"
  - "add tests"
  - "write tests"
  - "test this"
  - "run tests"
  - "improve coverage"
  - "unit test"
  - "integration test"
  - "e2e test"
  - "test strategy"
  - "accessibility test"
  - "a11y test"
  - "test translations"
  - "i18n test"
  - "migration test"
---

# Testing Skill

## Core Philosophy

**"Tests document behavior and prevent regressions."**

Design and run tests that are fast, deterministic, and focused. Prefer testing behavior over implementation.

**⛔ TESTING IS MANDATORY - NOT OPTIONAL**

When working within the workflow skill:
- **NEVER** present tests as "optional" or "next steps"
- **NEVER** complete a workflow without tests passing
- **ALWAYS** write and run tests before commit
- **STOP** the workflow if tests are missing and write them first

For frontend/UI projects:
- Tests (`npm test` or equivalent) MUST pass
- Build (`npm run build` or equivalent) MUST succeed
- E2E tests via Playwright MCP MUST pass (if UI exists)

For backend projects (Go, Python, Ruby, etc.):
- Tests MUST pass before any commit

---

## Protocol

### 1. Understand Scope

- **Unit**: Single function/class in isolation (mocks for deps).
- **Integration**: Multiple components together (real or test doubles).
- **E2E**: Full stack or user flows (browser/API).

Choose the right level; avoid testing implementation details in unit tests.

**MANDATORY: For any UI-related testing, you MUST use the Playwright MCP server.** If the Playwright MCP is not configured, run `/setup` first to add it before proceeding with UI tests.

### 2. Test Design

- **Arrange** – Set up inputs and dependencies.
- **Act** – Call the code under test.
- **Assert** – Check outcomes and side effects.

One logical assertion per test when possible. Name tests by behavior: `it("returns 404 when resource is missing")` not `it("works")`.

### 3. Commands (by ecosystem)

| Context    | Command                                                     | Purpose                     |
| ---------- | ----------------------------------------------------------- | --------------------------- |
| Node/JS/TS | `npm test` or `npx vitest` / `jest`                         | Run test suite              |
| Python     | `pytest` or `python -m pytest`                              | Run tests                   |
| Go         | `go test -race ./...`                                       | Run all packages with race detection |
| Rust       | `cargo test`                                                | Run tests                   |
| Generic    | Run the project’s test script from README or `package.json` | Respect project conventions |

Run tests after changes. Fix or skip failing tests before adding new ones.

### 4. Coverage

- Use coverage only to find gaps, not as a target by itself.
- Prefer: critical paths, edge cases, and error handling.
- Report coverage when asked: `pytest --cov`, `npm run test:coverage`, `go test -race -cover ./...`, etc.

### 5. UI Testing with Playwright MCP (MANDATORY for UI)

**When the application has a UI, Playwright MCP is MANDATORY for E2E and UI testing.**

**Prerequisites:**
1. Ensure Playwright MCP is configured via `/setup`
2. The MCP provides browser automation tools directly to the agent

**Playwright MCP Capabilities:**

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to URLs |
| `browser_click` | Click elements |
| `browser_type` | Type text into inputs |
| `browser_screenshot` | Capture screenshots for visual verification |
| `browser_snapshot` | Get accessibility tree snapshot |
| `browser_wait` | Wait for conditions |
| `browser_select_option` | Select dropdown options |
| `browser_hover` | Hover over elements |
| `browser_drag` | Drag and drop |
| `browser_press_key` | Press keyboard keys |

**When to Use Playwright MCP:**

- Testing user flows (login, checkout, forms)
- Visual regression testing (screenshots)
- Accessibility tree inspection
- Interactive debugging of UI issues
- Cross-browser testing (Chrome, Firefox, WebKit, Edge)

**Example UI Test Flow:**

1. Use `browser_navigate` to go to the page
2. Use `browser_snapshot` to understand the page structure
3. Use `browser_click`, `browser_type` to interact
4. Use `browser_screenshot` to capture results
5. Verify outcomes via assertions or visual inspection

**Configuration:** If Playwright MCP is not available, stop and run `/setup` to configure it before proceeding with any UI testing.

### 6. Accessibility (a11y) Testing

Test that the application is usable by people with disabilities:

| Test Type | Tools | What to Check |
|-----------|-------|---------------|
| **Automated** | axe-core, pa11y, Lighthouse | Color contrast, alt text, ARIA labels, heading hierarchy |
| **Keyboard** | Manual or Cypress/Playwright | Tab order, focus visible, no keyboard traps, skip links |
| **Screen reader** | VoiceOver, NVDA, JAWS | Announcements make sense, forms labeled, dynamic content announced |

**Automated a11y testing in CI:**

```javascript
// Jest + axe-core example
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  expect(await axe(container)).toHaveNoViolations();
});
```

**Key WCAG criteria to test:**
- Perceivable: Alt text, captions, color contrast (4.5:1 for text)
- Operable: Keyboard accessible, no seizure triggers, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

### 7. Internationalization (i18n) Testing

Test that the application works correctly across languages and locales:

| Test Type | What to Check |
|-----------|---------------|
| **Translation coverage** | All user-facing strings have translations; no hardcoded text |
| **Locale formatting** | Dates, numbers, currencies format correctly per locale |
| **RTL support** | Layout works for right-to-left languages (Arabic, Hebrew) |
| **Text expansion** | UI doesn't break when translations are longer (German ~30% longer) |
| **Pluralization** | Correct plural forms for each language |
| **Character encoding** | Unicode renders correctly; no mojibake |

**i18n testing approaches:**

```javascript
// Test with pseudo-localization (catches hardcoded strings)
i18n.locale = 'pseudo'; // Renders "[Ḩḗŀŀǿ Ẇǿřŀḓ!]"

// Test with longest translations
i18n.locale = 'de'; // German often longest

// Test RTL
i18n.locale = 'ar'; // Arabic
expect(document.dir).toBe('rtl');
```

**Tools:** i18next, FormatJS, pseudo-localization libraries, Crowdin/Lokalise for translation management.

### 8. Database Migration Testing

Test that migrations work correctly and are reversible:

| Test | Purpose |
|------|---------|
| **Up migration** | Schema changes apply without error |
| **Down migration** | Rollback works; schema returns to previous state |
| **Data integrity** | Existing data survives migration; constraints hold |
| **Idempotency** | Running migration twice doesn't fail or corrupt |

**Migration testing in CI:**
1. Start with clean DB
2. Run all migrations up
3. Seed with test data
4. Run latest migration down, then up again
5. Verify data integrity

### 9. Output

When adding or updating tests, provide:

- Short rationale (what behavior is covered).
- How to run the new/updated tests.
- Any new dependencies or config (e.g. test framework, env vars).

---

## Checklist

**⛔ MANDATORY (workflow cannot proceed without these):**
- [ ] Tests written for new/changed code
- [ ] All tests pass
- [ ] Build succeeds (frontend/compiled languages)
- [ ] **UI: E2E tests via Playwright MCP pass** (mandatory if UI exists)

**Quality checks:**
- [ ] Tests are deterministic (no flake from time/random/network).
- [ ] No tests that only assert implementation details.
- [ ] Failures give clear messages (assertions describe expected vs actual).
- [ ] Test file/names follow project layout and naming.
- [ ] Accessibility tests pass (axe-core or equivalent); keyboard navigation works.
- [ ] i18n tested: no hardcoded strings, locale formatting correct, RTL supported (if applicable).
- [ ] Database migrations tested: up, down, and data integrity verified.

**⚠️ NEVER output "Optional: Add tests" - testing is MANDATORY.**
