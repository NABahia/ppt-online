// Importamos los componentes que este componente utiliza
import "../button";

class CustomForm extends HTMLElement {
  // Para consistencia y evitar problemas, también usamos Shadow DOM aquí
  shadow = this.attachShadow({ mode: "open" });

  constructor() {
    super();
    this.render();
  }

  render() {
    const label = this.getAttribute("label") || "Label";
    const buttonText = this.getAttribute("button-text") || "Enviar";

    // El contenido ahora va dentro del Shadow DOM
    this.shadow.innerHTML = `
      <form class="form">
        <label class="label">${label}</label>
        <input class="input" type="text" required />
        <custom-button class="button">${buttonText}</custom-button>
      </form>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      * { box-sizing: border-box; }
      .form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        max-width: 320px;
      }
      .label {
        font-size: 45px;
        text-align: center;
        font-family: 'Odibee Sans', cursive;
      }
      .input {
        height: 87px;
        border: 10px solid #001997;
        border-radius: 10px;
        font-size: 45px;
        text-align: center;
        width: 100%;
        font-family: 'Odibee Sans', cursive;
      }
      .button {
        width: 100%;
      }
    `;
    // Los estilos también van en el Shadow DOM
    this.shadow.appendChild(style);
    this.addListeners();
  }

  addListeners() {
    const form = this.shadow.querySelector(".form") as HTMLFormElement;
    const button = this.shadow.querySelector(".button");

    // El botón solo le pide al formulario que se envíe.
    // El método requestSubmit() se encarga de la validación automáticamente.
    if (button) {
      button.addEventListener("click", () => {
        form.requestSubmit();
      });
    }

    // El listener 'submit' es ahora la ÚNICA fuente de verdad.
    // Se dispara con Enter o cuando requestSubmit() tiene éxito.
    if (form) {
      form.addEventListener("submit", (e: any) => {
        // Prevenimos que la página se recargue
        e.preventDefault();
        const input = this.shadow.querySelector(".input") as HTMLInputElement;

        // Creamos y disparamos nuestro evento personalizado
        const customEvent = new CustomEvent("form-submit", {
          detail: { value: input.value },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(customEvent);
      });
    }
  }
}

customElements.define("custom-form", CustomForm);
