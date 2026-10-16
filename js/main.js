/* =========================================================
   ZAGA · Panel de administración
   SCRIPT GENERAL (compartido por todas las pantallas)
   Menú de hamburguesa del encabezado en móvil
   ========================================================= */

(function () {
  "use strict";

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!menuBtn || !mobileMenu) return;

  function toggleMenu(forceOpen) {
    const open = typeof forceOpen === "boolean"
      ? forceOpen
      : menuBtn.getAttribute("aria-expanded") !== "true";

    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileMenu.hidden = !open;
  }

  menuBtn.addEventListener("click", () => toggleMenu());

  // Si se agranda la pantalla, se cierra el menú móvil
  window.matchMedia("(min-width: 769px)").addEventListener("change", (e) => {
    if (e.matches) toggleMenu(false);
  });
})();