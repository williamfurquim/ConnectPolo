// ===== IMPORTAÇÕES =====

import { db } from "../firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// ===== VARIÁVEIS GLOBAIS =====

const auth = getAuth();
const form = document.getElementById("formulario-solic");
const container = document.getElementById("minhas-solicitacoes");

let usuarioLogado = null;

// ===== VERIFICA USUÁRIO LOGADO =====

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Você precisa estar logado");
    window.location.href = "/login.html";
    return;
  }

  usuarioLogado = user;
  carregarMinhasSolicitacoes();
});

// ===== ENVIAR SOLICITAÇÕES =====

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!usuarioLogado) return;

  const solicitacao = document.getElementById("selectSolicitacao").value;
  const lider = document.getElementById("selectLider").value;
  const tipo = document.getElementById("selectTipo").value.trim();

  const alunoId = usuarioLogado.uid;
  const alunoNome = usuarioLogado.displayName || usuarioLogado.email;

  try {
    await addDoc(collection(db, "solicitacoes"), {
      alunoId,
      alunoNome,
      solicitacao,
      tipo,
      lider,
      status: "pendente",
      criadoEm: serverTimestamp()
    });

    alert("Enviado com sucesso!");
    form.reset();
    carregarMinhasSolicitacoes();

  } catch (err) {
    alert("Erro ao enviar");
    console.error(err);
  }
});

// ===== CARREGAR PRÓPRIAS SOLICITAÇÕES =====

async function carregarMinhasSolicitacoes() {
  const q = query(
    collection(db, "solicitacoes"),
    where("alunoId", "==", usuarioLogado.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p>Você ainda não enviou solicitações.</p>";
    return;
  }

  let html = "";

  snap.forEach(d => {
    const s = d.data();

    html += `
      <div class="solicitacao-card">
        <p><strong>Tipo:</strong> ${s.solicitacao}</p>
        <p><strong>Status:</strong> ${s.status}</p>

        ${s.respostaLider
          ? `<p><strong>Resposta:</strong> ${s.respostaLider}</p>`
          : ""
        }

        ${s.status === "pendente"
          ? `<button class="btn-excluir" data-id="${d.id}">Excluir</button>`
          : ""
        }
      </div>
    `;
  });

  container.innerHTML = html;

  // ===== BOTÃO EXCLUIR =====

  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Deseja excluir esta solicitação?")) return;
      await deleteDoc(doc(db, "solicitacoes", btn.dataset.id));
      carregarMinhasSolicitacoes();
    });
  });
}
