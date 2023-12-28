export async function persistData() {
  if (navigator.storage && navigator.storage.persist) {
    const alreadyPersisted = await navigator.storage.persisted();
    if (!alreadyPersisted) {
      const result = await navigator.storage.persist();
      console.info(`Data persisted: ${result}`);
    }
  }
}

export function clearServiceWorkerCache() {
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        return caches.delete(cacheName);
      })
    );
  });
}
