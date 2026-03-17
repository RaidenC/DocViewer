#!/bin/bash
# Install and configure git hooks

echo "Setting up git hooks..."

# Make pre-commit script executable
chmod +x scripts/pre-commit.sh

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
exec npm run pre-commit
HOOK

chmod +x .git/hooks/pre-commit

echo "Git hooks installed!"
echo "Make sure to run 'npm install' to install husky"