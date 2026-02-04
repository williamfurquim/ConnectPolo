// ===== IMPORTAÇÕES =====
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====
const btnPresenca = document.getElementById("btn-presenca");
const msg = document.getElementById("mensagem-presenca");
let cacheHorario = null;

// ===== FUNÇÃO AUXILIAR DE HORÁRIO =====
function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// ===== FUNÇÃO DE HORÁRIO PERMITIDO =====
async function horarioPermitido() {
  if (!cacheHorario) return false;

  const { inicio, fim } = cacheHorario;

  const agora = new Date();

  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const inicioMin = horaParaMinutos(inicio);
  const fimMin = horaParaMinutos(fim);

  return agoraMin >= inicioMin && agoraMin <= fimMin;

}

// ===== VERIFICAÇÃO DE STATUS COM HORÁRIO =====
async function verificarStatus(user) {
  msg.style.color = "";
  const hoje = new Date().toLocaleDateString("en-CA");

  const refPresenca = doc(db, "presencas", user.uid, "dias", hoje);
  const refJustificativa = doc(db, "justificativas", user.uid, "dias", hoje);

  const [presencaSnap, justificativaSnap] = await Promise.all([
    getDoc(refPresenca),
    getDoc(refJustificativa)
  ]);

  const permitido = await horarioPermitido();

  if (justificativaSnap.exists()) {
    msg.textContent = "Você possui uma justificativa registrada hoje";
    msg.style.color = "orange";
    btnPresenca.disabled = true;
    btnPresenca.classList.remove("pulsando");
    return "justificado";
  }

  if (presencaSnap.exists()) {
    msg.textContent = "Presença já registrada hoje";
    btnPresenca.disabled = true;
    btnPresenca.classList.remove("pulsando");
    return "presente";
  }

  // Só habilita o botão se estiver no horário permitido
  if (!permitido) {
    msg.textContent = "Presença só pode ser registrada no horário definido pelo líder";
    msg.style.color = "red";
    btnPresenca.disabled = true;
    btnPresenca.classList.remove("pulsando");
    return "foraHorario";
  }

  btnPresenca.disabled = false;
  btnPresenca.classList.add("pulsando");
  msg.textContent = "Marque sua presença diária";
  return "pendente";
}

// ===== FUNÇÃO DE ATUALIZAÇÃO PERIÓDICA DO BOTÃO =====
async function atualizarBotao(user) {
  await verificarStatus(user);
}

// ===== ADICIONAR PRESENÇA =====
if (btnPresenca) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    // Atualiza botão ao carregar
    await atualizarBotao(user);

    // Atualiza botão a cada minuto para refletir mudanças de horário
    setInterval(() => atualizarBotao(user), 60000);

    btnPresenca.addEventListener("click", async () => {
      const status = await verificarStatus(user);
      if (status !== "pendente") return;

      const hoje = new Date().toLocaleDateString("en-CA");

      const refPresenca = doc(db, "presencas", user.uid, "dias", hoje);
      const refJustificativa = doc(db, "justificativas", user.uid, "dias", hoje);
      const justificativaSnap = await getDoc(refJustificativa);

      if (justificativaSnap.exists()) {
        msg.textContent = "Você já possui uma justificativa registrada para hoje.";
        msg.style.color = "orange";
        btnPresenca.disabled = true;
        return;
      }

      if ((await getDoc(refPresenca)).exists()) {
        msg.textContent = "Presença já registrada.";
        btnPresenca.disabled = true;
        return;
      }

      await setDoc(refPresenca, {
        presente: true,
        criadoEm: serverTimestamp()
      });

      await addDoc(collection(db, "notificacoes"), {
        tipo: "presenca",
        alunoId: user.uid,
        alunoNome: user.displayName || "",
        mensagem: "registrou presença hoje.",
        criadaEm: serverTimestamp(),
        lida: false
      })

      msg.textContent = "Presença registrada!";
      msg.style.color = "green";
      btnPresenca.disabled = true;
    });
  });
}

const refHorario = doc(db, "config", "presenca");

onSnapshot(refHorario, (snap) => {
  const pHorario = document.getElementById("horario-presenca");

  if (!snap.exists()) {
    cacheHorario = null;
    pHorario.textContent = "Horário ainda não definido.";
    return;
  }

  cacheHorario = snap.data();

  const { inicio, fim } = cacheHorario;
  pHorario.textContent = `Horário permitido para marcar presença: ${inicio} - ${fim}`;
  pHorario.style.color = "gray";
});
