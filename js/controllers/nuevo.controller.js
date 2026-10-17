/* =========================================================
   CONTROLADOR · Nuevo producto
   Solo se guarda el producto si TODAS las validaciones pasan.
   ========================================================= */

import * as M from "../models/producto.model.js";
import * as V from "../views/nuevo.view.js";
import { validacionesNuevo as Val } from "../models/validaciones.js";
import * as Img from "../models/imagen.js";

const INVENTORY_PAGE = "inventario-productos.html";
const MAX_IMAGE_MB = 5;

const fieldNames = Object.keys(Val.reglas);
let saving = false;

/* ---------- Validación ---------- */
function validateField(name) {
  const message = Val.reglas[name](V.valor(name));
  V.setError(name, message);
  return message;
}

// Devuelve la lista de campos inválidos (vacía = todo correcto)
function validateAll() {
  const invalid = fieldNames.filter((name) => validateField(name));
  V.actualizarResumen();
  return invalid;
}

/* ---------- Imagen ---------- */
function onImagen(file) {
  if (!file) return;

  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    V.mostrarToast("Solo se aceptan imágenes JPG o PNG.");
    V.limpiarArchivo();
    return;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    V.mostrarToast(`La imagen supera los ${MAX_IMAGE_MB} MB. Elige una más liviana.`);
    V.limpiarArchivo();
    return;
  }

  // Se reduce a máx. 500 px y se guarda como texto para que sobreviva al cambio de página
  Img.reducir(file, { max: 500, calidad: 0.8 }, (dataUrl) => {
    V.mostrarImagen(dataUrl, file.name);
  });
}

/* ---------- Guardar (solo si todo es válido) ---------- */
function onSubmit(e) {
  e.preventDefault();
  if (saving) return;

  const invalid = validateAll();

  // Si hay algún error: se muestra el anuncio y NO se guarda nada
  if (invalid.length) {
    V.enfocar(invalid[0]);
    V.irAlResumen();
    return;
  }

  const f = V.leerFormulario();
  const guardado = M.crear({
    name: f.name.trim(),
    category: f.category,
    description: f.description.trim(),
    price: Val.formatearPrecio(Val.limpiarPrecio(f.price)),
    status: f.status,
    custom: f.custom.trim(),
    image: f.image
  });

  if (!guardado) {
    V.mostrarToast("No se pudo guardar: la imagen es muy pesada. Prueba con otra.");
    return;
  }

  saving = true;
  V.mostrarToast("Producto guardado correctamente.");
  setTimeout(() => { location.href = INVENTORY_PAGE; }, 900);
}

function init() {
  // Validación en vivo
  fieldNames.forEach((name) => {
    V.bindCampo(
      name,
      () => { validateField(name); V.actualizarResumen(); },
      () => {
        // Una vez que hay error, se revisa en cada tecla para que desaparezca al corregir
        if (V.tieneError(name)) { validateField(name); V.actualizarResumen(); }
      }
    );
  });

  V.activarMascaras();
  V.bindImagen(onImagen);
  V.bindSubmit(onSubmit);
  V.bindCancelar(() => {
    if (V.confirmarSalida()) location.href = INVENTORY_PAGE;
  });
}

init();
