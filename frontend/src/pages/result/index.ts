import { Router } from "@vaadin/router";
import { state } from "../../state";
import "../../components/button";

const piedraImg = new URL("../../public/assets/piedra.svg", import.meta.url);
const papelImg = new URL("../../public/assets/papel.svg", import.meta.url);
const tijeraImg = new URL("../../public/assets/tijera.svg", import.meta.url);

class ResultPage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  // NUEVO: Bandera para saber si ya dibujamos el resultado
  hasRenderedResult = false;

  connectedCallback() {
    state.subscribe(() => {
      if (this.isConnected) {
        this.render();
      }
    });
    this.render();
  }

  render() {
    if (!this.isConnected) return;

    // NUEVO: Si ya dibujamos el resultado final, ignoramos las actualizaciones de Firebase
    // Esto evita que la pantalla se borre si el oponente resetea la partida primero.
    if (this.hasRenderedResult) return;

    const currentState = state.getState();
    const { player1, player2, winner } = currentState.currentGame;

    // Redirección de seguridad: Si no hay ganador y no renderizamos nada, volvemos a instrucciones
    if (!winner) {
      Router.go("/instructions");
      return;
    }

    // Marcamos que a partir de acá la pantalla queda congelada
    this.hasRenderedResult = true;

    const iAmPlayer1 = currentState.userId === player1.userId;
    const myMove = iAmPlayer1 ? player1.move : player2.move;
    const opponentMove = iAmPlayer1 ? player2.move : player1.move;

    let resultText = "";
    let resultType = "empate";

    const currentHistory = currentState.history || { player1: 0, player2: 0 };

    if (winner === "empate") {
      resultText = "Empate";
    } else if (
      (winner === "player1" && iAmPlayer1) ||
      (winner === "player2" && !iAmPlayer1)
    ) {
      resultText = "Ganaste";
      resultType = "ganaste";
      if (iAmPlayer1) currentHistory.player1 += 1;
      else currentHistory.player2 += 1;
    } else {
      resultText = "Perdiste";
      resultType = "perdiste";
      if (iAmPlayer1) currentHistory.player2 += 1;
      else currentHistory.player1 += 1;
    }

    state.data.history = currentHistory;

    this.shadow.innerHTML = `
      <div class="container result--${resultType}">
        <div class="hands-container">
          <div class="opponent-hands">
            <img src="${piedraImg.href}" class="hand" data-hand="piedra">
            <img src="${papelImg.href}" class="hand" data-hand="papel">
            <img src="${tijeraImg.href}" class="hand" data-hand="tijera">
          </div>
          <div class="my-hands">
            <img src="${piedraImg.href}" class="hand" data-hand="piedra">
            <img src="${papelImg.href}" class="hand" data-hand="papel">
            <img src="${tijeraImg.href}" class="hand" data-hand="tijera">
          </div>
        </div>
        
        <div class="result-banner hidden">
          <h1 class="result-text">${resultText}</h1>
          <div class="score-board">
            <p>Score</p>
            <p>Vos: ${iAmPlayer1 ? currentHistory.player1 : currentHistory.player2}</p>
            <p>Oponente: ${iAmPlayer1 ? currentHistory.player2 : currentHistory.player1}</p>
          </div>
          <custom-button class="play-again-btn">Volver a Jugar</custom-button>
          <custom-button class="go-home-btn">Volver al inicio</custom-button>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      .container { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .result--ganaste { background-color: rgba(136, 137, 73, 0.6); }
      .result--perdiste { background-color: rgba(137, 73, 73, 0.6); }
      .result--empate { background-color: rgba(255, 250, 122, 0.6); }
      
      .hands-container { position: absolute; width: 100%; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
      .opponent-hands { transform: rotate(180deg); }
      .my-hands, .opponent-hands { display: flex; align-items: flex-end; height: 40%; }
      
      .hand {
        width: 150px; 
        height: auto;
        display: none;
        margin: 0 10px;
      }
      .hand.selected {
        display: block;
        transform: translateY(-20px) scale(1.2);
        transition: transform 0.3s ease-in-out;
      }
      
      .result-banner { display: flex; flex-direction: column; align-items: center; gap: 15px; position: relative; z-index: 1; transition: opacity 0.5s ease-in-out; }
      .result-banner.hidden { opacity: 0; pointer-events: none; }
      .result-text { font-size: 55px; margin: 0; font-family: 'Odibee Sans', cursive; }
      .score-board { border: 5px solid #000; background: white; padding: 15px; border-radius: 10px; text-align: right; font-family: 'Odibee Sans', cursive; font-size: 24px; width: 100%; min-width: 250px;}
      .score-board p { margin: 5px 0; color: #000; }
      .play-again-btn, .go-home-btn { width: 100%; min-width: 300px; }
    `;
    this.shadow.appendChild(style);

    const myHandEl = this.shadow.querySelector(
      `.my-hands .hand[data-hand="${myMove}"]`,
    );
    const opponentHandEl = this.shadow.querySelector(
      `.opponent-hands .hand[data-hand="${opponentMove}"]`,
    );

    if (myHandEl) myHandEl.classList.add("selected");
    if (opponentHandEl) opponentHandEl.classList.add("selected");

    setTimeout(() => {
      const banner = this.shadow.querySelector(".result-banner");
      if (banner) {
        const handsContainer = this.shadow.querySelector(
          ".hands-container",
        ) as HTMLElement;
        if (handsContainer) handsContainer.style.display = "none";
        banner.classList.remove("hidden");
      }
    }, 2000);

    this.addListeners();
  }

  addListeners() {
    const playAgainBtn = this.shadow.querySelector(".play-again-btn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        state.resetPlay(() => {
          Router.go("/instructions");
        });
      });
    }
    const goHomeBtn = this.shadow.querySelector(".go-home-btn");
    if (goHomeBtn) {
      goHomeBtn.addEventListener("click", () => {
        // Redirigimos a la pantalla principal sin resetear la sala
        Router.go("/welcome");
      });
    }
  }
}
customElements.define("result-page", ResultPage);
