import { useCallback, useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../api/publisherApi";
import EventCard from "./EventCard";
import EventDetailsModal from "./EventDetailsModal";
import "../styles/upcomingEvents.css";

const UTSC_TIME_ZONE = "America/Toronto";

export const getUtscDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: UTSC_TIME_ZONE,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const getUtscOffsetMilliseconds = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: UTSC_TIME_ZONE,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return representedAsUtc - date.getTime();
};

export const millisecondsUntilNextUtscDay = (now = new Date()) => {
  const [year, month, day] = getUtscDateKey(now).split("-").map(Number);
  const nextDateAsUtc = Date.UTC(year, month - 1, day + 1);
  const offset = getUtscOffsetMilliseconds(new Date(nextDateAsUtc));
  const nextMidnight = nextDateAsUtc - offset;

  return Math.max(1000, nextMidnight - now.getTime() + 100);
};

export const prepareUpcomingEvents = (events, now = new Date()) => {
  const today = getUtscDateKey(now);

  return events
    .filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate || ""))
    .filter((event) => event.eventDate >= today)
    .sort((first, second) => {
      const dateComparison = first.eventDate.localeCompare(second.eventDate);
      if (dateComparison !== 0) return dateComparison;

      return (first.startTime || "99:99").localeCompare(
        second.startTime || "99:99"
      );
    });
};

export const formatEventDate = (date) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  if (!match) return date || "Date to be announced";

  const dateAtNoonUtc = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  );

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateAtNoonUtc);
};

export const formatEventTime = (time) => {
  if (!/^\d{2}:\d{2}$/.test(time || "")) return time || "";

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const formatEventTimeRange = (event) => {
  const start = formatEventTime(event.startTime);
  const end = formatEventTime(event.endTime);

  if (start && end) return `${start} – ${end}`;
  return start || end || "Time to be announced";
};

export default function UpcomingEvents() {
  const [state, setState] = useState({ status: "loading", events: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchUpcomingEvents(controller.signal)
      .then((events) =>
        setState({ status: "success", events: prepareUpcomingEvents(events) })
      )
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", events: [] });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let timeoutId;

    const scheduleNextDay = () => {
      timeoutId = window.setTimeout(() => {
        setState((current) =>
          current.status === "success"
            ? { ...current, events: prepareUpcomingEvents(current.events) }
            : current
        );
        scheduleNextDay();
      }, millisecondsUntilNextUtscDay());
    };

    scheduleNextDay();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const closeModal = useCallback(() => setSelectedEvent(null), []);

  return (
    <section id="upcoming-events" aria-labelledby="upcoming-events-title">
      <div className="upcoming-events__heading">
        <p className="upcoming-events__eyebrow">What's happening</p>
        <h2 id="upcoming-events-title">Upcoming Events</h2>
        <p>Join the UTSC MSA at our upcoming programs and community events.</p>
      </div>

      {state.status === "loading" && (
        <p className="upcoming-events__status" role="status">
          Loading upcoming events…
        </p>
      )}

      {state.status === "error" && (
        <p className="upcoming-events__status" role="status">
          We couldn't load upcoming events. Check{" "}
          <a href="https://instagram.com/msa_utsc" target="_blank" rel="noreferrer">
            @msa_utsc
          </a>{" "}
          for the latest announcements.
        </p>
      )}

      {state.status === "success" && state.events.length === 0 && (
        <p className="upcoming-events__status">
          No upcoming events have been published yet. Check{" "}
          <a href="https://instagram.com/msa_utsc" target="_blank" rel="noreferrer">
            @msa_utsc
          </a>{" "}
          for new announcements.
        </p>
      )}

      {state.status === "success" && state.events.length > 0 && (
        <div className="upcoming-events__grid">
          {state.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => setSelectedEvent(event)}
              formatDate={formatEventDate}
              formatTimeRange={formatEventTimeRange}
            />
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={closeModal}
          formatDate={formatEventDate}
          formatTimeRange={formatEventTimeRange}
        />
      )}
    </section>
  );
}
