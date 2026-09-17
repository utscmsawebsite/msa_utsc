import { useEffect, useState } from "react";
import { fetchJummah } from "../api/publisherApi";
import "../styles/jummahInfo.css";

export const formatPublisherTime = (time) => {
  if (!/^\d{2}:\d{2}$/.test(time || "")) return time || "";

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

const Session = ({ label, startTime, endTime, location }) => (
  <div className="jummah-schedule__session">
    <h3>{label}</h3>
    <p className="jummah-schedule__time">
      {formatPublisherTime(startTime)}
      {endTime ? ` – ${formatPublisherTime(endTime)}` : ""}
    </p>
    <p className="jummah-schedule__location">{location}</p>
  </div>
);

export default function JummahInfo() {
  const [state, setState] = useState({ status: "loading", jummah: null });

  useEffect(() => {
    const controller = new AbortController();

    fetchJummah(controller.signal)
      .then((jummah) => setState({ status: "success", jummah }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", jummah: null });
        }
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p className="jummah-schedule__status">Loading Jumu'ah information…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="jummah-schedule__status" role="status">
        We couldn't load the latest Jumu'ah information. Check Instagram or
        WhatsApp for updates.
      </p>
    );
  }

  if (!state.jummah) {
    return (
      <p className="jummah-schedule__status">
        Jumu'ah information has not been configured yet. Check Instagram or
        WhatsApp for updates.
      </p>
    );
  }

  if (!state.jummah.isOffered) {
    return (
      <p className="jummah-schedule__status">
        {state.jummah.unavailableMessage ||
          "Jumu'ah is not being offered at this time."}
      </p>
    );
  }

  const hasFirstSession =
    state.jummah.firstStartTime && state.jummah.firstLocation;
  const hasSecondSession =
    state.jummah.secondStartTime && state.jummah.secondLocation;

  if (!hasFirstSession) {
    return (
      <p className="jummah-schedule__status">
        Jumu'ah information has not been fully configured yet. Check Instagram
        or WhatsApp for updates.
      </p>
    );
  }

  return (
    <section className="jummah-schedule" aria-labelledby="jummah-schedule-title">
      <h2 id="jummah-schedule-title">Jumu'ah Schedule</h2>
      <div className="jummah-schedule__sessions">
        <Session
          label={hasSecondSession ? "First Jumu'ah" : "Jumu'ah"}
          startTime={state.jummah.firstStartTime}
          endTime={state.jummah.firstEndTime}
          location={state.jummah.firstLocation}
        />
        {hasSecondSession && (
          <Session
            label="Second Jumu'ah"
            startTime={state.jummah.secondStartTime}
            endTime={state.jummah.secondEndTime}
            location={state.jummah.secondLocation}
          />
        )}
      </div>
    </section>
  );
}

