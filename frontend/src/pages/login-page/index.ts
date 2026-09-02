// Importamos Router para poder navegar
import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/button";
import "../../components/hands";
import "../../components/form";

class LoginPage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  connectedCallback() {
    this.render();
  }

  render() {
    const style = document.createElement("style");
    this.shadow.innerHTML = `
      <div class="container">
        <h1 class="title">Piedra, Papel o Tijera</h1>
        <custom-form class="form" label="Tu Nombre" button-text="Empezar"></custom-form>
        <hand-icons class="hands"></hand-icons>
      </div>
    `;

    style.innerHTML = `
      * {
        box-sizing: border-box;
      }
      .container {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 100vh;
        padding-bottom: 20px;
        padding-top: 100px;
      }

      .title {
        font-size: 80px;
        font-family: 'Odibee Sans', cursive;
        color: #009048;
        text-align: center;
        max-width: 280px;
        line-height: 0.9;
        margin: 0;
      }
    `;

    this.shadow.appendChild(style);
    this.addListeners();

    // Precargamos el nombre si ya existe en el state
    const currentState = state.getState();
    if (currentState.nombre) {
      const formInput = this.shadow
        .querySelector(".form")
        ?.shadowRoot?.querySelector(".input") as HTMLInputElement;
      if (formInput) {
        formInput.value = currentState.nombre;
      }
    }
  }

  addListeners() {
    const form = this.shadow.querySelector(".form");
    if (form) {
      form.addEventListener("form-submit", (e: any) => {
        const nombre = e.detail.value;
        if (nombre) {
          state.setNombre(nombre);
          // Usamos la nueva función 'signIn'
          state.signIn((err) => {
            // Si hay un error (ej: nombre en uso), lo mostramos
            if (err) {
              alert(err);
            } else {
              // Si no hay error, navegamos
              Router.go("/welcome");
            }
          });
        } else {
          console.error("El nombre no puede estar vacío");
        }
      });
    }
  }
}

customElements.define("login-page", LoginPage);
