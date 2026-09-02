class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.render();
  }
  render() {
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        box-sizing: border-box;
      }
      .button {
        background-color: #006CFC;
        border: 10px solid #001997;
        border-radius: 10px;
        font-size: 45px;
        font-family: 'Odibee Sans', cursive;
        color: white;
        padding: 5px 0;
        width: 320px;
        cursor: pointer;
        text-align: center;
      }
      .button:hover {
        background-color: #0056ca;
      }
    `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.appendChild(style);

    const button = document.createElement("div");
    button.classList.add("button");
    button.textContent = this.textContent;
    this.shadowRoot?.appendChild(button);
  }
}
customElements.define("custom-button", CustomButton);
