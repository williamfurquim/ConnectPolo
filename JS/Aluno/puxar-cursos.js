// =========== IMPORTAÇÕES =====
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { buscarCursos, buscarProgressoAluno } from "../api-service.js";



// =========== VARIÁVEIS GLOBAIS =====
const containerCursos = document.querySelector(".grid");



// =========== FUNÇÃO PARA RENDERIZAR CURSOS =====
async function renderizarCursosAluno(alunoId) {
  containerCursos.innerHTML = "<p>⏳ Carregando cursos...</p>";

  try {
    const cursosResult = await buscarCursos({ ativo: true });
    if (!cursosResult.success) throw new Error(cursosResult.error);

    containerCursos.innerHTML = ""; 

    for (const curso of cursosResult.data) {
      const progressoResult = await buscarProgressoAluno(alunoId, curso.id);
      let porcentagem = 0;
      if (progressoResult.success && progressoResult.data) {
        porcentagem = progressoResult.data.porcentagem || 0;
      }

      let modulosHTML = "<ul>";
      curso.modulos?.forEach(modulo => {
        modulosHTML += `<li>${modulo}</li>`;
      });
      modulosHTML += "</ul>";

      const divCurso = document.createElement("div");
      divCurso.classList.add("d-curso");

      divCurso.innerHTML = `
        <h3>${curso.titulo}</h3>
        <p>${curso.descricao}</p>
        <p><strong>Carga horária:</strong> ${curso.cargaHoraria}h</p>
        ${modulosHTML}
        <progress value="${porcentagem}" max="100"></progress>
        <p>${porcentagem === 100 ? "CONCLUÍDO" : "APTO"}</p>
      `;

      containerCursos.appendChild(divCurso);
    }

    if (cursosResult.data.length === 0) {
      containerCursos.innerHTML = "<p>Nenhum curso disponível.</p>";
    }

  } catch (error) {
    console.error("Erro ao carregar cursos:", error);
    containerCursos.innerHTML = `<p style="color:red;">Erro ao carregar cursos: ${error.message}</p>`;
  }
}



// =========== INICIALIZAÇÃO COM AUTH =====
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    renderizarCursosAluno(user.uid); 
  } else {
    containerCursos.innerHTML = "<p>⚠️ Usuário não autenticado.</p>";
  }
});