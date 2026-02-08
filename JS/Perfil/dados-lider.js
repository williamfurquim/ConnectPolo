// =========== IMPORTAÇÕES =====
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";



// =========== VARIÁVEIS GLOBAIS =====
window.addEventListener("DOMContentLoaded", () => {
  const nome = document.getElementById("nomeCompleto");
  const funcao = document.getElementById("funcao");
  const contrato = document.getElementById("n-contrato");
  const nascimento = document.getElementById("dataNascimento");
  const email = document.getElementById("email");
  const telefone = document.getElementById("telefone");
  const imagem = document.getElementById("imagem");



// =========== TRAZER DADOS (LÍDER) =====  
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;
    const d = snap.data();
    
    if(nome) nome.value = d.nome || "-----";
    if(funcao) funcao.value = d.role || "-----";
    if(contrato) contrato.value = d.contrato || "-----";
    if(nascimento) nascimento.value = d.dataNascimento || "------";
    if(email) email.value = d.email || "-----";
    if(telefone) telefone.value = d.telefone || "-----";
    if(imagem) imagem.src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
  });
});
