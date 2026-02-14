# LLM Evaluation and Testing

This document provides guidance for testing LLM-powered features, including skills, agents, and AI-assisted workflows.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Table of Contents

- [Introduction](#introduction)
- [Testing Challenges with LLMs](#testing-challenges-with-llms)
- [Test Types for LLM Features](#test-types-for-llm-features)
- [Deterministic vs Scoring-Based Tests](#deterministic-vs-scoring-based-tests)
- [Prompt Evaluation Frameworks](#prompt-evaluation-frameworks)
- [Skill Validation Patterns](#skill-validation-patterns)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)
- [Example Test Patterns](#example-test-patterns)
- [Tools and Libraries](#tools-and-libraries)

---

## Introduction

Testing LLM-powered features is fundamentally different from testing traditional software:

- **Non-deterministic outputs**: Same input can produce different outputs
- **Semantic correctness**: Output may be correct even if text differs
- **Context-dependent**: Quality depends on prompts, examples, and context
- **Emergent behaviors**: Complex interactions between components
- **Evaluation complexity**: No single "correct" answer

**Key principle:** Test behavior and outcomes, not exact output.

---

## Testing Challenges with LLMs

### Challenge 1: Non-Determinism

**Problem:** LLMs produce different outputs for the same input.

**Solutions:**
- Use temperature=0 for deterministic tests (when supported)
- Test for properties (e.g., "contains keyword") not exact matches
- Use semantic similarity metrics instead of string equality
- Focus on behavioral assertions (e.g., "task completed successfully")

### Challenge 2: Evaluation Metrics

**Problem:** Hard to define "correct" output quantitatively.

**Solutions:**
- Use rubric-based scoring (1-5 scale with criteria)
- Measure semantic similarity (embeddings, BLEU, ROUGE)
- Check for required elements (JSON structure, specific fields)
- Use LLM-as-judge for complex evaluations

### Challenge 3: Flaky Tests

**Problem:** Tests pass/fail inconsistently due to output variance.

**Solutions:**
- Run tests multiple times and aggregate results
- Use wider tolerance ranges for scoring
- Test invariants (e.g., valid JSON) not exact output
- Separate deterministic tests from probabilistic tests

### Challenge 4: Cost and Latency

**Problem:** LLM API calls are expensive and slow.

**Solutions:**
- Mock LLM responses for fast unit tests
- Use cached responses for integration tests
- Run full evaluation only in CI or nightly builds
- Use smaller/cheaper models for development testing

---

## Test Types for LLM Features

### 1. Unit Tests (Fast, Deterministic)

Test individual components without LLM calls.

**What to test:**
- Input validation (schema, format)
- Prompt construction logic
- Output parsing (JSON, structured data)
- Error handling (API failures, timeouts)
- Tool selection and routing

**Example:**
```python
def test_prompt_construction():
    """Test that prompt includes all required elements."""
    prompt = build_prompt(task="Add authentication", context="React app")

    assert "Add authentication" in prompt
    assert "React app" in prompt
    assert "## Task" in prompt  # Check structure
```

### 2. Integration Tests (Medium, Mocked LLM)

Test workflows with mocked LLM responses.

**What to test:**
- Workflow orchestration
- Multi-step interactions
- State management
- Error recovery

**Example:**
```python
@mock.patch('llm_client.complete')
def test_workflow_orchestration(mock_complete):
    """Test full workflow with mocked LLM."""
    mock_complete.side_effect = [
        {"status": "plan_created", "plan": "..."},
        {"status": "tests_written", "tests": "..."},
        {"status": "implementation_complete", "code": "..."}
    ]

    result = run_workflow(task="Add login")

    assert result.status == "success"
    assert mock_complete.call_count == 3
```

### 3. End-to-End Tests (Slow, Real LLM)

Test with real LLM calls (expensive, run selectively).

**What to test:**
- Real-world scenarios
- Actual LLM behavior
- Integration with external services
- Performance and latency

**Example:**
```python
@pytest.mark.slow
@pytest.mark.e2e
def test_skill_execution_e2e():
    """Test skill with real LLM (expensive)."""
    result = execute_skill(
        skill="developer",
        task="Add a function to check if number is prime"
    )

    # Test behavioral outcomes
    assert result.status == "success"
    assert result.tests_pass is True
    assert "isPrime" in result.code  # Check for key element
```

### 4. Regression Tests (Snapshot Testing)

Detect unexpected changes in LLM behavior.

**What to test:**
- Known good outputs (golden datasets)
- Performance baselines
- Quality metrics over time

**Example:**
```python
def test_skill_output_regression():
    """Compare against known good output."""
    result = execute_skill_with_snapshot(
        skill="code-reviewer",
        input_file="fixtures/buggy_code.py"
    )

    # Check semantic similarity to baseline
    similarity = compare_with_baseline(result.review, "baseline_review.json")
    assert similarity > 0.85  # Allow 15% variance
```

---

## Deterministic vs Scoring-Based Tests

### Deterministic Tests

Use when output has clear right/wrong answers.

**When to use:**
- JSON structure validation
- Required field presence
- Format compliance (regex, schema)
- Invariant properties (e.g., no secrets in output)

**Example:**
```python
def test_json_output_structure():
    """Test that output is valid JSON with required fields."""
    output = generate_response(prompt)

    data = json.loads(output)  # Fails if not valid JSON
    assert "status" in data
    assert "result" in data
    assert data["status"] in ["success", "failure"]
```

### Scoring-Based Tests

Use when output quality is subjective or variable.

**When to use:**
- Content quality (helpfulness, clarity)
- Semantic correctness
- Style and tone
- Complex reasoning tasks

**Example:**
```python
def test_code_review_quality():
    """Score code review quality on multiple criteria."""
    review = generate_code_review(code_sample)

    scores = evaluate_review(review)

    # Check each criterion against threshold
    assert scores.completeness >= 4  # 1-5 scale
    assert scores.clarity >= 4
    assert scores.actionability >= 3

    # Aggregate score
    assert scores.overall >= 3.5
```

---

## Prompt Evaluation Frameworks

### PromptFoo

**Purpose:** Compare prompts, models, and parameters systematically.

**Use cases:**
- A/B testing prompts
- Model comparison
- Regression testing

**Setup:**
```yaml
# promptfooconfig.yaml
prompts:
  - "Write a function to {{task}}"
  - "Implement {{task}} in Python"

providers:
  - openai:gpt-4
  - anthropic:claude-3-opus

tests:
  - vars:
      task: "calculate Fibonacci sequence"
    assert:
      - type: contains
        value: "def fibonacci"
      - type: python
        value: "output.count('return') == 1"
```

**Run:**
```bash
promptfoo eval
promptfoo view
```

### LangSmith

**Purpose:** Trace, evaluate, and monitor LLM applications.

**Use cases:**
- Production monitoring
- Debugging failures
- Dataset management
- Custom evaluators

**Example:**
```python
from langsmith import Client, evaluate

client = Client()

def correctness_evaluator(run, example):
    """Custom evaluator for correctness."""
    expected = example.outputs["answer"]
    actual = run.outputs["answer"]

    # Use LLM-as-judge
    score = llm_judge.score(expected, actual)
    return {"score": score}

# Run evaluation
results = evaluate(
    lambda x: my_chain.invoke(x),
    data="skill_validation_dataset",
    evaluators=[correctness_evaluator]
)
```

### Custom Evaluation Pipeline

For specialized needs, build custom evaluation:

```python
class SkillEvaluator:
    """Evaluate skill execution quality."""

    def evaluate(self, skill_output, expected_behavior):
        """Score skill output against expected behavior."""
        scores = {
            "task_completion": self._check_completion(skill_output),
            "code_quality": self._check_quality(skill_output.code),
            "test_coverage": self._check_tests(skill_output.tests),
            "documentation": self._check_docs(skill_output.docs)
        }

        # Aggregate with weights
        overall = (
            scores["task_completion"] * 0.4 +
            scores["code_quality"] * 0.3 +
            scores["test_coverage"] * 0.2 +
            scores["documentation"] * 0.1
        )

        return {"scores": scores, "overall": overall}
```

---

## Skill Validation Patterns

### Pattern 1: Outcome-Based Testing

Test that skill achieves intended outcome, not how.

```python
def test_developer_skill_adds_feature():
    """Test that developer skill successfully adds feature."""
    result = invoke_skill(
        skill="developer",
        task="Add password validation to User model"
    )

    # Check outcomes
    assert result.status == "success"
    assert result.tests_written > 0
    assert result.tests_passing is True

    # Check behavior (not exact code)
    assert "password" in result.code.lower()
    assert "validation" in result.code.lower()
```

### Pattern 2: Property-Based Testing

Test invariant properties that must hold.

```python
@given(st.text(min_size=1, max_size=100))
def test_skill_never_exposes_secrets(task_description):
    """Test that skill output never contains secrets."""
    result = invoke_skill(skill="architect", task=task_description)

    # Invariants that must always hold
    assert "sk-" not in result.output  # No API keys
    assert "password" not in result.output.lower()  # No passwords
    assert is_valid_json(result.structured_output)  # Valid format
```

### Pattern 3: LLM-as-Judge

Use LLM to evaluate LLM output quality.

```python
def test_code_review_is_helpful():
    """Use LLM to judge code review quality."""
    code = load_fixture("buggy_code.py")
    review = invoke_skill(skill="code-reviewer", code=code)

    # Use LLM-as-judge
    judgment = llm_judge(
        prompt=f"""
        Rate this code review on a scale of 1-5 for:
        - Identifies actual bugs (not nitpicks)
        - Provides actionable feedback
        - Clear and respectful tone

        Code: {code}
        Review: {review}

        Return JSON: {{"bug_detection": X, "actionability": X, "tone": X}}
        """,
        temperature=0
    )

    scores = json.loads(judgment)
    assert scores["bug_detection"] >= 4
    assert scores["actionability"] >= 4
    assert scores["tone"] >= 4
```

### Pattern 4: Differential Testing

Compare outputs across models or versions.

```python
def test_skill_consistency_across_models():
    """Test that skill produces similar results across models."""
    task = "Implement binary search"

    result_gpt4 = invoke_skill(skill="developer", task=task, model="gpt-4")
    result_claude = invoke_skill(skill="developer", task=task, model="claude-3-opus")

    # Both should succeed
    assert result_gpt4.status == "success"
    assert result_claude.status == "success"

    # Both should have similar quality
    similarity = semantic_similarity(
        result_gpt4.code,
        result_claude.code
    )
    assert similarity > 0.6  # Allow for different implementations
```

---

## Common Pitfalls

### Pitfall 1: Over-Fitting to Examples

**Problem:** Tests pass for specific examples but fail on variations.

**Solution:**
- Use diverse test cases
- Property-based testing with random inputs
- Test edge cases and boundary conditions

**Bad:**
```python
def test_code_generation():
    result = generate_code("add two numbers")
    assert result == "def add(a, b):\n    return a + b"  # Too specific!
```

**Good:**
```python
def test_code_generation():
    result = generate_code("add two numbers")
    assert "def" in result  # Check for function definition
    assert "return" in result  # Check for return statement
    assert result.count("a") >= 2  # Check parameters referenced
```

### Pitfall 2: Flaky Tests from Variance

**Problem:** Tests fail randomly due to LLM output variance.

**Solution:**
- Use temperature=0 when possible
- Test invariants, not exact output
- Run multiple times and aggregate
- Separate flaky tests into different suite

**Bad:**
```python
def test_prompt_response():
    result = llm("Explain recursion")
    assert "base case" in result  # May fail randomly
```

**Good:**
```python
@pytest.mark.repeat(3)  # Run 3 times
def test_prompt_response():
    result = llm("Explain recursion", temperature=0)

    # Check multiple indicators
    indicators = ["base case", "recursive", "call itself"]
    matches = sum(1 for ind in indicators if ind in result.lower())
    assert matches >= 2  # At least 2 of 3 must be present
```

### Pitfall 3: Testing Implementation Details

**Problem:** Tests break when implementation changes.

**Solution:**
- Test behavior and outcomes
- Focus on user-visible effects
- Avoid testing internal prompt construction

**Bad:**
```python
def test_prompt_construction():
    prompt = build_prompt(task="Add feature")
    assert prompt.startswith("You are a helpful assistant")  # Internal detail
    assert len(prompt) > 1000  # Fragile
```

**Good:**
```python
def test_skill_execution():
    result = execute_skill(task="Add feature")
    assert result.status == "success"  # Behavioral outcome
    assert result.output_valid is True  # Observable property
```

### Pitfall 4: Ignoring Cost and Latency

**Problem:** Test suite is too slow or expensive to run frequently.

**Solution:**
- Use mocks for unit tests
- Cache responses for integration tests
- Run expensive tests only in CI
- Use cheaper models for development

**Strategy:**
```python
# Unit tests (fast, mocked)
@pytest.mark.unit
@mock.patch('llm_client.complete')
def test_workflow_logic(mock_complete):
    pass

# Integration tests (medium, cached)
@pytest.mark.integration
@use_cached_responses
def test_skill_integration():
    pass

# E2E tests (slow, real LLM)
@pytest.mark.e2e
@pytest.mark.slow
def test_full_workflow():
    pass
```

---

## Best Practices

### Do

✅ **Test behavior and outcomes, not exact output**
```python
assert result.status == "success"
assert result.tests_pass is True
assert "function" in result.code  # Key element present
```

✅ **Use temperature=0 for deterministic tests**
```python
result = llm.complete(prompt, temperature=0)  # Reproducible
```

✅ **Run expensive tests selectively**
```python
@pytest.mark.slow
@pytest.mark.e2e
def test_full_workflow():
    pass  # Only run in CI or on demand
```

✅ **Test invariants that must always hold**
```python
assert is_valid_json(output)
assert "sk-" not in output  # No API keys
assert len(output) < MAX_OUTPUT_SIZE
```

✅ **Use rubrics for quality evaluation**
```python
scores = evaluate_quality(output, rubric={
    "completeness": "Does it answer all parts?",
    "clarity": "Is it easy to understand?",
    "correctness": "Is it factually accurate?"
})
assert scores.overall >= 4  # 1-5 scale
```

### Don't

❌ **Don't test exact output strings**
```python
assert result == "The answer is 42"  # Will break
```

❌ **Don't ignore flaky tests**
```python
# Bad: Just re-running until pass
@pytest.mark.flaky(reruns=5)  # Masks real issues
```

❌ **Don't make every test call real LLM**
```python
# Bad: Expensive and slow
def test_every_feature_with_real_llm():
    pass  # Use mocks for unit tests
```

❌ **Don't test implementation details**
```python
assert "You are a helpful assistant" in prompt  # Internal detail
```

---

## Example Test Patterns

### Example 1: Skill Execution Test

```python
def test_developer_skill_implements_feature():
    """Test that developer skill implements feature with TDD."""
    result = execute_skill(
        skill="developer",
        task="Add a function to calculate factorial",
        context={"language": "Python"}
    )

    # Behavioral assertions
    assert result.status == "success"
    assert result.tdd_cycle_completed is True

    # Output validation
    assert result.tests_written > 0
    assert result.tests_passing is True

    # Key elements present (not exact code)
    assert "factorial" in result.code.lower()
    assert "def" in result.code
    assert "return" in result.code

    # No common issues
    assert "TODO" not in result.code
    assert "FIXME" not in result.code
```

### Example 2: Multi-Step Workflow Test

```python
def test_workflow_phases_execute_in_order():
    """Test that workflow executes all phases successfully."""
    workflow = Workflow(task="Add authentication")

    # Mock LLM for speed
    with mock_llm_responses([
        {"phase": "plan", "status": "complete"},
        {"phase": "execute", "status": "complete"},
        {"phase": "test", "status": "pass"},
        {"phase": "review", "status": "approved"},
    ]):
        result = workflow.run()

    # Check phase completion
    assert result.phases_completed == ["plan", "execute", "test", "review"]
    assert result.status == "success"
    assert result.artifacts["code"] is not None
    assert result.artifacts["tests"] is not None
```

### Example 3: Prompt Quality Test

```python
def test_prompt_produces_valid_structured_output():
    """Test that prompt consistently produces valid JSON."""
    tasks = [
        "Add user authentication",
        "Implement caching",
        "Add logging"
    ]

    for task in tasks:
        result = llm.complete(
            prompt=build_structured_prompt(task),
            temperature=0
        )

        # Must be valid JSON
        data = json.loads(result)

        # Must have required fields
        assert "status" in data
        assert "plan" in data
        assert "steps" in data
        assert isinstance(data["steps"], list)
        assert len(data["steps"]) > 0
```

### Example 4: Semantic Similarity Test

```python
def test_code_review_quality_semantic():
    """Test code review quality using semantic similarity."""
    buggy_code = """
    def divide(a, b):
        return a / b  # Missing zero check
    """

    review = invoke_skill(skill="code-reviewer", code=buggy_code)

    expected_issues = [
        "division by zero",
        "missing error handling",
        "no input validation"
    ]

    # Check semantic similarity to expected issues
    for expected_issue in expected_issues:
        similarity = semantic_similarity(review, expected_issue)
        assert similarity > 0.3  # At least somewhat similar
```

---

## Tools and Libraries

### Testing Frameworks

| Tool | Purpose | Language |
|------|---------|----------|
| **pytest** | General testing framework | Python |
| **unittest.mock** | Mocking LLM calls | Python |
| **hypothesis** | Property-based testing | Python |
| **jest** | General testing framework | JavaScript |

### LLM Evaluation

| Tool | Purpose | Use Case |
|------|---------|----------|
| **PromptFoo** | Prompt testing and comparison | A/B testing prompts |
| **LangSmith** | LLM tracing and evaluation | Production monitoring |
| **DeepEval** | LLM evaluation metrics | Quality scoring |
| **RAGAS** | RAG evaluation | RAG applications |
| **Anthropic Evals** | Claude-specific evaluation | Claude testing |

### Semantic Similarity

| Tool | Purpose | Method |
|------|---------|--------|
| **sentence-transformers** | Semantic embeddings | Cosine similarity |
| **BLEU** | Translation quality | N-gram overlap |
| **ROUGE** | Summarization quality | Recall-based |
| **BERTScore** | Semantic similarity | Contextual embeddings |

### Installation

```bash
# Testing frameworks
pip install pytest pytest-mock hypothesis

# LLM evaluation
pip install promptfoo deepeval ragas

# Semantic similarity
pip install sentence-transformers scikit-learn nltk
```

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to implement LLM evaluation | **testing** skill | Read `skills/testing/SKILL.md` for test design |
| Performance testing for LLM | **performance** skill | Read `skills/performance/SKILL.md` for profiling |
| CI/CD for LLM tests | **ci-cd** skill | Read `skills/ci-cd/SKILL.md` for pipeline setup |
| Security concerns in LLM output | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |

---

## Reference

- [PromptFoo Documentation](https://www.promptfoo.dev/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [DeepEval Documentation](https://docs.confident-ai.com/)
- [Anthropic Evals](https://github.com/anthropics/evals)
- [OpenAI Evals](https://github.com/openai/evals)
