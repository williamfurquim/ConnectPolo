// ===== IMPORTAÇÕES =====

import { auth } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const perfilNome = document.getElementById("perfil-nome");
const botao = document.getElementById("d-perfil");

// ===== VERIFICAÇÃO ===== 

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const nome = user.email.split("@")[0];
  perfilNome.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
});

botao.addEventListener("click", () => {
  window.location.href = "perfil.html";
})