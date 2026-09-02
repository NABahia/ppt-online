import { Router } from "@vaadin/router";
import { state } from "../../state";

class AccessRoomPage extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
      <div class="container">
        <h1 class="title">Piedra, Papel o Tijera</h1>
        <custom-form class="form" label="Código" button-text="Ingresar a la sala"></custom-form>
        <hand-icons class="hands"></hand-icons>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
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
      .hands {
        transform: translateY(30px);
      }
    `;
    this.shadow.appendChild(style);
    this.addListeners();
  }

  addListeners() {
    const form = this.shadow.querySelector(".form");
    if (form) {
      form.addEventListener("form-submit", (e: any) => {
        const roomId = e.detail.value;
        if (roomId) {
          // Usamos la nueva función del state para obtener el ID largo y unirnos
          state.getRoom(roomId, (err) => {
            if (err) {
              console.log("el roomId", roomId);
              alert("La sala no existe");
            } else {
              // Si todo sale bien, navegamos a la pantalla de instrucciones o del juego
              Router.go("/instructions");
            }
          });
        }
      });
    }
  }
}

customElements.define("access-room-page", AccessRoomPage);
