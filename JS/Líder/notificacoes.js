// =========== IMPORTAÇÕES =====
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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";



// =========== PROTEÇÃO =====
protegerPagina("lider");



// =========== FILTRAGEM DE NOTIFICAÇÕES =====
document
  .getElementById('categoria-notificacao')
  .addEventListener('change', categorizarNot);

function categorizarNot() {
  const categoria = document.getElementById("categoria-notificacao").value;
  const notificacoes = document.querySelectorAll(".notificacao");

  notificacoes.forEach(not => {
    const tipo = not.dataset.tipo;

    if (categoria === "all" || tipo === categoria) {
      not.classList.remove("oculto");
    } else {
      not.classList.add("oculto");
    }
  });
}



// =========== EXIBIÇÃO DE NOTIFICAÇÕES =====
function iniciarNotificacoes() {
  const area = document.getElementById("lista-notificacoes");
  if (!area) {
    console.warn("Área de notificações não encontrada");
    return;
  }

  const q = query(
    collection(db, "notificacoes"),
    where("lida", "==", false),
    orderBy("criadaEm", "desc"),
    limit(15)
  );

  let unsubscribe = null;



  // =========== SNAPSHOT =====
  unsubscribe = onSnapshot(q, async (snap) => {
    area.innerHTML = "";

    const notificacoes = await Promise.all(snap.docs.map(async (d) => {
      const n = d.data();

      let alunoNome = n.alunoNome || "Erro no nome";

      if (n.alunoId && (!n.alunoNome || n.alunoNome.trim() === "")) {
        try {
          const refAluno = doc(db, "usuarios", n.alunoId);
          const snapAluno = await getDoc(refAluno);

          if (snapAluno.exists()) {
            const dados = snapAluno.data();
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

    notificacoes.forEach(n => {
      const div = document.createElement("div");
      div.classList.add("notificacao");
      div.dataset.tipo = n.tipo;

      const botaoAcao = n.tipo === "solicitação"
      ? `<button class="btn-resolver" onclick="window.location.href='lider.html'">Resolver agora</button>`
      : `<button class="btn-lida">Marcar como lida</button>`

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
            await updateDoc(n.ref, {
              lida: true
            });
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

  }
  );



  // =========== ATUALIZAÇÃO NA VIRADA DO DIA =====
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
window.addEventListener("beforeunload", () => {
  localStorage.setItem("ultimoAcessoNotificacoes", Date.now());
});