# Internationalization (i18n) Testing

This document provides comprehensive guidance for testing application internationalization to ensure it works correctly across languages and locales.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Why i18n Testing Matters

Internationalization testing ensures your application works correctly for users across the world:
- Different languages (English, Spanish, Chinese, Arabic, etc.)
- Different writing systems (Latin, Cyrillic, Arabic, CJK, etc.)
- Different text directions (LTR, RTL)
- Different locale conventions (dates, numbers, currencies)
- Different cultural expectations

**Business impact:** Poor i18n can block market expansion, alienate users, and cause data corruption.

---

## Types of i18n Testing

| Test Type                | What to Check                                                      |
| ------------------------ | ------------------------------------------------------------------ |
| **Translation coverage** | All user-facing strings have translations; no hardcoded text       |
| **Locale formatting**    | Dates, numbers, currencies format correctly per locale             |
| **RTL support**          | Layout works for right-to-left languages (Arabic, Hebrew)          |
| **Text expansion**       | UI doesn't break when translations are longer (German ~30% longer) |
| **Pluralization**        | Correct plural forms for each language                             |
| **Character encoding**   | Unicode renders correctly; no mojibake                             |

---

## Translation Coverage Testing

### Detecting Hardcoded Strings

Use pseudo-localization to find hardcoded strings:

```javascript
// Test with pseudo-localization (catches hardcoded strings)
i18n.locale = "pseudo"; // Renders "[Ḩḗŀŀǿ Ẇǿřŀḓ!]"

// Any text NOT wrapped in brackets is hardcoded
render(<App />);
expect(screen.queryByText(/^[^[\]]+$/)).not.toBeInTheDocument();
```

**Pseudo-localization transforms:**
- Wraps text in brackets: `Hello` → `[Ḩḗŀŀǿ]`
- Adds diacritics: `Hello` → `[Ḩḗŀŀǿ]`
- Expands text ~30%: `Hello` → `[Ḩḗŀŀǿ Ẇǿřŀḓ!]`

**Benefits:**
- Visually identifies hardcoded text
- Tests text expansion tolerance
- Catches missing translation keys

### Example: Jest + i18next

```javascript
import i18n from "i18next";

it("has no hardcoded strings", () => {
  i18n.changeLanguage("pseudo");
  const { container } = render(<App />);

  // All text should be wrapped in brackets
  const text = container.textContent;
  const unbracketedText = text.match(/[^[\]]{4,}/g);

  expect(unbracketedText).toBeNull(); // No hardcoded strings
});
```

### Translation Key Coverage

Check that all keys have translations:

```javascript
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

it("has complete Spanish translations", () => {
  const enKeys = Object.keys(enTranslations);
  const esKeys = Object.keys(esTranslations);

  const missingKeys = enKeys.filter(key => !esKeys.includes(key));
  expect(missingKeys).toEqual([]); // All keys translated
});
```

---

## Locale Formatting Testing

### Date Formatting

```javascript
import { format } from "date-fns";
import { enUS, es, de, ar } from "date-fns/locale";

it("formats dates correctly per locale", () => {
  const date = new Date(2025, 0, 15); // Jan 15, 2025

  expect(format(date, "PP", { locale: enUS })).toBe("Jan 15, 2025");
  expect(format(date, "PP", { locale: es })).toBe("15 ene 2025");
  expect(format(date, "PP", { locale: de })).toBe("15. Jan. 2025");
  expect(format(date, "PP", { locale: ar })).toBe("١٥ يناير ٢٠٢٥");
});
```

### Number Formatting

```javascript
it("formats numbers correctly per locale", () => {
  const number = 1234567.89;

  expect(number.toLocaleString("en-US")).toBe("1,234,567.89");
  expect(number.toLocaleString("de-DE")).toBe("1.234.567,89");
  expect(number.toLocaleString("fr-FR")).toBe("1 234 567,89");
  expect(number.toLocaleString("ar-EG")).toBe("١٬٢٣٤٬٥٦٧٫٨٩");
});
```

### Currency Formatting

```javascript
it("formats currency correctly per locale", () => {
  const amount = 1234.56;

  expect(
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
  ).toBe("$1,234.56");

  expect(
    amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
  ).toBe("1.234,56 €");

  expect(
    amount.toLocaleString("ja-JP", { style: "currency", currency: "JPY" })
  ).toBe("¥1,235"); // No decimal for yen
});
```

---

## RTL (Right-to-Left) Support Testing

### Detecting RTL Layout

```javascript
it("applies RTL direction for Arabic", () => {
  i18n.changeLanguage("ar");
  render(<App />);

  expect(document.dir).toBe("rtl");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
});
```

### Testing RTL Layout

```javascript
it("reverses flex direction in RTL", () => {
  i18n.changeLanguage("ar");
  render(<NavigationBar />);

  const nav = screen.getByRole("navigation");
  const styles = window.getComputedStyle(nav);

  expect(styles.direction).toBe("rtl");
  // Flexbox should reverse automatically
  expect(styles.flexDirection).toBe("row-reverse");
});
```

### RTL Visual Testing

Use Playwright/Cypress to capture screenshots:

```javascript
test("RTL layout matches design", async ({ page }) => {
  await page.goto("/?locale=ar");

  // Capture RTL layout
  await page.screenshot({ path: "rtl-layout.png" });

  // Compare to baseline (manual review or visual regression)
});
```

### Common RTL Issues

❌ **Bad: Hardcoded text direction**

```css
.container {
  text-align: left; /* Breaks in RTL */
  margin-left: 20px; /* Flips incorrectly */
}
```

✅ **Good: Logical properties**

```css
.container {
  text-align: start; /* Auto-adjusts for RTL */
  margin-inline-start: 20px; /* Correct in both LTR and RTL */
}
```

---

## Text Expansion Testing

### Test with Longest Translations

German translations are typically ~30% longer than English:

```javascript
it("handles long German translations", () => {
  i18n.changeLanguage("de");
  render(<Button />);

  const button = screen.getByRole("button");

  // Button should not overflow or clip text
  expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
});
```

### Responsive Text

```javascript
it("truncates long text gracefully", () => {
  i18n.changeLanguage("de");
  render(<ProductCard title="Unglaublich langer Produktname" />);

  const title = screen.getByText(/Unglaublich/);

  // Check for ellipsis or responsive wrapping
  const styles = window.getComputedStyle(title);
  expect(styles.textOverflow).toBe("ellipsis");
  expect(styles.overflow).toBe("hidden");
});
```

### UI Breakage Detection

```javascript
it("does not break layout with long translations", async () => {
  const locales = ["en", "de", "fr", "es", "pt"];

  for (const locale of locales) {
    i18n.changeLanguage(locale);
    const { container } = render(<DashboardLayout />);

    // Check for horizontal scroll (layout overflow)
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);

    // Check for overlapping elements
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button, i) => {
      if (i > 0) {
        const prevButton = buttons[i - 1];
        const prevRect = prevButton.getBoundingClientRect();
        const currRect = button.getBoundingClientRect();

        // Buttons should not overlap
        expect(currRect.top).toBeGreaterThanOrEqual(prevRect.bottom);
      }
    });
  }
});
```

---

## Pluralization Testing

Different languages have different plural rules:

| Language | Plural Forms          | Example                                      |
| -------- | --------------------- | -------------------------------------------- |
| English  | 2 (one, other)        | 1 item, 2 items                              |
| Polish   | 3 (one, few, many)    | 1 przedmiot, 2 przedmioty, 5 przedmiotów     |
| Arabic   | 6 (zero, one, two...) | 0 عناصر, 1 عنصر, 2 عنصران, 3 عناصر, 11 عنصر |

### Example: Testing Pluralization

```javascript
import { t } from "i18next";

it("pluralizes correctly in English", () => {
  i18n.changeLanguage("en");

  expect(t("items", { count: 0 })).toBe("0 items");
  expect(t("items", { count: 1 })).toBe("1 item");
  expect(t("items", { count: 2 })).toBe("2 items");
});

it("pluralizes correctly in Polish", () => {
  i18n.changeLanguage("pl");

  expect(t("items", { count: 1 })).toBe("1 przedmiot"); // one
  expect(t("items", { count: 2 })).toBe("2 przedmioty"); // few
  expect(t("items", { count: 5 })).toBe("5 przedmiotów"); // many
});

it("pluralizes correctly in Arabic", () => {
  i18n.changeLanguage("ar");

  expect(t("items", { count: 0 })).toBe("0 عناصر"); // zero
  expect(t("items", { count: 1 })).toBe("1 عنصر"); // one
  expect(t("items", { count: 2 })).toBe("2 عنصران"); // two
  expect(t("items", { count: 3 })).toBe("3 عناصر"); // few
  expect(t("items", { count: 11 })).toBe("11 عنصر"); // many
});
```

---

## Character Encoding Testing

### Testing Unicode Support

```javascript
it("renders Unicode characters correctly", () => {
  const testStrings = [
    "Hello World", // English
    "Héllo Wörld", // Diacritics
    "Привет мир", // Cyrillic
    "你好世界", // Chinese
    "مرحبا بالعالم", // Arabic
    "שלום עולם", // Hebrew
    "🌍🌎🌏", // Emoji
  ];

  testStrings.forEach(str => {
    render(<Text>{str}</Text>);
    expect(screen.getByText(str)).toBeInTheDocument();
  });
});
```

### Detecting Mojibake

Mojibake occurs when text is decoded with the wrong character encoding:

```javascript
it("does not produce mojibake", async () => {
  const response = await fetch("/api/data");
  const text = await response.text();

  // Check for common mojibake patterns
  const mojibakePatterns = [
    /\uFFFD/, // Replacement character
    /Ã©/, // é decoded as Latin-1 instead of UTF-8
    /ãƒ/, // Japanese hiragana decoded incorrectly
  ];

  mojibakePatterns.forEach(pattern => {
    expect(text).not.toMatch(pattern);
  });
});
```

---

## i18n Testing Tools

### Libraries

- **i18next:** Industry-standard i18n framework (React, Vue, Angular, vanilla JS)
- **FormatJS:** Comprehensive i18n (React Intl, Format.js)
- **Globalize:** CLDR-based i18n (numbers, dates, currencies)
- **Polyglot.js:** Lightweight i18n library

### Pseudo-localization

- **pseudolocalization:** npm package for generating pseudo-locales
- **i18next-pseudo:** i18next plugin for pseudo-localization
- **React Intl Pseudo:** Built-in pseudo-locale support

### Translation Management

- **Crowdin:** Collaborative translation platform
- **Lokalise:** Translation management system
- **Phrase:** Localization platform
- **POEditor:** Translation management tool

---

## i18n Testing Checklist

- [ ] All user-facing strings use translation keys (no hardcoded text)
- [ ] Pseudo-localization reveals no hardcoded strings
- [ ] All locales have complete translation coverage
- [ ] Dates, numbers, currencies format correctly per locale
- [ ] RTL layout works for Arabic, Hebrew
- [ ] UI handles text expansion (German, Finnish)
- [ ] Pluralization works correctly for all supported languages
- [ ] Unicode characters render correctly (no mojibake)
- [ ] Forms accept international characters (names, addresses)
- [ ] Character encoding is UTF-8 throughout stack

---

## Integration with CI/CD

### Add i18n Tests to CI

```yaml
# .github/workflows/ci.yml
- name: Run i18n tests
  run: npm run test:i18n

- name: Check translation coverage
  run: npm run i18n:check
```

### Translation Coverage Script

```javascript
// scripts/check-i18n-coverage.js
const enKeys = Object.keys(require("./locales/en.json"));
const locales = ["es", "de", "fr", "ja"];

locales.forEach(locale => {
  const translations = require(`./locales/${locale}.json`);
  const localeKeys = Object.keys(translations);
  const missing = enKeys.filter(key => !localeKeys.includes(key));

  if (missing.length > 0) {
    console.error(`Missing ${locale} translations: ${missing.join(", ")}`);
    process.exit(1);
  }
});
```

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to test i18n | **testing** skill (this skill) | Follow i18n testing protocol above |
| Need to implement i18n | **developer** skill | Use i18next, FormatJS, or similar |
| Need to add i18n to CI pipeline | **ci-cd** skill | Add pseudo-localization and coverage checks |
| Need to document i18n support | **documentation** skill | Document supported locales, translation process |
