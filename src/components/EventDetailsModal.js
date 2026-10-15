import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const getFocusableElements = (container) =>
  Array.from(
    container.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
  );

export default function EventDetailsModal({
  event,
  onClose,
  formatDate,
  formatTimeRange,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState([]);
  const imageUrls = Array.isArray(event.imageUrls)
    ? event.imageUrls.filter(Boolean)
    : [];

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        onClose();
        return;
      }

      if (keyboardEvent.key !== "Tab" || !dialogRef.current) return;

      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const showPrevious = () => {
    setImageIndex((current) => (current - 1 + imageUrls.length) % imageUrls.length);
  };

  const showNext = () => {
    setImageIndex((current) => (current + 1) % imageUrls.length);
  };

  const currentImageFailed = failedImages.includes(imageIndex);

  return createPortal(
    <div className="event-modal" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="event-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="event-modal__close"
          onClick={onClose}
          aria-label="Close event details"
        >
          ×
        </button>

        <div className="event-modal__media">
          {imageUrls.length > 0 && !currentImageFailed ? (
            <img
              src={imageUrls[imageIndex]}
              alt={`${event.title} event poster`}
              onError={() => setFailedImages((failed) => [...failed, imageIndex])}
            />
          ) : (
            <div className="event-image-fallback">Event image unavailable</div>
          )}

          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                className="event-modal__arrow event-modal__arrow--previous"
                onClick={showPrevious}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="event-modal__arrow event-modal__arrow--next"
                onClick={showNext}
                aria-label="Next image"
              >
                ›
              </button>
              <span className="event-modal__image-count" aria-live="polite">
                {imageIndex + 1} / {imageUrls.length}
              </span>
            </>
          )}
        </div>

        <div
          className="event-modal__content"
          role="region"
          aria-label="Event description"
          tabIndex={0}
        >
          <p className="event-modal__date">
            {formatDate(event.eventDate)} · {formatTimeRange(event)}
          </p>
          <h2 id="event-modal-title">{event.title}</h2>
          {event.description && <p>{event.description}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
