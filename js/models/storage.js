/* =========================================================
   MODELO · Acceso a localStorage (llaves + lectura/escritura segura)
   ========================================================= */

export const KEYS = {
  PRODUCTOS: "zaga_productos",        // productos creados en "Nuevo producto"
  EDICIONES: "zaga_ediciones",        // ediciones de los productos que vienen en el HTML
  SNAPSHOT: "zaga_producto_editar",   // producto elegido en la lista para editar
  ELIMINADOS: "zaga_eliminados"       // ids de productos del HTML que se eliminaron
};

export function leer(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null || value === undefined ? fallback : value;
  } catch (e) {
    return fallback;
  }
}

export function escribir(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false; // sin espacio o almacenamiento bloqueado
  }
}

export function borrar(key) {
  try { localStorage.removeItem(key); } catch (e) { /* sin acceso */ }
}
