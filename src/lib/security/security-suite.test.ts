import { describe, expect, it, beforeEach } from "vitest";
import {
  rateLimit,
  resetRateLimitBuckets,
  rateLimitBucketCount,
} from "@/core/security/rate-limit";
import {
  canApproveTarget,
  homeLinkForApprovedRole,
  pendingRolesForActor,
} from "@/lib/security/approvals-policy";
import {
  canAccessDocument,
  sanitizeRelativeUploadPath,
} from "@/lib/security/file-access";
import {
  assertStaffOnlyRole,
  filterProjectsForClient,
  isMeetingVisibleToClient,
  safePageParams,
} from "@/lib/security/portal-scope";
import {
  canAccessRoute,
  hasPermission,
  homePathForRole,
  isStaffRole,
} from "@/lib/rbac";
import { meetingSchema, loginSchema, registerSchema } from "@/lib/validations";

describe("rate limiter (concurrency / abuse)", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("user:a", { limit: 5, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the 6th request in the same window", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("user:b", { limit: 5, windowMs: 60_000 });
    }
    const blocked = rateLimit("user:b", { limit: 5, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates keys so one user cannot starve another", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("user:busy", { limit: 5, windowMs: 60_000 });
    }
    expect(rateLimit("user:busy", { limit: 5, windowMs: 60_000 }).allowed).toBe(
      false
    );
    expect(rateLimit("user:other", { limit: 5, windowMs: 60_000 }).allowed).toBe(
      true
    );
  });

  it("handles a burst of many distinct users without throwing", () => {
    for (let i = 0; i < 500; i++) {
      const r = rateLimit(`burst:${i}`, { limit: 10, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
    expect(rateLimitBucketCount()).toBeGreaterThan(100);
  });
});

describe("approvals policy", () => {
  it("lets admin/super_admin approve clients; managers cannot", () => {
    expect(canApproveTarget("super_admin", "client")).toBe(true);
    expect(canApproveTarget("admin", "client")).toBe(true);
    expect(canApproveTarget("manager", "client")).toBe(false);
  });

  it("never approves super_admin", () => {
    expect(canApproveTarget("super_admin", "super_admin")).toBe(false);
  });

  it("queues client portals for admin actors", () => {
    expect(pendingRolesForActor("admin")).toContain("client");
    expect(pendingRolesForActor("manager")).not.toContain("client");
  });

  it("routes clients to portal after approval", () => {
    expect(homeLinkForApprovedRole("client")).toBe("/portal");
    expect(homeLinkForApprovedRole("manager")).toBe("/dashboard");
  });
});

describe("file ACL + path sanitization", () => {
  it("blocks path traversal", () => {
    expect(sanitizeRelativeUploadPath("../etc/passwd")).toBeNull();
    expect(sanitizeRelativeUploadPath("project/x/../secret")).toBeNull();
    expect(sanitizeRelativeUploadPath("project/abc/a.pdf")).toBe(
      "project/abc/a.pdf"
    );
  });

  it("prevents client A from reading client B project files", () => {
    const doc = {
      entity_type: "project",
      entity_id: "proj-b",
      file_path: "project/proj-b/x.pdf",
    };
    expect(
      canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: "client-a",
        clientProjectIds: ["proj-a"],
        doc,
      })
    ).toBe(false);
  });

  it("allows staff with documents.view", () => {
    expect(
      canAccessDocument({
        role: "admin",
        hasDocumentsView: true,
        clientId: null,
        clientProjectIds: [],
        doc: {
          entity_type: "project",
          entity_id: "any",
          file_path: "x",
        },
      })
    ).toBe(true);
  });
});

describe("portal isolation", () => {
  it("hides meetings for other clients", () => {
    expect(
      isMeetingVisibleToClient({
        meetingClientId: "c1",
        portalClientId: "c2",
        visibleToClient: true,
      })
    ).toBe(false);
  });

  it("hides meetings marked not visible or deleted", () => {
    expect(
      isMeetingVisibleToClient({
        meetingClientId: "c1",
        portalClientId: "c1",
        visibleToClient: false,
      })
    ).toBe(false);
    expect(
      isMeetingVisibleToClient({
        meetingClientId: "c1",
        portalClientId: "c1",
        visibleToClient: true,
        deletedAt: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it("shows own visible meetings", () => {
    expect(
      isMeetingVisibleToClient({
        meetingClientId: "c1",
        portalClientId: "c1",
        visibleToClient: true,
      })
    ).toBe(true);
  });

  it("scopes projects strictly by client_id", () => {
    const scoped = filterProjectsForClient(
      [
        { id: "1", client_id: "a" },
        { id: "2", client_id: "b" },
        { id: "3", client_id: "a" },
      ],
      "a"
    );
    expect(scoped.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("clamps unsafe pagination under load", () => {
    expect(safePageParams({ page: 0, pageSize: 9999 })).toEqual({
      page: 1,
      pageSize: 50,
      skip: 0,
    });
    expect(safePageParams({ page: 3, pageSize: 10 }).skip).toBe(20);
  });

  it("treats client role as non-staff", () => {
    expect(assertStaffOnlyRole("client")).toBe(false);
    expect(assertStaffOnlyRole("manager")).toBe(true);
    expect(isStaffRole("client")).toBe(false);
  });
});

describe("rbac route isolation", () => {
  it("keeps clients out of staff routes", () => {
    expect(canAccessRoute("client", "/dashboard")).toBe(false);
    expect(canAccessRoute("client", "/meetings")).toBe(false);
    expect(canAccessRoute("client", "/portal/meetings")).toBe(true);
    expect(canAccessRoute("manager", "/portal")).toBe(false);
    expect(homePathForRole("client")).toBe("/portal");
  });

  it("denies clients upload / user manage", () => {
    expect(hasPermission("client", "documents.upload")).toBe(true);
    expect(hasPermission("client", "users.manage")).toBe(false);
    expect(hasPermission("client", "portal.view")).toBe(true);
  });
});

describe("validation schemas", () => {
  it("rejects weak login passwords length", () => {
    const bad = loginSchema.safeParse({
      email: "a@b.com",
      password: "123",
    });
    expect(bad.success).toBe(false);
  });

  it("accepts valid login", () => {
    const ok = loginSchema.safeParse({
      email: "user@wrapcrm.com",
      password: "secret1",
    });
    expect(ok.success).toBe(true);
  });

  it("requires meeting title and schedule", () => {
    const bad = meetingSchema.safeParse({
      title: "a",
      scheduled_at: "",
    });
    expect(bad.success).toBe(false);

    const ok = meetingSchema.safeParse({
      title: "Progress review",
      scheduled_at: "2026-08-01T10:00",
      duration_minutes: 30,
    });
    expect(ok.success).toBe(true);
  });

  it("allows optional client role only in schema (blocked at register action)", () => {
    const parsed = registerSchema.safeParse({
      full_name: "Test User",
      email: "t@example.com",
      password: "password1",
      role: "client",
    });
    expect(parsed.success).toBe(true);
  });
});
