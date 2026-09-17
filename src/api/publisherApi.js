const PUBLISHER_BASE_URL =
  process.env.REACT_APP_PUBLISHER_URL || "https://msa-publisher.vercel.app";

const getJson = async (path, signal) => {
  const response = await fetch(`${PUBLISHER_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`Publisher request failed with status ${response.status}`);
  }

  return response.json();
};

export const fetchJummah = async (signal) => {
  const data = await getJson("/api/jummah", signal);
  return data?.jummah ?? null;
};

export const fetchUpcomingEvents = async (signal) => {
  const data = await getJson("/api/events", signal);
  return Array.isArray(data?.events) ? data.events : [];
};

