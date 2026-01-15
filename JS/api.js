// const api = "link-fictício";

// ===== IMPORTAÇÕES =====

import { buscarAlunos } from "./Mock/mock-service.js";

// async function chamarApi() {
//   const lista = document.getElementById("scroll");
//   if (!lista) return;

//   try {
//     const req = await fetch(api);
//     if (!req.ok) throw new Error(req.status);

//     const alunos = await req.json();
//     lista.innerHTML = "";

//     alunos.forEach(aluno => {
//       const bloco = document.createElement("div");
//       bloco.classList.add("bloco-aluno");

//       bloco.innerHTML = `
//         <img src="${aluno.imagem || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
//         <div class="info-left">
//           <h2>${aluno.nome}</h2>
//           <p>Setor: ${aluno.setor}</p>
//         </div>
//         <div class="info-right">
//           <h2>${aluno.aniversario}</h2>
//           <p>Meses de experiência: ${aluno.tempo}</p>
//         </div>
//       `;

//       lista.appendChild(bloco);
//     });

//   } catch (e) {
//     lista.textContent = "Erro ao carregar turma.";
//   }
// }





// ===== CACHE (NÃO REMOVE NADA) =====

let alunosCache = [];

// ===== CHAMADA DA API =====

async function chamarApi() {
  const lista = document.getElementById("scroll");
  if (!lista) return;

  try {
    lista.innerHTML = "<p>Carregando alunos...</p>";

    const alunos = await buscarAlunos();

    // mantém os dados em cache
    alunosCache = alunos;

    // renderiza normalmente
    renderizarAlunos(alunos);

  } catch (e) {
    console.error(e);
    lista.textContent = "Erro ao carregar turma.";
  }
}

// ===== RENDERIZAÇÃO =====

function renderizarAlunos(alunos) {
  const lista = document.getElementById("scroll");
  lista.innerHTML = "";

  if (alunos.length === 0) {
    lista.innerHTML = "<p>Nenhum aluno encontrado.</p>";
    return;
  }

  alunos.forEach(aluno => {
    const bloco = document.createElement("div");
    bloco.classList.add("bloco-aluno");

    bloco.innerHTML = `
      <img src="${aluno.imagem || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
      <div class="info-left">
        <h2>${aluno.nome}</h2>
        <p>Setor: ${aluno.setor}</p>
      </div>
      <div class="info-right">
        <h2>${aluno.aniversario}</h2>
        <p>Meses de experiência: ${aluno.tempo}</p>
      </div>
    `;

    lista.appendChild(bloco);
  });
}

// ===== BARRA DE PESQUISA ====

const barraPesquisa = document.getElementById("barraPesquisa");

if (barraPesquisa) {
  barraPesquisa.addEventListener("input", () => {
    const termo = barraPesquisa.value.toLowerCase().trim();

    if (!termo) {
      renderizarAlunos(alunosCache);
      return;
    }

    const alunosFiltrados = alunosCache.filter(aluno =>
      aluno.nome.toLowerCase().includes(termo) ||
      aluno.setor.toLowerCase().includes(termo)
    );

    renderizarAlunos(alunosFiltrados);
  });
}

// ===== LOAD =====
window.addEventListener("load", chamarApi);