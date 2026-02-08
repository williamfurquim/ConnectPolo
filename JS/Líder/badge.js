// =========== IMPORTAÇÕES =====
import { db } from "../firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";



// =========== ELEMENTO =====
const badge = document.getElementById("badge-notificacao");



if (!badge) {
  console.warn("Badge não encontrado");
} else {
  const q = query(
    collection(db, "notificacoes"),
    where("lida", "==", false),
    orderBy("criadaEm", "desc")
  );

  onSnapshot(q, (snap) => {
    let contador = 0;

    const ultimoAcessoRaw = localStorage.getItem("ultimoAcessoNotificacoes");
    const ultimoAcesso = ultimoAcessoRaw ? Number(ultimoAcessoRaw) : 0;

    snap.docs.forEach(doc => {
      const n = doc.data();

      if (n.criadaEm && n.criadaEm.toMillis() > ultimoAcesso) {
        contador++;
      }
    });

    if (contador > 0) {
      const max = 9;
      badge.style.display = "inline-block";
      badge.textContent = contador > max ? `+${max}+` : `+${contador}`;
    } else {
      badge.style.display = "none";
    }
  });
}
