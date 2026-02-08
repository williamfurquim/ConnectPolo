// =========== IMPORTAÇÕES =====
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { db } from "../firebase.js"



// =========== VARIÁVEIS GLOBAIS =====
const section = document.getElementById("s-aniversario");
const hoje = new Date();
const diaHoje = hoje.getDate();
const mesHoje = hoje.getMonth() + 1;

const q = query(
  collection(db, "usuarios"),
  // where("role", "==", "aluno"),
  // where("diaNascimento", "==", diaHoje),
  // where("mesNascimento", "==", mesHoje),
  // where("ativo", "==", true)
);

// =========== EXIBIÇÃO DOS ANIVERSARIANTES =====
const snapshot = await getDocs(q);
section.innerHTML = ""
snapshot.forEach(doc => {
  const aluno = doc.data();

  const div = document.createElement("div");
  div.classList.add("d-aniversario");

  div.innerHTML = `
    <div class="texto">
      <h4>Happy <br>Birthday</h4>
      <p>${aluno.nomeExibicao || aluno.nome}, sua presença enriquece nosso ambiente de trabalho. <br>Desejamos que seu dia seja maravilhoso e <br>que sua jornada continue sendo de muito crescimento e conquistas.</p>
    </div>

    <div class="imagem">
      <img src="${aluno.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" alt="">
      <img id="img-baloes" src="https://static.vecteezy.com/system/resources/thumbnails/038/967/748/small/celebration-party-banner-with-color-balloons-png.png" alt="">
    </div>
  `
  section.appendChild(div);
});