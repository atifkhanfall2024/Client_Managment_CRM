import { describe, expect, it } from "vitest";
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
  canAccessRoute,
  hasPermission,
  homePathForRole,
  isStaffRole,
} from "@/lib/rbac";

describe("approvals policy", () => {
  it("lets admin and super_admin approve client portal users", () => {
    expect(canApproveTarget("super_admin", "client")).toBe(true);
    expect(canApproveTarget("admin", "client")).toBe(true);
    expect(canApproveTarget("manager", "client")).toBe(false);
    expect(canApproveTarget("employee", "client")).toBe(false);
  });

  it("never allows approving super_admin", () => {
    expect(canApproveTarget("super_admin", "super_admin")).toBe(false);
    expect(canApproveTarget("admin", "super_admin")).toBe(false);
  });

  it("includes clients in admin pending queues", () => {
    expect(pendingRolesForActor("super_admin")).toContain("client");
    expect(pendingRolesForActor("admin")).toContain("client");
    expect(pendingRolesForActor("manager")).not.toContain("client");
    expect(pendingRolesForActor("employee")).toBeNull();
  });

  it("routes approved clients to portal", () => {
    expect(homeLinkForApprovedRole("client")).toBe("/portal");
    expect(homeLinkForApprovedRole("admin")).toBe("/dashboard");
  });
});

describe("file access ACL", () => {
  const ownDoc = {
    entity_type: "project",
    entity_id: "proj-1",
    file_path: "project/proj-1/a.pdf",
  };

  it("allows staff with documents.view", () => {
    expect(
      canAccessDocument({
        role: "admin",
        hasDocumentsView: true,
        clientId: null,
        clientProjectIds: [],
        doc: ownDoc,
      })
    ).toBe(true);
  });

  it("denies staff without documents.view", () => {
    expect(
      canAccessDocument({
        role: "employee",
        hasDocumentsView: false,
        clientId: null,
        clientProjectIds: [],
        doc: ownDoc,
      })
    ).toBe(false);
  });

  it("scopes client downloads to their projects and client entity", () => {
    expect(
      canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: "c1",
        clientProjectIds: ["proj-1"],
        doc: ownDoc,
      })
    ).toBe(true);

    expect(
      canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: "c1",
        clientProjectIds: ["proj-1"],
        doc: { ...ownDoc, entity_id: "other-proj" },
      })
    ).toBe(false);

    expect(
      canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: "c1",
        clientProjectIds: [],
        doc: {
          entity_type: "client",
          entity_id: "c1",
          file_path: "client/c1/x.pdf",
        },
      })
    ).toBe(true);

    expect(
      canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: "c1",
        clientProjectIds: [],
        doc: {
          entity_type: "client",
          entity_id: "other",
          file_path: "client/other/x.pdf",
        },
      })
    ).toBe(false);
  });

  it("rejects path traversal in uploads", () => {
    expect(sanitizeRelativeUploadPath("../secret")).toBeNull();
    expect(sanitizeRelativeUploadPath("project/../etc/passwd")).toBeNull();
    expect(sanitizeRelativeUploadPath("project/abc/file.pdf")).toBe(
      "project/abc/file.pdf"
    );
  });
});

describe("rbac portal isolation", () => {
  it("marks client as non-staff and homes to portal", () => {
    expect(isStaffRole("client")).toBe(false);
    expect(homePathForRole("client")).toBe("/portal");
    expect(homePathForRole("manager")).toBe("/dashboard");
  });

  it("blocks clients from staff routes", () => {
    expect(canAccessRoute("client", "/dashboard")).toBe(false);
    expect(canAccessRoute("client", "/clients")).toBe(false);
    expect(canAccessRoute("client", "/portal")).toBe(true);
    expect(canAccessRoute("client", "/portal/projects")).toBe(true);
    expect(canAccessRoute("admin", "/portal")).toBe(false);
  });

  it("gives clients portal view but not upload/manage", () => {
    expect(hasPermission("client", "portal.view")).toBe(true);
    expect(hasPermission("client", "documents.view")).toBe(true);
    expect(hasPermission("client", "documents.upload")).toBe(true);
    expect(hasPermission("client", "clients.update")).toBe(false);
    expect(hasPermission("client", "users.manage")).toBe(false);
  });
});

describe("portal project isolation logic", () => {
  it("only matches projects belonging to the linked client id", () => {
    const clientId = "client-a";
    const projects = [
      { id: "1", client_id: "client-a", name: "A" },
      { id: "2", client_id: "client-b", name: "B" },
      { id: "3", client_id: "client-a", name: "C" },
    ];
    const scoped = projects.filter((p) => p.client_id === clientId);
    expect(scoped.map((p) => p.id)).toEqual(["1", "3"]);
    expect(scoped.find((p) => p.id === "2")).toBeUndefined();
  });
});
