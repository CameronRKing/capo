# Project Context

## Purpose
Capo is a Convex framework for rapidly shipping custom Notion- or Coda-like applications. From core model definitions, the framework derives property inputs, presenters, entity cards, forms, and tables with automatic real-time validation, user presence indicators, and reactive row/column-level security policies. The framework empowers developers to build collaborative, data-driven notebook applications with automatic persistence, reactivity, collaboration, client-side data caching, universal data validation, strong access controls, and live UI construction.

## Tech Stack
- **Backend**: Convex (real-time database & backend framework)
- **Schema Validation**: Zod (via convex-helpers)
- **Frontend**: React
- **Editor**: TipTap (extended with inline/block components)
- **Language**: TypeScript
- **Styling**: d-flx (custom compression-oriented ACSS framework)

## Project Conventions

### Code Style
- Use TypeScript strict mode
- Follow functional programming patterns where appropriate
- Prefer composition over inheritance
- Use kebab-case for file and directory names
- Use PascalCase for React components and types
- Use camelCase for functions and variables

### Architecture Patterns
- **Schema-First Development**: All data models defined via Zod schemas
- **Component Mapping**: Dynamic introspection of JSON schemas to generate UI components
- **Reactive Security**: Row-level and column-level security policies enforced reactively
- **Separation of Concerns**: Clear separation between schema definition, UI generation, and business logic
- **Event-Driven**: Simple event triggers for cross-concept dependencies ("reactions")

### Testing Strategy
- Unit tests for validation logic
- Integration tests for CRUD operations
- E2E tests for critical user flows
- Security testing for RBAC policies

### Git Workflow
- Feature branches for new capabilities
- Change proposals via OpenSpec before implementation
- PR reviews required for all changes
- Archive completed changes after deployment

## Domain Context

### Key Concepts
- **Model**: A domain entity defined by a Zod schema with associated CRUD operations, UI components, and security policies
- **Working Docs**: Database-persisted versions of schemas with relaxed refinements for safe collaboration on complex data in technically "invalid" but useful states
- **Notebook**: A shareable workspace for exercising domain models with automatic persistence and reactivity
- **Presence Indicators**: Visual indicators (hover/focus/change) showing real-time user collaboration
- **Domain Focus**: User focus expressed as domain objects (properties of models) rather than UI elements, enabling cross-view collaboration

### Component Categories
1. **Model Properties**: Inputs (block, inline, cell), Presenters (value-only, key/value), Actions
2. **Model Utilities**: Card, Form, Table, Action Bars/Menus
3. **TipTap Integrations**: Direct reference, Query reference
4. **Presence Components**: FacePiles, ActivityLists, UserCursors

## Important Constraints

### Technical Constraints
- Must use Convex for backend (no direct database access)
- Schema definitions must use Zod for validation
- All validations run both client-side (for feedback) and server-side (for integrity)
- "Working docs" must maintain separate history from "real" docs
- Security policies must reactively enforce access (data disappears immediately when access is revoked)

### Design Constraints
- Framework must derive all UI components from model definitions
- No manual component creation for basic CRUD operations
- Must support three form modes: Live (real-time collaborative), Working (collaborative with relaxed validation), Patch (traditional local-first)
- Presence indicators must work across all views of the same domain data

## External Dependencies
- **convex-helpers**: For RLS (Row-Level Security) helpers
- **Zod**: For schema validation and JSON schema generation
- **TipTap**: For rich text editor functionality
- **d-flx**: Custom design system (defined in /memory-bank/d-flx/projectbrief.md)

## Long-Term Considerations
- Potential migration to Standard Schema API with Arktype implementation
- Database-level validation helpers (e.g., unique email constraints)
- Event streaming to orchestrator for complex event patterns
- Cron job configuration for users
- End-to-end encryption for chat/communication features
