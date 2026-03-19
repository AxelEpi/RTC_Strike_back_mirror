import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function Sidebar({ data, onChannelSelect, selectedChannelId }) {
  // Sécurisation des données
  const serverDetails = data?.serverDetails || null;
  const user = data?.user || null;
  const channels = data?.channels || [];
  const servers = data?.listServerData || [];

  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const userMenuRef = useRef(null);
  const serverMenuRef = useRef(null);

  const { id: activeServerId } = router.query;
  const activeServerIdRef = useRef(activeServerId);

  useEffect(() => {
    activeServerIdRef.current = activeServerId;
  }, [activeServerId]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsUserMenuOpen(false);
      window.location.href = "/auth/login";
    }
  };

  const handleLeaveServer = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${activeServerId}/leave`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setIsServerMenuOpen(false);
        router.push("/servers");
      } else {
        console.error("Failed to leave server:", response.statusText);
      }
    } catch (error) {
      console.error("Leave server error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        serverMenuRef.current &&
        !serverMenuRef.current.contains(event.target)
      ) {
        setIsServerMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsServerMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isServerMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen, isServerMenuOpen]);

  // ✅ Source de vérité = URL

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!activeServerId) {
        setUserRole(null);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servers/${activeServerId}/members/me`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || null);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };

    fetchUserRole();
  }, [activeServerId]);

  return (
    <div className="flex h-screen">
      {/* ============================= */}
      {/* Liste des serveurs (gauche) */}
      {/* ============================= */}
      <div className="w-12 md:w-16 bg-[var(--card-bg)] flex flex-col items-center py-3 md:py-4 gap-2 md:gap-3 border-r border-[#334155] shadow-sm">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => router.push(`/servers/${server.id}`)}
            className={`btn-server w-8 md:w-10 h-8 md:h-10 rounded-lg flex items-center justify-center font-bold text-white text-xs md:text-sm transition-all shadow-md hover:shadow-lg border ${
              activeServerId === server.id
                ? "ring-2 ring-[#7c3aed] scale-105 border-[#7c3aed]"
                : "hover:scale-105 opacity-90 hover:opacity-100 border-[#334155]/50 hover:border-[#7c3aed]/60"
            }`}
            title={server.name.toUpperCase()}
            style={{ backgroundColor: server.color }}
          >
            {server.name.toUpperCase()
              ? server.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "?"}
          </button>
        ))}

        {/* Bouton Ajouter */}
        <button
          className={`w-8 md:w-10 h-8 md:h-10 rounded-lg border-2 border-dashed flex items-center justify-center text-[#7c3aed] hover:scale-105 transition-all mt-2 font-bold text-lg md:text-xl ${
            router.pathname === "/servers" && !router.query.id
              ? "border-[#7c3aed] bg-[#7c3aed]/20 ring-2 ring-[#7c3aed] scale-105"
              : "border-[#7c3aed]/40 hover:border-[#7c3aed] hover:bg-[#7c3aed]/10"
          }`}
          onClick={() => router.push("/servers")}
        >
          +
        </button>
      </div>

      {/* ============================= */}
      {/* Sidebar principale */}
      {/* ============================= */}
      <div className="w-52 md:w-60 h-screen bg-[var(--card-bg)] flex flex-col border-r border-[#334155] shadow-sm">
        {/* Header serveur */}
        {activeServerId && (
          <div ref={serverMenuRef} className="relative">
            {isServerMenuOpen && (
              <div className="absolute top-14 left-0 right-0 bg-[var(--card-bg)] border border-[#334155] shadow-xl rounded-lg overflow-hidden z-50">
                {(userRole === "OWNER" || userRole === "ADMIN") && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/servers/dashboard/${activeServerId}`);
                      setIsServerMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--color-60)] transition flex items-center gap-2 border-b border-[#334155]"
                  >
                    <svg
                      className="w-4 h-4 text-[#7c3aed]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                    Server Settings
                  </button>
                )}
                {userRole !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleLeaveServer();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-400 hover:bg-red-600/20 transition flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Leave Server
                  </button>
                )}
              </div>
            )}

            <div
              onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
              className="h-12 md:h-14 px-3 md:px-5 flex items-center border-b border-[#334155] hover:bg-[var(--color-60)] cursor-pointer transition-all shadow-sm"
            >
              <span className="text-[var(--foreground)] font-bold text-sm md:text-base tracking-wide truncate">
                {serverDetails?.name.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* ============================= */}
        {/* Channels */}
        {/* ============================= */}
        <div className="flex-1 overflow-y-auto px-2 py-4 md:py-6">
          {channels.length !== 0 && (
            <div className="mt-2 md:mt-4 px-2 mb-2 md:mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-30)]">
              Channels
            </div>
          )}

          {channels.map((channel) => (
            <div key={channel.id} className="mb-1">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChannelSelect && onChannelSelect(channel.id);
                }}
                className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg cursor-pointer transition-all group ${
                  selectedChannelId === channel.id
                    ? "bg-[#7c3aed]/20 text-[var(--foreground)]"
                    : "hover:bg-[var(--color-60)] text-[var(--color-30)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="text-[#7c3aed] text-base md:text-lg font-bold group-hover:scale-110 transition-transform">
                  #
                </span>
                <span className="text-xs md:text-sm font-semibold truncate">
                  {channel.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ============================= */}
        {/* User panel */}
        {/* ============================= */}

        <div className="relative" ref={userMenuRef}>
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 h-16 bg-red-600/20 border border-red-500/60 shadow-xl flex items-center px-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-full rounded-lg text-left px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-red-600/20 transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}

          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="w-full h-14 md:h-16 px-2 md:px-3 py-2 bg-gradient-to-r from-[var(--color-60)] to-[var(--card-bg)] border-t border-[#334155] flex items-center gap-2 md:gap-3 shadow-inner"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg">
              {user?.username
                ? user.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "??"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--foreground)] text-left truncate text-xs md:text-sm">
                {user?.username || "Utilisateur"}
              </p>
            </div>

            {/* Settings */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                router.push("/auth/update");
              }}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-[#7c3aed]/20 text-[var(--color-30)] hover:text-[#7c3aed] transition-all hover:scale-105 cursor-pointer"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
