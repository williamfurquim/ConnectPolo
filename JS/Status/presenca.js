// ===== IMPORTAÇÕES =====

import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====

const btnPresenca = document.getElementById("btn-presenca");
const msg = document.getElementById("mensagem-presenca");

// ===== VERIFICAÇÃO DE STATUS =====

async function verificarStatus(user) {
  const hoje = new Date().toISOString().split("T")[0];

  const refPresenca = doc(db, "presencas", user.uid, "dias", hoje);
  const refJustificativa = doc(db, "justificativas", user.uid, "dias", hoje);

  const [presencaSnap, justificativaSnap] = await Promise.all([
    getDoc(refPresenca),
    getDoc(refJustificativa)
  ]);

  if (justificativaSnap.exists()) {
    msg.textContent = "Você possui uma justificativa registrada hoje";
    msg.style.color = "orange";
    btnPresenca.disabled = true;
    btnPresenca.classList.remove("pulsando");
    return "justificado";
  }

  if (presencaSnap.exists()) {
    msg.textContent = "Presença já registrada hoje";
    btnPresenca.disabled = true;
    btnPresenca.classList.remove("pulsando");
    return "presente";
  }

  btnPresenca.disabled = false;
  btnPresenca.classList.add("pulsando");
  return "pendente";
}

// ===== ADICIONAR PRESENÇA =====

if (btnPresenca) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
 await verificarStatus(user);
    
    btnPresenca.addEventListener("click", async () => {
      const status = await verificarStatus(user);
      if (status !== "pendente") return;

      const hoje = new Date().toISOString().split("T")[0];

      const refPresenca = doc(db, "presencas", user.uid, "dias", hoje);
      const refJustificativa = doc(db, "justificativas", user.uid, "dias", hoje);
      const justificativaSnap = await getDoc(refJustificativa);


      if (justificativaSnap.exists()) {
        msg.textContent =
          "Você já possui uma justificativa registrada para hoje.";
        msg.style.color = "orange";
        btnPresenca.disabled = true;
        return;
      }

      if ((await getDoc(refPresenca)).exists()) {
        msg.textContent = "Presença já registrada.";
        btnPresenca.disabled = true;
        return;
      }

      await setDoc(refPresenca, {
        presente: true,
        criadoEm: serverTimestamp()
      });

      await addDoc(collection(db, "notificacoes"), {
        tipo: "presenca",
        alunoId: user.uid,
        mensagem: "Aluno registrou presença hoje.",
        criadaEm: serverTimestamp(),
        lida: false
      })

      msg.textContent = "Presença registrada!";
      msg.style.color = "green";
      btnPresenca.disabled = true;
    });
  });
}

