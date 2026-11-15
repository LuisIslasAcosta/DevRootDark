// Utilidades de la firma del profesor

// Recorta los bordes vacíos y deja un pequeño margen
export function recortar(canvas) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const datos = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (datos[(y * width + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const margen = 12;
  x0 = Math.max(0, x0 - margen);
  y0 = Math.max(0, y0 - margen);
  x1 = Math.min(width - 1, x1 + margen);
  y1 = Math.min(height - 1, y1 + margen);
  const salida = document.createElement("canvas");
  salida.width = x1 - x0 + 1;
  salida.height = y1 - y0 + 1;
  salida.getContext("2d").drawImage(canvas, x0, y0, salida.width, salida.height, 0, 0, salida.width, salida.height);
  return salida;
}

