"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/page";
import Members from "../../components/Layout/members";
import ChatBox from "../../components/Chat/page";
const api = process.env.NEXT_PUBLIC_API_URL;
console.log("🌍 API:", api);

export default function Layout() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState(null);
  const [sidebarData, setSidebarData] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  useEffect(() => {
    if (!id) {
      console.log("No id, returning");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const [
          userData,
          listServerData,
          serverData,
          channelsData,
          membersData,
        ] = await Promise.all([
          getData("me"),
          getData("servers"),
          getData(`servers/${id}`),
          getData(`servers/${id}/channels`),
          getData(`servers/${id}/members`),
        ]);

        console.log("=== DONNÉES RÉCUPÉRÉES ===");
        console.log("userData:", userData);
        console.log("listServerData:", listServerData);
        console.log("serverData:", serverData);
        console.log("channelsData BRUT:", channelsData);
        console.log("channelsData type:", typeof channelsData);
        console.log("channelsData.data:", channelsData?.data);
        console.log("membersData:", membersData);

        // Extraire les channels du bon endroit
        let channels = null;

        // Cas 1: channelsData est un tableau direct
        if (Array.isArray(channelsData)) {
          console.log("✅ channelsData est un tableau direct");
          channels = channelsData;
        }
        // Cas 2: channelsData.data est un tableau
        else if (channelsData?.data && Array.isArray(channelsData.data)) {
          console.log("✅ channelsData.data est un tableau");
          channels = channelsData.data;
        }
        // Cas 3: channelsData.channels est un tableau
        else if (
          channelsData?.channels &&
          Array.isArray(channelsData.channels)
        ) {
          console.log("✅ channelsData.channels est un tableau");
          channels = channelsData.channels;
        } else {
          console.error("❌ Format de channelsData non reconnu:", channelsData);
          channels = [];
        }

        console.log("📋 Channels extraits:", channels);
        console.log("📊 Nombre de channels:", channels.length);

        if (channels.length > 0) {
          console.log("📝 Premier channel:", channels[0]);
        }

        setSidebarData({
          listServerData: listServerData,
          serverDetails: serverData,
          user: userData?.data,
          channels: channels, // Utiliser les channels extraits
        });

        setMembers(membersData);

        // Sélectionner automatiquement le premier channel si aucun n'est sélectionné
        if (channels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(channels[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSidebarData(null);
        setMembers(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  async function getData(path) {
    try {
      console.log("🌍 API VALUE:", api, typeof api);
      console.log("🌍 FULL URL:", `${api}/${path}`);

      console.log(`🔍 Fetching: ${api}/${path}`);

      const response = await fetch(`${api}/${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await response.json();
      console.log(`✅ Response for ${path}:`, result);

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
  }

  if (!id || loading || !sidebarData) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] items-center justify-center">
        <p className="text-[var(--foreground)]">Chargement...</p>
      </div>
    );
  }

  const selectedChannel = sidebarData?.channels?.find(
    (c) => c.id === selectedChannelId,
  );
  const channelName = selectedChannel?.name || "general";

  console.log("=== RENDU FINAL ===");
  console.log("sidebarData.channels:", sidebarData?.channels);
  console.log("Channel sélectionné ID:", selectedChannelId);
  console.log("Channel sélectionné name:", channelName);

  return (
    <div className="flex min-h-screen bg-[var(--background)] relative">
      {/* Sidebar - cachée sur mobile, visible sur tablette et desktop */}
      <div className="hidden md:block">
        <Sidebar
          data={sidebarData}
          onChannelSelect={setSelectedChannelId}
          selectedChannelId={selectedChannelId}
        />
      </div>

      {/* Chat principal - prend tout l'écran sur mobile */}
      <main className="flex-1 w-full md:w-auto">
        {selectedChannelId ? (
          <ChatBox
            key={`${id}-${selectedChannelId}`}
            serverId={id}
            channelId={selectedChannelId}
            channelName={channelName}
          />
        ) : (
          <div className="flex items-center justify-center h-full flex-col gap-4">
            <p className="text-gray-400">Aucun channel disponible</p>
          </div>
        )}
      </main>

      {/* Members - caché sur mobile et tablette, visible sur desktop */}
      <div className="hidden xl:block">
        <Members data={members} />
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
