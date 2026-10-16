/* =========================================================
   ZAGA · Editar producto
   Script exclusivo de esta pantalla:
   - carga el producto elegido en la lista
   - validaciones del formulario
   - guarda los cambios en localStorage (los lee productos-guardados.js)
   ========================================================= */

(function () {
  "use strict";

  // Mismas llaves que usa js/productos-guardados.js
  const KEY = "zaga_productos";          // productos creados en "Nuevo producto"
  const EDITS = "zaga_ediciones";        // ediciones de los productos que vienen en el HTML
  const SNAP = "zaga_producto_editar";   // producto elegido en la lista
  const LIST_PAGE = "inventario-productos.html";

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const IMAGE_TYPES = ["image/jpeg", "image/png"];
  const MAX_PRICE = 99999999;

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null || value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false; // sin espacio o almacenamiento bloqueado
    }
  };

  const normalize = (t) =>
    String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  // ---------- Elementos ----------
  const form = document.getElementById("productForm");
  const alertBox = document.getElementById("formAlert");
  const toast = document.getElementById("toast");
  const previewImg = document.getElementById("previewImg");
  const fileName = document.getElementById("fileName");
  const imageInput = document.getElementById("imageInput");
  const changeBtn = document.getElementById("changeImageBtn");
  const imageError = document.getElementById("imageError");

  /* Producto que se está editando:
     id: identificador | image: ruta o imagen en base64 | imageName: nombre a mostrar */
  let current = { id: null, image: "", imageName: "" };

  // ---------- Cargar el producto elegido en la lista ----------
  function resolveProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // 1) El producto que la lista dejó guardado al pulsar "Editar"
    const snap = read(SNAP, null);
    if (snap && snap.name && (!id || String(snap.id) === id)) return snap;

    // 2) Un producto creado en "Nuevo producto"
    if (id) {
      const mine = read(KEY, []).find((p) => String(p.id) === id);
      if (mine) return mine;
    }

    // 3) Datos enviados por la URL (?name=...&price=...)
    if (params.has("name")) {
      return Object.fromEntries(params.entries());
    }

    return null;
  }

  function selectOption(select, wanted) {
    const target = normalize(wanted);
    if (!target) return;

    let option = Array.from(select.options).find(
      (o) => normalize(o.textContent) === target || normalize(o.value) === target
    );
    if (!option) {
      option = new Option(wanted, target);
      select.add(option);
    }
    select.value = option.value;
  }

  function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const product = resolveProduct();

    if (!product) {
      // Se pidió un producto concreto pero no hay datos: se vuelve a la lista
      // (así nunca se guarda por error sobre otro producto).
      if (params.get("id")) window.location.replace(LIST_PAGE);
      return; // sin id: se queda con los valores de ejemplo del HTML
    }

    current.id = product.id ? String(product.id) : null;

    document.getElementById("name").value = product.name || "";
    document.getElementById("price").value = product.price || "";
    document.getElementById("description").value = product.description || "";
    document.getElementById("custom").value = product.custom || "";
    selectOption(document.getElementById("category"), product.category || "");
    selectOption(document.getElementById("status"), product.status || "");

    // Imagen: solo rutas del proyecto o imágenes guardadas (nada de enlaces externos)
    const image = product.image || "";
    const isExternal = /^(https?:|\/\/)/i.test(image);
    if (image && !isExternal) {
      current.image = image;
      current.imageName = product.imageName || "";
      previewImg.src = image;
      previewImg.alt = "Imagen de " + (product.name || "el producto");
      fileName.textContent = displayName(image, current.imageName);
    }

    // Migas de pan y título de la pestaña
    const name = (product.name || "").trim();
    const crumb = document.getElementById("crumbName");
    if (name && crumb) crumb.textContent = name;
    if (name) document.title = "Editar " + name + " · ZAGA Administración";
  }

  function displayName(image, savedName) {
    if (savedName) return savedName;
    if (image.startsWith("data:")) return "imagen-del-producto";
    return image.split("/").pop();
  }

  loadProduct();

  // ---------- Cambiar imagen ----------
  /* Se reduce a máx. 800 px para que quepa en localStorage */
  function toStoredImage(file, done) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => done(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  changeBtn.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      imageError.textContent = "Formato no válido. Sube una imagen JPG o PNG.";
      imageError.hidden = false;
      imageInput.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      imageError.textContent = "La imagen supera los 5 MB. Elige una más liviana.";
      imageError.hidden = false;
      imageInput.value = "";
      return;
    }

    imageError.hidden = true;
    toStoredImage(file, (dataUrl) => {
      current.image = dataUrl;
      current.imageName = file.name;
      previewImg.src = dataUrl;
      fileName.textContent = file.name;
    });
  });

  // ---------- Validaciones ----------
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

  /* Cada regla devuelve el mensaje de error, o "" si el campo es válido */
  const rules = {
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

  const fields = Object.keys(rules).map((key) => ({
    key,
    el: document.getElementById(key),
    error: document.getElementById(key + "Error")
  }));

  let submitted = false;

  function check(field) {
    const message = rules[field.key](field.el.value);
    const invalid = message !== "";

    field.el.classList.toggle("is-invalid", invalid);
    field.el.setAttribute("aria-invalid", String(invalid));
    field.error.textContent = message;
    field.error.hidden = !invalid;

    if (invalid) field.el.setAttribute("aria-describedby", field.error.id);
    else field.el.removeAttribute("aria-describedby");

    // Si ya no queda ningún error, se oculta el aviso general
    if (!alertBox.hidden && !form.querySelector(".is-invalid")) {
      alertBox.hidden = true;
    }

    return !invalid;
  }

  fields.forEach((field) => {
    const eventName = field.el.tagName === "SELECT" ? "change" : "input";

    // Al salir del campo se valida
    field.el.addEventListener("blur", () => check(field));

    // Mientras escribe: se limpia el error apenas lo corrige
    // (o se valida en vivo si ya intentó guardar)
    field.el.addEventListener(eventName, () => {
      if (submitted || field.el.classList.contains("is-invalid")) check(field);
    });
  });

  // El precio se muestra con formato al salir del campo: $45.000 COP
  const priceField = fields.find((f) => f.key === "price");
  priceField.el.addEventListener("blur", () => {
    const n = parsePrice(priceField.el.value);
    if (n && !Number.isNaN(n) && n <= MAX_PRICE) {
      priceField.el.value = formatPrice(n);
    }
  });

  // ---------- Guardar ----------
  let toastTimer = null;

  function showToast(message, ms) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), ms || 2500);
  }

  /* Guarda en el mismo lugar del que lee la lista (productos-guardados.js) */
  function saveProduct(data) {
    if (!current.id) return true; // pantalla abierta sin producto: solo demostración

    const list = read(KEY, []);
    const index = list.findIndex((p) => String(p.id) === current.id);

    if (index >= 0) {
      // Producto creado en "Nuevo producto": se actualiza conservando sus demás datos
      list[index] = Object.assign({}, list[index], data);
      return write(KEY, list);
    }

    // Producto que viene escrito en el HTML: se guarda como edición
    const edits = read(EDITS, {});
    edits[current.id] = Object.assign({}, edits[current.id], data);
    return write(EDITS, edits);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitted = true;

    // Se validan todos (sin cortar en el primero) para marcar todos los errores
    const invalidFields = fields.filter((field) => !check(field));

    if (invalidFields.length) {
      toast.classList.remove("is-visible");
      alertBox.hidden = false;
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidFields[0].el.focus({ preventScroll: true });
      return;
    }

    alertBox.hidden = true;
    priceField.el.value = formatPrice(parsePrice(priceField.el.value));

    const selectText = (id) => {
      const select = document.getElementById(id);
      return select.options[select.selectedIndex].textContent.trim();
    };

    const saved = saveProduct({
      name: document.getElementById("name").value.trim(),
      category: selectText("category"),
      price: priceField.el.value,
      image: current.image,
      imageName: current.imageName,
      status: selectText("status"),
      description: document.getElementById("description").value.trim(),
      custom: document.getElementById("custom").value.trim()
    });

    if (!saved) {
      showToast("No se pudo guardar: no hay espacio disponible en el navegador.", 4000);
      return;
    }

    showToast("Cambios guardados", 1200);

    // Se vuelve a la lista, que ya muestra el producto actualizado
    if (current.id) {
      try { localStorage.removeItem(SNAP); } catch (err) { /* sin acceso */ }
      setTimeout(() => { window.location.href = LIST_PAGE; }, 900);
    }
  });
})();