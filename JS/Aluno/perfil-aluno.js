// ===== IMPORTAÇÕES =====
import { auth } from "../firebase.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";



// =========== OUVIDOR AO ABRIR PÁGINA ===== 
document.addEventListener("DOMContentLoaded", () => {
  const perfilNome = document.getElementById("perfil-nome");
  const botao = document.getElementById("d-perfil");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const nome = user.email.split("@")[0];
    if (perfilNome) perfilNome.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  });

  if (botao) botao.addEventListener("click", () => {
    window.location.href = "perfil-aluno.html";
  });
});
