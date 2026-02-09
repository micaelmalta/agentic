/**
 * Performance fixture with intentional O(n^2) bottleneck.
 */

/**
 * Find duplicate values in an array.
 * PERFORMANCE ISSUE: O(n^2) nested loop instead of using a Set.
 */
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

/**
 * Sort and deduplicate — also O(n^2) due to includes check.
 */
function uniqueSorted(arr) {
  const result = [];
  const sorted = arr.slice().sort();
  for (let i = 0; i < sorted.length; i++) {
    if (!result.includes(sorted[i])) {
      result.push(sorted[i]);
    }
  }
  return result;
}

module.exports = { findDuplicates, uniqueSorted };
