import { useEffect } from 'react';

export default function UpdatePrompt() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloaded = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });

  }, []);

  return null;
}