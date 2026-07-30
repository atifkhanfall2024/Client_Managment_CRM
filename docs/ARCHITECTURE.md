# Architecture — ClientCRM

## Why this structure

Enterprise SaaS must separate:

| Layer | Responsibility | Must NOT do |
|-------|----------------|-------------|
| **UI** | Render + collect input | Talk to DB directly |
| **Actions / Route Handlers** | Transport (HTTP / Server Action) | Business rules |
| **Service** | Authorization + domain rules + orchestration | SQL details |
| **Repository** | Persistence (Supabase queries) | RBAC / notifications |
| **Core** | Shared primitives (errors, rate limit, API shape) | Feature logic |

## Target feature layout

```text
src/
  core/                         # cross-cutting platform
    types/
    http/
    security/
    repository/
    services/
    actions/
  features/
    clients/
      repository/
      services/
      hooks/
      components/               # (Module 3+)
      schemas/                  # (Module 3+)
    projects/
    tasks/
    ...
  app/
    (app)/                      # pages (compose features)
    api/                        # REST route handlers
  components/ui/                # design system only
  components/shared/            # cross-feature UI
```

## Decision records

1. **Server Components by default** — less JS, better security boundary for initial data.
2. **Server Actions for mutations** — colocated with forms; still call services.
3. **REST Route Handlers for integrations / TanStack Query** — typed `ApiResponse`.
4. **RLS in Supabase + app RBAC** — defense in depth.
5. **Soft delete** — auditability over hard delete.
6. **In-memory rate limit** — replace with Redis/Upstash when scaling horizontally.

## Module rollout

Module 1 (this): platform foundation + Clients service/repo + GET /api/clients as reference.
Later modules migrate remaining domains onto the same pattern.
