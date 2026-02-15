# Accessibility (a11y) Testing

This document provides comprehensive guidance for testing application accessibility to ensure usability by people with disabilities.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Why Accessibility Testing Matters

Accessibility ensures your application is usable by everyone, including people with:
- Visual impairments (blind, low vision, color blind)
- Motor disabilities (limited dexterity, cannot use mouse)
- Auditory disabilities (deaf, hard of hearing)
- Cognitive disabilities (dyslexia, ADHD, autism)

**Legal requirement:** Many jurisdictions require WCAG 2.1 Level AA compliance for public-facing websites.

---

## Types of Accessibility Testing

| Test Type         | Tools                        | What to Check                                                      |
| ----------------- | ---------------------------- | ------------------------------------------------------------------ |
| **Automated**     | axe-core, pa11y, Lighthouse  | Color contrast, alt text, ARIA labels, heading hierarchy           |
| **Keyboard**      | Manual or Cypress/Playwright | Tab order, focus visible, no keyboard traps, skip links            |
| **Screen reader** | VoiceOver, NVDA, JAWS        | Announcements make sense, forms labeled, dynamic content announced |

---

## Automated a11y Testing

### Tools

- **axe-core:** Industry-standard accessibility testing library
- **pa11y:** Command-line accessibility testing
- **Lighthouse:** Chrome DevTools auditing (includes accessibility)
- **jest-axe:** axe-core integration for Jest
- **cypress-axe:** axe-core integration for Cypress

### Example: Jest + axe-core

```javascript
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no accessibility violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Example: Cypress + axe-core

```javascript
describe("Homepage a11y", () => {
  it("has no accessibility violations", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

### Example: Playwright + axe-core

```javascript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("should not have any automatically detectable accessibility issues", async ({ page }) => {
  await page.goto("https://example.com");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### What Automated Tests Catch

✅ **Can detect:**
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Incorrect heading hierarchy (h1 → h3 skips h2)
- Missing ARIA roles
- Invalid HTML

❌ **Cannot detect:**
- Whether alt text is meaningful (vs. just present)
- Logical tab order (automated checks only if focus is visible)
- Screen reader UX quality
- Keyboard trap avoidance
- Content comprehensibility

**Automated tests catch ~30-40% of accessibility issues.** Manual testing is essential.

---

## Keyboard Testing

Test that all interactive elements are keyboard accessible.

### Test Checklist

- [ ] **Tab order is logical:** Tab moves through interactive elements in reading order
- [ ] **Focus is visible:** Currently focused element has clear visual indicator
- [ ] **No keyboard traps:** Can escape from every UI component using keyboard only
- [ ] **Skip links work:** "Skip to main content" link allows bypassing navigation
- [ ] **All actions accessible:** Everything clickable can be activated via keyboard
- [ ] **Escape closes modals:** Esc key dismisses overlays and modals
- [ ] **Arrow keys work:** Navigate within components (dropdown, tab panel, menu)

### Example Test

```javascript
it("supports keyboard navigation", () => {
  render(<FormComponent />);

  // Tab to first input
  userEvent.tab();
  expect(screen.getByLabelText("Email")).toHaveFocus();

  // Tab to second input
  userEvent.tab();
  expect(screen.getByLabelText("Password")).toHaveFocus();

  // Tab to submit button
  userEvent.tab();
  expect(screen.getByRole("button", { name: "Submit" })).toHaveFocus();

  // Press Enter to submit
  userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalled();
});
```

### Manual Keyboard Testing

1. Unplug mouse or disable trackpad
2. Navigate entire application using only keyboard:
   - Tab / Shift+Tab: Move focus forward/backward
   - Enter / Space: Activate buttons
   - Arrow keys: Navigate within components
   - Esc: Close modals/menus
3. Verify all functionality is accessible
4. Check for keyboard traps (cannot escape a component)

---

## Screen Reader Testing

Test with real screen readers to ensure announcements make sense.

### Screen Readers by Platform

| Platform | Screen Reader | Keyboard Shortcut         |
| -------- | ------------- | ------------------------- |
| macOS    | VoiceOver     | Cmd+F5                    |
| Windows  | NVDA          | Free download             |
| Windows  | JAWS          | Commercial (most popular) |
| iOS      | VoiceOver     | Settings → Accessibility  |
| Android  | TalkBack      | Settings → Accessibility  |

### What to Test

- [ ] **Landmarks are announced:** `<header>`, `<main>`, `<nav>`, `<footer>` are identified
- [ ] **Form fields have labels:** Each input announces its purpose
- [ ] **Buttons describe actions:** "Submit", not "Click here"
- [ ] **Links describe destinations:** "View profile", not "Click here"
- [ ] **Images have alt text:** Decorative images have `alt=""`, meaningful images have descriptive alt
- [ ] **Dynamic content is announced:** Loading states, error messages, success notifications
- [ ] **Tables have headers:** `<th>` elements identify columns/rows

### Example: Testing with VoiceOver (macOS)

1. Press `Cmd+F5` to start VoiceOver
2. Navigate with `Ctrl+Option+Right Arrow`
3. Listen to each announcement
4. Verify announcements are clear and useful
5. Test forms by filling fields
6. Test dynamic content (show/hide, loading states)

### ARIA Best Practices

```html
<!-- Good: Semantic HTML (no ARIA needed) -->
<button>Submit</button>

<!-- Good: ARIA for custom widgets -->
<div role="button" tabindex="0" aria-label="Close dialog">×</div>

<!-- Bad: Redundant ARIA -->
<button role="button">Submit</button>

<!-- Bad: ARIA on non-interactive element without tabindex -->
<div role="button" aria-label="Click me">Button</div>

<!-- Good: Hidden decorative content -->
<div aria-hidden="true">🎉</div>

<!-- Good: Live region for dynamic content -->
<div role="status" aria-live="polite">
  Message sent successfully!
</div>
```

---

## WCAG 2.1 Key Criteria

Test against Web Content Accessibility Guidelines (WCAG) 2.1 Level AA:

### 1. Perceivable

**Users must be able to perceive the information.**

- **Alt text:** All images have descriptive alt text (or `alt=""` for decorative)
- **Captions:** Videos have captions
- **Color contrast:** Text has 4.5:1 contrast (3:1 for large text)
- **Resizable text:** Text can be resized to 200% without loss of functionality

### 2. Operable

**Users must be able to operate the interface.**

- **Keyboard accessible:** All functionality available via keyboard
- **No keyboard traps:** Users can navigate away from any component
- **Enough time:** Users can pause, stop, or extend time limits
- **No seizure triggers:** No flashing content more than 3 times per second
- **Navigable:** Multiple ways to navigate (menu, search, sitemap)
- **Focus visible:** Keyboard focus indicator is visible

### 3. Understandable

**Users must be able to understand the information and UI.**

- **Readable:** Language is clear; reading level appropriate
- **Predictable:** Navigation and interactions behave consistently
- **Input assistance:** Forms have labels, instructions, and error messages
- **Error identification:** Errors are clearly identified and described

### 4. Robust

**Content must be robust enough for assistive technologies.**

- **Valid HTML:** Markup is well-formed
- **Name, role, value:** Custom widgets have correct ARIA attributes
- **Compatible:** Works with current and future assistive technologies

---

## Common Accessibility Issues and Fixes

### Issue: Missing alt text

```html
<!-- Bad -->
<img src="logo.png" />

<!-- Good -->
<img src="logo.png" alt="Company Logo" />

<!-- Good: Decorative image -->
<img src="divider.png" alt="" />
```

### Issue: Low color contrast

```css
/* Bad: Light gray on white (2:1 contrast) */
color: #ccc;
background: #fff;

/* Good: Dark gray on white (4.5:1 contrast) */
color: #595959;
background: #fff;
```

### Issue: Missing form labels

```html
<!-- Bad -->
<input type="email" placeholder="Email" />

<!-- Good -->
<label for="email">Email</label>
<input type="email" id="email" />

<!-- Good: Visually hidden label -->
<label for="search" class="sr-only">Search</label>
<input type="search" id="search" placeholder="Search..." />
```

### Issue: Button without accessible name

```html
<!-- Bad -->
<button><img src="close.svg" /></button>

<!-- Good -->
<button aria-label="Close dialog">
  <img src="close.svg" alt="" />
</button>
```

### Issue: Custom widget without ARIA

```html
<!-- Bad: div that acts like a button -->
<div onclick="handleClick()">Click me</div>

<!-- Good: proper button markup -->
<button onclick="handleClick()">Click me</button>

<!-- Acceptable if div is necessary -->
<div role="button" tabindex="0" aria-label="Click me"
     onclick="handleClick()" onkeypress="handleKeypress(event)">
  Click me
</div>
```

---

## Tools and Resources

### Testing Tools

- **axe DevTools:** Browser extension for manual a11y testing
- **WAVE:** Web accessibility evaluation tool
- **Lighthouse:** Built into Chrome DevTools
- **Accessibility Insights:** Microsoft's a11y testing extension
- **Color Contrast Analyzer:** Check color combinations

### Screen Readers

- **VoiceOver:** Built into macOS and iOS
- **NVDA:** Free, open-source (Windows)
- **JAWS:** Commercial, most popular (Windows)
- **TalkBack:** Built into Android

### Learning Resources

- **WebAIM:** Tutorials and guides
- **A11y Project:** Accessibility checklist
- **Deque University:** Comprehensive a11y training
- **MDN Accessibility Guide:** Technical reference

---

## Integration with CI/CD

### Add Automated a11y Tests to CI

```yaml
# .github/workflows/ci.yml
- name: Run accessibility tests
  run: npm run test:a11y

# pa11y CLI example
- name: Run pa11y
  run: npx pa11y-ci
```

### Fail Build on Violations

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ["./jest.setup.js"]
};

// jest.setup.js
import { toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

// Test will fail if violations found
expect(results).toHaveNoViolations();
```

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to test UI accessibility | **testing** skill (this skill) | Follow a11y testing protocol above |
| Need to implement accessible components | **developer** skill | Use semantic HTML, ARIA patterns |
| Need to add a11y to CI pipeline | **ci-cd** skill | Add axe-core or pa11y to workflow |
| Need to document accessibility features | **documentation** skill | Document keyboard shortcuts, screen reader support |
