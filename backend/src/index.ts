import express from "express";
import cors from "cors";
import path from "path";
import { firestore, rtdb } from "./db.js";
import { nanoid } from "nanoid";
import "dotenv/config";

const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(cors());

// Le decimos a Express que sirva los archivos estáticos compilados por Parcel
app.use(express.static(path.resolve("frontend/dist")));

const usersCollection = firestore.collection("users");
const roomsCollection = firestore.collection("rooms");
type Move = "piedra" | "papel" | "tijera";

// ... (signup no cambia) ...
app.post("/signup", async (req, res) => {
  try {
    const { nombre, userId } = req.body;
    if (!nombre)
      return res.status(400).json({ error: "El nombre es requerido" });
    const searchResponse = await usersCollection
      .where("nombre", "==", nombre)
      .get();
    if (!searchResponse.empty) {
      const existingUser = searchResponse.docs[0];
      if (userId && existingUser.id === userId) {
        return res
          .status(200)
          .json({ id: existingUser.id, message: "Login successful" });
      } else {
        return res.status(409).json({
          message:
            "El nombre de usuario ya está en uso. Por favor, elige otro.",
        });
      }
    }
    const newUser = await usersCollection.add({ nombre });
    res.status(201).json({ id: newUser.id, nombre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para crear una sala o recuperar y ACTUALIZAR la existente de un owner
app.post("/rooms", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ error: "El userId es requerido" });

    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });
    const userData = userDoc.data();
    if (!userData)
      return res.status(404).json({ error: "Datos de usuario no encontrados" });

    const roomQuery = await roomsCollection.where("owner", "==", userId).get();

    // Si el usuario ya tiene una sala...
    if (!roomQuery.empty) {
      const existingRoom = roomQuery.docs[0].data();
      const rtdbRoomId = existingRoom.rtdbRoomId;

      // CAMBIO: Apuntamos a la sala entera, no solo a /players
      const roomRef = rtdb.ref(`rooms/${rtdbRoomId}`);
      await roomRef.update({
        "players/player1": {
          nombre: userData.nombre,
          userId: userId,
          online: true,
          ready: false,
          move: "",
        },
        "players/player2": null, // borramos al jugador 2
        winner: null, // ¡ESTA ES LA MAGIA! Borramos el ganador viejo
      });

      // Y luego devolvemos los datos de la sala existente
      return res.json({
        roomId: existingRoom.shortId,
        rtdbRoomId: rtdbRoomId,
      });
    }

    // Si no tiene una sala, creamos una nueva (lógica sin cambios)
    const shortId = nanoid(6).toUpperCase();
    const newRoomRef = rtdb.ref(`rooms/${nanoid()}`);
    await newRoomRef.set({
      owner: userId,
      players: {
        player1: {
          nombre: userData.nombre,
          userId: userId,
          online: true,
          move: "",
          ready: false,
        },
        player2: {},
      },
    });
    const rtdbRoomId = newRoomRef.key;
    if (!rtdbRoomId)
      throw new Error("No se pudo obtener el ID de la sala de RTDB");
    await roomsCollection
      .doc(rtdbRoomId)
      .set({ owner: userId, shortId, rtdbRoomId });
    res.status(201).json({ roomId: shortId, rtdbRoomId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/rooms/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    const cleanShortId = shortId.trim().toUpperCase();
    const roomQuery = await roomsCollection
      .where("shortId", "==", cleanShortId)
      .get();
    if (roomQuery.empty)
      return res.status(404).json({ message: "Sala no encontrada" });
    const roomDoc = roomQuery.docs[0];
    res.json({ rtdbRoomId: roomDoc.data().rtdbRoomId });
  } catch (error) {
    console.error("Error al buscar la sala:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/rooms/:rtdbRoomId/players", async (req, res) => {
  try {
    const { rtdbRoomId } = req.params;
    const { userId } = req.body;

    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });
    const userData = userDoc.data();
    if (!userData)
      return res.status(404).json({ error: "Datos de usuario no encontrados" });

    const roomRef = rtdb.ref(`rooms/${rtdbRoomId}`);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.val();

    if (
      roomData.players.player2 &&
      roomData.players.player2.userId &&
      roomData.players.player2.userId !== userId
    ) {
      return res.status(400).json({ message: "La sala ya está llena." });
    }

    const existingPlayer1Data = roomData.players.player1;

    const updates = {
      "players/player2": {
        nombre: userData.nombre,
        userId: userId,
        online: true,
        move: "",
        ready: false,
      },
      "players/player1": {
        ...existingPlayer1Data,
        ready: false,
        move: "",
      },
      winner: null, // Reseteamos el ganador al unir un nuevo jugador
    };

    await roomRef.update(updates);

    res.status(200).json({ message: "Te uniste a la sala exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/rooms/:rtdbRoomId/ready", async (req, res) => {
  try {
    const { rtdbRoomId } = req.params;
    const { userId } = req.body;
    const roomRef = rtdb.ref(`rooms/${rtdbRoomId}`);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.val();
    if (!roomData)
      return res.status(404).json({ message: "Sala no encontrada" });

    const playerKey =
      roomData.players.player1.userId === userId ? "player1" : "player2";
    await rtdb
      .ref(`rooms/${rtdbRoomId}/players/${playerKey}`)
      .update({ ready: true, move: "" }); // FORZAMOS LA LIMPIEZA DE LA JUGADA
    res.status(200).json({ message: `Jugador ${playerKey} está listo` });
  } catch (error) {
    console.error("Error al marcar como listo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

function whoWins(p1Move: Move, p2Move: Move) {
  if (p1Move === p2Move) return "empate";
  const winningMoves: Record<Move, Move> = {
    piedra: "tijera",
    papel: "piedra",
    tijera: "papel",
  };
  if (winningMoves[p1Move] === p2Move) return "player1";
  return "player2";
}

app.post("/rooms/:rtdbRoomId/move", async (req, res) => {
  try {
    const { rtdbRoomId } = req.params;
    const { userId, move } = req.body;
    const roomRef = rtdb.ref(`rooms/${rtdbRoomId}`);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.val();
    if (!roomData)
      return res.status(404).json({ message: "Sala no encontrada" });
    const playerKey =
      roomData.players.player1.userId === userId ? "player1" : "player2";
    await rtdb.ref(`rooms/${rtdbRoomId}/players/${playerKey}`).update({ move });
    const updatedRoomSnap = await roomRef.get();
    const { players } = updatedRoomSnap.val();
    if (players.player1.move && players.player2.move) {
      const winner = whoWins(
        players.player1.move as Move,
        players.player2.move as Move,
      );
      await roomRef.update({ winner });
    }
    res.status(200).json({ message: `Jugada de ${playerKey} registrada` });
  } catch (error) {
    console.error("Error al registrar la jugada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/rooms/:rtdbRoomId/reset", async (req, res) => {
  try {
    const { rtdbRoomId } = req.params;
    const roomRef = rtdb.ref(`rooms/${rtdbRoomId}`);
    await roomRef.update({
      "players/player1/move": "",
      "players/player1/ready": false,
      "players/player2/move": "",
      "players/player2/ready": false,
      winner: null,
    });
    res.status(200).json({ message: "La partida ha sido reseteada" });
  } catch (error) {
    console.error("Error al resetear la partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve("frontend/dist/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
