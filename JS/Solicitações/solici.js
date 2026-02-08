// =========== IMPORTAÇÕES =====

import { db } from "../firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";



// =========== VARIÁVEIS GLOBAIS =====
const auth = getAuth();
const form = document.getElementById("formulario-solic");
const container = document.getElementById("minhas-solicitacoes");

let usuarioLogado = null;



// =========== VERIFICA USUÁRIO LOGADO =====
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Você precisa estar logado");
    window.location.href = "/login.html";
    return;
  }

  usuarioLogado = user;
  carregarMinhasSolicitacoes();
});



// =========== ENVIAR SOLICITAÇÕES =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!usuarioLogado) return;

  try {
    const docRef = doc(db, "usuarios", usuarioLogado.uid);
    const docSnap = await getDoc(docRef);

    let nomeParaSalvar = "?";
    if (docSnap.exists() && docSnap.data().nome) {
      nomeParaSalvar = docSnap.data().nome;
    }

    const solicitacao = document.getElementById("selectSolicitacao").value;
    const lider = document.getElementById("selectLider").value;
    const tipo = document.getElementById("selectTipo").value.trim();

    await addDoc(collection(db, "solicitacoes"), {
      alunoId: usuarioLogado.uid,
      alunoNome: nomeParaSalvar,
      solicitacao,
      tipo,
      lider,
      status: "pendente",
      criadoEm: serverTimestamp(),
      notificadoAtraso: false,
      apagadoAluno: false,
      apagadoLider: false
    });

    alert("Enviado com sucesso!");
    form.reset();
    carregarMinhasSolicitacoes();
  } catch (err) {
    alert("Erro ao enviar");
    console.error(err);
  }
});



// =========== CARREGAR PRÓPRIAS SOLICITAÇÕES =====
async function carregarMinhasSolicitacoes() {
  const q = query(
    collection(db, "solicitacoes"),
    where("alunoId", "==", usuarioLogado.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  snap.forEach(d => {
    const s = d.data();
    if (s.apagadoAluno === true) return;

    html += `
      <div class="solicitacao-card">
        <p><strong>Tipo:</strong> ${s.solicitacao}</p>
        <p><strong>Status:</strong> ${s.status}</p>
        <p><strong>Sua mensagem:</strong> "${s.tipo}"</p>

        ${s.respostaLider
        ? `<p><strong>Resposta:</strong> ${s.respostaLider}</p>`
        : "<p>Sua solicitação ainda não foi analisada</p>"
      }

        <button
          class="btn-excluir"
          data-id="${d.id}"
          data-status="${s.status}">
            Excluir
          </button>
      </div>
    `;
  });
  container.innerHTML = html;



  // =========== BOTÃO EXCLUIR =====
  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      const ref = doc(db, "solicitacoes", id);

      const msg =
      status === "pendente"
      ? "Esta solicitação ainda não foi analisada. Ela será excluída definitivamente. Deseja continuar?"
      : "Deseja excluir esta solicitação?";

      if (!confirm(msg)) return;

      if (status === "pendente") {
        await deleteDoc(ref);
        carregarMinhasSolicitacoes();
        return;
      }

      await updateDoc(ref, { apagadoAluno: true });

      const snap = await getDoc(ref);
      const data = snap.data();

      if (data.apagadoAluno === true && data.apagadoLider === true) {
        await deleteDoc(ref);
      }

      carregarMinhasSolicitacoes();
    });
  });
}