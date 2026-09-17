import { useEffect } from "react";
import "../styles/PrayertimesWidget.css";
import JummahInfo from "./JummahInfo";

export default function PrayertimesWidget() {
  useEffect(() => {
    // Check if script already exists to avoid duplicates
    if (document.querySelector('script[src="https://masjidbox.com/widgets/loader.js"]')) {
      return;
    }

    // Use the responsive script loading approach
    const asyncLoad = () => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.src = 'https://masjidbox.com/widgets/loader.js';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);
    };

    // Load script based on window state
    if (window.attachEvent) {
      window.attachEvent('onload', asyncLoad);
    } else {
      window.addEventListener('load', asyncLoad, false);
    }

    return () => {
      // Cleanup event listeners if needed
      if (window.removeEventListener) {
        window.removeEventListener('load', asyncLoad, false);
      }
    };
  }, []);

  return (
    <div className="prayertimes-container">
      <a
        data-masjidbox-widget="ZTMbjjTkDN8jIyWxfZ9IS"
        data-masjidbox-ifr
        href="https://masjidbox.com/prayer-times/university-of-toronto-scarborough-muslim-student-association"
      >
        Prayer times University of Toronto Scarborough Muslim Student Association
      </a>
      
      <div className="jummah-info">
        <JummahInfo />
        <p>
          Any updates will be posted{" "}
          <a 
            href="https://instagram.com/msa_utsc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="instagram-link"
          >
            @msa_utsc
          </a>
        </p>
        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSdmpU9pSxBCV51KkPSZkE3rtR4RqZYwFqcgUaZNBSzLTOCM7A/viewform"
          className="feedback-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jumu'ah Feedback
        </a>
      </div>
    </div>
  );
}
