// ===== IMPORTAÇÕES =====

import { db } from "../firebase.js";

import {
  collection,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIAVEL GLOBAL =====

const container = document.getElementById("solicitacoes-alunos");

// ===== BUSCAR SOLICITAÇÕES =====

const snapshot = await getDocs(collection(db, "solicitacoes"));

if (snapshot.empty) {
  container.innerHTML = "<p>Não há solicitações no momento.</p>";
} else {
  let html = "";

  // ===== EXIBIR SOLICITAÇÕES =====

  snapshot.forEach(d => {
    const s = d.data();
    if (s.apagadoLider === true) return;
    html += `
      <div class="solicitacao-card">
        <h3 class="solicitacao-titulo">${s.solicitacao}</h3>

        <div class="solicitacao-info">
          <p><strong>Aluno:</strong> ${s.alunoNome}</p>
          <p><strong>Status:</strong> ${s.status}</p>
          <p><strong>➡️ ${s.tipo}</strong> </p>
        </div>

        <div class="solicitacao-acoes">
  ${s.status === "pendente"
        ? `
        <button class="btn btn-aceitar" data-id="${d.id}">
          Aceitar
        </button>
        <button class="btn btn-recusar" data-id="${d.id}">
          Recusar
        </button>
      `
        : `
        <button class="btn btn-excluir" data-id="${d.id}">
          Excluir
        </button>
      `
      }
</div>

      </div>
    `;
  });

  container.innerHTML = html;

  // ===== BOTÃO ACEITAR =====

  document.querySelectorAll(".btn-aceitar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const resposta = prompt("Digite sua resposta para o aluno:");

      if (!resposta) return;

      const id = btn.dataset.id;

      await updateDoc(doc(db, "solicitacoes", id), {
        status: "Aceito",
        respostaLider: resposta,
        respondidoEm: serverTimestamp()
      });

      alert("Solicitação aceita!");
      location.reload();
    });
  });

  // ===== BOTÃO RECUSAR =====

  document.querySelectorAll(".btn-recusar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const motivo = prompt("Digite o motivo da recusa:");

      if (!motivo) return;

      const id = btn.dataset.id;

      await updateDoc(doc(db, "solicitacoes", id), {
        status: "Recusado",
        respostaLider: motivo,
        respondidoEm: serverTimestamp()
      });

      alert("Solicitação recusada!");
      location.reload();
    });
  });

  // ===== BOTÃO EXCLUIR =====

  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Deseja excluir esta solicitação?")) return;

      const id = btn.dataset.id;
      const ref = doc(db, "solicitacoes", id);

      await updateDoc(ref, { apagadoLider: true });

      const snap = await getDoc(ref);
      const data = snap.data();

      if (data.apagadoAluno === true && data.apagadoLider === true) {
        await deleteDoc(ref);
      }

      location.reload();
    });
  });
}

