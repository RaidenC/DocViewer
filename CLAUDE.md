# DocViewer - Unified Document Ecosystem

## Project Overview
- **Stack**: .NET 10 Web API + React 19
- **Architecture**: Clean Architecture with CQRS pattern
- **Purpose**: Centralized document management platform consolidating fax, email, scan, and FTP systems

## Tech Stack
- **Backend**: ASP.NET Core 10, Entity Framework Core, MediatR
- **Frontend**: React 19 with TypeScript
- **Testing**: xUnit, FluentAssertions
- **Database**: SQLite (POC) / PostgreSQL (production)

## Coding Standards (Interview-Ready)

### Required Workflow
1. **TDD First** - Use `/tdd` skill before writing any feature code
2. **Test Coverage** - Minimum 80% coverage required
3. **Async/Await** - Always use proper async patterns
4. **SOLID Principles** - Follow dependency injection, interface segregation

### Project Structure
```
DocViewer/
├── src/
│   ├── DocViewer.Api/          # Web API layer
│   ├── DocViewer.Application/   # Use cases, MediatR handlers
│   ├── DocViewer.Domain/        # Entities, value objects
│   ├── DocViewer.Infrastructure/# EF Core, repositories
│   └── DocViewer.WebApp/        # React frontend
└── tests/
    ├── DocViewer.Api.Tests/
    └── DocViewer.Application.Tests/
```

### Key Patterns to Demonstrate
- Repository pattern
- Unit of Work
- CQRS with MediatR
- Dependency Injection
- Metadata filtering (Client ID, Date, Sender)

## Skills Available
- `tdd` - Test-driven development workflow
- `dotnet-best-practices` - .NET coding standards
- `vercel-react-best-practices` - React patterns
- `webapp-testing` - Integration testing

## Gstack

Use gstack for all web browsing and browser-based testing. Never use MCP tools like `mcp__claude-in-chrome__*`.

### Available Skills
- `/office-hours` - Brainstorming new ideas
- `/plan-ceo-review` - Reviewing strategy plans
- `/plan-eng-review` - Reviewing architecture plans
- `/plan-design-review` - Reviewing design plans
- `/design-consultation` - Creating a design system
- `/debug` - Debugging errors
- `/qa` - Testing the app (full workflow)
- `/qa-only` - Testing only
- `/design-review` - Visual design audit
- `/review` - Code review before merge
- `/setup-browser-cookies` - Set up browser cookies
- `/retro` - Weekly retrospective
- `/ship` - Ready to deploy/create PR
- `/browse` - Navigate web, interact with elements, verify page state
- `/document-release` - Post-ship doc updates

## Development Commands
- `npx nx run-many -t build` - Build all projects
- `npx nx run-many -t lint` - Lint all projects
- `npx nx run-many -t format` - Check code format
- `npx nx run-many -t test` - Run all tests
- `npx nx run docviewer-api:serve` - Start API server
- `npx nx run docviewer-webapp:dev` - Start dev server

## Testing

See [TESTING.md](./TESTING.md) for detailed instructions.

### Quick Commands
```bash
# Run all tests
npx nx run-many -t test

# Backend tests only
dotnet test tests/DocViewer.Application.Tests

# Frontend tests only
cd src/DocViewer.WebApp && npm test
```

### Test Expectations
- 80% test coverage is the goal
- When writing new functions, write a corresponding test
- When fixing a bug, write a regression test
- When adding error handling, write a test that triggers the error
- When adding a conditional (if/else, switch), write tests for BOTH paths
- Never commit code that makes existing tests fail

## Hooks

### PostToolUse
After editing source files, run lint check:

- matcher: "Edit|Write"
  hooks:
    - type: command
      command: npx nx run-many -t lint --projects=docviewer-api,docviewer-domain,docviewer-application,docviewer-infrastructure,docviewer-webapp
      timeout: 120