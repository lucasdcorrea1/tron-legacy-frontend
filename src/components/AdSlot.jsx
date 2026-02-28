import { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-8952525362331082';

export default function AdSlot({ slot, format = 'auto', layout, style, className = '' }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (!adRef.current) return;

    // Wait for the AdSense script to be ready and the element to be in the DOM
    const timer = setTimeout(() => {
      try {
        if (adRef.current && !adRef.current.dataset.adsbygoogleStatus) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (e) {
        // AdSense not loaded yet or ad blocked
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={style || { display: 'block' }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layout && { 'data-ad-layout': layout })}
    />
  );
}
