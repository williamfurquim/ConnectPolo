// ===== IMPORTAÇÕES =====
import { protegerPagina } from "../guard.js";


import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

protegerPagina("lider");



const imgLider = document.getElementById("img-lider");
const nomeLider = document.getElementById("nome-lider");
const email = document.getElementById("email-lider");


onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const d = snap.data();

  // Pega o primeiro e último nome
  let nomeExibir = "-----";
  if (d.nome) {
    const partes = d.nome.trim().split(/\s+/); // separa por espaços
    if (partes.length === 1) {
      nomeExibir = partes[0]; // só um nome
    } else {
      nomeExibir = `${partes[0]} ${partes[partes.length - 1]}`; // primeiro e último
    }
  }

  email.textContent = d.email;
  nomeLider.textContent = nomeExibir;
  imgLider.src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
});

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
