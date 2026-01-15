// ===== IMPORTAÇÕES =====

import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== FUNÇÃO DE DATA LOCAL =====

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

// ===== VERIFICAÇÃO DE FALTAS =====

export async function verificarFaltasHoje() {
  const agora = new Date();
  if (agora.getHours() < 22) return;
  const hoje = hojeISO();
  const alunosSnap = await getDocs(collection(db, "usuarios"));

  for (const aluno of alunosSnap.docs) {
    if (aluno.data().role !== "aluno") continue;
    const nomeAluno = aluno.data().nome;

    const refPresenca = doc(db, "presencas", aluno.id, "dias", hoje);
    const presencaSnap = await getDoc(refPresenca);

    const refJustificativa = doc(
      db,
      "justificativas",
      aluno.id,
      "dias",
      hoje
    );
    const justificativaSnap = await getDoc(refJustificativa);

    const refNotificacao = doc(
      db,
      "notificacoes",
      `falta_${aluno.id}_${hoje}`
    );

    const estevePresente = presencaSnap.exists();
    const esteveJustificado = justificativaSnap.exists();

    const notifSnap = await getDoc(refNotificacao);


    if (!estevePresente && !esteveJustificado && !notifSnap.exists()) {
      await setDoc(refNotificacao, {
        tipo: "falta",
        alunoId: aluno.id,
        mensagem: `${nomeAluno} não marcou presença hoje.`,
        criadaEm: serverTimestamp(),
        lida: false
      });
    }

  }
};
