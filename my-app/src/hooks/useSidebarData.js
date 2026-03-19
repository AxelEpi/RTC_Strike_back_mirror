import { useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL;

export const useSidebarData = (serverId = null) => {
  const [sidebarData, setSidebarData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        if (serverId) {
          // Fetch data for a specific server
          const [userData, listServerData, serverData, channelsData] =
            await Promise.all([
              getData("me"),
              getData("servers"),
              getData(`servers/${serverId}`),
              getData(`servers/${serverId}/channels`),
            ]);

          // Extraire les channels du bon endroit
          let channels = [];

          if (Array.isArray(channelsData)) {
            channels = channelsData;
          } else if (channelsData?.data && Array.isArray(channelsData.data)) {
            channels = channelsData.data;
          } else if (
            channelsData?.channels &&
            Array.isArray(channelsData.channels)
          ) {
            channels = channelsData.channels;
          }

          setSidebarData({
            listServerData: listServerData,
            serverDetails: serverData,
            user: userData?.data ?? userData ?? null,
            channels: channels,
          });
        } else {
          // Fetch general sidebar data (sans serverId - pour pages like update)
          const [userData, listServerData] = await Promise.all([
            getData("me"),
            getData("servers"),
          ]);
          setSidebarData({
            listServerData: listServerData?.data ?? listServerData ?? [],
            user: userData?.data ?? userData ?? null,
          });
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
        setSidebarData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [serverId]);

  return { sidebarData, loading };
};

async function getData(path) {
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
}
