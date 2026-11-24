const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeCode } = require("../services/analyzer");

test("local JavaScript analysis detects common code-quality patterns", () => {
  const code = "function check(value) {\n  var result = value == 1;\n  console.log(result);\n  return result;\n}";
  const result = analyzeCode(code, "JavaScript");
  const titles = result.issues.map(issue => issue.title);

  assert.equal(result.source, "local");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(titles.includes("Prefer let/const"));
  assert.ok(titles.includes("Loose equality"));
  assert.ok(titles.includes("Debug statement"));
  assert.ok(result.issues.every(issue => issue.line >= 1));
});

test("local JSON analysis reports invalid JSON", () => {
  const result = analyzeCode('{ "name": }', "JSON");
  assert.ok(result.issues.some(issue => issue.title === "Invalid JSON" && issue.severity === "high"));
  assert.equal(result.source, "local");
});

test("local analysis returns actionable suggestions when no known pattern is found", () => {
  const result = analyzeCode("const answer = 42;", "JavaScript");
  assert.equal(result.issues.length, 0);
  assert.ok(result.suggestions.length > 0);
  assert.equal(result.score, 100);
});


test("SQL analysis checks each destructive statement separately", () => {
  const code = "UPDATE users SET active = 0;\nDELETE FROM sessions WHERE expired = 1;";
  const result = analyzeCode(code, "SQL");
  const finding = result.issues.find(issue => issue.title === "Missing WHERE clause");
  assert.ok(finding);
  assert.equal(finding.line, 1);
});
