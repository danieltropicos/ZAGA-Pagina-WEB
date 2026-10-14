/* =========================================================
   ZAGA · Editar producto
   Script exclusivo de esta pantalla (imagen y guardado)
   Solo comportamiento visual (sin guardar datos reales)
   ========================================================= */

(function () {
  "use strict";

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  // ---------- Cambiar imagen (vista previa local) ----------
  const changeBtn = document.getElementById("changeImageBtn");
  const imageInput = document.getElementById("imageInput");
  const previewImg = document.getElementById("previewImg");
  const fileName = document.getElementById("fileName");
  const imageError = document.getElementById("imageError");

  let previewUrl = null;

  changeBtn.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      imageError.hidden = false;
      imageInput.value = "";
      return;
    }

    imageError.hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    fileName.textContent = file.name;
  });

  // ---------- Guardar (solo muestra un aviso) ----------
  const form = document.getElementById("productForm");
  const toast = document.getElementById("toast");
  let toastTimer = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
  });
})();
