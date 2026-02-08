// =========== IMPORTAÇÕES =====
import { cadastrarAluno, buscarTurmas } from "../api-service.js";



// =========== VARIÁVEIS GLOBAIS =====
let imageBase64 = null;
let turmasDisponiveis = [];
let formIsValid = false;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const form = document.getElementById('alunoForm');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const submitBtn = document.getElementById('submitBtn');
const nomeCounter = document.getElementById('nomeCounter');
const exibicaoCounter = document.getElementById('exibicaoCounter');



// =========== FUNÇÕES =====
async function inicializar() {
    try {
        console.log("🚀 Iniciando sistema de cadastro...");
        showLoading(true);

        await carregarTurmas();
        configurarEventListeners();
        configurarValidacaoTempo();
        configurarAutoPreenchimento();

        showLoading(false);
        console.log("✅ Sistema de cadastro pronto.");
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showMessage(`❌ Erro ao inicializar: ${error.message}`, 'error');
        showLoading(false);
    }
}






async function carregarTurmas() {
    const selectTurma = document.getElementById('turmaId');

    try {
        console.log("📚 [1/5] Iniciando busca de turmas...");
        selectTurma.innerHTML = '<option value="">⏳ Carregando turmas...</option>';

        console.log("📚 [2/5] Chamando buscarTurmas()...");
        const result = await buscarTurmas({ ativa: true });

        console.log("📚 [3/5] Resultado recebido:", result);

        if (!result.success) {
            throw new Error(result.error || 'Erro ao carregar turmas');
        }

        if (!result.data || result.data.length === 0) {
            console.warn("⚠️ [4/5] Nenhuma turma encontrada no Firestore.");
            selectTurma.innerHTML = '<option value="">❌ Nenhuma turma - Execute popular-firestore.html</option>';
            selectTurma.disabled = true;
            showMessage('⚠️ Nenhuma turma cadastrada. Execute popular-firestore.html primeiro.', 'error');
            return;
        }

        turmasDisponiveis = result.data;

        console.log("📚 [4/5] Turmas encontradas:", turmasDisponiveis.length);
        console.table(turmasDisponiveis.map(t => ({ id: t.id, nome: t.nome, ativa: t.ativa })));
        console.log("📚 [5/5] Turmas já estão ordenadas pelo campo 'ordem'");

        popularSelectTurmas();

        console.log("✅ Turmas carregadas com sucesso.");

    } catch (error) {
        console.error('❌ ERRO COMPLETO ao carregar turmas:', error);
        console.error('Stack:', error.stack);

        selectTurma.innerHTML = '<option value="">❌ Erro ao carregar - Veja console (F12)</option>';
        selectTurma.disabled = true;

        showMessage(`❌ Erro: ${error.message}. Abra o Console (F12) para detalhes.`, 'error');

        setTimeout(() => {
            alert(`ERRO AO CARREGAR TURMAS:\n\n${error.message}\n\nAbra o Console (F12) para mais detalhes.`);
        }, 500);
    }
}





function popularSelectTurmas(erro = false) {
    const selectTurma = document.getElementById('turmaId');
    const statusTurmas = document.getElementById('statusTurmas');

    console.log("🎯 Populando select de turmas...");
    console.log("   - Erro?", erro);
    console.log("   - Turmas disponíveis:", turmasDisponiveis.length);

    if (erro || turmasDisponiveis.length === 0) {
        selectTurma.innerHTML = '<option value="">❌ Nenhuma turma disponível - Execute popular-firestore.html</option>';
        selectTurma.disabled = true;

        if (statusTurmas) {
            statusTurmas.innerHTML = '<span style="color: #ef4444;">❌ Erro</span>';
        }

        console.warn("⚠️ Select desabilitado - sem turmas");
        return;
    }

    const options = turmasDisponiveis.map(turma =>
        `<option value="${turma.id}">${turma.nome}</option>`
    ).join('');

    selectTurma.innerHTML = `
        <option value="">Selecione uma turma (opcional)</option>
        ${options}
    `;
    selectTurma.disabled = false;

    if (statusTurmas) {
        statusTurmas.innerHTML = `<span style="color: #10b981;">✅ ${turmasDisponiveis.length} turmas</span>`;
    }

    console.log("✅ Select populado com", turmasDisponiveis.length, "turmas");
    console.log("   Primeira turma:", turmasDisponiveis[0]?.nome);
}





function configurarEventListeners() {
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    form.addEventListener('submit', handleSubmit);

    const nomeInput = document.getElementById('nomeCompleto');
    const exibicaoInput = document.getElementById('nomeExibicao');

    nomeInput.addEventListener('input', () => {
        updateCharCounter(nomeInput, nomeCounter, 100);
    });

    exibicaoInput.addEventListener('input', () => {
        updateCharCounter(exibicaoInput, exibicaoCounter, 50);
    });

    const camposObrigatorios = form.querySelectorAll('[required]');
    camposObrigatorios.forEach(campo => {
        campo.addEventListener('input', () => {
            validarCampoVisual(campo);
        });

        campo.addEventListener('blur', () => {
            validarCampoVisual(campo);
        });
    });
}





function configurarAutoPreenchimento() {
    const btnAuto = document.getElementById('btnAutoPreenchimento');
    const nomeCompleto = document.getElementById('nomeCompleto');
    const nomeExibicao = document.getElementById('nomeExibicao');

    btnAuto.addEventListener('click', () => {
        const nome = nomeCompleto.value.trim();

        if (!nome) {
            showMessage('⚠️ Preencha o nome completo primeiro', 'error');
            nomeCompleto.focus();
            return;
        }

        const palavras = nome.split(' ').filter(p => p.length > 0);

        let nomeResumido;
        if (palavras.length === 1) {
            nomeResumido = palavras[0];
        } else if (palavras.length === 2) {
            nomeResumido = palavras.join(' ');
        } else {
            nomeResumido = `${palavras[0]} ${palavras[palavras.length - 1]}`;
        }

        nomeExibicao.value = nomeResumido;
        updateCharCounter(nomeExibicao, exibicaoCounter, 50);
        validarCampoVisual(nomeExibicao);

        console.log(`✨ Auto-preenchido: "${nome}" → "${nomeResumido}"`);
        showMessage(`✅ Nome de exibição: "${nomeResumido}"`, 'success');
    });
}





function updateCharCounter(input, counter, max) {
    const length = input.value.length;
    counter.textContent = length;

    if (length >= max * 0.9) {
        counter.style.color = '#ef4444';
    } else if (length >= max * 0.7) {
        counter.style.color = '#f59e0b';
    } else {
        counter.style.color = '#6b7280';
    }
}





function validarCampoVisual(campo) {
    if (campo.required && campo.value.trim() === '') {
        campo.classList.add('error');
        campo.classList.remove('success');
        return false;
    } else if (campo.value.trim() !== '') {
        campo.classList.remove('error');
        campo.classList.add('success');
        return true;
    }

    campo.classList.remove('error', 'success');
    return true;
}





function configurarValidacaoTempo() {
    const camposObrigatorios = form.querySelectorAll('[required]');

    form.addEventListener('input', () => {
        let todosPreenchidos = true;

        camposObrigatorios.forEach(campo => {
            if (campo.value.trim() === '') {
                todosPreenchidos = false;
            }
        });

        formIsValid = todosPreenchidos;
        submitBtn.style.opacity = formIsValid ? '1' : '0.8';
    });
}





function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('❌ Por favor, selecione apenas imagens.', 'error');
        return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        showMessage(`❌ Imagem muito grande (${sizeMB}MB). Tamanho máximo: 5MB`, 'error');
        return;
    }

    uploadArea.innerHTML = '<div class="spinner"></div><p>Carregando imagem...</p>';

    const reader = new FileReader();

    reader.onload = (e) => {
        imageBase64 = e.target.result;
        previewImage.src = imageBase64;
        previewImage.classList.add('show');

        uploadArea.innerHTML = `
            <div class="upload-icon">✅</div>
            <p><strong>Imagem carregada com sucesso.</strong></p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
                ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            </p>
            <p style="font-size: 13px; color: #667eea; margin-top: 8px;">
                Clique para alterar
            </p>
        `;

        showMessage('✅ Imagem carregada com sucesso.', 'success');
    };

    reader.onerror = () => {
        showMessage('❌ Erro ao ler a imagem.', 'error');
        restaurarAreaUpload();
    };

    reader.readAsDataURL(file);
}





export function extrairCaminhoDeURL(url) {
    try {
        const urlObj = new URL(url);
        if (!urlObj.pathname.includes('/o/')) return null;
        const path = urlObj.pathname.split('/o/')[1];
        return decodeURIComponent(path.split('?')[0]);
    } catch {
        return null;
    }
}





function restaurarAreaUpload() {
    uploadArea.innerHTML = `
        <div class="upload-icon">📤</div>
        <p><strong>Clique ou arraste uma imagem aqui</strong></p>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">
            Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
        </p>
    `;
}





async function handleSubmit(e) {
    e.preventDefault();

    console.log("📝 Tentando cadastrar aluno...");

    const camposObrigatorios = form.querySelectorAll('[required]');
    let todosValidos = true;

    camposObrigatorios.forEach(campo => {
        if (!validarCampoVisual(campo)) {
            todosValidos = false;
        }
    });

    if (!todosValidos) {
        showMessage('❌ Por favor, preencha todos os campos obrigatórios corretamente', 'error');
        return;
    }

    const dados = {
        nomeCompleto: document.getElementById('nomeCompleto').value.trim(),
        nomeExibicao: document.getElementById('nomeExibicao').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        setor: document.getElementById('setor').value.trim(),
        dataNascimento: document.getElementById('dataNascimento')?.value || null,
        tempoExperiencia: document.getElementById('tempoExperiencia').value.trim() || '0 meses',
        matricula: document.getElementById('matricula')?.value?.trim() || null,
        turmaId: document.getElementById('turmaId')?.value || null
    };

    if (imageBase64) {
        dados.foto = imageBase64;
    }

    console.log("📤 Dados a enviar:", { ...dados, foto: dados.foto ? 'Base64...' : null });

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Cadastrando...</span>';
        showLoading(true);
        messageDiv.classList.remove('show');

        const result = await cadastrarAluno(dados);

        console.log("📥 Resultado do cadastro:", result);

        if (result.success) {
            showMessage(`✅ Aluno cadastrado com sucesso. ID: ${result.data.id}`, 'success');

            setTimeout(() => {
                limparFormulario();
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro desconhecido');
        }
    } catch (error) {
        console.error('❌ Erro ao cadastrar:', error);

        let mensagemErro = error.message;

        if (mensagemErro.includes('Email já cadastrado')) {
            mensagemErro = '❌ Este email já está cadastrado no sistema';
        } else if (mensagemErro.includes('permission-denied')) {
            mensagemErro = '❌ Sem permissão. Verifique as regras de segurança do Firestore';
        } else if (mensagemErro.includes('network')) {
            mensagemErro = '❌ Erro de conexão. Verifique sua internet';
        } else {
            mensagemErro = `❌ Erro ao cadastrar: ${mensagemErro}`;
        }

        showMessage(mensagemErro, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✅ Cadastrar Aluno</span>';
        showLoading(false);
    }
}





function showLoading(show) {
    if (show) {
        loadingDiv.classList.add('show');
    } else {
        loadingDiv.classList.remove('show');
    }
}





function showMessage(text, type) {
    const icon = type === 'success' ? '✅' : '❌';

    messageDiv.innerHTML = `
        <span class="message-icon">${icon}</span>
        <span>${text}</span>
    `;
    messageDiv.className = `message ${type} show`;

    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}





function limparFormulario() {
    form.reset();

    imageBase64 = null;
    previewImage.classList.remove('show');
    previewImage.src = '';

    restaurarAreaUpload();

    const todosInputs = form.querySelectorAll('input, select');
    todosInputs.forEach(input => {
        input.classList.remove('error', 'success');
    });

    if (nomeCounter) nomeCounter.textContent = '0';
    if (exibicaoCounter) exibicaoCounter.textContent = '0';

    messageDiv.classList.remove('show');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('✨ Formulário limpo com sucesso');
}





document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (formIsValid && !submitBtn.disabled) {
            form.dispatchEvent(new Event('submit'));
        }
    }

    if (e.key === 'Escape') {
        if (confirm('Deseja limpar o formulário?')) {
            limparFormulario();
        }
    }
});





window.addEventListener('beforeunload', (e) => {
    const nomeInput = document.getElementById('nomeCompleto');

    if (nomeInput && nomeInput.value.trim() !== '') {
        e.preventDefault();
        e.returnValue = '';
    }
});





window.limparFormulario = limparFormulario;
window.addEventListener('DOMContentLoaded', inicializar);
console.log("📋 Script de cadastro carregado.");