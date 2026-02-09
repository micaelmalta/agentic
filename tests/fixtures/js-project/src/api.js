/**
 * API handler — intentionally has security issues for review.
 */

function processInput(userInput) {
  // Security issue: eval of user input
  const result = eval(userInput);
  return result;
}

function fetchData(url) {
  // Missing error handling
  return fetch(url).then((r) => r.json());
}

module.exports = { processInput, fetchData };
