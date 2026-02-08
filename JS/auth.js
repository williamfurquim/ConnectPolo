// =========== IMPORTAÇÕES =====
import { auth, db } from "./firebase.js";

import { signInWithEmailAndPassword } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";



// =========== VARIÁVEIS GLOBAIS =====
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");



// =========== FORMULÁRIO DE LOGIN =====
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const msg = document.getElementById("loginMessage");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          role: "aluno", 
          ativo: true,
          criadoEm: new Date()
        });
      }

      const userData = (await getDoc(ref)).data();

      if (userData.role === "lider") {
        window.location.href = "lider.html";
      } else {
        window.location.href = "aluno.html";
      }
    } catch (err) {
      msg.textContent = "Erro ao fazer login: " + err;
      msg.style.color = "gray";
      console.log(err)
    }
  });
}