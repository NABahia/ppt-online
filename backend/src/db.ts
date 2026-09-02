import admin from "firebase-admin";
import dotenv from "dotenv";

// Carga las variables de entorno del archivo .env
dotenv.config();

// Comprueba que la variable de entorno exista para evitar errores
if (!process.env.SERVICE_ACCOUNT_BASE64) {
  throw new Error(
    "La variable de entorno SERVICE_ACCOUNT_BASE64 no está definida."
  );
}

// Decodifica la clave de servicio desde Base64
const serviceAccountString = Buffer.from(
  process.env.SERVICE_ACCOUNT_BASE64,
  "base64"
).toString("utf-8");

const serviceAccount = JSON.parse(serviceAccountString);

// Evita reinicializar la app en cada recarga del servidor de desarrollo
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL,
  });
}

const firestore = admin.firestore();
const rtdb = admin.database();

export { firestore, rtdb };
