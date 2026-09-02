import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/hands";

class ShareCodePage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  connectedCallback() {
    // 1. Nos suscribimos a los cambios ANTES de renderizar por primera vez.
    state.subscribe(() => {
      // Cada vez que el state cambie, volvemos a renderizar.
      this.render();
    });
    // 2. Renderizamos el estado inicial.
    this.render();
  }

  render() {
    if (!this.isConnected) return;
    const currentState = state.getState();
    const roomId = currentState.roomId;
    const player2 = currentState.currentGame.player2;

    // Si detectamos que el jugador 2 ya se unió, navegamos.
    // Esta comprobación ahora se hace en cada re-renderizado.
    if (player2 && player2.userId) {
      Router.go("/instructions");
      return; // Detenemos el renderizado para evitar dibujar la página innecesariamente.
    }

    this.shadow.innerHTML = `
      <div class="container">
        <div class="header">
            <span class="player-name">${currentState.nombre}</span>
            <div class="room-info">
              <span class="room-label">Sala</span>
              <span class="room-id">${roomId}</span>
            </div>
        </div>
        <div class="text-container">
          <p class="paragraph">Compartí el código:</p>
          <h2 class="code">${roomId}</h2>
          <p class="paragraph">con tu contrincante</p>
        </div>
        <hand-icons class="hands"></hand-icons>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      * { box-sizing: border-box; }
      .container { display: flex; flex-direction: column; justify-content: space-between; align-items: center; height: 100vh; padding: 20px 0 0; }
      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 380px; padding: 0 10px; font-family: 'Odibee Sans', cursive; font-size: 24px; }
      .room-info { text-align: right; }
      .room-label { font-size: 20px; display: block; }
      .room-id { font-size: 28px; font-weight: 700; display: block; }
      .text-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .paragraph { font-size: 35px; font-family: 'Odibee Sans', cursive; margin: 0; text-align: center; }
      .code { font-size: 48px; font-family: 'Odibee Sans', cursive; font-weight: 700; margin: 0; }
      .hands { transform: translateY(30px); }
    `;
    this.shadow.appendChild(style);
  }
}

customElements.define("share-code-page", ShareCodePage);
