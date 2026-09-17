import { fireEvent, render, screen } from "@testing-library/react";
import JummahInfo from "./components/JummahInfo";
import UpcomingEvents, {
  millisecondsUntilNextUtscDay,
  prepareUpcomingEvents,
} from "./components/UpcomingEvents";
import { fetchJummah, fetchUpcomingEvents } from "./api/publisherApi";

jest.mock("./api/publisherApi", () => ({
  fetchJummah: jest.fn(),
  fetchUpcomingEvents: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders a configured Jumu'ah session", async () => {
  fetchJummah.mockResolvedValue({
    firstStartTime: "13:30",
    firstEndTime: "14:00",
    firstLocation: "HW 305",
    secondStartTime: null,
    secondEndTime: null,
    secondLocation: null,
    isOffered: true,
  });

  render(<JummahInfo />);

  expect(await screen.findByText("1:30 PM – 2:00 PM")).toBeInTheDocument();
  expect(screen.getByText("HW 305")).toBeInTheDocument();
});

test("renders the publisher's unavailable message", async () => {
  fetchJummah.mockResolvedValue({
    isOffered: false,
    unavailableMessage: "Jumu'ah is not offered during reading week.",
  });

  render(<JummahInfo />);

  expect(
    await screen.findByText("Jumu'ah is not offered during reading week.")
  ).toBeInTheDocument();
});

test("shows only the first image on a card and the carousel in the full view", async () => {
  fetchUpcomingEvents.mockResolvedValue([
    {
      id: "event-1",
      title: "Community Dinner",
      description: "A full event description for the community dinner.",
      eventDate: "2099-09-19",
      startTime: "18:00",
      endTime: "20:00",
      imageUrls: ["https://example.com/first.jpg", "https://example.com/second.jpg"],
    },
  ]);

  render(<UpcomingEvents />);

  await screen.findByText("Community Dinner");
  const cardImage = screen.getByRole("img", {
    name: /Community Dinner event poster/i,
  });
  expect(cardImage).toHaveAttribute("src", "https://example.com/first.jpg");
  expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "View details for Community Dinner" })
  );

  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Previous image" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next image" })).toBeInTheDocument();
});

test("renders an empty upcoming-events state", async () => {
  fetchUpcomingEvents.mockResolvedValue([]);

  render(<UpcomingEvents />);

  expect(
    await screen.findByText(/No upcoming events have been published yet/i)
  ).toBeInTheDocument();
});

test("keeps today's events, removes past dates, and sorts by date then start time", () => {
  const events = [
    { id: "tomorrow", eventDate: "2026-09-18", startTime: "09:00" },
    { id: "today-later", eventDate: "2026-09-17", startTime: "18:00" },
    { id: "past", eventDate: "2026-09-16", startTime: "23:00" },
    { id: "today-earlier", eventDate: "2026-09-17", startTime: "10:00" },
  ];

  const prepared = prepareUpcomingEvents(
    events,
    new Date("2026-09-17T23:30:00Z")
  );

  expect(prepared.map(({ id }) => id)).toEqual([
    "today-earlier",
    "today-later",
    "tomorrow",
  ]);
});

test("removes an event when the next Toronto calendar day begins", () => {
  const events = [
    { id: "today", eventDate: "2026-09-17", startTime: "08:00" },
  ];

  expect(
    prepareUpcomingEvents(events, new Date("2026-09-18T03:59:59Z"))
  ).toHaveLength(1);
  expect(
    prepareUpcomingEvents(events, new Date("2026-09-18T04:00:00Z"))
  ).toHaveLength(0);
  expect(
    millisecondsUntilNextUtscDay(new Date("2026-09-18T03:59:59Z"))
  ).toBe(1100);
});
