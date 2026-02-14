# UI Testing with Playwright MCP

This document provides comprehensive guidance for UI and E2E testing using Playwright MCP.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## When UI Testing is Required

**When the application has a UI, Playwright MCP is MANDATORY for E2E and UI testing.**

If your project includes:
- Web frontend (React, Vue, Angular, vanilla HTML)
- User-facing dashboards or admin panels
- Interactive forms or workflows
- Visual components

Then you MUST use Playwright MCP for end-to-end testing.

---

## Prerequisites

1. **Ensure Playwright MCP is configured via `/setup`**
   - Run `/setup` command to configure MCP servers
   - Select "Playwright" when prompted
   - Verify configuration in your IDE's MCP settings

2. **The MCP provides browser automation tools directly to the agent**
   - No need to install Playwright separately
   - Tools are available immediately after configuration
   - Works across Chrome, Firefox, WebKit, and Edge

---

## Playwright MCP Capabilities

| Tool                    | Purpose                                     | Example Usage                              |
| ----------------------- | ------------------------------------------- | ------------------------------------------ |
| `browser_navigate`      | Navigate to URLs                            | Open login page, go to dashboard           |
| `browser_click`         | Click elements                              | Click buttons, links, checkboxes           |
| `browser_type`          | Type text into inputs                       | Fill forms, enter credentials              |
| `browser_screenshot`    | Capture screenshots for visual verification | Capture results, visual regression testing |
| `browser_snapshot`      | Get accessibility tree snapshot             | Understand page structure, verify a11y     |
| `browser_wait_for`      | Wait for conditions                         | Wait for element, wait for text to appear  |
| `browser_select_option` | Select dropdown options                     | Choose from select menus                   |
| `browser_hover`         | Hover over elements                         | Trigger tooltips, dropdowns                |
| `browser_drag`          | Drag and drop                               | Reorder lists, move elements               |
| `browser_press_key`     | Press keyboard keys                         | Submit forms (Enter), navigate (Tab)       |

---

## When to Use Playwright MCP

### User Flow Testing

Test complete user journeys from start to finish:
- **Login flows:** Enter credentials, submit, verify redirect
- **Checkout flows:** Add to cart, fill shipping, payment, confirm
- **Form submissions:** Fill fields, validate, submit, check success
- **Multi-step wizards:** Progress through steps, verify state

### Visual Regression Testing

Capture screenshots to detect unintended visual changes:
- Take baseline screenshots of key pages
- Compare current state to baseline
- Flag differences for manual review
- Useful for CSS changes, responsive design

### Accessibility Tree Inspection

Use `browser_snapshot` to verify page structure:
- Check semantic HTML hierarchy
- Verify ARIA roles and labels
- Ensure keyboard navigation order
- Validate screen reader announcements

### Interactive Debugging

When bugs only appear in the browser:
- Navigate to problematic page
- Take snapshot to understand current state
- Interact with elements to reproduce issue
- Capture screenshot of error state

### Cross-browser Testing

Test across different browsers:
- Chrome (most common)
- Firefox (Gecko engine)
- WebKit (Safari engine)
- Edge (Chromium-based)

---

## Example UI Test Flow

### Basic Flow

1. **Navigate to the page**
   ```javascript
   await browser_navigate({ url: "https://example.com/login" });
   ```

2. **Understand the page structure**
   ```javascript
   const snapshot = await browser_snapshot({});
   // Review snapshot to identify elements
   ```

3. **Interact with elements**
   ```javascript
   await browser_type({
     ref: "input[name='email']",
     text: "user@example.com"
   });
   await browser_type({
     ref: "input[name='password']",
     text: "password123"
   });
   await browser_click({
     ref: "button[type='submit']"
   });
   ```

4. **Capture results**
   ```javascript
   await browser_screenshot({
     filename: "login-success.png"
   });
   ```

5. **Verify outcomes**
   ```javascript
   await browser_wait_for({
     text: "Welcome back!"
   });
   ```

### Complete E2E Test Example

**Scenario:** Test user registration flow

```javascript
describe("User Registration", () => {
  it("successfully registers a new user", async () => {
    // 1. Navigate
    await browser_navigate({ url: "https://example.com/register" });

    // 2. Fill form
    await browser_type({
      ref: "input[name='username']",
      text: "newuser"
    });
    await browser_type({
      ref: "input[name='email']",
      text: "newuser@example.com"
    });
    await browser_type({
      ref: "input[name='password']",
      text: "SecurePass123!"
    });

    // 3. Submit
    await browser_click({
      ref: "button[type='submit']"
    });

    // 4. Wait for success
    await browser_wait_for({
      text: "Account created successfully"
    });

    // 5. Verify redirect to dashboard
    const snapshot = await browser_snapshot({});
    expect(snapshot).toContain("Dashboard");

    // 6. Capture final state
    await browser_screenshot({
      filename: "registration-success.png"
    });
  });
});
```

---

## Best Practices

### Use Semantic Selectors

**Prefer:**
- `button[aria-label='Submit']` (accessible)
- `input[name='email']` (semantic)
- `[data-testid='login-form']` (test-specific)

**Avoid:**
- `.btn-primary` (brittle, couples to CSS)
- `div > div > button:nth-child(2)` (fragile, breaks easily)

### Wait for Dynamic Content

Always wait for elements to be ready:

```javascript
// Good: Wait for specific content
await browser_wait_for({ text: "Data loaded" });

// Bad: Arbitrary sleep
await new Promise(resolve => setTimeout(resolve, 5000));
```

### Take Screenshots at Key Points

Capture visual evidence for debugging:

```javascript
await browser_screenshot({ filename: "before-submit.png" });
await browser_click({ ref: "button[type='submit']" });
await browser_screenshot({ filename: "after-submit.png" });
```

### Use browser_snapshot for Debugging

When tests fail, snapshot the page state:

```javascript
try {
  await browser_click({ ref: "button#missing" });
} catch (error) {
  const snapshot = await browser_snapshot({});
  console.log("Page state:", snapshot);
  throw error;
}
```

### Test Error States

Don't only test happy paths:

```javascript
it("shows error for invalid email", async () => {
  await browser_type({
    ref: "input[name='email']",
    text: "invalid-email"
  });
  await browser_click({ ref: "button[type='submit']" });
  await browser_wait_for({
    text: "Please enter a valid email"
  });
});
```

---

## Configuration

### If Playwright MCP is Not Available

**STOP and run `/setup` before proceeding with any UI testing.**

1. Run `/setup` command
2. Select "Playwright" from MCP servers list
3. Provide API keys if required
4. Verify configuration in MCP settings
5. Restart IDE if necessary

### Troubleshooting

**MCP tools not available:**
- Check IDE MCP configuration file
- Restart IDE after configuration changes
- Verify MCP server is running

**Browser not launching:**
- Run `mcp__playwright__browser_install` if browser needs installation
- Check for port conflicts (default: 9222)
- Verify system permissions

**Elements not found:**
- Use `browser_snapshot` to inspect page structure
- Check if element is inside iframe
- Wait for dynamic content to load

---

## Integration with Testing Frameworks

### Jest + Playwright MCP

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.js"]
};

// test file
describe("Login", () => {
  beforeAll(async () => {
    await browser_navigate({ url: process.env.APP_URL });
  });

  it("logs in successfully", async () => {
    // Test implementation
  });
});
```

### Pytest + Playwright MCP

```python
import pytest

@pytest.fixture
def browser():
    # Setup browser via MCP
    yield
    # Teardown

def test_login(browser):
    # Test implementation
```

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to set up Playwright MCP | **setup** skill | Run `/setup`, select Playwright |
| Writing E2E tests for new feature | **developer** skill | Follow TDD with E2E tests first |
| CI pipeline needs E2E tests | **ci-cd** skill | Add E2E test step to workflow |
| E2E tests failing in CI | **debugging** skill | Investigate environment differences |
