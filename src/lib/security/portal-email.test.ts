import { describe, expect, it } from "vitest";
import { canUseEmailForClientPortal } from "@/lib/security/portal-email";

describe("portal email uniqueness", () => {
  it("allows a brand-new email", () => {
    expect(
      canUseEmailForClientPortal({
        existingUser: null,
        currentClientPortalUserId: null,
        otherClientUsingThisPortalUser: false,
      }).ok
    ).toBe(true);
  });

  it("blocks staff emails already in the database", () => {
    const r = canUseEmailForClientPortal({
      existingUser: { id: "u1", role: "manager" },
      currentClientPortalUserId: null,
      otherClientUsingThisPortalUser: false,
    });
    expect(r.ok).toBe(false);
  });

  it("blocks email already used by another client portal", () => {
    const r = canUseEmailForClientPortal({
      existingUser: { id: "portal-user", role: "client" },
      currentClientPortalUserId: null,
      otherClientUsingThisPortalUser: true,
    });
    expect(r.ok).toBe(false);
  });

  it("allows updating the same portal login on the same client", () => {
    const r = canUseEmailForClientPortal({
      existingUser: { id: "portal-user", role: "client" },
      currentClientPortalUserId: "portal-user",
      otherClientUsingThisPortalUser: false,
    });
    expect(r.ok).toBe(true);
  });

  it("blocks reusing an existing client-role email on a different client", () => {
    const r = canUseEmailForClientPortal({
      existingUser: { id: "portal-user", role: "client" },
      currentClientPortalUserId: null,
      otherClientUsingThisPortalUser: false,
    });
    expect(r.ok).toBe(false);
  });
});
