/* ══════════════════════════════════════════════════════════════════════
   vista-auth.js — Etapa 2: Login y Registro.
   Reemplaza el placeholder de "Vistas.login" que armamos en la Etapa 1.
   Una sola pantalla con dos pestañas: Ingresar / Crear cuenta.
   ════════════════════════════════════════════════════════════════════════ */

(function () {

  // Modo actual de la pantalla: "login" o "registro".
  let modo = "login";

  /* Validación simple de email del lado del cliente (UX).
     El backend igual valida; esto es para avisarte antes de mandar. */
  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* Dibuja los campos del formulario según el modo. */
  function camposDelFormulario() {
    if (modo === "registro") {
      return `
        <div class="campo">
          <label for="nombreUsuario">Nombre de usuario</label>
          <input id="nombreUsuario" type="text" autocomplete="username" placeholder="Ej: lu_munch" />
          <p class="pista-campo">Mínimo 3 caracteres.</p>
        </div>
        <div class="campo">
          <label for="email">Email</label>
          <input id="email" type="email" autocomplete="email" placeholder="vos@ejemplo.com" />
        </div>
        <div class="campo">
          <label for="password">Contraseña</label>
          <input id="password" type="password" autocomplete="new-password" placeholder="••••••••" />
          <p class="pista-campo">Mínimo 6 caracteres.</p>
        </div>`;
    }
    // modo login
    return `
      <div class="campo">
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="email" placeholder="vos@ejemplo.com" />
      </div>
      <div class="campo">
        <label for="password">Contraseña</label>
        <input id="password" type="password" autocomplete="current-password" placeholder="••••••••" />
      </div>`;
  }

  /* Dibuja toda la pantalla. */
  function render(cont) {
    // Si ya hay sesión, no tiene sentido mostrar el login: vamos al inicio.
    if (API.haySesion()) {
      Router.ir("/");
      return;
    }

    const titulo = modo === "login" ? "Ingresar" : "Crear cuenta";
    const ayuda = modo === "login"
      ? "Entrá con tu email y contraseña."
      : "Registrate para empezar a pronosticar.";
    const textoBoton = modo === "login" ? "Ingresar" : "Crear cuenta";

    cont.innerHTML = `
      <div class="auth">
        <div class="auth-card tarjeta">
          <div class="auth-tabs">
            <button class="auth-tab ${modo === "login" ? "activa" : ""}" data-modo="login">Ingresar</button>
            <button class="auth-tab ${modo === "registro" ? "activa" : ""}" data-modo="registro">Crear cuenta</button>
          </div>
          <div class="auth-cuerpo">
            <h2>${titulo}</h2>
            <p class="ayuda">${ayuda}</p>
            <form id="form-auth" novalidate>
              <p class="error-form" id="error-form"></p>
              ${camposDelFormulario()}
              <button type="submit" class="boton boton-primario" id="btn-enviar">${textoBoton}</button>
            </form>
          </div>
        </div>
      </div>`;

    // Cambio de pestaña.
    cont.querySelectorAll(".auth-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        modo = tab.dataset.modo;
        render(cont);
      });
    });

    // Envío del formulario (Enter o botón). preventDefault evita que recargue.
    cont.querySelector("#form-auth").addEventListener("submit", (e) => {
      e.preventDefault();
      enviar(cont);
    });
  }

  /* Muestra un error dentro del formulario. */
  function mostrarError(cont, mensaje) {
    cont.querySelector("#error-form").textContent = mensaje;
  }

  /* Procesa el envío: valida, llama al backend y redirige. */
  async function enviar(cont) {
    const email = cont.querySelector("#email").value.trim();
    const password = cont.querySelector("#password").value;
    const boton = cont.querySelector("#btn-enviar");

    mostrarError(cont, "");

    // ── Validación de cliente (rápida, antes de molestar al backend) ──
    if (!emailValido(email)) {
      mostrarError(cont, "Ingresá un email válido.");
      return;
    }
    if (!password) {
      mostrarError(cont, "La contraseña es obligatoria.");
      return;
    }

    let nombreUsuario = "";
    if (modo === "registro") {
      nombreUsuario = cont.querySelector("#nombreUsuario").value.trim();
      if (nombreUsuario.length < 3) {
        mostrarError(cont, "El nombre de usuario necesita al menos 3 caracteres.");
        return;
      }
      if (password.length < 6) {
        mostrarError(cont, "La contraseña necesita al menos 6 caracteres.");
        return;
      }
    }

    // ── Llamada al backend ──
    boton.disabled = true;
    boton.textContent = modo === "login" ? "Ingresando…" : "Creando…";

    try {
      if (modo === "registro") {
        // 1) Creamos la cuenta. (El backend NO devuelve token en el registro.)
        await API.registrar(nombreUsuario, email, password);
        // 2) Auto-login: entramos enseguida con las mismas credenciales.
        await API.login(email, password);
        aviso("¡Cuenta creada! Bienvenida 👋", "ok");
      } else {
        await API.login(email, password);
        aviso("Sesión iniciada", "ok");
      }

      // Actualizamos la nav/chip y redirigimos según el rol.
      refrescarChrome();
      Router.ir(API.esAdmin() ? "/admin" : "/");

    } catch (err) {
      // Mostramos el mensaje que vino del backend (409 email repetido,
      // 401 credenciales inválidas, 400 validación, 0 sin conexión…).
      mostrarError(cont, err.message);
      boton.disabled = false;
      boton.textContent = modo === "login" ? "Ingresar" : "Crear cuenta";
    }
  }

  // Reemplazamos el placeholder de la Etapa 1 por la vista real.
  Vistas.login = render;

})();
