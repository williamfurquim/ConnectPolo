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
  return new Date().toLocaleDateString("en-CA");
}

// ===== ADICIONAR JUSTIFICATIVA SE ESTIVER LOGADO =====

if (btn) {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        const motivo = document.getElementById("motivo").value.trim();
        const observacao = document.getElementById("observacao").value.trim();
        const dataReferencia = document.getElementById("data-falta").value;
        const hoje = hojeISO();

        if (!motivo || !dataReferencia || !observacao) {
          msg.textContent = "Preencha todos os campos para justificar sua falta";
          msg.style.color = "red";
          btn.disabled = false;
          return;
        }

        const refPresenca = doc(
          db,
          "presencas",
          user.uid,
          "dias",
          dataReferencia
        );

        const refJustificativa = doc(
          db,
          "justificativas",
          user.uid,
          "dias",
          dataReferencia
        );

        const [justificativaSnap, presencaSnap] = await Promise.all([
          getDoc(refJustificativa),
          getDoc(refPresenca)
        ]);


        if (justificativaSnap.exists()) {
          msg.textContent = "Já existe uma justificativa para esta data";
          msg.style.color = "orange";
          return;
        }

        if (presencaSnap.exists()) {
          if (dataReferencia === hoje) {
            msg.textContent = "Você já registrou presença hoje";
          } else {
            msg.textContent = "Você já registrou presença nesta data";
          }
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

        let mensagem;
        if (dataReferencia === hoje) {
          mensagem = "justificou ausência para o dia de hoje."
        } else if (dataReferencia > hoje) {
          mensagem = `justificou ausência prevista para ${dataFormatada}.`;
        } else {
          mensagem = `justificou ausência ocorrida em ${dataFormatada}.`;
        }

        // Cria notificação para o líder
        await addDoc(collection(db, "notificacoes"), {
          tipo: "justificativa",
          alunoId: user.uid,
          alunoNome: user.displayName || "",
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
      } catch (error) {
        console.log(error);
        msg.textContent = "Houve um erro ao justificar falta";
        btn.disabled = false;
      }
    });
  });
}
