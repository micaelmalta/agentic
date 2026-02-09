/**
 * Calculator with a known off-by-one bug in discount().
 */

function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

/**
 * Apply a percentage discount to a price.
 * BUG: Uses > 100 instead of >= 100, so discount(100, 100) returns 100
 * instead of 0.
 */
function discount(price, pct) {
  if (pct < 0 || pct > 100) {
    throw new RangeError("Percentage must be between 0 and 100");
  }
  return price * (1 - pct / 100);
}

module.exports = { add, multiply, discount };
