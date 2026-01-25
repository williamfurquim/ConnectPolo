import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const nome = document.getElementById("nomeCompleto");
const funcao = document.getElementById("funçao");
const matricula = document.getElementById("n-matrícula");
const nascimento = document.getElementById("dataNascimento");
const email = document.getElementById("email");
const tempoExperiencia = document.getElementById("tempoExperiencia");
const imagem = document.getElementById("imagem");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const d = snap.data();
  nome.value = d.nome || "-----";
  funcao.value = d.role || "-----";
  matricula.value = d.matricula || "-----";
  nascimento.value = d.dataNascimento || "-----";
  email.value = d.email || "-----";
  tempoExperiencia.value = d.tempoExperiencia || "-----";
  imagem.src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
});
