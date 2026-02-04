// ===== IMPORTAÇÕES =====
import { buscarAlunos, buscarTurmas } from "./api-service.js";

// ===== CACHE =====
let alunosCache = [];
let turmasCache = [];
let turmaAtualId = null;

// ===== ELEMENTOS DO DOM =====
const lista = document.getElementById("scroll");
const selectTurma = document.querySelector('select[name="select-turma"]');
const barraPesquisa = document.getElementById("barraPesquisa");

// ===== CARREGAR TURMAS NO SELECT =====
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

    // Popular o select
    let options = '<option value="">Todas as turmas</option>';
    turmasCache.forEach(turma => {
      options += `<option value="${turma.id}">${turma.nome}</option>`;
    });
    selectTurma.innerHTML = options;

    // Iniciar em "Todas as turmas"
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

    // Atualizar nome da turma no header
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

// ===== CARREGAR ALUNOS =====
async function carregarAlunos() {
  if (!lista) return;

  try {
    lista.innerHTML = "<p style='color: white; text-align: center;'>⏳ Carregando alunos...</p>";

    // Filtrar por turma se houver seleção
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

// ===== RENDERIZAÇÃO =====
function renderizarAlunos(alunos) {
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
        <h2>${nomeExibir}</h2>
        <p>Setor: ${aluno.setor}</p>
      </div>
      <div class="info-right">
        <h2>${aluno.dataNascimento || 'Não informado'}</h2>
        <p>Experiência: ${aluno.tempoExperiencia}</p>
      </div>
    `;
    lista.appendChild(bloco);
  });
}

// ===== BARRA DE PESQUISA =====
// ===== FUNÇÕES AUXILIARES =====
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ===== FUNÇÃO DE HIGHLIGHT CORRIGIDA =====
function highlight(text, termo) {
  if (!text || !termo) return text;

  const textSemAcento = removeAcentos(text).toLowerCase();
  const termoSemAcento = removeAcentos(termo).toLowerCase();

  let resultado = '';
  let lastIndex = 0;

  const regex = new RegExp(escapeRegExp(termoSemAcento), 'gi');
  let match;
  while ((match = regex.exec(textSemAcento)) !== null) {
    resultado += text.slice(lastIndex, match.index);
    resultado += `<span class="highlight">${text.slice(match.index, match.index + termo.length)}</span>`;
    lastIndex = match.index + termo.length;
  }

  resultado += text.slice(lastIndex);
  return resultado;
}

// ===== FUNÇÃO DE DEBOUNCE =====
function debounce(fn, delay = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ===== BARRA DE PESQUISA =====
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

    lista.innerHTML = "";
    if (alunosFiltrados.length === 0) {
      lista.innerHTML = `<p style='color: white; text-align: center; padding: 2rem;'>📭 Nenhum aluno encontrado.</p>`;
      return;
    }

    alunosFiltrados.forEach(aluno => {
      const bloco = document.createElement("div");
      bloco.classList.add("bloco-aluno");

      const imagemSrc = aluno.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      const nomeExibir = aluno.nomeExibicao || aluno.nome;

      bloco.innerHTML = `
        <img src="${imagemSrc}" 
             alt="Foto de ${aluno.nome}"
             onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
        <div class="info-left">
          <h2>${highlight(nomeExibir, termo)}</h2>
          <p>Setor: ${highlight(aluno.setor, termo)}</p>
        </div>
        <div class="info-right">
          <h2>${aluno.dataNascimento || 'Não informado'}</h2>
          <p>Experiência: ${aluno.tempoExperiencia}</p>
        </div>
      `;
      lista.appendChild(bloco);
    });
  }, 300));
}


// ===== INICIALIZAÇÃO =====
window.addEventListener("load", async () => {
  await carregarTurmas();
});