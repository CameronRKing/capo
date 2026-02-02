# Architecture Documentation Index

This directory contains architectural documentation for the Capo Business Simulation MVP.

## Documents

### [MVP Architecture](./mvp-architecture.md)
**Primary architecture document covering:**

- **Executive Summary**: Key architectural decisions and tech stack
- **Data Layer**: Convex schema design with domain-driven collections
- **Service Layer**: Custom function builders, domain services, access control patterns
- **Frontend**: Route structure, component patterns, state management
- **Authentication**: Magic-link auth with role-based access control
- **Real-Time Collaboration**: Presence integration and hooks
- **Testing**: Vitest + convex-test patterns and utilities
- **Error Handling**: Error boundaries and resilience patterns
- **Deployment**: Environment setup and build configuration

## Quick Reference

### Core Technologies
- **Backend**: Convex (real-time database + serverless functions)
- **Frontend**: React 19 + TanStack Router
- **Auth**: `@convex-dev/auth` (magic links)
- **Presence**: `@convex-dev/presence`
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + convex-test
- **TypeScript**: Strict mode

### Domain Model
```
Games (simulations)
  └── Companies (grouped by Industry)
       └── Users (students assigned to companies)
       └── Decisions (hiring + leadership per quarter)
       └── ActiveReps (per company, per quarter)
       └── Reports (performance, financial, hiring outcomes)
```

### Key Patterns

#### Domain-Driven Functions
Instead of generic CRUD, use domain language:
- ✅ `getCompanyCurrentQuarter(gameId, companyId)`
- ❌ `getDocumentsWithFilter('active_reps', { ... })`

#### Access Control
Wrap functions with custom builders for role-based access:
```typescript
export const gameQuery = customQuery(query, {
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    // Validate access
    return { ctx: { ...ctx, user, gameId: args.gameId }, args: {} };
  },
});
```

#### Validation Strategy
1. **Client**: Real-time validation as users type (JSON Schema + AJV)
2. **Server**: Re-validate all data on submission
3. **UI**: Disable submit until valid

#### Real-Time State
- Use `useQuery` for all server state (auto-subscribes)
- Use `useState` for local UI state only
- Leverage presence hooks for collaboration

## File Structure

```
convex/
├── schema.ts                    # Database schema & indexes
├── domain/                      # Domain services
│   ├── games/                   # Game lifecycle
│   ├── companies/               # Company management
│   ├── decisions/               # Decision logic
│   ├── compilation/             # Compilation engine
│   └── reports/                 # Report generation
├── services/                    # Shared services
│   ├── validation/              # Validation logic
│   ├── permissions/             # Access control
│   └── presence/                # User presence
└── auth/                        # Authentication config

src/
├── routes/                      # TanStack Router routes
│   ├── __root.tsx               # Root layout
│   ├── login.tsx                # Auth pages
│   ├── admin/                   # Admin routes
│   ├── teacher/                 # Teacher routes
│   └── student/                 # Student routes
├── components/
│   ├── domain/                  # Business logic components
│   ├── ui/                      # Presentation components
│   └── collaboration/           # Presence-aware components
└── hooks/                       # Custom React hooks
```

## Related Documentation

- **Requirements**: `/data/projects/capo/openspec/mvp-requirements-overview.md`
- **Testing**: `/data/projects/capo/.claude/docs/testing/vitest-convex-test.md`
- **Convex Components**: `/data/projects/capo/.claude/docs/convex/components.md`

## Development Workflow

1. **Start**: `npm run dev` (Vite + Convex dev)
2. **Test**: `npm test` (Vitest watch mode)
3. **Build**: `npm run build` (Production build)
4. **Deploy**: `npm run deploy` (Convex deployment)

## Architecture Principles

1. **Domain Language Over Technical Jargon**: Speak business terms, not CRUD
2. **Separation of Concerns**: Clear layer boundaries (UI → Service → Data)
3. **Fail Fast & Validate Early**: Client + server validation
4. **Progressive Enhancement**: Start with stubbed logic, extend later
5. **Real-Time by Default**: All data is reactive via Convex subscriptions

---

**Last Updated**: 2026-02-02
