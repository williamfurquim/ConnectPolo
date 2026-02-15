import { db } from "../firebase.js";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const auth = getAuth();
const container = document.getElementById("minhas-duvidas-container");

onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const q = query(
        collection(db, "duvidas"),
        where("alunoId", "==", user.uid),
        where("resolvidaPeloAluno", "==", false),
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
                <small>Aviso: ${data.avisoTitulo}</small>
                <p>Status: ${data.respondida ? "Respondida" : "Aguardando resposta"}</p>
                ${data.respondida ? `<div class="resposta-box"><strong>Resposta:</strong><p>${data.resposta}</p></div>` : ""}
                <div class="acoes"></div>
            `;

            const acoes = card.querySelector(".acoes");

            if (!data.respondida) {
                // EDITAR
                const btnEditar = document.createElement("button");
                btnEditar.textContent = "Editar";

                btnEditar.addEventListener("click", async () => {
                    const novaMsg = prompt("Editar dúvida:", data.mensagem);
                    if (!novaMsg) return;

                    await updateDoc(doc(db, "duvidas", d.id), {
                        mensagem: novaMsg,
                        editada: true
                    });
                });

                // EXCLUIR
                const btnExcluir = document.createElement("button");
                btnExcluir.textContent = "Excluir";

                btnExcluir.addEventListener("click", async () => {
                    if (!confirm("Excluir dúvida?")) return;
                    await deleteDoc(doc(db, "duvidas", d.id));
                });

                acoes.appendChild(btnEditar);
                acoes.appendChild(btnExcluir);

            } else {
                // MARCAR COMO RESOLVIDA
                const btnResolver = document.createElement("button");
                btnResolver.textContent = "Marcar como resolvida";

                btnResolver.addEventListener("click", async () => {
                    await updateDoc(doc(db, "duvidas", d.id), {
                        resolvidaPeloAluno: true
                    });
                });

                acoes.appendChild(btnResolver);
            }

            container.appendChild(card);
        });
    });
});
