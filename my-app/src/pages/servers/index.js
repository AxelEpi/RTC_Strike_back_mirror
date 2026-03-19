"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSidebarData } from "../../hooks/useSidebarData";
import Sidebar from "../../components/Sidebar/page";

const api = process.env.NEXT_PUBLIC_API_URL;

export default function Layout() {
  const router = useRouter();
  const { sidebarData, loading } = useSidebarData();
  const [serversAll, setServersAll] = useState([]);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const getData = async (path) => {
    try {
      const response = await fetch(`${api}/${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) {
        return result;
      } else {
        console.error(`Error fetching ${path}:`, result);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return null;
    }
  };

  useEffect(() => {
    async function fetchAllServers() {
      try {
        const data = await getData("servers/all");
        const serversData = data ?? [];

        // Enrichir avec les counts
        setLoadingCounts(true);
        const enrichedServers = await Promise.all(
          serversData.map(async (server) => {
            try {
              // Récupérer membres et channels en parallèle
              const [members, channels] = await Promise.all([
                getData(`servers/${server.id}/members`).catch(() => []),
                getData(`servers/${server.id}/channels`).catch(() => []),
              ]);

              return {
                ...server,
                memberCount: Array.isArray(members) ? members.length : 0,
                channelCount: Array.isArray(channels) ? channels.length : 0,
              };
            } catch (error) {
              console.error(
                `Error fetching counts for server ${server.id}:`,
                error,
              );
              return { ...server, memberCount: 0, channelCount: 0 };
            }
          }),
        );

        setServersAll(enrichedServers);
        setLoadingCounts(false);
      } catch (error) {
        console.error("Error fetching all servers:", error);
        setServersAll([]);
        setLoadingCounts(false);
      }
    }
    fetchAllServers();
  }, []);

  async function joinServer(id, userId) {
    try {
      const response = await fetch(`${api}/servers/${id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: userId ? JSON.stringify({ user_id: userId }) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Error joining server ${id}:`, result);
        return null;
      }

      return result;
    } catch (error) {
      console.error(`Error joining server ${id}:`, error);
      return null;
    }
  }

  const handleJoin = async (serverId) => {
    const userId = sidebarData?.user?.id;
    const joined = await joinServer(serverId, userId);
    if (joined) {
      router.push(`/servers/${serverId}`);
    }
  };

  const handleCreateServer = () => {
    router.push("/servers/add-server");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const hasData = Boolean(
    sidebarData?.user ||
    (sidebarData?.listServerData && sidebarData.listServerData.length),
  );

  if (loading && !hasData) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] items-center justify-center">
        <p className="text-[var(--foreground)]">Chargement...</p>
      </div>
    );
  }

  const servers = serversAll ?? [];

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar data={sidebarData} />

      <main className="flex-1 bg-[var(--color-60)] overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Discover Servers
            </h1>
            <p className="text-[var(--color-30)]">
              Join a server to connect with others and explore new communities!
              Browse through the list of available servers and find the perfect
              one for you.
            </p>
          </div>

          {/* Create Server Card */}
          <div
            onClick={handleCreateServer}
            className="bg-[var(--card-bg)] rounded-lg p-4 flex items-center gap-4 border-2 border-dashed border-[var(--color-30)]/40 hover:border-[var(--color-10)] hover:bg-[var(--color-60)]/50 transition cursor-pointer mb-4 group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-10)] group-hover:bg-[var(--color-10-hover)] text-white font-bold text-2xl shadow-lg flex-shrink-0 transition">
              +
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Create New Server
              </h3>
              <p className="text-xs text-[var(--color-30)]">
                Create your own server and invite your friends
              </p>
            </div>
          </div>

          {/* Servers List */}
          <div className="space-y-2">
            {servers.length === 0 ? (
              <div className="bg-[var(--card-bg)] rounded-lg p-8 text-center border border-[var(--color-30)]/20">
                <p className="text-[var(--color-30)]">
                  Aucun serveur disponible
                </p>
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server.id}
                  className="bg-[var(--card-bg)] rounded-lg p-3 flex items-center gap-3 hover:bg-[var(--color-60)]/50 transition border border-[var(--color-30)]/20 hover:border-[var(--color-30)]/40"
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0"
                    style={{ backgroundColor: getRandomColor(server.name) }}
                  >
                    {getInitials(server.name)}
                  </div>

                  {/* Name & Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--foreground)] truncate">
                      {server.name}
                    </h3>
                    <p className="text-xs text-[var(--color-30)] truncate">
                      {server.description || "Aucune description"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[var(--color-30)] flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {server.memberCount || 0} membres
                      </span>
                      <span className="text-xs text-[var(--color-30)]">
                        {server.channelCount || 0} channels
                      </span>
                    </div>
                  </div>

                  {/* Join Button */}
                  {server?.role === "BANNED" || server?.isBanned ? (
                    <button
                      disabled
                      className="px-5 py-1.5 bg-[#334155]/60 text-[var(--color-30)] text-sm font-medium rounded-lg transition flex-shrink-0 cursor-not-allowed"
                    >
                      Banned
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(server.id)}
                      className="px-5 py-1.5 bg-[var(--color-10)] hover:bg-[var(--color-10-hover)] text-white text-sm font-medium rounded-lg transition flex-shrink-0"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
