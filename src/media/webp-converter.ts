// Conversor Client-Side Instantâneo para WebP (Ctrl+V / Drag-and-Drop)
// Composição sobre fundo branco puro (#FFFFFF) + Cálculo SHA-256

export interface ClientWebpResult {
  webpDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
}

export async function convertBlobToStudioWebp(
  blob: Blob,
  maxDimension = 1600,
  quality = 0.96
): Promise<ClientWebpResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        // Limita dimensão sem esticar
        if (Math.max(w, h) > maxDimension) {
          const scale = maxDimension / Math.max(w, h);
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }

        // Canvas principal
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Não foi possível obter contexto 2D do Canvas');

        // Fundo Branco Puro #FFFFFF
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Thumbnail de 180px
        const thumbCanvas = document.createElement('canvas');
        const thumbScale = 180 / Math.max(w, h);
        const tw = Math.max(1, Math.round(w * thumbScale));
        const th = Math.max(1, Math.round(h * thumbScale));
        thumbCanvas.width = tw;
        thumbCanvas.height = th;
        const tctx = thumbCanvas.getContext('2d');
        if (tctx) {
          tctx.fillStyle = '#FFFFFF';
          tctx.fillRect(0, 0, tw, th);
          tctx.drawImage(canvas, 0, 0, tw, th);
        }
        const thumbnailDataUrl = thumbCanvas.toDataURL('image/webp', 0.88);

        // Bytes brutos para SHA-256
        const byteCharacters = atob(webpDataUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const hashBuffer = await crypto.subtle.digest('SHA-256', byteArray);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        resolve({
          webpDataUrl,
          thumbnailDataUrl,
          width: w,
          height: h,
          sizeBytes: byteArray.length,
          sha256,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar a imagem colada/selecionada'));
    };

    img.src = objectUrl;
  });
}

/**
 * Escuta evento de Paste (Ctrl+V) e extrai imagens coladas
 */
export function extractImageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      return item.getAsFile();
    }
  }
  return null;
}
