/**
 * Profile photo — stored in IndexedDB on this device only, never uploaded.
 * Falls back to /assets/avatar-default.jpg when the user hasn't set one.
 */

const DB_NAME = "liftlog";
const STORE = "profile";
const LEGACY_KEY = "profile-photo";

const keyFor = (userId) => (userId ? `profile-photo-${userId}` : LEGACY_KEY);

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-indexeddb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      for (const s of ["progress_photos", STORE]) {
        if (!req.result.objectStoreNames.contains(s)) {
          req.result.createObjectStore(s, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Get the user's profile photo data URL, or null (no cross-account fallback). */
export async function getProfilePhoto(userId) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(keyFor(userId));
      r.onsuccess = () => resolve(r.result?.dataUrl || null);
      r.onerror = () => reject(r.error);
    });
  } catch {
    return null;
  }
}

/** Save a profile photo (File or data URL). Downscales to 512px. */
export async function setProfilePhoto(input, userId) {
  const dataUrl = typeof input === "string" ? input : await shrinkToSquare(input);
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id: keyFor(userId), dataUrl });
    tx.objectStore(STORE).delete(LEGACY_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return dataUrl;
}

/**
 * One-time migration: move a photo stored under the legacy global key onto
 * the given user's per-user key, then delete the global copy.
 * Returns true if a photo was migrated.
 */
export async function migrateLegacyPhoto(userId) {
  if (!userId) return false;
  try {
    const db = await openDb();
    const get = (key) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result?.dataUrl || null);
      r.onerror = () => reject(r.error);
    });
    const perUser = await get(keyFor(userId));
    if (perUser) return false; // user already has their own photo
    const legacy = await get(LEGACY_KEY);
    if (!legacy) return false; // nothing to migrate
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id: keyFor(userId), dataUrl: legacy });
      tx.objectStore(STORE).delete(LEGACY_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

/** Remove the custom profile photo (reverts to default avatar). */
export async function clearProfilePhoto(userId) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(keyFor(userId));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* noop */ }
}

function shrinkToSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const size = 512;
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d");
        // Center-crop to square
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.85));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
