export async function fetchWithAuth(url, options = {}, { onSessionExpired } = {}) {
  const response = await fetch(url, { credentials: 'include', ...options });

  if (response.status === 401 && typeof onSessionExpired === 'function') {
    onSessionExpired();
  }

  return response;
}
