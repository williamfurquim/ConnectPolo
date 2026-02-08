// =========== IMPORTAÇÕES =====
import { buscarAlunos, buscarTurmas } from "./api-service.js";

import {
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { db } from "./firebase.js";



// =========== CACHE =====
let alunosCache = [];
let turmasCache = [];
let turmaAtualId = null;
const hoje = new Date().toLocaleDateString("en-CA");



// =========== ELEMENTOS DO DOM =====
const lista = document.getElementById("scroll");
const selectTurma = document.querySelector('select[name="select-turma"]');
const barraPesquisa = document.getElementById("barraPesquisa");



// =========== CARREGAR TURMAS NO SELECT =====
async function carregarTurmas() {
  if (!selectTurma) return;

  try {
    console.log("📚 Carregando turmas para o select...");
    selectTurma.innerHTML = '<option value="">⏳ Carregando...</option>';

    const result = await buscarTurmas({ ativa: true });

    if (!result.success) {
      throw new Error(result.error);
    }

    turmasCache = result.data;

    if (turmasCache.length === 0) {
      selectTurma.innerHTML = '<option value="">❌ Nenhuma turma disponível</option>';
      return;
    }

    let options = '<option value="">Todas as turmas</option>';
    turmasCache.forEach(turma => {
      options += `<option value="${turma.id}">${turma.nome}</option>`;
    });
    selectTurma.innerHTML = options;

    selectTurma.value = "";
    turmaAtualId = null;
    await carregarAlunos();

    const nomeTurmaEl = document.querySelector('.d-nome-turma h2');
    if (nomeTurmaEl) {
      nomeTurmaEl.textContent = "Todas as turmas";
    }

    console.log("✅ Turmas carregadas:", turmasCache.length);
  } catch (e) {
    console.error("❌ Erro ao carregar turmas:", e);
    selectTurma.innerHTML = '<option value="">❌ Erro ao carregar</option>';
  }
}



if (selectTurma) {
  selectTurma.addEventListener('change', async (e) => {
    turmaAtualId = e.target.value || null;

    const nomeTurmaEl = document.querySelector('.d-nome-turma h2');
    if (nomeTurmaEl) {
      if (turmaAtualId) {
        const turma = turmasCache.find(t => t.id === turmaAtualId);
        nomeTurmaEl.textContent = turma ? turma.nome : "Nome da turma";
      } else {
        nomeTurmaEl.textContent = "Todas as turmas";
      }
    }

    console.log("🔄 Turma selecionada:", turmaAtualId);
    await carregarAlunos();
  });
}

// =========== CARREGAR ALUNOS =====
async function carregarAlunos() {
  if (!lista) return;

  try {
    lista.innerHTML = "<p style='color: white; text-align: center;'>⏳ Carregando alunos...</p>";

    const filtros = { ativo: true };
    if (turmaAtualId) {
      filtros.turmaId = turmaAtualId;
    }

    const result = await buscarAlunos(filtros);

    if (!result.success) {
      throw new Error(result.error);
    }

    alunosCache = result.data;
    renderizarAlunos(alunosCache);

    console.log(`✅ ${alunosCache.length} alunos carregados`);
  } catch (e) {
    console.error("❌ Erro ao carregar alunos:", e);
    lista.innerHTML = `
      <p style='color: #E24329; text-align: center; padding: 2rem;'>
        ❌ Erro ao carregar alunos<br>
        <small>${e.message}</small>
      </p>
    `;
  }
}

// =========== RENDERIZAÇÃO =====
function renderizarAlunos(alunos, termoBusca = "") {
  lista.innerHTML = "";

  if (alunos.length === 0) {
    lista.innerHTML = `
      <p style='color: white; text-align: center; padding: 2rem;'>
        📭 Nenhum aluno encontrado nesta turma.
      </p>
    `;
    return;
  }

  alunos.forEach(aluno => {
    const bloco = document.createElement("div");
    bloco.classList.add("bloco-aluno");

    const imagemSrc = aluno.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const nomeExibir = aluno.nomeExibicao || aluno.nome;

    bloco.innerHTML = `
      <img src="${imagemSrc}" 
       alt="Foto de ${aluno.nome}"
       onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">

      <div class="info-left">
        <h2>${highlight(nomeExibir, termoBusca)}</h2>
        <p>Setor: ${highlight(aluno.setor, termoBusca)}</p>
      </div>

      <div class="info-right">
        <h2>${aluno.dataNascimento || 'Não informado'}</h2>
        <p>Experiência: ${aluno.tempoExperiencia}</p>
      </div>

      <div class="botoes-alunos">
        <button class="btn-presenca-manual">Presença manual disponível</button>
      </div>
    `;

    lista.appendChild(bloco);
    const btnPresenca = bloco.querySelector(".btn-presenca-manual");

    const refPresenca = doc(
      db,
      "presencas",
      aluno.id,
      "dias",
      hoje
    );

    const refNotificacoes = collection(
      db,
      "notificacoes"
    )

    getDoc(refPresenca).then((snap) => {
      if (snap.exists()) {
        btnPresenca.textContent = "Presente ✔️";
        btnPresenca.disabled = true;
        btnPresenca.style.cursor = "not-allowed";
      }
    });

    btnPresenca.addEventListener("click", async () => {
      try {
        btnPresenca.disabled = true;
        btnPresenca.style.cursor = "not-allowed";

        await setDoc(refPresenca, {
          presente: true,
          manual: true,
          criadoEm: serverTimestamp()
        });

        await addDoc(refNotificacoes, {
          tipo: "presenca",
          alunoId: aluno.id,
          alunoNome: aluno.nomeExibicao || aluno.nome,
          mensagem: "recebeu presença manualmente.",
          criadaEm: serverTimestamp(),
          lida: false
        })


        btnPresenca.textContent = "Presente ✔️";
      } catch (error) {
        console.error("Erro ao registrar presença:", error);
        btnPresenca.disabled = false;
        btnPresenca.textContent = "Erro — tentar novamente";
      }
    });
  });
}

// =========== BARRA DE PESQUISA =====
// =========== FUNÇÕES AUXILIARES =====
function highlight(texto, termo) {
  if (!texto || !termo) return texto;

  const textoNormalizado = removeAcentos(texto.toLowerCase());
  const termoNormalizado = removeAcentos(termo.toLowerCase());

  let resultado = "";
  let lastIndex = 0;

  const regex = new RegExp(termoNormalizado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  let match;

  while ((match = regex.exec(textoNormalizado)) !== null) {
    resultado += texto.slice(lastIndex, match.index);
    resultado += `<span class="highlight">${texto.slice(match.index, match.index + termo.length)}</span>`;
    lastIndex = match.index + termo.length;
  }

  resultado += texto.slice(lastIndex);
  return resultado;
}



function removeAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}



// =========== FUNÇÃO DE DEBOUNCE =====
function debounce(fn, delay = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}



// =========== BARRA DE PESQUISA =====
if (barraPesquisa) {
  barraPesquisa.addEventListener("input", debounce(() => {
    const termo = barraPesquisa.value.trim();

    if (!termo) {
      renderizarAlunos(alunosCache);
      return;
    }

    const termoLimpo = removeAcentos(termo.toLowerCase());

    const alunosFiltrados = alunosCache.filter(aluno => {
      const nome = removeAcentos(aluno.nome.toLowerCase());
      const exibicao = removeAcentos((aluno.nomeExibicao || "").toLowerCase());
      const setor = removeAcentos(aluno.setor.toLowerCase());
      return nome.includes(termoLimpo) || exibicao.includes(termoLimpo) || setor.includes(termoLimpo);
    });

    renderizarAlunos(alunosFiltrados, termo);
  }, 300));
}



// ===== INICIALIZAÇÃO =====
window.addEventListener("load", async () => {
  await carregarTurmas();
});