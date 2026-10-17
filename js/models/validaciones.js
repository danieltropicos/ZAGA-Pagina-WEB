/* =========================================================
   MODELO · Reglas de validación y formato de precio
   Cada regla devuelve el mensaje de error, o "" si el campo es válido.
   (Nuevo producto y Editar producto conservan sus propias reglas.)
   ========================================================= */

/* ---------- Nuevo producto ---------- */
const limpiarPrecio = (v) => v.replace(/COP|[\s.$]/gi, "");
const formatearPrecio = (digits) => "$" + Number(digits).toLocaleString("es-CO") + " COP";

const reglasNuevo = {
  name(v) {
    const t = v.trim();
    if (!t) return "Escribe el nombre del producto.";
    if (t.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (t.length > 60) return "El nombre no puede superar los 60 caracteres.";
    if (!/[a-záéíóúüñ]/i.test(t)) return "El nombre debe incluir letras, no solo números o símbolos.";
    return "";
  },
  category(v) {
    return v ? "" : "Selecciona una categoría.";
  },
  description(v) {
    const t = v.trim();
    if (!t) return "Escribe una descripción del producto.";
    if (t.length < 20) return `La descripción debe tener al menos 20 caracteres (llevas ${t.length}).`;
    if (t.length > 300) return "La descripción no puede superar los 300 caracteres.";
    return "";
  },
  price(v) {
    const digits = limpiarPrecio(v);
    if (!digits) return "Escribe el precio del producto.";
    if (!/^\d+$/.test(digits)) return "El precio solo puede tener números.";
    const n = Number(digits);
    if (n <= 0) return "El precio debe ser mayor a 0.";
    if (n < 1000) return "El precio mínimo es $1.000 COP.";
    if (n > 99999999) return "El precio es demasiado alto. Revisa el valor.";
    return "";
  }
};

export const validacionesNuevo = { reglas: reglasNuevo, limpiarPrecio, formatearPrecio };

/* ---------- Editar producto ---------- */
const MAX_PRICE = 99999999;

/* "$45.000 COP" → 45000 | "" → null | "-5000", "abc" → NaN */
function parsePrice(raw) {
  const clean = raw.replace(/COP/gi, "").replace(/[$\s.]/g, "");
  if (clean === "") return null;
  if (!/^\d+$/.test(clean)) return NaN;
  return Number(clean);
}

function formatPrice(n) {
  return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " COP";
}

const reglasEditar = {
  name(value) {
    const v = value.trim();
    if (!v) return "El nombre es obligatorio.";
    if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (v.length > 60) return "El nombre no puede superar los 60 caracteres.";
    return "";
  },
  category(value) {
    return value ? "" : "Selecciona una categoría.";
  },
  description(value) {
    const v = value.trim();
    if (!v) return "La descripción es obligatoria.";
    if (v.length < 10) return "La descripción debe tener al menos 10 caracteres.";
    if (v.length > 300) return "La descripción no puede superar los 300 caracteres.";
    return "";
  },
  price(value) {
    if (!value.trim()) return "El precio es obligatorio.";
    const n = parsePrice(value);
    if (n === null || Number.isNaN(n) || n <= 0) return "Ingresa un precio válido.";
    if (n > MAX_PRICE) return "El precio no puede superar " + formatPrice(MAX_PRICE) + ".";
    return "";
  },
  custom(value) {
    // Campo opcional: solo se limita la longitud
    if (value.trim().length > 200) return "No puede superar los 200 caracteres.";
    return "";
  }
};

export const validacionesEditar = { reglas: reglasEditar, parsePrice, formatPrice, MAX_PRICE };
