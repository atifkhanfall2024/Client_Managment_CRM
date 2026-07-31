/**
 * Portal email must be unique across users, except when updating
 * the same portal login already linked to this CRM client.
 */
export function canUseEmailForClientPortal(params: {
  existingUser: {
    id: string;
    role: string;
  } | null;
  currentClientPortalUserId: string | null;
  otherClientUsingThisPortalUser: boolean;
}): { ok: true } | { ok: false; error: string } {
  const { existingUser, currentClientPortalUserId, otherClientUsingThisPortalUser } =
    params;

  if (!existingUser) {
    return { ok: true };
  }

  if (existingUser.role !== "client") {
    return {
      ok: false,
      error: "Yeh email pehle se database me hai (staff account). Client portal ke liye use nahi ho sakti.",
    };
  }

  // Same portal user already on this client → password/update allowed
  if (
    currentClientPortalUserId &&
    currentClientPortalUserId === existingUser.id
  ) {
    return { ok: true };
  }

  // Email belongs to another client's portal (or orphan client user)
  if (otherClientUsingThisPortalUser || !currentClientPortalUserId) {
    return {
      ok: false,
      error: "Yeh email pehle se database me hai. Koi aur account / client portal already is email ko use kar raha hai.",
    };
  }

  return {
    ok: false,
    error: "Yeh email pehle se database me hai. Client portal ke liye naya unique email use karein.",
  };
}
