// Usamos el constructor new URL para obtener las rutas de forma explícita y robusta.
// El segundo parámetro, `import.meta.url`, le da a Parcel el contexto para resolver la ruta.
const piedraImg = new URL("../../public/assets/piedra.svg", import.meta.url);
const papelImg = new URL("../../public/assets/papel.svg", import.meta.url);
const tijeraImg = new URL("../../public/assets/tijera.svg", import.meta.url);

class HandIcons extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  constructor() {
    super();
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
    <style>
        * {
          box-sizing: border-box;
        }
        .container {
            position: relative;
            width: 300px; /* Ajusta según diseño */
            height: 150px; /* Menor que la imagen para ocultar parte inferior */
            overflow: hidden; /* Oculta la parte baja de las imágenes */
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        img {
            width: 100px;
            height: 131px;
            cursor: pointer;
            transition: transform 0.3s;
            transform: translateY(50px); /* Inicia oculta debajo */
        }
        img.active {
            transform: translateY(20px); /* Se levanta completamente */
        }
    </style>
    <div class="container">
      <img src="${piedraImg.href}" alt="Piedra" class="hand" data-type="piedra">
      <img src="${papelImg.href}" alt="Papel" class="hand" data-type="papel">
      <img src="${tijeraImg.href}" alt="Tijera" class="hand" data-type="tijera">
    </div>
    `;

    const hands = this.shadow.querySelectorAll(".hand");
    hands.forEach((hand) => {
      hand.addEventListener("click", () => {
        hands.forEach((h) => h.classList.remove("active"));
        hand.classList.add("active");

        const handType = hand.getAttribute("data-type");
        const customEvent = new CustomEvent("hand-selected", {
          detail: {
            handType: handType,
          },
        });

        this.dispatchEvent(customEvent);
      });
    });
  }
}

customElements.define("hand-icons", HandIcons);
