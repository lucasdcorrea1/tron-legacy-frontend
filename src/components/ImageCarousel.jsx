import { useState, useEffect, useRef, useCallback } from 'react';
import { getImageUrl } from '../services/api';
import './ImageCarousel.css';

export default function ImageCarousel({
  images = [],
  legacyImage = '',
  size = 'card',
  showControls = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = '',
  alt = '',
}) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Build resolved image URLs from group_ids or legacy image
  const resolvedImages = [];
  if (images && images.length > 0) {
    images.forEach((groupId) => {
      resolvedImages.push(getImageUrl(groupId, size));
    });
  } else if (legacyImage) {
    resolvedImages.push(getImageUrl(legacyImage));
  }

  const total = resolvedImages.length;
  const hasMultiple = total > 1;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (autoPlay && hasMultiple) {
      autoPlayRef.current = setInterval(next, autoPlayInterval);
      return () => clearInterval(autoPlayRef.current);
    }
  }, [autoPlay, hasMultiple, next, autoPlayInterval]);

  // Pause autoplay on interaction
  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const resumeAutoPlay = () => {
    if (autoPlay && hasMultiple) {
      autoPlayRef.current = setInterval(next, autoPlayInterval);
    }
  };

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    pauseAutoPlay();
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    const threshold = 50;
    if (touchDelta < -threshold) next();
    else if (touchDelta > threshold) prev();
    setTouchStart(null);
    setTouchDelta(0);
    setIsDragging(false);
    resumeAutoPlay();
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    if (!hasMultiple) return;
    pauseAutoPlay();
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (touchStart === null || !isDragging) return;
    const delta = e.clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleMouseUp = () => {
    if (touchStart === null) return;
    const threshold = 50;
    if (touchDelta < -threshold) next();
    else if (touchDelta > threshold) prev();
    setTouchStart(null);
    setTouchDelta(0);
    setIsDragging(false);
    resumeAutoPlay();
  };

  if (total === 0) return null;

  const trackOffset = -current * 100 + (hasMultiple && isDragging ? (touchDelta / (trackRef.current?.offsetWidth || 1)) * 100 : 0);

  return (
    <div
      className={`carousel ${className}`}
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      <div
        className="carousel-viewport"
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchMove={hasMultiple ? handleTouchMove : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        onMouseDown={hasMultiple ? handleMouseDown : undefined}
        onMouseMove={hasMultiple ? handleMouseMove : undefined}
        onMouseUp={hasMultiple ? handleMouseUp : undefined}
        onMouseLeave={isDragging ? handleMouseUp : undefined}
      >
        <div
          ref={trackRef}
          className="carousel-track"
          style={{
            transform: `translateX(${trackOffset}%)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
        >
          {resolvedImages.map((src, i) => (
            <div key={i} className="carousel-slide">
              <img
                src={src}
                alt={alt || `Image ${i + 1}`}
                draggable="false"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {showControls && hasMultiple && (
        <>
          <button className="carousel-arrow carousel-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="carousel-arrow carousel-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showControls && hasMultiple && (
        <div className="carousel-dots">
          {resolvedImages.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
