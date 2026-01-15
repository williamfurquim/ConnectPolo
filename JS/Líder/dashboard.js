import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";

// ===============================
// MOCKS (substituir pela API depois)
// ===============================

async function buscarTurmas() {
    return [
        { nome: "Mecânica", alunos: 20 },
        { nome: "Automotiva", alunos: 15 },
        { nome: "Robótica", alunos: 18 },
        { nome: "Logística", alunos: 12 }
    ];
}

async function buscarCursos() {
    return {
        concluidos: 40,
        andamento: 18,
        adicionados: 60
    };
}

async function buscarFaltas() {
    return [
        { aluno: "João", faltas: 5 },
        { aluno: "Maria", faltas: 4 },
        { aluno: "Carlos", faltas: 6 }
    ];
}

async function buscarSolicitacoes(periodo) {
    if (periodo === "dia") return 4;
    if (periodo === "semana") return 18;
    if (periodo === "mes") return 55;
}

// ===============================
// GRÁFICOS
// ===============================

async function graficoTurmas() {
    const dados = await buscarTurmas();

    new Chart(document.getElementById("graficoTurmas"), {
        type: "bar",
        data: {
            labels: dados.map(t => t.nome),
            datasets: [{
                label: "Alunos",
                data: dados.map(t => t.alunos)
            }]
        }
    });
}

async function graficoCursos() {
    const dados = await buscarCursos();

    new Chart(document.getElementById("graficoCursos"), {
        type: "doughnut",
        data: {
            labels: ["Concluídos", "Em andamento", "Cursos adicionados"],
            datasets: [{
                data: [dados.concluidos, dados.andamento, dados.adicionados]
            }]
        }
    });
}

async function graficoFaltas() {
    const dados = await buscarFaltas();

    new Chart(document.getElementById("graficoFaltas"), {
        type: "bar",
        data: {
            labels: dados.map(a => a.aluno),
            datasets: [{
                label: "Faltas consecutivas",
                data: dados.map(a => a.faltas)
            }]
        }
    });
}

async function graficoSolicitacoes() {
    const dia = await buscarSolicitacoes("dia");
    const semana = await buscarSolicitacoes("semana");
    const mes = await buscarSolicitacoes("mes");

    new Chart(document.getElementById("graficoSolicitacoes"), {
        type: "line",
        data: {
            labels: ["Hoje", "Semana", "Mês"],
            datasets: [{
                label: "Solicitações",
                data: [dia, semana, mes]
            }]
        }
    });
}

// ===============================
// INIT
// ===============================

graficoTurmas();
graficoCursos();
graficoFaltas();
graficoSolicitacoes();

const btnPDF = document.getElementById("btn-pdf");

if (btnPDF){
    btnPDF.addEventListener("click", async () => {
    const area = document.getElementById("area-pdf");

    const canvas = await html2canvas(area, {
        scale: 2,
        backgroundColor: "#1A1A22"
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("landscape", "mm", "a4");

    const larguraPDF = pdf.internal.pageSize.getWidth();
    const alturaPDF = (canvas.height * larguraPDF) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, larguraPDF, alturaPDF);
    pdf.save("dashboard-analitico-lider.pdf");
});
}
