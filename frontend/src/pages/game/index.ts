import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/hands";

class GamePage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });
  countdownInterval: any;

  connectedCallback() {
    state.subscribe(() => {
      this.render();
    });
    this.render();
  }

  disconnectedCallback() {
    clearInterval(this.countdownInterval);
  }

  render() {
    // 1. ESCUDO ANTI-FANTASMAS: Evita que la página intente redirigir si está oculta
    if (!this.isConnected) return;

    const currentState = state.getState();

    // 2. PRIMERO DEFINIMOS LAS VARIABLES (¡Acá estaba el error!)
    const iamPlayer1 =
      currentState.userId === currentState.currentGame.player1?.userId;
    const myData = iamPlayer1
      ? currentState.currentGame.player1
      : currentState.currentGame.player2;
    const opponentData = iamPlayer1
      ? currentState.currentGame.player2
      : currentState.currentGame.player1;

    // 3. AHORA SÍ, EL DOBLE CANDADO
    // Viajamos si hay ganador Y además ambos jugadores ya tienen una jugada registrada
    if (myData?.move && opponentData?.move && currentState.currentGame.winner) {
      clearInterval(this.countdownInterval);
      Router.go("/result");
      return;
    }

    this.shadow.innerHTML = `
      <div class="container">
        <div class="opponent-hand-container">
          ${
            opponentData?.move
              ? `<hand-icons hand="${opponentData.move}" class="opponent-hand selected"></hand-icons>`
              : ""
          }
        </div>
        <div class="countdown-container">
          <span class="countdown"></span>
        </div>
        <div class="my-hands-container">
          ${
            !myData?.move
              ? '<hand-icons class="hands" big="true"></hand-icons>'
              : `<hand-icons hand="${myData.move}" big="true" class="my-hand selected"></hand-icons>`
          }
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      .container { height: 100vh; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
      .opponent-hand-container { transform: rotate(180deg); height: 40%; display: flex; align-items: flex-end; }
      .my-hands-container, .my-hand { height: 40%; display: flex; align-items: flex-end; }
      .countdown-container { font-size: 100px; font-family: 'Odibee Sans', cursive; font-weight: 700; }
      .hands, .my-hand.selected { transform: translateY(30px); }
      .opponent-hand.selected { transform: translateY(30px); }
    `;
    this.shadow.appendChild(style);

    // 3. SOLO INICIAMOS EVENTOS SI AÚN NO JUGÓ
    if (!myData?.move) {
      this.addListeners();
      if (!this.countdownInterval) {
        this.startCountdown();
      }
    }
  }

  addListeners() {
    const handsEl = this.shadow.querySelector(".hands");
    handsEl?.addEventListener("hand-selected", (e: any) => {
      // Frenamos el contador en el instante que hace clic
      clearInterval(this.countdownInterval);
      state.setMove(e.detail.handType);
    });
  }

  startCountdown() {
    let count = 3;
    const countdownEl = this.shadow.querySelector(".countdown");
    if (countdownEl) {
      countdownEl.textContent = String(count);
      this.countdownInterval = setInterval(() => {
        count--;
        if (countdownEl) countdownEl.textContent = String(count);
        if (count < 0) {
          clearInterval(this.countdownInterval);

          // 4. FIX DE JUGADA VACÍA: Si no elige nada, mandamos una jugada aleatoria.
          // Si mandábamos un string vacío (""), el backend fallaba en calcular al ganador.
          const moves = ["piedra", "papel", "tijera"];
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          state.setMove(randomMove);
        }
      }, 1000);
    }
  }
}
customElements.define("game-page", GamePage);
