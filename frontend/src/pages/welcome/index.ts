import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/button";
import "../../components/hands";

class WelcomePage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  connectedCallback() {
    // ESTE ES EL "GUARDIA DE SEGURIDAD"
    // Comprobamos si tenemos un userId en el state.
    const currentState = state.getState();
    if (!currentState.userId) {
      // Si no hay userId, el usuario no debería estar aquí.
      // Lo redirigimos a la página de login para que inicie sesión.
      Router.go("/login");
    } else {
      // Si todo está en orden, renderizamos la página.
      this.render();
    }
  }

  render() {
    this.shadow.innerHTML = `
      <div class="container">
        <h1 class="title">Piedra, Papel o Tijera</h1>
        <div class="buttons-container">
          <custom-button class="new-game-btn">Nuevo Juego</custom-button>
          <custom-button class="join-game-btn">Ingresar a una sala</custom-button>
        </div>
        <hand-icons class="hands"></hand-icons>
      </div>
    `;

    const style = document.createElement("style");
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
        padding: 100px 0 0;
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
      .buttons-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        max-width: 320px;
      }
      .hands {
        transform: translateY(30px);
      }
    `;
    this.shadow.appendChild(style);
    this.addListeners();
  }

  addListeners() {
    const newGameBtn = this.shadow.querySelector(".new-game-btn");
    const joinGameBtn = this.shadow.querySelector(".join-game-btn");

    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => {
        // Le pedimos al state que cree una nueva sala
        console.log("vamos a pedirle algo al State");
        state.createRoom(() => {
          // Cuando el state nos avisa que terminó, navegamos a la siguiente página
          Router.go("/share-code");
        });
      });
    }

    if (joinGameBtn) {
      joinGameBtn.addEventListener("click", () => {
        // Simplemente navegamos a la página para ingresar un código
        Router.go("/join-game");
      });
    }
  }
}

customElements.define("welcome-page", WelcomePage);
