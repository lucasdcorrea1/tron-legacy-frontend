import { useEffect, useRef, useState } from 'react';

const AD_CLIENT = 'ca-pub-8952525362331082';
const SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;

// Singleton: load the AdSense script once across all AdSlot instances
let scriptLoadPromise = null;

function loadAdSenseScript() {
  if (scriptLoadPromise) return scriptLoadPromise;

  // Only load if user accepted cookies
  if (localStorage.getItem('cookie-consent') !== 'accepted') {
    return Promise.resolve(false);
  }

  // Already loaded by something else
  if (document.querySelector(`script[src*="adsbygoogle"]`)) {
    return Promise.resolve(true);
  }

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = SCRIPT_SRC;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export default function AdSlot({ slot, format = 'auto', layout, style, className = '' }) {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);

  // Load the AdSense script on mount
  useEffect(() => {
    loadAdSenseScript().then((loaded) => {
      if (loaded) setScriptReady(true);
    });
  }, []);

  // Push the ad once script is ready
  useEffect(() => {
    if (!scriptReady || pushed.current || !adRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (adRef.current && !adRef.current.dataset.adsbygoogleStatus) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (e) {
        // AdSense not ready or ad blocked
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [scriptReady]);

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
