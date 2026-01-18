import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBrC8475Zag_T-sfRgXibUi_4YGSfRhxSk",
  authDomain: "marcopolodays-25e45.firebaseapp.com",
  databaseURL: "https://marcopolodays-25e45-default-rtdb.firebaseio.com",
  projectId: "marcopolodays-25e45",
  storageBucket: "marcopolodays-25e45.firebasestorage.app",
  messagingSenderId: "992740172037",
  appId: "1:992740172037:web:83423a2f89c245dbb5576c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };