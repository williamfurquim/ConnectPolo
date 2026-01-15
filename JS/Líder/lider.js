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
