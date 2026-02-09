/**
 * String utilities — intentionally uses poor naming for code review to flag.
 */

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sl(s) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

module.exports = { cap, sl };
