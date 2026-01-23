// ===== IMPORTAÇÕES =====
import { protegerPagina } from "../guard.js";
import { verificarFaltasHoje } from "../Status/verificacao.js";
import { db } from "../firebase.js";

import {
  collection,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

protegerPagina("lider");
verificarFaltasHoje();

// ===== FUNÇÕES DE DATA =====
function semanaPassadaISO() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

// ===== CALCULO DE VARIAÇÃO (%) =====
function calcularVariacao(atual, anterior) {
  if (anterior === 0) return "Sem variação";

  const diff = ((atual - anterior) / anterior) * 100;
  const abs = Math.abs(diff).toFixed(1);

  if (diff > 0) return `${abs}% a mais`;
  if (diff < 0) return `${abs}% a menos`;

  return "Sem variação";
}

// ⚠️ Se você ainda NÃO estiver usando variação semanal,
// deixe essas funções aqui prontas para o futuro.

// ===== NOTIFICAÇÕES NÃO LIDAS =====
const q = query(
  collection(db, "notificacoes"),
  where("lida", "==", false),
  orderBy("criadaEm", "desc")
);





const btnSalvar = document.getElementById("btn-salvar-horario");
if (btnSalvar) {
  btnSalvar.addEventListener("click", async () => {
    const inicio = document.getElementById("hora-inicio").value;
    const fim = document.getElementById("hora-fim").value;

    if (!inicio || !fim) {
      alert("Preencha os dois horários!");
      return;
    }

    await setDoc(doc(db, "config", "presenca"), { inicio, fim });
    alert("Horário de presença salvo com sucesso!");
  });
}

// Pré-carregar horários atuais nos inputs do líder
async function carregarHorarioAtual() {
  const ref = doc(db, "config", "presenca");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const { inicio, fim } = snap.data();
  document.getElementById("hora-inicio").value = inicio;
  document.getElementById("hora-fim").value = fim;
}

carregarHorarioAtual();
