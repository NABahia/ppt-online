import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "Um0i4c7dfF9v84UWwJePl1AW2S9dMyaScZFWilQy",
  authDomain: "nabahia-e2c4a.firebaseapp.com",
  projectId: "nabahia-e2c4a",
  databaseURL: "https://nabahia-e2c4a-default-rtdb.firebaseio.com",
  storageBucket: "nabahia-e2c4a.appspot.com",
  appId: "nabahia-e2c4a",
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

export { rtdb };
