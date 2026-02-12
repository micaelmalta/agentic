# Developer Examples: Language-Specific Patterns

This document contains language-specific test commands and patterns. For TDD cycle details, see [TDD_CYCLE.md](TDD_CYCLE.md).

## Contents

- [Language-Specific Test Commands](#language-specific-test-commands)
- [Test Structure Patterns](#test-structure-patterns)
- [Example Workflows](#example-workflows)

---

## Language-Specific Test Commands

| Stack | Test Command | Watch Mode |
|-------|--------------|------------|
| **JavaScript/TypeScript** | `npm test` | `npm test -- --watch` |
| **Python** | `pytest` | `pytest --watch` or `ptw` |
| **Go** | `go test ./...` | `gotestsum --watch` |
| **Ruby** | `bundle exec rspec` | `guard` |
| **Rust** | `cargo test` | `cargo watch -x test` |
| **Java** | `mvn test` | IDE integration |

---

## Test Structure Patterns

### JavaScript/TypeScript (Jest, Vitest)

```javascript
import { describe, test, expect } from '@jest/globals';
import { calculateDiscount } from '../src/discount.js';

describe('calculateDiscount', () => {
  test('applies 10% discount for orders over $100', () => {
    // Arrange
    const order = { total: 150 };

    // Act
    const result = calculateDiscount(order);

    // Assert
    expect(result).toBe(15); // 10% of 150
  });

  test('returns 0 for orders under $100', () => {
    const order = { total: 50 };
    const result = calculateDiscount(order);
    expect(result).toBe(0);
  });
});
```

### Python (pytest)

```python
import pytest
from src.discount import calculate_discount

class TestCalculateDiscount:
    def test_applies_discount_for_large_orders(self):
        # Arrange
        order = {"total": 150}

        # Act
        result = calculate_discount(order)

        # Assert
        assert result == 15  # 10% of 150

    def test_returns_zero_for_small_orders(self):
        order = {"total": 50}
        result = calculate_discount(order)
        assert result == 0
```

### Go (testing package)

```go
package discount_test

import (
    "testing"
    "myapp/discount"
)

func TestCalculateDiscount(t *testing.T) {
    t.Run("applies discount for large orders", func(t *testing.T) {
        // Arrange
        order := discount.Order{Total: 150}

        // Act
        result := discount.Calculate(order)

        // Assert
        if result != 15 { // 10% of 150
            t.Errorf("expected 15, got %d", result)
        }
    })

    t.Run("returns zero for small orders", func(t *testing.T) {
        order := discount.Order{Total: 50}
        result := discount.Calculate(order)

        if result != 0 {
            t.Errorf("expected 0, got %d", result)
        }
    })
}
```

### Rust (built-in test framework)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_discount_for_large_orders() {
        // Arrange
        let order = Order { total: 150.0 };

        // Act
        let result = calculate_discount(&order);

        // Assert
        assert_eq!(result, 15.0); // 10% of 150
    }

    #[test]
    fn returns_zero_for_small_orders() {
        let order = Order { total: 50.0 };
        let result = calculate_discount(&order);
        assert_eq!(result, 0.0);
    }
}
```

### Ruby (RSpec)

```ruby
require 'rspec'
require_relative '../lib/discount'

RSpec.describe Discount do
  describe '.calculate' do
    it 'applies 10% discount for orders over $100' do
      # Arrange
      order = { total: 150 }

      # Act
      result = Discount.calculate(order)

      # Assert
      expect(result).to eq(15) # 10% of 150
    end

    it 'returns 0 for orders under $100' do
      order = { total: 50 }
      result = Discount.calculate(order)
      expect(result).to eq(0)
    end
  end
end
```

### Java (JUnit 5)

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DiscountCalculatorTest {

    @Test
    void appliesDiscountForLargeOrders() {
        // Arrange
        Order order = new Order(150.0);
        DiscountCalculator calc = new DiscountCalculator();

        // Act
        double result = calc.calculate(order);

        // Assert
        assertEquals(15.0, result, 0.01); // 10% of 150
    }

    @Test
    void returnsZeroForSmallOrders() {
        Order order = new Order(50.0);
        DiscountCalculator calc = new DiscountCalculator();

        double result = calc.calculate(order);

        assertEquals(0.0, result, 0.01);
    }
}
```

---

## Example Workflows

### Workflow 1: Feature Implementation (JavaScript)

**RED Phase:**
```javascript
// tests/auth.test.js
import { login } from '../src/auth.js';

test('returns success for valid credentials', () => {
  const result = login('user@example.com', 'password123');
  expect(result).toEqual({ success: true, token: expect.any(String) });
});
```

Run test: `npm test` → FAILS (function doesn't exist)

**GREEN Phase:**
```javascript
// src/auth.js
export function login(email, password) {
  if (email === 'user@example.com' && password === 'password123') {
    return { success: true, token: 'mock-token-123' };
  }
  return { success: false, error: 'Invalid credentials' };
}
```

Run test: `npm test` → PASSES

**REFACTOR Phase:**
```javascript
// src/auth.js
import { generateToken } from './tokenService.js';
import { validateCredentials } from './validator.js';

export function login(email, password) {
  if (validateCredentials(email, password)) {
    return { success: true, token: generateToken(email) };
  }
  return { success: false, error: 'Invalid credentials' };
}
```

Run test: `npm test` → PASSES

---

### Workflow 2: Bug Fix (Python)

Bug: Function returns wrong discount amount

**RED Phase:**
```python
# tests/test_discount.py
def test_calculates_correct_discount_amount():
    order = {"subtotal": 100, "discount_rate": 0.15}
    result = apply_discount(order)
    assert result == 85  # 100 - 15% = 85
```

Run test: `pytest` → FAILS (returns 100, no discount applied)

**GREEN Phase:**
```python
# src/discount.py
def apply_discount(order):
    discount = order["subtotal"] * order["discount_rate"]
    return order["subtotal"] - discount
```

Run test: `pytest` → PASSES

**REFACTOR Phase:**
```python
# src/discount.py
def apply_discount(order):
    subtotal = order["subtotal"]
    rate = order["discount_rate"]
    return subtotal * (1 - rate)
```

Run test: `pytest` → PASSES

---

### Workflow 3: Refactoring (Go)

Before: Large function needs extraction

```go
// user.go (before)
func ProcessUser(user *User) error {
    if user.Email == "" || !strings.Contains(user.Email, "@") {
        return errors.New("invalid email")
    }
    if len(user.Password) < 8 {
        return errors.New("password too short")
    }
    user.ID = uuid.New().String()
    user.CreatedAt = time.Now()
    return db.Save(user)
}
```

Ensure tests exist:
```go
// user_test.go
func TestProcessUser(t *testing.T) {
    user := &User{Email: "test@example.com", Password: "password123"}
    err := ProcessUser(user)
    if err != nil {
        t.Fatal(err)
    }
    if user.ID == "" {
        t.Error("expected ID to be set")
    }
}
```

Run tests: `go test` → PASSES (baseline)

Refactor:
```go
// user.go (after)
func ProcessUser(user *User) error {
    if err := ValidateUser(user); err != nil {
        return err
    }
    SetUserDefaults(user)
    return db.Save(user)
}

func ValidateUser(user *User) error {
    if err := ValidateEmail(user.Email); err != nil {
        return err
    }
    return ValidatePassword(user.Password)
}

func SetUserDefaults(user *User) {
    user.ID = uuid.New().String()
    user.CreatedAt = time.Now()
}
```

Run tests: `go test` → PASSES (behavior unchanged)

---

### Workflow 4: Test-Driven Bug Fix (Rust)

Bug: Parser doesn't handle empty input

**RED Phase:**
```rust
#[test]
fn handles_empty_input() {
    let input = "";
    let result = parse_config(input);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), Config::default());
}
```

Run test: `cargo test` → FAILS (panics on empty input)

**GREEN Phase:**
```rust
pub fn parse_config(input: &str) -> Result<Config, ParseError> {
    if input.is_empty() {
        return Ok(Config::default());
    }
    // ... existing parsing logic
}
```

Run test: `cargo test` → PASSES

**REFACTOR Phase:**
```rust
pub fn parse_config(input: &str) -> Result<Config, ParseError> {
    match input.trim() {
        "" => Ok(Config::default()),
        trimmed => parse_non_empty(trimmed),
    }
}

fn parse_non_empty(input: &str) -> Result<Config, ParseError> {
    // ... parsing logic extracted
}
```

Run test: `cargo test` → PASSES

---

## Quick Reference by Language

### JavaScript/TypeScript
- **Framework:** Jest, Vitest, Mocha
- **Run tests:** `npm test`
- **Watch mode:** `npm test -- --watch`
- **Pattern:** describe/test/expect

### Python
- **Framework:** pytest, unittest
- **Run tests:** `pytest`
- **Watch mode:** `ptw` (pytest-watch)
- **Pattern:** class/method/assert

### Go
- **Framework:** testing (built-in)
- **Run tests:** `go test ./...`
- **Watch mode:** `gotestsum --watch`
- **Pattern:** TestXxx functions, subtests with t.Run

### Rust
- **Framework:** built-in test framework
- **Run tests:** `cargo test`
- **Watch mode:** `cargo watch -x test`
- **Pattern:** #[test] attribute, assert! macros

### Ruby
- **Framework:** RSpec, Minitest
- **Run tests:** `bundle exec rspec`
- **Watch mode:** `guard`
- **Pattern:** describe/it/expect

### Java
- **Framework:** JUnit 5, TestNG
- **Run tests:** `mvn test`
- **Watch mode:** IDE integration
- **Pattern:** @Test annotations, assertions

---

## See Also

- [SKILL.md](SKILL.md) - TDD overview
- [TDD_CYCLE.md](TDD_CYCLE.md) - Detailed cycle
- [TOOLS.md](TOOLS.md) - Tool usage guidelines
