import { db } from "../firebase.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const auth = getAuth();
const container = document.getElementById("duvidas-lider-container");

const q = query(
    collection(db, "duvidas"),
    orderBy("criadaEm", "desc")
);

onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    snapshot.forEach(d => {
        const data = d.data();

        const card = document.createElement("div");
        card.classList.add("duvida-card");

        card.innerHTML = `
            <h3>${data.titulo}</h3>
            <p>${data.mensagem}</p>
            <small>Aluno: ${data.alunoNome}</small>
            <small>Aviso: ${data.avisoTitulo}</small>
            <p>Status: ${data.respondida ? "Respondida" : "Aguardando"}</p>

            ${data.respondida ? `
                <div class="resposta-box">
                    <strong>Resposta:</strong>
                    <p>${data.resposta}</p>
                </div>
            ` : `
                <textarea class="resposta-input" placeholder="Escrever resposta..."></textarea>
                <button class="btn-responder">Responder</button>
            `}
        `;

        if (!data.respondida) {
            const textarea = card.querySelector(".resposta-input");
            const btnResponder = card.querySelector(".btn-responder");

            btnResponder.addEventListener("click", async () => {
                const respostaTexto = textarea.value.trim();
                if (!respostaTexto) return;

                await updateDoc(doc(db, "duvidas", d.id), {
                    resposta: respostaTexto,
                    respondida: true,
                    respondidaPor: auth.currentUser.uid,
                    respondidaEm: new Date()
                });
            });
        }

        container.appendChild(card);
    });
});
