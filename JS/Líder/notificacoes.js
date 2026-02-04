// ===== IMPORTAÇÕES =====
import { protegerPagina } from "../guard.js";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  limit,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

protegerPagina("lider");
function iniciarNotificacoes() {

// ===== VARIÁVEIS GLOBAIS =====
const area = document.getElementById("lista-notificacoes");
if (!area) {
  console.warn("Área de notificações não encontrada");
  return;
}

const q = query(
  collection(db, "notificacoes"),
  where("lida", "==", false),
  orderBy("criadaEm", "desc"),
  limit(15) // Aumentei um pouco o limite para seu conforto
);

let unsubscribe = null;
// ===== EXIBE NOTIFICAÇÕES =====

unsubscribe = onSnapshot(q, async (snap) => {
  area.innerHTML = "";

  const notificacoes = await Promise.all(snap.docs.map(async (d) => {
    const n = d.data();

    // 1. Já começa com o nome que está na notificação
    let alunoNome = n.alunoNome || "Erro no nome";

    // 2. Se a notificação não tiver o nome gravado nela, mas tiver o ID do aluno:
    if (n.alunoId && (!n.alunoNome || n.alunoNome.trim() === "")) {
      try {
        const refAluno = doc(db, "usuarios", n.alunoId);
        const snapAluno = await getDoc(refAluno);

        if (snapAluno.exists()) {
          const dados = snapAluno.data();
          // SÓ ATUALIZA SE O CAMPO 'NOME' EXISTIR NO DOCUMENTO DO USUÁRIO
          if (dados.nome) {
            alunoNome = dados.nome;
          }
        }
      } catch (err) {
        console.error("Erro ao buscar nome:", err);
      }
    }

    const ts = n.criadaEm;
    const dataFormatada = (ts && typeof ts.toDate === 'function')
      ? ts.toDate().toLocaleString("pt-BR")
      : "Data inválida";

    return { ...n, id: d.id, ref: d.ref, alunoNome, dataFormatada };
  }));

  // Renderização
  notificacoes.forEach(n => {
    const div = document.createElement("div");
    div.classList.add("notificacao", n.tipo);

    const botaoAcao = n.tipo === "solicitação"
      ? `<button class="btn-resolver" onclick="window.location.href='lider.html'">Resolver agora</button>`
      : `<button class="btn-lida">Marcar como lida</button>`

    // USAMOS O n.dataFormatada QUE CRIAMOS ACIMA
    div.innerHTML = `
      <p style="font-size: 1.25rem;"><strong>${n.alunoNome}</strong> ${n.mensagem} ${n.motivo ? `| <strong>Motivo: ${n.motivo}</strong>` : ""}</p>
      ${n.observacao ? `<p style="margin-top: 1rem; font-size: 1.1rem;">➡️Observação: ${n.observacao}</p>` : ""}
      <div class="notificacaoBottom">
        <small class="small">${n.tipo.toUpperCase()} • ${n.dataFormatada}</small><br>
        ${botaoAcao}
      </div>
    `;

    const btnLida = div.querySelector(".btn-lida");
    if (btnLida) {
      btnLida.addEventListener("click", async () => {
        try {
          await deleteDoc(n.ref); // n.ref é a referência doc(db, "notificacoes", id)
          // A lista atualizará sozinha por causa do onSnapshot
        } catch (err) {
          console.error("Erro ao excluir notificação:", err);
        }
      });
    }

    const btnResolver = div.querySelector(".btn-resolver");
    if (btnResolver) {
      btnResolver.addEventListener("click", async () => {

        window.location.href = 'lider.html'


      })
    }




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
}
iniciarNotificacoes();