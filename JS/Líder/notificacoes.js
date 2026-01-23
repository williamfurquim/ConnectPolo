// ===== IMPORTAÇÕES =====
import { protegerPagina } from "../guard.js";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc
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
onSnapshot(q, async (snap) => {
  area.innerHTML = "";

  // Para cada doc, buscamos o nome do aluno em paralelo
  const notificacoes = await Promise.all(snap.docs.map(async (d) => {
    const n = d.data();
    let alunoNome = "Aluno desconhecido";

    if (n.alunoId) {
      const refAluno = doc(db, "usuarios", n.alunoId);
      const snapAluno = await getDoc(refAluno);
      if (snapAluno.exists()) {
        const dadosAluno = snapAluno.data();
        if (dadosAluno.nome) {
          alunoNome = dadosAluno.nome;
        } else if (dadosAluno.email) {
          alunoNome = dadosAluno.email.split("@")[0];
          alunoNome = alunoNome.charAt(0).toUpperCase() + alunoNome.slice(1);
        }
      }
    }

    return { ...n, id: d.id, ref: d.ref, alunoNome };
  }));

  // Agora renderizamos todas as notificações
  notificacoes.forEach(n => {
    const div = document.createElement("div");
    div.classList.add("notificacao", n.tipo);

    const data = n.criadaEm?.toDate().toLocaleString("pt-BR");

    div.innerHTML = `
      <p style="font-size: 1.25rem;"><strong>${n.alunoNome}</strong> ${n.mensagem} | <strong>Motivo:</strong> ${n.motivo}</p>
      ${n.observacao ? `<p style="margin-top: 1rem; font-size: 1.1rem;">➡️Observação: ${n.observacao}</p>` : ""}
      <div class="notificacaoBottom">
        <small class="small">${n.tipo.toUpperCase()} • ${data}</small><br>
        <button class="btn-lida">Marcar como lida</button>
      </div>
    `;

    div.querySelector(".btn-lida").addEventListener("click", async () => {
      await updateDoc(n.ref, { lida: true });
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
