// ===== IMPORTAÇÕES =====
import { db } from "../firebase.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    updateDoc,
    increment,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// ===== VARIÁVEIS GLOBAIS =====
const auth = getAuth();
const container = document.getElementById("avisos-container");
const semAvisos = document.getElementById("sem-avisos");
const TEMPO_MAXIMO = 48 * 60 * 60 * 1000; // 48 horas
const q = query(collection(db, "avisos"), orderBy("criadoEm", "desc"));

// ===== VERIFICA USUÁRIO LOGADO =====
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.warn("Usuário não autenticado!");
        return;
    }

    const userId = user.uid;

    onSnapshot(q, async (snapshot) => {
        container.innerHTML = "";
        let existeAvisoVisivel = false;
        const agora = Date.now();

        const lidosCache = new Map();
        await Promise.all(
            snapshot.docs.map(async avisoDoc => {
                const avisoId = avisoDoc.id;
                const lidoRef = doc(db, "avisosLidos", `${avisoId}_${userId}`);
                const lidoSnap = await getDoc(lidoRef);
                lidosCache.set(avisoId, lidoSnap.exists());
            })
        );


        for (const avisoDoc of snapshot.docs) {
            const data = avisoDoc.data();
            if (!data.criadoEm) continue;

            const criadoEm = data.criadoEm.toDate().getTime();
            if (agora - criadoEm > TEMPO_MAXIMO) continue;

            const avisoId = avisoDoc.id;
            const lidoRef = doc(db, "avisosLidos", `${avisoId}_${userId}`);
            const jaLido = lidosCache.get(avisoId);

            existeAvisoVisivel = true;

            const linkHTML = data.link
                ? `<p><a href="${data.link}" target="_blank" rel="noopener noreferrer">Abrir link</a></p>`
                : "";

            const aviso = document.createElement("div");
            aviso.classList.add("aviso");

            aviso.innerHTML = `
                <h3>${data.titulo}</h3>
                <p>${data.mensagem}</p>
                ${linkHTML}
                <footer>
                    <button class="btn-avisos">
                        ${jaLido ? "Marcado como lido" : "Marcar como lido"}
                    </button>
                </footer>
            `;

            const btnLido = aviso.querySelector(".btn-avisos");

            if (jaLido) btnLido.disabled = true;

            btnLido.addEventListener("click", async () => {
                btnLido.disabled = true;
                btnLido.textContent = "Marcado como lido";

                const snapConfirmacao = await getDoc(lidoRef);
                if (snapConfirmacao.exists()) return;

                await setDoc(lidoRef, {
                    avisoId,
                    userId,
                    lidoEm: serverTimestamp()
                });

                await updateDoc(doc(db, "avisos", avisoId), {
                    lidosCount: increment(1)
                });
            });

            container.appendChild(aviso);
        }

        if (!existeAvisoVisivel) container.appendChild(semAvisos);
    });
});
