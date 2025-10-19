
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDgwI90DMBa25JOkNR2Oec32kfgIt5TNg",
  authDomain: "prompt-scientist.firebaseapp.com",
  projectId: "prompt-scientist",
  storageBucket: "prompt-scientist.firebasestorage.app",
  messagingSenderId: "240705146800",
  appId: "1:240705146800:web:e7f05107761f4d3007d075"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
