// ===== IMPORTAÇÕES =====

import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====

const btn = document.getElementById("btn-justificar");
const msg = document.getElementById("msg-justificativa");

// ===== FUNÇÃO DE DATA LOCAL =====

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

// ===== ADICIONAR JUSTIFICATIVA SE ESTIVER LOGADO =====

if (btn) {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    btn.addEventListener("click", async () => {
      const motivo = document.getElementById("motivo").value;
      const observacao = document.getElementById("observacao").value;
      const dataReferencia = document.getElementById("data-falta").value;
      const hoje = hojeISO();
      if (dataReferencia < hoje) {
        msg.textContent = "Não é possível justificar faltas passadas.";
        msg.style.color = "red";
        return;
      }

      if (!motivo || !dataReferencia) {
        msg.textContent = "Informe o motivo e a data da ausência.";
        msg.style.color = "red";
        return;
      }

      const refPresenca = doc(
        db,
        "presencas",
        user.uid,
        "dias",
        dataReferencia
      );

      if (dataReferencia === hoje) {
        const presencaSnap = await getDoc(refPresenca);
        if (presencaSnap.exists()) {
          msg.textContent = "Você já registrou presença para esta data";
          msg.style.color = "orange";
          return;
        }
      }

      const refJustificativa = doc(
        db,
        "justificativas",
        user.uid,
        "dias",
        dataReferencia
      );

      if ((await getDoc(refJustificativa)).exists()) {
        msg.textContent = "Já existe uma justificativa para esta data";
        msg.style.color = "orange";
        return;
      }

      if ((await getDoc(refPresenca)).exists()) {
        msg.textContent =
          "Você já registrou presença nesta data. Não é possível justificar";
        msg.style.color = "orange";
        return;
      }

      // Salva justificativa
      await setDoc(refJustificativa, {
        motivo,
        observacao,
        dataReferencia,
        criadaEm: serverTimestamp()
      });

      // Define mensagem conforme data
      const dataFormatada = dataReferencia.split("-").reverse().join("/");

      const mensagem =
        dataReferencia === hoje
          ? "informou ausência para o dia de hoje"
          : `informou ausência prevista para ${dataFormatada}`;
      // Cria notificação para o líder
      await addDoc(collection(db, "notificacoes"), {
        tipo: "justificativa",
        alunoId: user.uid,
        mensagem: mensagem,
        motivo: motivo,
        observacao: observacao,
        dataReferencia,
        criadaEm: serverTimestamp(),
        lida: false
      });

      msg.textContent = "Justificativa registrada com sucesso.";
      msg.style.color = "green";
      btn.disabled = true;
    });
  });
}
