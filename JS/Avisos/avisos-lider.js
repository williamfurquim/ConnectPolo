// ===== IMPORTAÇÕES =====

import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====

const form = document.getElementById("form-aviso");
const msg = document.getElementById("msg");
const container = document.getElementById("avisos-lider-container");
const semAvisos = document.getElementById("sem-avisos");

// ===== ENVIAR AVISO PARA TURMA =====

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const mensagem = document.getElementById("mensagem").value.trim();

    if (!titulo || !mensagem) return;

    try {
        await addDoc(collection(db, "avisos"), {
            titulo,
            mensagem,
            criadoEm: serverTimestamp()
        });

        msg.textContent = "Aviso enviado!";
        msg.style.color = "green";
        form.reset();

    } catch (err) {
        msg.textContent = "Erro ao enviar aviso.";
        msg.style.color = "red";
        console.error(err);
    }
});

// ===== PEGA TODOS OS AVISOS CRIADOS =====

const q = query(collection(db, "avisos"), orderBy("criadoEm", "desc"));

// ===== EXIBE PRÓPRIOS AVISOS =====

onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
        container.appendChild(semAvisos);
        return;
    }

    snapshot.forEach(d => {
        const data = d.data();

        const aviso = document.createElement("div");
        aviso.classList.add("aviso");

        aviso.innerHTML = `
            <h3 contenteditable="false">${data.titulo}</h3>
            <p contenteditable="false">${data.mensagem}</p>
            <p class="aviso-lido">
            👁️${data.lidosCount || 0} aluno(s) visualizaram
            </p>

            <div class="aviso-acoes">
                <button class="btn-editar">Editar</button>
                <button class="btn-salvar" style="display:none;">Salvar</button>
                <button class="btn-excluir">Excluir</button>
                <button class="btn-cancelar" style="display: none;">Cancelar</button>
            </div>
        `;

        const tituloEl = aviso.querySelector("h3");
        const mensagemEl = aviso.querySelector("p");
        const btnEditar = aviso.querySelector(".btn-editar");
        const btnSalvar = aviso.querySelector(".btn-salvar");
        const btnExcluir = aviso.querySelector(".btn-excluir");
        const btnCancelar = aviso.querySelector(".btn-cancelar");


        /* ✏️ Editar */
        let tituloOriginal = "";
        let mensagemOriginal = "";

        btnEditar.addEventListener("click", () => {
            tituloOriginal = tituloEl.textContent;
            mensagemOriginal = mensagemEl.textContent;

            tituloEl.contentEditable = true;
            mensagemEl.contentEditable = true;
            tituloEl.focus();

            btnEditar.style.display = "none";
            btnSalvar.style.display = "inline-block";
            btnCancelar.style.display = "inline-block";
        });

        /* 💾 Salvar edição */
        btnSalvar.addEventListener("click", async () => {
            await updateDoc(doc(db, "avisos", d.id), {
                titulo: tituloEl.textContent.trim(),
                mensagem: mensagemEl.textContent.trim()
            });

            tituloEl.contentEditable = false;
            mensagemEl.contentEditable = false;

            btnEditar.style.display = "inline-block";
            btnSalvar.style.display = "none";
            btnCancelar.style.display = "none";
        });


        /* 🗑️ Excluir */
        btnExcluir.addEventListener("click", async () => {
            if (!confirm("Deseja excluir este aviso?")) return;
            await deleteDoc(doc(db, "avisos", d.id));
        });

        btnCancelar.addEventListener("click", () => {
            tituloEl.textContent = tituloOriginal;
            mensagemEl.textContent = mensagemOriginal;

            tituloEl.contentEditable = false;
            mensagemEl.contentEditable = false;

            btnEditar.style.display = "inline-block";
            btnSalvar.style.display = "none";
            btnCancelar.style.display = "none";
        });

        container.appendChild(aviso);
    });
});
