const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { cap, sl } = require("../src/utils");

describe("cap", () => {
  it("capitalizes the first letter", () => {
    assert.strictEqual(cap("hello"), "Hello");
  });

  it("handles empty string", () => {
    assert.strictEqual(cap(""), "");
  });
});

describe("sl", () => {
  it("slugifies a string", () => {
    assert.strictEqual(sl("Hello World"), "hello-world");
  });

  it("removes special characters", () => {
    assert.strictEqual(sl("Hello! World?"), "hello-world");
  });
});
