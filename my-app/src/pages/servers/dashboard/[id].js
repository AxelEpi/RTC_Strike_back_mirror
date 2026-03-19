"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAlert } from "../../../hooks/useAlert";
import { useSidebarData } from "../../../hooks/useSidebarData";
import Alert from "../../../components/Alert/Alert";
import Sidebar from "../../../components/Sidebar/page";
import InviteButton from "../../../components/Invite/InviteButton"; 
import { getServerInvites } from "../../../lib/api";

const api = process.env.NEXT_PUBLIC_API_URL;

export default function ServerDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const alert = useAlert();
  const { sidebarData, loading } = useSidebarData(id);
  const [activeTab, setActiveTab] = useState("server");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Server State
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");

  // Channels State
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelName, setEditChannelName] = useState("");

  // Members State
  const [members, setMembers] = useState([]);
  const [selectedRole, setSelectedRole] = useState({});

  const serverDetails = sidebarData?.serverDetails;

  useEffect(() => {
    if (serverDetails) {
      setServerName(serverDetails.name || "");
      setServerDescription(serverDetails.description || "");
    }
  }, [serverDetails]);
  // Invitations State
  const [invites, setInvites] = useState([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  // Fetch channels
  useEffect(() => {
    if (id) {
      checkPermissions();
      fetchChannels();
      fetchMembers();
    }
  }, [id]);

  const checkPermissions = async () => {
    try {
      setIsCheckingPermissions(true);
      const response = await fetch(`${api}/servers/${id}/members/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);

        if (data.role !== "OWNER" && data.role !== "ADMIN") {
          alert.showError(
            "Access denied: Only owners and admins can access this page",
          );
          router.back();
        }
      } else {
        alert.showError("Failed to verify permissions");
        router.back();
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
      alert.showError("Error checking permissions");
      router.back();
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${api}/servers/${id}/channels`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setChannels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${api}/servers/${id}/members`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  // Update Server
  const handleUpdateServer = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`${api}/servers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: serverName,
          description: serverDescription,
        }),
      });

      if (response.ok) {
        alert.showSuccess("Server updated successfully!");
        // Reload to update sidebar with new server info
        window.location.reload();
      } else {
        const data = await response.json();
        alert.showError(data.error || "Failed to update server");
      }
    } catch (error) {
      alert.showError("Error updating server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Channel
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${api}/servers/${id}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newChannelName }),
      });

      if (response.ok) {
        alert.showSuccess("Channel created!");
        setNewChannelName("");
        await fetchChannels();
      } else {
        const data = await response.json();
        alert.showError(data.error || "Failed to create channel");
      }
    } catch (error) {
      alert.showError("Error creating channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Channel
  const handleUpdateChannel = async (channelId, newName) => {
    if (!newName.trim()) {
      alert.showError("Channel name cannot be empty");
      return;
    }

    try {
      const response = await fetch(`${api}/channels/${channelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        alert.showSuccess("Channel updated!");
        setEditingChannel(null);
        setEditChannelName("");
        fetchChannels();
      } else {
        const data = await response.json();
        alert.showError(data.error || "Failed to update channel");
      }
    } catch (error) {
      alert.showError("Error updating channel");
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (channelId) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    try {
      const response = await fetch(`${api}/channels/${channelId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert.showSuccess("Channel deleted!");
        fetchChannels();
      } else {
        alert.showError("Failed to delete channel");
      }
    } catch (error) {
      alert.showError("Error deleting channel");
    }
  };

  // Update Member Role
  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      const response = await fetch(`${api}/servers/${id}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        alert.showSuccess("Member role updated!");
        fetchMembers();
      } else {
        alert.showError("Failed to update member role");
      }
    } catch (error) {
      alert.showError("Error updating member role");
    }
  };

  // Kick Member
  const handleKickMember = async (memberId) => {
    if (!confirm("Are you sure you want to kick this member?")) return;

    try {
      const response = await fetch(`${api}/servers/${id}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert.showSuccess("Member kicked!");
        fetchMembers();
      } else {
        alert.showError("Failed to kick member");
      }
    } catch (error) {
      alert.showError("Error kicking member");
    }
  };
// Ban Member (with optional duration)
const handleBanMember = async (memberId, duration = null) => {
  if (!confirm(duration ? `Bannir ce membre pour ${duration}s ?` : "Bannir définitivement ce membre ?")) return;
  try {
    const response = await fetch(`${api}/servers/${id}/members/${memberId}/ban`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(duration ? { duration } : {}),
    });
    if (response.ok) {
      alert.showSuccess("Membre banni !");
      fetchMembers();
    } else {
      alert.showError("Impossible de bannir ce membre");
    }
  } catch (error) {
    alert.showError("Erreur lors du ban");
  }
};
// Unban Member
const handleUnbanMember = async (memberId) => {
  try {
    const response = await fetch(`${api}/servers/${id}/members/${memberId}/unban`, {
      method: "PUT",
      credentials: "include",
    });
    if (response.ok) {
      alert.showSuccess("Membre débanni !");
      fetchMembers();
    } else {
      alert.showError("Impossible de débannir ce membre");
    }
  } catch (error) {
    alert.showError("Erreur lors du unban");
  }
};

// Delete Server (OWNER only)
const handleDeleteServer = async () => {
  if (!confirm("This will permanently delete the server. Are you sure?")) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${api}/servers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert.showSuccess("Server deleted successfully");
        router.push("/servers");
      } else {
        alert.showError("Failed to delete server");
      }
    } catch (error) {
      alert.showError("Error deleting server");
    } finally {
      setIsSubmitting(false);
    }
  };
  //invitations
  useEffect(() => {
  if (id) {
    checkPermissions();
    fetchChannels();
    fetchMembers();
    fetchInvites(); // ← AJOUTEZ
  }
}, [id]);
// Fetch invites
const fetchInvites = async () => {
  try {
    setIsLoadingInvites(true);
    const response = await fetch(`${api}/servers/${id}/invitations`, {
      credentials: "include",
    });
    
    const text = await response.text(); // ← Récupère RAW
    console.log('Invites RAW response:', text || 'VIDE'); // ← DEBUG
    
    if (response.ok) {
      if (!text) {
        setInvites([]); // ← Gère réponse vide
        return;
      }
      const data = JSON.parse(text);
      setInvites(Array.isArray(data) ? data : []);
    }
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    setInvites([]);
  } finally {
    setIsLoadingInvites(false);
  }
};

  // Vérification de données pour éviter le flash de "Loading..." si on a déjà des données en cache
  const hasData = Boolean(
    sidebarData?.user ||
    (sidebarData?.listServerData && sidebarData.listServerData.length) ||
    (invites.length > 0)
  );

  if (loading && !hasData) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] items-center justify-center">
        <p className="text-[var(--foreground)]">Loading...</p>
      </div>
    );
  }

  if (isCheckingPermissions) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] items-center justify-center">
        <p className="text-[var(--foreground)]">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar data={sidebarData} />

      <main className="flex-1 bg-[var(--color-60)] overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              {serverDetails?.name || 'Server Dashboard'}
            </h1>
            <p className="text-[var(--color-30)]">
              {serverDetails?.description || 'Manage your server settings, channels, and members'}
            </p>
          </div>
          {/* Alert */}
          <Alert message={alert.message} type={alert.type} />

          {/* Navigation Tabs avec tab Invitations */}
          <div className="flex gap-2 mb-6 border-b border-[#334155] flex-wrap">
            <button
              onClick={() => setActiveTab("server")}
              className={`px-6 py-3 font-semibold border-b-2 transition-all ${
                activeTab === "server"
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[var(--color-30)] hover:text-[var(--foreground)]"
              }`}
            >
              Server Settings
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`px-6 py-3 font-semibold border-b-2 transition-all ${
                activeTab === "channels"
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[var(--color-30)] hover:text-[var(--foreground)]"
              }`}
            >
              Channels
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-6 py-3 font-semibold border-b-2 transition-all ${
                activeTab === "members"
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[var(--color-30)] hover:text-[var(--foreground)]"
              }`}
            >
              Members
            </button>
            {/* NOUVELLE TAB INVITATIONS */}
            <button
              onClick={() => setActiveTab("invites")}
              className={`px-6 py-3 font-semibold border-b-2 transition-all ${
                activeTab === "invites"
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[var(--color-30)] hover:text-[var(--foreground)]"
              }`}
            >
              Invitations
            </button>
            {userRole === "OWNER" && (
              <button
                onClick={() => setActiveTab("danger")}
                className={`px-6 py-3 font-semibold border-b-2 transition-all ${
                  activeTab === "danger"
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-[var(--color-30)] hover:text-red-400"
                }`}
              >
                Danger Zone
              </button>
            )}
          </div>
          {/* Content */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[#334155] p-8 shadow-lg">
            {/* Server Settings Tab */}
            {activeTab === "server" && (
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Server Information
                </h2>
                <form onSubmit={handleUpdateServer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#334155] bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[#7c3aed] outline-none transition-all"
                      placeholder="Server name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Description
                    </label>
                    <textarea
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-[#334155] bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[#7c3aed] outline-none transition-all resize-none"
                      placeholder="Server description"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/80 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Channels Tab */}
            {activeTab === "channels" && (
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Manage Channels
                </h2>

                <form onSubmit={handleCreateChannel} className="mb-8 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Create New Channel
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="flex-1 px-4 py-3 border border-[#334155] bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[#7c3aed] outline-none transition-all"
                        placeholder="Channel name"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#7c3aed] hover:bg-[#7c3aed]/80 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </form>

                <div className="space-y-3">
                  {channels.length === 0 ? (
                    <p className="text-[var(--color-30)] text-center py-4">
                      No channels yet
                    </p>
                  ) : (
                    channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-4 bg-[var(--color-60)] rounded-lg border border-[#334155] hover:border-[#7c3aed]/50 transition-all"
                      >
                        {editingChannel === channel.id ? (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[#7c3aed] text-lg font-bold">
                                #
                              </span>
                              <input
                                type="text"
                                value={editChannelName}
                                onChange={(e) =>
                                  setEditChannelName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateChannel(
                                      channel.id,
                                      editChannelName,
                                    );
                                  } else if (e.key === "Escape") {
                                    setEditingChannel(null);
                                    setEditChannelName("");
                                  }
                                }}
                                autoFocus
                                className="flex-1 px-3 py-2 border border-[#334155] bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[#7c3aed] outline-none transition-all"
                                placeholder="Channel name"
                              />
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                onClick={() =>
                                  handleUpdateChannel(
                                    channel.id,
                                    editChannelName,
                                  )
                                }
                                className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#7c3aed]/80 text-white rounded-lg text-sm font-semibold transition-all"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingChannel(null);
                                  setEditChannelName("");
                                }}
                                className="px-3 py-1.5 bg-[var(--color-10)] hover:bg-[#334155] text-[var(--foreground)] rounded-lg text-sm font-semibold transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-[#7c3aed] text-lg font-bold">
                                #
                              </span>
                              <span className="text-[var(--foreground)] font-medium">
                                {channel.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingChannel(channel.id);
                                  setEditChannelName(channel.name);
                                }}
                                className="px-3 py-1.5 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-[#7c3aed] rounded-lg text-sm font-semibold transition-all border border-[#7c3aed]/30"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteChannel(channel.id)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold transition-all border border-red-500/30"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* Members Tab */}
            {activeTab === "members" && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                Manage Members
              </h2>

              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-[var(--color-30)] text-center py-4">
                    No members
                  </p>
                ) : (
                  members
                    .filter((member) => member.role !== "OWNER")
                    .map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 bg-[var(--color-60)] rounded-lg border transition-all ${
                          member.role === "BANNED"
                            ? "border-red-500/30 opacity-60"
                            : "border-[#334155] hover:border-[#7c3aed]"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-xs font-bold">
                            {member.username?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <div>
                            <span className="text-[var(--foreground)] font-medium">
                              {member.username}
                            </span>
                            {member.role === "BANNED" && (
                              <span className="ml-2 text-xs text-red-400 font-semibold">
                                BANNI
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.role !== "BANNED" ? (
                            <>
                              <select
                                value={selectedRole[member.user_id] || member.role || "MEMBER"}
                                onChange={(e) => {
                                  handleUpdateMemberRole(member.user_id, e.target.value);
                                  setSelectedRole({ ...selectedRole, [member.user_id]: e.target.value });
                                }}
                                className="px-4 py-2 bg-[var(--color-10)] text-white rounded-lg border border-[#334155] focus:ring-2 focus:ring-[#7c3aed] outline-none transition-all cursor-pointer"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <button
                                onClick={() => handleBanMember(member.user_id, 300)} // Ban 5 min
                                className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-semibold transition-all border border-orange-500/30"
                              >
                                Ban 5 min
                              </button>
                              <button
                                onClick={() => handleBanMember(member.user_id)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold transition-all border border-red-500/30"
                              >
                                Ban
                              </button>
                              <button
                                onClick={() => handleKickMember(member.user_id)}
                                className="text-red-400 hover:text-red-300 font-semibold transition-all"
                              >
                                Kick
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleUnbanMember(member.user_id)}
                              className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold transition-all border border-green-500/30"
                            >
                              Debannir
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
              {/* Invitations Tab */}
              {activeTab === "invites" && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                      Invitations
                    </h2>
                    <InviteButton serverId={id} userRole={userRole} />
                  </div>

                  <div className="space-y-3">
                    {isLoadingInvites ? (
                      <p className="text-[var(--color-30)] text-center py-8">
                        Loading invitations...
                      </p>
                    ) : invites.length === 0 ? (
                      <div className="text-center py-12 bg-[var(--color-60)]/50 rounded-xl border-2 border-dashed border-[#334155]">
                        <p className="text-[var(--color-30)] mb-4">Aucune invitation</p>
                        <p className="text-sm text-[var(--color-30)]">
                          Créez votre première invitation avec le bouton ci-dessus
                        </p>
                      </div>
                    ) : (
                      invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-6 bg-[var(--color-60)] rounded-xl border border-[#334155] hover:border-[#7c3aed] transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#ec4899] rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {invite.code.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <code className="block font-mono text-lg font-bold text-[var(--foreground)]">
                                {invite.code}
                              </code>
                              <p className="text-sm text-[var(--color-30)]">
                                Utilisations: {invite.uses}/{invite.max_uses || '∞'} • 
                                Expire: {new Date(invite.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/join/${invite.code}`);
                                alert.showSuccess("Lien copié !");
                              }}
                              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#7c3aed]/80 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                              Copier
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Supprimer cette invitation ?")) {
                                  try {
                                    const response = await fetch(`${api}/servers/${id}/invitations/${invite.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include',
                                    });
                                    if (response.ok) {
                                      alert.showSuccess("Invitation supprimée");
                                      fetchInvites();
                                    }
                                  } catch (error) {
                                    alert.showError("Erreur suppression");
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-semibold transition-all border border-red-500/30"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            {/* Danger Zone Tab (Owner only) */}
            {activeTab === "danger" && userRole === "OWNER" && (
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-6">
                  Danger Zone
                </h2>
                <div className="p-4 border border-red-500/50 rounded-lg bg-red-500/10">
                  <p className="text-[var(--foreground)] mb-4">
                    Deleting this server is permanent. All channels and members
                    will be removed.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteServer}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Delete Server
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
