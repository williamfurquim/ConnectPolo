// ===== IMPORTAÇÕES =====
import { db } from "../firebase.js";
import {
  collection,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====
const container = document.getElementById("solicitacoes-alunos");

// ===== FUNÇÃO PARA BUSCAR E RENDERIZAR SOLICITAÇÕES =====
async function carregarSolicitacoes() {
  const snapshot = await getDocs(collection(db, "solicitacoes"));

  if (snapshot.empty) {
    container.innerHTML = "<p>Não há solicitações no momento.</p>";
    return;
  }

  // Contagem de tipos
  const tiposContagem = {};
  snapshot.forEach(d => {
    const s = d.data();
    if (s.apagadoLider) return;
    if (!tiposContagem[s.solicitacao]) tiposContagem[s.solicitacao] = 0;
    tiposContagem[s.solicitacao]++;
  });

  // ===== CRIAR SELECT DE FILTRO =====
  let filtroSelect = document.getElementById("filtro-tipo");
  if (!filtroSelect) {
    filtroSelect = document.createElement("select");
    filtroSelect.id = "filtro-tipo";
    filtroSelect.innerHTML = '<option value="todos">Todos</option>';
    container.parentElement.insertBefore(filtroSelect, container);
  } else {
    filtroSelect.innerHTML = '<option value="todos">Todos</option>';
  }

  for (const tipo in tiposContagem) {
    const opt = document.createElement("option");
    opt.value = tipo;
    opt.textContent = `${tipo} (${tiposContagem[tipo]})`;
    filtroSelect.appendChild(opt);
  }

  // ===== FUNÇÃO PARA RENDERIZAR A LISTA COM FILTRO =====
  function renderizarLista(tipoSelecionado = "todos") {
    let html = "";
    snapshot.forEach(d => {
      const s = d.data();
      if (s.apagadoLider) return;
      if (tipoSelecionado !== "todos" && s.solicitacao !== tipoSelecionado) return;

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
              ? `<button class="btn btn-aceitar" data-id="${d.id}">Aceitar</button>
                 <button class="btn btn-recusar" data-id="${d.id}">Recusar</button>`
              : `<button class="btn btn-excluir" data-id="${d.id}">Excluir</button>`
            }
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    adicionarListenersBotoes(); // Reaplica listeners sempre
  }

  // ===== LISTENER PARA O SELECT =====
  filtroSelect.addEventListener("change", () => {
    renderizarLista(filtroSelect.value);
  });

  // Renderiza inicialmente todas as solicitações
  renderizarLista();
}

// ===== FUNÇÃO PARA ADICIONAR LISTENERS =====
function adicionarListenersBotoes() {
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
      const id = btn.dataset.id;
      const ref = doc(db, "solicitacoes", id);

      if (!confirm("Deseja excluir esta solicitação?")) return;

      const snap = await getDoc(ref);
      const data = snap.data();

      if (data.status === "pendente") {
        // 🔥 Pendente → apaga definitivo
        await deleteDoc(ref);
      } else {
        // 🧠 Respondida → soft delete
        await updateDoc(ref, { apagadoLider: true });
        if (data.apagadoAluno) {
          await deleteDoc(ref);
        }
      }

      carregarSolicitacoes(); // Recarrega lista e select
    });
  });
}

// ===== INICIAR =====
carregarSolicitacoes();
