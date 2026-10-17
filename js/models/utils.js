/* =========================================================
   MODELO · Utilidades de texto compartidas
   ========================================================= */

const QUITAR_TILDES = /[\u0300-\u036f]/g;

// minúsculas, sin tildes y sin espacios en los extremos
export function normalize(t) {
  return String(t).toLowerCase().normalize("NFD").replace(QUITAR_TILDES, "").trim();
}

// "Camiseta personalizada" -> "camiseta-personalizada"
export function slug(t) {
  return String(t).toLowerCase().normalize("NFD").replace(QUITAR_TILDES, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
