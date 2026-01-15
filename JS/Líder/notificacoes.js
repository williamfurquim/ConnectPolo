// ===== IMPORTAÇÕES =====

import { protegerPagina } from "../guard.js";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

protegerPagina("lider");

// ===== VARIÁVEIS GLOBAIS =====

const area = document.getElementById("lista-notificacoes");

const q = query(
  collection(db, "notificacoes"),
  where("lida", "==", false),
  orderBy("criadaEm", "desc")
);

// ===== EXIBE NOTIFICAÇÕES =====

onSnapshot(q, (snap) => {
  console.log("Docs encontrados: ", snap.size);
  area.innerHTML = "";

  snap.forEach(d => {
    const n = d.data();
    const div = document.createElement("div");
    div.classList.add("notificacao", n.tipo);

    const data = n.criadaEm?.toDate().toLocaleString("pt-BR");

    div.innerHTML = `
  <p>${n.mensagem}</p> 
  <div class="notificacaoBottom">
  <small class="small">${n.tipo.toUpperCase()} • ${data}</small><br>
  <button class="btn-lida">Marcar como lida</button>
  </div>
`;

    div.querySelector(".btn-lida").addEventListener("click", async () => {
      await updateDoc(d.ref, { lida: true });
    });

    area.appendChild(div);   
  });
});

// ===== ATUALIZAÇÃO NA VIRADA DO DIA =====

function recarregarNaViradaDoDia() {
  const agora = new Date();
  const meiaNoite = new Date();

  meiaNoite.setHours(24, 0, 0, 0);

  const msAteMeiaNoite = meiaNoite - agora;

  setTimeout(() => {
    window.location.reload();
  }, msAteMeiaNoite);
}

recarregarNaViradaDoDia();