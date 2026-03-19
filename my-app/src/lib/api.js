// ./lib/api.js - 100% compatible cookies (comme votre dashboard)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
});

export async function createServerInvite(serverId) {
  const response = await fetch(`${API_BASE}/servers/${serverId}/invitations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',  // ← Cookies (comme votre checkPermissions)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function getServerInvites(serverId) {
  const response = await fetch(`${API_BASE}/servers/${serverId}/invitations`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Impossible de charger les invitations');
  return response.json();
}

export async function getMyRoleInServer(serverId) {
  const response = await fetch(`${API_BASE}/servers/${serverId}/members/me`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Impossible de récupérer votre rôle');
  const data = await response.json();
  return data.role || 'MEMBER';
}
