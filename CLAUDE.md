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

## Development Commands
- `npx nx run-many -t build` - Build all projects
- `npx nx run-many -t lint` - Lint all projects
- `npx nx run-many -t format` - Check code format
- `npx nx run-many -t test` - Run all tests
- `npx nx run docviewer-api:serve` - Start API server
- `npx nx run docviewer-webapp:dev` - Start dev server

## Hooks

### PostToolUse
After editing source files, run lint check:

- matcher: "Edit|Write"
  hooks:
    - type: command
      command: npx nx run-many -t lint --projects=docviewer-api,docviewer-domain,docviewer-application,docviewer-infrastructure,docviewer-webapp
      timeout: 120