// ===== IMPORTAÇÕES DESORGANIZADAS =====

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VERIFICAÇÃO =====

export function protegerPagina(roleEsperado) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists() || snap.data().role !== roleEsperado) {
      window.location.href = "index.html";
    }
  });
}
