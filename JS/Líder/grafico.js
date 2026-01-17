// ===== IMPORTAÇÕES =====
import { db } from "../firebase.js";
import {
    collection,
    getDocs,
    onSnapshot,
    collectionGroup,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";

// ===== ELEMENTOS DO DOM =====
const presencasHojeEl = document.getElementById("presencas-hoje");
const faltasHojeEl = document.getElementById("faltas-hoje");
const presencasVarEl = document.getElementById("presencas-variacao");
const faltasVarEl = document.getElementById("faltas-variacao");

const canvas = document.getElementById("graficoPresencaFaltas");
const ctx = canvas.getContext("2d");

let grafico = null;

// ===== DATAS =====
function hojeISO() {
    return new Date().toISOString().split("T")[0];
}

function dataSemanaPassadaISO() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
}

const HOJE = hojeISO();

// ===== CACHE EM MEMÓRIA =====
const presencasHoje = new Set();
const justificativasHoje = new Set();
let totalAlunos = 0;

// ===== FUNÇÃO AUXILIAR VARIAÇÃO =====
function calcularVariacao(atual, anterior) {
    if (anterior === 0) return "Sem dados";
    const diff = ((atual - anterior) / anterior) * 100;
    const abs = Math.abs(diff).toFixed(1);
    if (diff > 0) return `${abs}% mais`;
    if (diff < 0) return `${abs}% menos`;
    return "Sem dados";
}

// ===== CARREGAR TOTAL DE ALUNOS =====
async function carregarTotalAlunos() {
    const snap = await getDocs(collection(db, "usuarios"));
    totalAlunos = snap.docs.filter(u => u.data().role === "aluno").length;
}

// ===== OBTER ESTATÍSTICAS SEMANA PASSADA =====
async function obterEstatisticasSemanaPassada() {
    const semanaPassada = dataSemanaPassadaISO();
    const snap = await getDocs(collection(db, "usuarios"));
    const alunos = snap.docs.filter(u => u.data().role === "aluno");

    let presencas = 0;
    let justificativas = 0;

    await Promise.all(alunos.map(async aluno => {
        const presencaRef = doc(db, "presencas", aluno.id, "dias", semanaPassada);
        const justificativaRef = doc(db, "justificativas", aluno.id, "dias", semanaPassada);

        const [pSnap, jSnap] = await Promise.all([
            getDoc(presencaRef),
            getDoc(justificativaRef)
        ]);

        if (pSnap.exists()) presencas++;
        else if (jSnap.exists()) justificativas++;
    }));

    return presencas + justificativas;
}

// ===== FUNÇÃO DE ATUALIZAÇÃO DO GRÁFICO =====
function atualizarGraficoEUI() {
    const presencas = presencasHoje.size + justificativasHoje.size;
    const faltas = totalAlunos - presencas;

    presencasHojeEl.textContent = presencas;
    faltasHojeEl.textContent = faltas;

    if (grafico) {
        grafico.data.datasets[0].data = [presencas, faltas];
        grafico.update();
        return;
    }

    grafico = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Presenças", "Faltas"],
            datasets: [{
                data: [presencas, faltas],
                backgroundColor: ["#4CAF50", "#F44336"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" },
                title: {
                    display: true,
                    text: "PRESENÇA / FALTAS (HOJE)"
                }
            }
        }
    });
}

// ===== ATUALIZA GRÁFICO + VARIAÇÃO SEMANAL =====
async function atualizarUIComVariacao() {
    atualizarGraficoEUI();

    const semanaPassada = await obterEstatisticasSemanaPassada();

    const presHoje = presencasHoje.size + justificativasHoje.size;
    const faltasHoje = totalAlunos - presHoje;

    presencasVarEl.textContent = calcularVariacao(presHoje, semanaPassada) + " que semana passada";
    faltasVarEl.textContent = calcularVariacao(faltasHoje, totalAlunos - semanaPassada) + " que semana passada";
}

// ===== TEMPO REAL =====
function escutarTempoReal() {
    onSnapshot(collectionGroup(db, "dias"), snapshot => {
        let mudouHoje = false;

        snapshot.docChanges().forEach(change => {
            if (change.doc.id !== HOJE) return;

            const alunoId = change.doc.ref.parent.parent.id;
            const caminho = change.doc.ref.path;

            mudouHoje = true;

            if (caminho.startsWith("presencas/")) {
                presencasHoje.add(alunoId);
                justificativasHoje.delete(alunoId);
            }

            if (caminho.startsWith("justificativas/")) {
                justificativasHoje.add(alunoId);
                presencasHoje.delete(alunoId);
            }

            if (change.type === "removed") {
                presencasHoje.delete(alunoId);
                justificativasHoje.delete(alunoId);
            }
        });

        if (mudouHoje) {
            atualizarUIComVariacao();
        }
    });
}

// ===== INICIALIZAÇÃO =====
async function iniciar() {
    await carregarTotalAlunos();
    escutarTempoReal();
    atualizarUIComVariacao();
}

iniciar();
