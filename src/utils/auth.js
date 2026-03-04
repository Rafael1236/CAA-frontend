export function getSession() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);

    if (!user.expiresAt) return null;

    if (Date.now() > user.expiresAt) {
      localStorage.removeItem("user");
      return null;
    }

    return user;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}