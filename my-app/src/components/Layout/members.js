"use client";
import { useMemo, useState } from "react";

export default function Sidebar({ data }) {
  const [selectedUser, setSelectedUser] = useState(null);

  // Group members by role
  const membersByRole = useMemo(() => {
    if (!Array.isArray(data))
      return { owner: [], admin: [], members: [], offlines: [] };

    const grouped = {
      owner: [],
      admin: [],
      members: [],
      offlines: [],
    };

    data.forEach((member) => {
      const now = new Date();
      const tokenExpiresAt = member.token_expires_at
        ? new Date(member.token_expires_at)
        : null;
      const isInvalidDate =
        tokenExpiresAt && Number.isNaN(tokenExpiresAt.getTime());
      const isOffline =
        !tokenExpiresAt || isInvalidDate || tokenExpiresAt < now;

      if (isOffline) {
        grouped.offlines.push({ ...member, isOffline: true, isOnline: false });
        return;
      }

      const role = member.role?.toUpperCase();
      const onlineMember = { ...member, isOffline: false, isOnline: true };
      if (role === "OWNER") {
        grouped.owner.push(onlineMember);
      } else if (role === "ADMIN") {
        grouped.admin.push(onlineMember);
      } else {
        grouped.members.push(onlineMember);
      }
    });

    return grouped;
  }, [data]);

  const getRoleColor = (role, isOffline) => {
    if (isOffline) return "#475569";
    const roleUpper = role?.toUpperCase();
    switch (roleUpper) {
      case "OWNER":
        return "#ff6b6b";
      case "ADMIN":
        return "#7c3aed";
      default:
        return "#64748b";
    }
  };

  const getInitials = (username) => {
    if (!username) return "?";
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role) => {
    const roleUpper = role?.toUpperCase();
    const colors = {
      OWNER: "bg-red-500/20 text-red-300",
      ADMIN: "bg-purple-500/20 text-purple-300",
      MEMBER: "bg-slate-500/20 text-slate-300",
    };
    return colors[roleUpper] || colors["MEMBER"];
  };

  const MemberCard = ({ username, role, isOffline, isOnline, onClick }) => {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 bg-[var(--card-bg)] hover:bg-[var(--color-60)] transition-all cursor-pointer rounded-lg border border-[#334155]/30 hover:border-[#7c3aed]/50 hover:shadow-sm group ${isOffline ? "opacity-60" : ""}`}
      >
        <div
          className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
          style={{ backgroundColor: getRoleColor(role, isOffline) }}
        >
          {getInitials(username)}
        </div>
        <p
          className="text-xs md:text-sm font-semibold truncate flex-1"
          style={{ color: getRoleColor(role, isOffline) }}
        >
          {username}
        </p>
        {isOnline && !isOffline && (
          <span className="text-[10px] px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
            Online
          </span>
        )}
        {isOffline && (
          <span className="text-[10px] px-1.5 md:px-2 py-0.5 rounded-full bg-[#334155]/40 text-[var(--color-30)] font-semibold">
            Offline
          </span>
        )}
      </div>
    );
  };

  const UserModal = ({ user, onClose }) => {
    if (!user) return null;

    console.log("User data in modal:", user);

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[#334155] shadow-2xl overflow-hidden">
            {/* Header avec avatar */}
            <div className="relative h-24 bg-gradient-to-br from-[#7c3aed]/20 to-[#334155]/20">
              <div className="absolute -bottom-12 left-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-[var(--card-bg)]"
                  style={{
                    backgroundColor: getRoleColor(user.role, user.isOffline),
                  }}
                >
                  {getInitials(user.username)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 px-6 pb-6">
              {/* Username et statut */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">
                    {user.username}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getRoleBadge(user.role)}`}
                    >
                      {user.role?.toUpperCase() || "MEMBER"}
                    </span>
                    {user.isOnline && !user.isOffline ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-[#334155]/40 text-[var(--color-30)] font-semibold">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-[var(--color-30)] uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">
                  {user.description || "No description"}
                </p>
              </div>

              {/* Servers */}
              {user.servers && user.servers.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[var(--color-30)] uppercase tracking-wider mb-2">
                    Servers ({user.servers.length})
                  </h3>
                  <div className="space-y-2">
                    {user.servers.map((server, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-60)] rounded-lg border border-[#334155]/30"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#ff6b6b] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {server.name ? server.name[0].toUpperCase() : "S"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {server.name || "Server"}
                          </p>
                          {server.role && (
                            <p className="text-xs text-[var(--color-30)]">
                              {server.role}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member since */}
              {user.joined_at && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[var(--color-30)] uppercase tracking-wider mb-2">
                    Member since
                  </h3>
                  <p className="text-sm text-[var(--foreground)]/80">
                    {new Date(user.joined_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 bg-[var(--color-60)] hover:bg-[#7c3aed]/20 text-[var(--foreground)] rounded-lg font-semibold transition-colors border border-[#334155]/30 hover:border-[#7c3aed]/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const Section = ({ title, members, role }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold text-[var(--color-30)] uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs text-[var(--color-30)] font-semibold">
          {members.length}
        </span>
      </div>
      <div className="space-y-1">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            username={member.username}
            role={role}
            isOffline={member.isOffline}
            isOnline={member.isOnline}
            onClick={() => setSelectedUser(member)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="w-56 md:w-64 h-screen bg-[var(--card-bg)] border-l border-[#334155] p-3 md:p-4 overflow-y-auto shadow-sm">
        {membersByRole.owner.length > 0 && (
          <Section title="Owner" members={membersByRole.owner} role="owner" />
        )}
        {membersByRole.admin.length > 0 && (
          <Section title="Admins" members={membersByRole.admin} role="admin" />
        )}
        {membersByRole.members.length > 0 && (
          <Section
            title="Members"
            members={membersByRole.members}
            role="member"
          />
        )}
        {membersByRole.offlines.length > 0 && (
          <Section
            title="Offline"
            members={membersByRole.offlines}
            role="member"
          />
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
