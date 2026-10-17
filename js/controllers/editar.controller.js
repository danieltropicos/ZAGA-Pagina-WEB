/* =========================================================
   CONTROLADOR · Editar producto
   - carga el producto elegido en la lista
   - valida el formulario
   - guarda los cambios (a través del modelo)
   ========================================================= */

import * as M from "../models/producto.model.js";
import * as V from "../views/editar.view.js";
import { validacionesEditar as Val } from "../models/validaciones.js";
import * as Img from "../models/imagen.js";

const LIST_PAGE = "inventario-productos.html";

const fieldKeys = Object.keys(Val.reglas);

/* Producto que se está editando:
   id: identificador | image: ruta o imagen en base64 | imageName: nombre a mostrar */
const current = { id: null, image: "", imageName: "" };
let submitted = false;

// ---------- Cargar el producto elegido en la lista ----------
function displayName(image, savedName) {
  if (savedName) return savedName;
  if (image.startsWith("data:")) return "imagen-del-producto";
  return image.split("/").pop();
}

function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const product = M.resolverParaEditar(params.get("id"), params);

  if (!product) {
    // Se pidió un producto concreto pero no hay datos: se vuelve a la lista
    // (así nunca se guarda por error sobre otro producto).
    if (params.get("id")) window.location.replace(LIST_PAGE);
    return; // sin id: se queda con los valores de ejemplo del HTML
  }

  current.id = product.id ? String(product.id) : null;
  V.cargarProducto(product);

  // Imagen: solo rutas del proyecto o imágenes guardadas (nada de enlaces externos)
  const image = product.image || "";
  const isExternal = /^(https?:|\/\/)/i.test(image);
  if (image && !isExternal) {
    current.image = image;
    current.imageName = product.imageName || "";
    V.mostrarImagen(
      image,
      "Imagen de " + (product.name || "el producto"),
      displayName(image, current.imageName)
    );
  }
}

// ---------- Cambiar imagen ----------
function onImagen(file) {
  if (!file) return;

  if (!Img.TIPOS_VALIDOS.includes(file.type)) {
    V.errorImagen("Formato no válido. Sube una imagen JPG o PNG.");
    V.limpiarArchivo();
    return;
  }

  if (file.size > Img.MAX_BYTES) {
    V.errorImagen("La imagen supera los 5 MB. Elige una más liviana.");
    V.limpiarArchivo();
    return;
  }

  V.errorImagen("");
  // Se reduce a máx. 800 px para que quepa en localStorage
  Img.reducir(file, { max: 800, calidad: 0.85, fondoBlanco: true, respaldoSiFalla: true }, (dataUrl) => {
    current.image = dataUrl;
    current.imageName = file.name;
    V.mostrarImagen(dataUrl, undefined, file.name);
  });
}

// ---------- Validaciones ----------
function check(key) {
  const message = Val.reglas[key](V.valor(key));
  V.aplicarError(key, message);
  return message === "";
}

// ---------- Guardar ----------
function onSubmit(e) {
  e.preventDefault();
  submitted = true;

  // Se validan todos (sin cortar en el primero) para marcar todos los errores
  const invalidKeys = fieldKeys.filter((key) => !check(key));

  if (invalidKeys.length) {
    V.ocultarToast();
    V.mostrarAlerta();
    V.enfocar(invalidKeys[0]);
    return;
  }

  V.ocultarAlerta();
  V.setValor("price", Val.formatPrice(Val.parsePrice(V.valor("price"))));

  const saved = M.guardarEdicion(current.id, {
    name: V.valor("name").trim(),
    category: V.textoSelect("category"),
    price: V.valor("price"),
    image: current.image,
    imageName: current.imageName,
    status: V.textoSelect("status"),
    description: V.valor("description").trim(),
    custom: V.valor("custom").trim()
  });

  if (!saved) {
    V.mostrarToast("No se pudo guardar: no hay espacio disponible en el navegador.", 4000);
    return;
  }

  V.mostrarToast("Cambios guardados", 1200);

  // Se vuelve a la lista, que ya muestra el producto actualizado
  if (current.id) {
    M.limpiarSnapshot();
    setTimeout(() => { window.location.href = LIST_PAGE; }, 900);
  }
}

function init() {
  loadProduct();

  V.bindImagen(onImagen);

  fieldKeys.forEach((key) => {
    V.bindCampo(
      key,
      // Al salir del campo se valida
      () => check(key),
      // Mientras escribe: se limpia el error apenas lo corrige
      // (o se valida en vivo si ya intentó guardar)
      () => { if (submitted || V.esInvalido(key)) check(key); }
    );
  });

  // El precio se muestra con formato al salir del campo: $45.000 COP
  V.bindPrecioBlur(() => {
    const n = Val.parsePrice(V.valor("price"));
    if (n && !Number.isNaN(n) && n <= Val.MAX_PRICE) {
      V.setValor("price", Val.formatPrice(n));
    }
  });

  V.bindSubmit(onSubmit);
}

init();
