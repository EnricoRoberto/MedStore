const MAX_DATA_URL_BYTES = 700_000; // margine sotto il limite di 1 MiB/documento di Firestore
const MIN_QUALITY = 0.4;
const INITIAL_MAX_DIMENSION = 1280;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Immagine non leggibile."));
    };
    img.src = url;
  });
}

function drawScaled(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supportato dal browser.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Ridimensiona e comprime lato client: le foto vengono salvate come stringa
// base64 dentro il documento Firestore (niente Cloud Storage, che dal 2024
// richiede il piano Blaze anche solo per le security rules).
export async function compressImageToDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  let maxDimension = INITIAL_MAX_DIMENSION;

  for (let resizeAttempt = 0; resizeAttempt < 3; resizeAttempt++) {
    const canvas = drawScaled(img, maxDimension);
    for (let quality = 0.8; quality >= MIN_QUALITY; quality -= 0.15) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_DATA_URL_BYTES) {
        return dataUrl;
      }
    }
    maxDimension = Math.round(maxDimension / 1.5);
  }

  return drawScaled(img, maxDimension).toDataURL("image/jpeg", MIN_QUALITY);
}
