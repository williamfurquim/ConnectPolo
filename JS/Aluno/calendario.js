// =========== IMPORTAÇÕES =====
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";



/* =========== ELEMENTOS ===== */
const calendario = document.getElementById("calendario");
const detalhes = document.getElementById("detalhes");
const mesAno = document.getElementById("mes-ano");

const rPresenca = document.getElementById("r-presenca");
const rJust = document.getElementById("r-justificativa");
const rFalta = document.getElementById("r-falta");

const btnPdf = document.getElementById("btn-pdf");

/* ===== ESTADO ===== */
let nomeAluno = "";
let dataAtual = new Date();

/* ===== UTIL ===== */
function formatarData(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function hojeSemHora() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ===== AUTH ===== */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const userSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (userSnap.exists()) {
    nomeAluno = userSnap.data().nome || "";
  }

  async function carregarCalendario() {
    calendario.innerHTML = "";
    detalhes.innerHTML = "";

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const hoje = hojeSemHora();

    mesAno.textContent = dataAtual.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    const presencasSnap = await getDocs(
      collection(db, "presencas", user.uid, "dias")
    );
    const justificativasSnap = await getDocs(
      collection(db, "justificativas", user.uid, "dias")
    );

    const presencas = {};
    presencasSnap.forEach(d => presencas[d.id] = d.data());

    const justificativas = {};
    justificativasSnap.forEach(d => justificativas[d.id] = d.data());

    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    let totalPresenca = 0;
    let totalJust = 0;
    let totalFalta = 0;

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = formatarData(ano, mes, dia);
      const dataObj = new Date(`${data}T00:00`);

      const div = document.createElement("div");
      div.classList.add("dia");
      div.textContent = dia;

      let status = "Nenhuma ação registrada";

      if (presencas[data]) {
        div.classList.add("presente");
        status = "Presença";
        totalPresenca++;
      }
      else if (justificativas[data]) {
        div.classList.add("justificado");
        status = "Justificativa";
        totalJust++;

        div.dataset.motivo = justificativas[data].motivo || "";
        div.dataset.observacao = justificativas[data].observacao || "";
      }
      else if (dataObj < hoje) {
        div.classList.add("falta");
        status = "Falta";
        totalFalta++;
      }
      else {
        div.classList.add("vazio");
      }

      /* ===== CLICK DIA ===== */
      div.addEventListener("click", () => {
        let html = `
          <strong>Data:</strong> ${data.split("-").reverse().join("/")}<br>
          <strong>Status:</strong> ${status}<br>
        `;

        if (justificativas[data]) {
          html += `
            <hr>
            <label>Motivo</label><br>
            <input id="edit-motivo" value="${justificativas[data].motivo || ""}"><br><br>

            <label>Observação</label><br>
            <textarea id="edit-obs">${justificativas[data].observacao || ""}</textarea><br><br>

            <button id="btn-salvar">Salvar</button>
            <button id="btn-excluir" style="margin-left:10px">Excluir</button>
          `;
        }

        detalhes.innerHTML = html;

        /* UPDATE */
        const btnSalvar = document.getElementById("btn-salvar");
        if (btnSalvar) {
          btnSalvar.onclick = async () => {
            const novoMotivo = document.getElementById("edit-motivo").value.trim();
            const novaObs = document.getElementById("edit-obs").value.trim();

            if (!novoMotivo) {
              alert("Informe o motivo.");
              return;
            }

            await updateDoc(
              doc(db, "justificativas", user.uid, "dias", data),
              {
                motivo: novoMotivo,
                observacao: novaObs,
                atualizadoEm: new Date()
              }
            );

            alert("Justificativa atualizada.");
            carregarCalendario();
          };
        }

        /* DELETE */
        const btnExcluir = document.getElementById("btn-excluir");
        if (btnExcluir) {
          btnExcluir.onclick = async () => {
            if (!confirm("Deseja excluir esta justificativa?")) return;

            await deleteDoc(
              doc(db, "justificativas", user.uid, "dias", data)
            );

            alert("Justificativa excluída.");
            carregarCalendario();
          };
        }
      });

      calendario.appendChild(div);
    }

    rPresenca.textContent = `Presenças: ${totalPresenca}`;
    rJust.textContent = `Justificativas: ${totalJust}`;
    rFalta.textContent = `Faltas: ${totalFalta}`;
  }

  document.getElementById("mes-anterior").onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    carregarCalendario();
  };

  document.getElementById("mes-proximo").onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    carregarCalendario();
  };

  carregarCalendario();

  /* ===== PDF ===== */
  if (btnPdf) {
    btnPdf.onclick = () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      let y = 20;

      pdf.setFontSize(14);
      pdf.text(`Calendário - ${mesAno.textContent}`, 10, y);
      y += 7;
      pdf.text(`Aluno: ${nomeAluno}`, 10, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.text(rPresenca.textContent, 10, y); y += 6;
      pdf.text(rJust.textContent, 10, y); y += 6;
      pdf.text(rFalta.textContent, 10, y); y += 10;

      document.querySelectorAll(".dia").forEach(dia => {
        let status = "Sem registro";
        if (dia.classList.contains("presente")) status = "Presença";
        else if (dia.classList.contains("justificado")) status = "Justificativa";
        else if (dia.classList.contains("falta")) status = "Falta";

        let linha = `Dia ${dia.textContent}: ${status}`;

        if (dia.classList.contains("justificado")) {
          const mot = dia.dataset.motivo;
          const obs = dia.dataset.observacao;
          if (mot || obs) linha += ` | ${mot} - ${obs}`;
        }

        pdf.text(linha, 10, y);
        y += 7;

        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
      });

      pdf.save("calendario-presenca.pdf");
    };
  }
});