/* =========================================================
   MODELO · Procesamiento de imágenes
   Reduce la imagen y la devuelve como texto (base64) para que
   quepa en localStorage y sobreviva al cambio de página.
   opciones: { max, calidad, fondoBlanco, respaldoSiFalla }
   ========================================================= */

export const TIPOS_VALIDOS = ["image/jpeg", "image/png"];
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function reducir(file, opciones, done) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, opciones.max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (opciones.fondoBlanco) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL("image/jpeg", opciones.calidad));
    };
    if (opciones.respaldoSiFalla) img.onerror = () => done(reader.result);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
