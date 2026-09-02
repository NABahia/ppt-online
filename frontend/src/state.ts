// Importamos la referencia a la RTDB del cliente y las nuevas funciones
import { rtdb } from "./rtdb";
import { ref, onValue, onDisconnect } from "firebase/database";
import { Router } from "@vaadin/router";

const API_BASE_URL = "";

// DEFINIMOS LOS TIPOS PARA NUESTRO ESTADO
type ValidMove = "piedra" | "papel" | "tijera";
type Move = ValidMove | "";
type Player = {
  nombre: string;
  userId: string;
  online: boolean;
  move: Move;
  ready: boolean;
};
type GameState = {
  player1: Partial<Player>;
  player2: Partial<Player>;
  winner?: "player1" | "player2" | "empate";
};
type State = {
  userId: string;
  nombre: string;
  roomId: string;
  rtdbRoomId: string;
  currentGame: GameState;
  history: { player1: number; player2: number };
};

const state = {
  data: {
    userId: "",
    nombre: "",
    roomId: "",
    rtdbRoomId: "",
    currentGame: { player1: {}, player2: {} },
    history: { player1: 0, player2: 0 },
  } as State,
  listeners: [],

  init() {
    const localData = localStorage.getItem("ppt-user-data");
    if (localData) {
      const parsedData = JSON.parse(localData);
      this.setState({
        userId: parsedData.userId,
        nombre: parsedData.nombre,
      });
    }
  },

  getState() {
    return this.data;
  },

  // La función setState centralizada para todas las actualizaciones
  setState(newState: Partial<State>) {
    this.data = { ...this.data, ...newState };
    for (const cb of this.listeners) {
      cb();
    }
    console.log("State updated:", this.data);
  },

  setNombre(nombre: string) {
    this.setState({ nombre: nombre });
  },

  signIn(callback: (err?: string) => void) {
    const currentState = this.getState();
    if (currentState.nombre) {
      fetch(`${API_BASE_URL}/signup`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: currentState.nombre,
          userId: currentState.userId,
        }),
      })
        .then((res) => {
          if (res.status === 409) {
            return res.json().then((errData) => {
              throw new Error(errData.message);
            });
          }
          if (!res.ok) {
            throw new Error("Hubo un problema al registrarse");
          }
          return res.json();
        })
        .then((data) => {
          this.setState({ userId: data.id });
          localStorage.setItem(
            "ppt-user-data",
            JSON.stringify({
              nombre: this.data.nombre,
              userId: this.data.userId,
            }),
          );
          callback();
        })
        .catch((err) => {
          callback(err.message);
        });
    } else {
      callback("El nombre no puede estar vacío");
    }
  },

  createRoom(callback: () => void) {
    const currentState = this.getState();
    fetch(`${API_BASE_URL}/rooms`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentState.userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({
          roomId: data.roomId,
          rtdbRoomId: data.rtdbRoomId,
          history: data.score || { player1: 0, player2: 0 },
        });
        this.connectToRoom();
        callback();
      });
  },

  getRoom(shortId: string, callback: (err?: boolean) => void) {
    fetch(`${API_BASE_URL}/rooms/${shortId.trim().toUpperCase()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Sala no encontrada");
        }
        return res.json();
      })
      .then((data) => {
        if (data.rtdbRoomId) {
          this.setState({
            roomId: shortId.trim().toUpperCase(),
            rtdbRoomId: data.rtdbRoomId,
            history: data.score || { player1: 0, player2: 0 },
          });
          this.joinRoom(callback);
        } else {
          callback(true);
        }
      })
      .catch(() => {
        callback(true);
      });
  },

  joinRoom(callback: (err?: boolean) => void) {
    const currentState = this.getState();
    fetch(`${API_BASE_URL}/rooms/${currentState.rtdbRoomId}/players`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentState.userId }),
    }).then(() => {
      this.connectToRoom();
      callback();
    });
  },

  connectToRoom() {
    // Obtenemos el ID de la sala del estado actual
    const rtdbRoomId = this.getState().rtdbRoomId;
    const roomRef = ref(rtdb, `rooms/${rtdbRoomId}`);

    onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (roomData) {
        // Creamos un nuevo objeto de estado del juego
        const newGame: GameState = {
          player1: roomData.players?.player1 || {},
          player2: roomData.players?.player2 || {},
          winner: roomData.winner,
        };
        // Actualizamos el estado con los datos de Firebase
        this.setState({ currentGame: newGame });

        // Obtenemos el estado MÁS RECIENTE para la lógica de presencia
        const latestState = this.getState();
        const iamPlayer1 =
          latestState.userId === roomData.players?.player1?.userId;
        const iamPlayer2 =
          latestState.userId === roomData.players?.player2?.userId;

        if (iamPlayer1) {
          const player1Ref = ref(
            rtdb,
            `rooms/${rtdbRoomId}/players/player1/online`,
          );
          onDisconnect(player1Ref).set(false);
        } else if (iamPlayer2) {
          const player2Ref = ref(
            rtdb,
            `rooms/${rtdbRoomId}/players/player2/online`,
          );
          onDisconnect(player2Ref).set(false);
        }
      }
    });
  },

  setPlayerReady() {
    const currentState = this.getState();
    fetch(`${API_BASE_URL}/rooms/${currentState.rtdbRoomId}/ready`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentState.userId }),
    });
  },

  setMove(move: Move) {
    const currentState = this.getState();
    fetch(`${API_BASE_URL}/rooms/${currentState.rtdbRoomId}/move`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentState.userId, move: move }),
    });
  },

  resetPlay(callback: () => void) {
    const currentState = this.getState();
    fetch(`${API_BASE_URL}/rooms/${currentState.rtdbRoomId}/reset`, {
      method: "post",
    }).then(() => {
      callback();
    });
  },

  subscribe(callback: (any) => any) {
    this.listeners.push(callback);
  },
};

export { state };
