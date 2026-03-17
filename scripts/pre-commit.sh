# Pre-commit hook to run lint, format, and tests before commit
#!/bin/bash

echo "Running pre-commit checks..."

# Check if there are staged changes
if ! git diff --cached --quiet; then
    echo "Changes detected. Running checks..."
else
    echo "No staged changes. Skipping checks."
    exit 0
fi

# Run lint
echo "Running lint..."
npx nx affected -t lint
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
    echo "Lint failed!"
    exit 1
fi

# Run format (check only)
echo "Checking code format..."
npx nx affected -t format
FORMAT_EXIT=$?

if [ $FORMAT_EXIT -ne 0 ]; then
    echo "Code format issues found! Run 'npx nx format:write' to fix."
    exit 1
fi

# Run tests
echo "Running tests..."
npx nx affected -t test
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi

echo "All pre-commit checks passed!"
exit 0