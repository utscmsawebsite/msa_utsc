import { useState } from "react";

export default function EventCard({ event, onOpen, formatDate, formatTimeRange }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrls = Array.isArray(event.imageUrls)
    ? event.imageUrls.filter(Boolean)
    : [];
  const firstImage = imageUrls[0];

  return (
    <article className="upcoming-event-card">
      <button
        type="button"
        onClick={onOpen}
        className="upcoming-event-card__button"
        aria-label={`View details for ${event.title}`}
      />
      <div className="upcoming-event-card__media">
        {firstImage && !imageFailed ? (
          <img
            src={firstImage}
            alt={`${event.title} event poster`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="event-image-fallback">Event image unavailable</div>
        )}
        {imageUrls.length > 1 && (
          <span className="upcoming-event-card__image-count">
            {imageUrls.length} photos
          </span>
        )}
      </div>
      <div className="upcoming-event-card__content">
        <p className="upcoming-event-card__date">
          {formatDate(event.eventDate)} · {formatTimeRange(event)}
        </p>
        <h3>{event.title}</h3>
        {event.description && (
          <p className="upcoming-event-card__description">{event.description}</p>
        )}
        <span className="upcoming-event-card__action">View details</span>
      </div>
    </article>
  );
}
