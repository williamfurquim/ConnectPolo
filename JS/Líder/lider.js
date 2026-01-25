// ===== IMPORTAÇÕES =====
import { protegerPagina } from "../guard.js";
import { verificarFaltasHoje } from "../Status/verificacao.js";
import { db } from "../firebase.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

protegerPagina("lider");
verificarFaltasHoje();




const btnSalvar = document.getElementById("btn-salvar-horario");
if (btnSalvar) {
  btnSalvar.addEventListener("click", async () => {
    try{
    const inicio = document.getElementById("hora-inicio").value;
    const fim = document.getElementById("hora-fim").value;

    if (!inicio || !fim) {
      alert("Preencha os dois horários!");
      return;
    }

    if (fim <= inicio) {
      alert("O horário final deve ser mais que o horário de início!");
      return;
    }

    await setDoc(doc(db, "config", "presenca"), { inicio, fim });
    alert("Horário de presença salvo com sucesso!");
    } catch (error){
      console.log(error);
      alert("Houve um problema ao definir horário de presença!")
    }
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
