const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { add, multiply, discount } = require("../src/calculator");

describe("add", () => {
  it("adds two numbers", () => {
    assert.strictEqual(add(2, 3), 5);
  });
});

describe("multiply", () => {
  it("multiplies two numbers", () => {
    assert.strictEqual(multiply(3, 4), 12);
  });
});

describe("discount", () => {
  it("applies 10% discount", () => {
    assert.strictEqual(discount(100, 10), 90);
  });

  it("applies 50% discount", () => {
    assert.strictEqual(discount(200, 50), 100);
  });

  it("applies 0% discount (no change)", () => {
    assert.strictEqual(discount(100, 0), 100);
  });

  // This test exposes the off-by-one bug
  it("applies 100% discount (free)", () => {
    assert.strictEqual(discount(100, 100), 0);
  });

  it("rejects negative percentage", () => {
    assert.throws(() => discount(100, -1), { name: "RangeError" });
  });
});
