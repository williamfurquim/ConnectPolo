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
  addDoc
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

// FUNÇÃO AUXILIAR PARA LIMPAR A NOTIFICAÇÃO PELO ID DA SOLICITAÇÃO
async function limparNotificacao(solicId) {
  try {
    const q = query(
      collection(db, "notificacoes"),
      where("solicitacaoId", "==", solicId)
    );
    const snap = await getDocs(q);
    
    // Promessas de exclusão para cada notificação encontrada
    const deletarPromessas = snap.docs.map(d => deleteDoc(doc(db, "notificacoes", d.id)));
    await Promise.all(deletarPromessas);
    
    console.log("Notificações resolvidas foram excluídas do banco.");
  } catch (err) {
    console.error("Erro ao excluir notificações:", err);
  }
}

function adicionarListenersBotoes() {
  // BOTÃO ACEITAR
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

      await limparNotificacao(id); // <--- LIMPA AQUI
      alert("Solicitação aceita!");
      location.reload();
    });
  });

  // BOTÃO RECUSAR
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

      await limparNotificacao(id); // <--- LIMPA AQUI
      alert("Solicitação recusada!");
      location.reload();
    });
  });

  // BOTÃO EXCLUIR
  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const ref = doc(db, "solicitacoes", id);
      if (!confirm("Deseja excluir esta solicitação?")) return;

      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "pendente") {
        await limparNotificacao(id); // <--- LIMPA SE FOR PENDENTE
        await deleteDoc(ref);
      } else {
        await updateDoc(ref, { apagadoLider: true });
      }
      carregarSolicitacoes();
    });
  });
}

async function verificarNotAntigas() {
  const agora = new Date();
  const DOIS_MINUTOS = 2 * 60 * 1000;

  // IMPORTANTE: Volte o filtro para não repetir notificações
  const q = query(
    collection(db, "solicitacoes"),
    where("status", "==", "pendente"),
    where("notificadoAtraso", "!=", true) 
  );

  try {
    const snap = await getDocs(q);

    snap.forEach(async (d) => {
      const s = d.data();
      const criadoEm = s.criadoEm?.toDate();

      if (criadoEm && (agora - criadoEm > DOIS_MINUTOS)) {
        // 1. Cria a notificação
        await addDoc(collection(db, "notificacoes"), {
          tipo: "solicitação",
          alunoNome: s.alunoNome,
          mensagem: `está aguardando há mais de 5 horas: ${s.solicitacao}`,
          alunoId: s.alunoId,
          solicitacaoId: d.id,
          criadaEm: serverTimestamp(),
          lida: false,
          link: "lider.html"
        });

        // 2. TRAVA a solicitação para não gerar mais notificações de atraso
        const refSolic = doc(db, "solicitacoes", d.id);
        await updateDoc(refSolic, { notificadoAtraso: true });
      }
    });
  } catch (err) {
    console.error("Erro ao verificar atrasos: ", err);
  }
}


verificarNotAntigas();

// ===== INICIAR =====
carregarSolicitacoes();
