export async function enablePush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[push] SW/Push non supportés');
      return false;
    }

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      console.warn('[push] Permission refusée');
      return false;
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

    const body = {
      endpoint: sub.endpoint,
      p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
      auth: arrayBufferToBase64(sub.getKey('auth')!),
      ua: navigator.userAgent,
    };

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('[push] Abonnement DB a échoué', await res.text());
      try { await sub.unsubscribe(); } catch {}
      return false;
    }

    const confirm = await reg.pushManager.getSubscription();
    const ok = !!confirm;
    console.log('[push] enablePush ->', ok);
    return ok;
  } catch (err) {
    console.error('[push] enablePush error', err);
    return false;
  }
}

export async function disablePush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      console.log('[push] Pas d\'abonnement actif');
      return true;
    }

    const resp = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    if (!resp.ok) {
      console.warn('[push] Désinscription DB a échoué', await resp.text());
      return false;
    }

    try { await sub.unsubscribe(); } catch {}
    const confirm = await reg.pushManager.getSubscription();
    const ok = !confirm;
    console.log('[push] disablePush ->', ok);
    return ok;
  } catch (err) {
    console.error('[push] disablePush error', err);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
