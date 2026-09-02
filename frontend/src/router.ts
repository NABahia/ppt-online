import { Router } from "@vaadin/router";

// Importamos los componentes de las páginas
import "./pages/login-page";
import "./pages/welcome";
import "./pages/access-room";
import "./pages/share-code";
import "./pages/instructions";
import "./pages/game";
import "./pages/result";

const router = new Router(document.querySelector(".root"));
router.setRoutes([
  // Flujo principal del juego
  { path: "/", redirect: "/login" },
  { path: "/login", component: "login-page" },
  { path: "/welcome", component: "welcome-page" },
  { path: "/join-game", component: "access-room-page" },
  { path: "/share-code", component: "share-code-page" },
  { path: "/instructions", component: "instructions-page" },
  { path: "/game", component: "game-page" },
  { path: "/result", component: "result-page" },

  // Ruta para manejar URLs no encontradas
  { path: "(.*)", redirect: "/welcome" },
]);
