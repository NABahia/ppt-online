import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/button";
import "../../components/hands";

class InstructionsPage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  connectedCallback() {
    // 1. Nos suscribimos a los cambios ANTES de renderizar.
    state.subscribe(() => {
      this.render();
    });
    // 2. Renderizamos el estado inicial (puede que sin nombres de oponente aún).
    this.render();
  }

  render() {
    if (!this.isConnected) return;
    const currentState = state.getState();

    // ESTA ES LA SOLUCIÓN:
    // Añadimos un "guardia" para asegurarnos de que los datos del juego existen
    // antes de intentar leerlos. Si no existen, simplemente salimos de la función
    // y esperamos al siguiente re-renderizado.
    if (!currentState.currentGame || !currentState.currentGame.player1) {
      return;
    }

    const player1Ready = currentState.currentGame.player1?.ready;
    const player2Ready = currentState.currentGame.player2?.ready;

    // Si ambos están listos, navegamos al juego.
    if (player1Ready && player2Ready) {
      Router.go("/game");
      return;
    }

    const iamPlayer1 =
      currentState.userId === currentState.currentGame.player1?.userId;
    const opponent = iamPlayer1
      ? currentState.currentGame.player2
      : currentState.currentGame.player1;
    const myData = iamPlayer1
      ? currentState.currentGame.player1
      : currentState.currentGame.player2;
    const roomId = currentState.roomId;

    this.shadow.innerHTML = `
      <div class="container">
        <div class="header">
          <div class="players-info">
            <span class="player-name">${myData?.nombre || "..."}</span>
            <span class="player-name opponent-name">${
              opponent?.nombre || "Esperando..."
            }</span>
          </div>
          <div class="room-info">
            <span class="room-label">Sala</span>
            <span class="room-id">${roomId}</span>
          </div>
        </div>
        <div class="content-container">
          ${
            myData?.ready
              ? `<p class="paragraph waiting">Esperando a que<br>${
                  opponent?.nombre || "tu oponente"
                } presione ¡Jugar!...</p>`
              : `
                <div class="text-container">
                  <p class="paragraph">Presioná jugar<br>y elegí: piedra, papel o tijera<br>antes de que pasen los 3 segundos.</p>
                </div>
                <custom-button class="play-btn">¡Jugar!</custom-button>
              `
          }
        </div>
        <hand-icons class="hands"></hand-icons>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      * { box-sizing: border-box; }
      .container { display: flex; flex-direction: column; justify-content: space-between; align-items: center; height: 100vh; padding: 20px 0 0; }
      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 380px; padding: 0 10px; font-family: 'Odibee Sans', cursive; font-size: 24px; }
      .players-info { display: flex; flex-direction: column; text-align: left; }
      .room-info { text-align: right; }
      .room-label { font-size: 20px; display: block; }
      .room-id { font-size: 28px; font-weight: 700; display: block; }
      .player-name.opponent-name { color: #FF6442; }
      .content-container { display: flex; flex-direction: column; align-items: center; gap: 40px; }
      .text-container { max-width: 300px; }
      .paragraph { font-size: 35px; font-family: 'Odibee Sans', cursive; margin: 0; text-align: center; }
      .waiting { font-size: 40px; }
      .play-btn { width: 100%; max-width: 320px; }
      .hands { transform: translateY(30px); }
    `;
    this.shadow.appendChild(style);
    this.addListeners();
  }

  addListeners() {
    const playBtn = this.shadow.querySelector(".play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        state.setPlayerReady();
      });
    }
  }
}

customElements.define("instructions-page", InstructionsPage);
