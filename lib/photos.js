/**
 * Progress photos — stored in IndexedDB on this device only, never uploaded.
 * Same model as SebasFit: private to the device, not in any export.
 */

const DB_NAME = "liftlog";
const STORE = "progress_photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function photoOp(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const st = tx.objectStore(STORE);
    const r = fn(st);
    tx.oncomplete = () => resolve(r && r.result);
    tx.onerror = () => reject(tx.error);
  });
}

/** Downscale an image file to a max 1200px JPEG data URL. */
export function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sc = Math.min(1, 1200 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc);
        c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/jpeg", 0.82));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function listPhotos() {
  const list = (await photoOp("readonly", (st) => st.getAll())) || [];
  return list.sort((a, b) => b.t - a.t);
}

export async function addPhoto(dataUrl) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await photoOp("readwrite", (st) => st.put({ id, t: Date.now(), url: dataUrl }));
}

export async function deletePhoto(id) {
  await photoOp("readwrite", (st) => st.delete(id));
}
