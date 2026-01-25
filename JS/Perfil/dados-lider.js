import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const nome = document.getElementById("nomeCompleto");
const funcao = document.getElementById("funçao");
const contrato = document.getElementById("n-contrato");
const nascimento = document.getElementById("dataNascimento");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const d = snap.data();
  nome.value = d.nome || "-----";
  funcao.value = d.role || "-----";
  contrato.value = d.contrato || "-----";
  nascimento.value = d.dataNascimento || "------";
  email.value = d.email || "-----";
  telefone.value = d.telefone || "-----";
});
