import { db } from "../firebase.js";
import { collection, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { hojeISO } from "../data.js";

const { jsPDF } = window.jspdf;

// ===== FUNÇÃO PARA PEGAR PRIMEIRO E ÚLTIMO NOME =====
function primeiroEUltimoNome(nomeCompleto) {
    if (!nomeCompleto) return "Sem nome";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

// ===== FUNÇÃO PRINCIPAL PARA PDF ESTILIZADO COM TOTAL =====
async function exportarPresencaDoDiaPDF(data) {
    try {
        const alunosSnap = await getDocs(collection(db, "usuarios"));
        const diasSnap = await getDocs(collectionGroup(db, "dias"));

        const presencasMap = new Set();
        const justificativasMap = new Set();

        diasSnap.forEach(docSnap => {
            if (docSnap.id !== data) return;
            if (docSnap.ref.parent.parent.parent.id === "presencas") {
                presencasMap.add(docSnap.ref.parent.parent.id);
            }
            if (docSnap.ref.parent.parent.parent.id === "justificativas") {
                justificativasMap.add(docSnap.ref.parent.parent.id);
            }
        });

        if (presencasMap.size === 0 && justificativasMap.size === 0) {
            alert("Não existem registros para essa data.");
            return;
        }

        // ===== CONFIGURAÇÃO DO PDF =====
        const doc = new jsPDF("p", "pt", "a4");
        const margin = 40;
        const lineHeight = 22;
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 60;

        // ===== TÍTULO =====
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(`Presenças do dia ${data}`, pageWidth / 2, y, { align: "center" });
        y += 40;

        // ===== CABEÇALHO =====
        const headers = ["Aluno", "Email", "Status"];
        const colWidths = [180, 220, 120];

        doc.setFillColor(70, 130, 180); // Azul do cabeçalho
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        let x = margin;
        headers.forEach((h, i) => {
            doc.rect(x, y, colWidths[i], lineHeight, "F");
            doc.text(h, x + 5, y + 15);
            x += colWidths[i];
        });
        y += lineHeight;

        // ===== LINHAS DOS ALUNOS =====
        let fillToggle = false; // alterna cores de fundo
        doc.setFontSize(11);

        // Contadores
        let totalPresente = 0;
        let totalJustificado = 0;
        let totalFalta = 0;

        alunosSnap.forEach(aluno => {
            const d = aluno.data();
            if (d.role !== "aluno") return;

            let status = "Falta";
            let statusColor = [228, 67, 41]; // vermelho

            if (presencasMap.has(aluno.id)) {
                status = "Presente";
                statusColor = [22, 163, 74]; // verde
                totalPresente++;
            } else if (justificativasMap.has(aluno.id)) {
                status = "Justificado";
                statusColor = [242, 140, 46]; // laranja
                totalJustificado++;
            } else {
                totalFalta++;
            }

            fillToggle = !fillToggle;
            if (fillToggle) doc.setFillColor(245, 245, 245);
            else doc.setFillColor(255, 255, 255);
            doc.rect(margin, y, colWidths.reduce((a,b)=>a+b,0), lineHeight, "F");

            // Primeiro e último nome
            const nomeFormatado = primeiroEUltimoNome(d.nome);

            // Texto das células
            doc.setTextColor(0, 0, 0);
            doc.text(nomeFormatado, margin + 5, y + 15);
            doc.text(d.email || "", margin + colWidths[0] + 5, y + 15);

            doc.setFillColor(...statusColor);
            doc.rect(margin + colWidths[0] + colWidths[1], y, colWidths[2], lineHeight, "F");
            doc.setTextColor(255, 255, 255);
            doc.text(status, margin + colWidths[0] + colWidths[1] + 5, y + 15);

            y += lineHeight;

            if (y > 720) { // deixa espaço para total no final da página
                doc.addPage();
                y = 60;
            }
        });

        // ===== TOTALIZADORES =====
        y += 20;
        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Presente: ${totalPresente}`, margin, y);
        y += 18;
        doc.text(`Total Justificado: ${totalJustificado}`, margin, y);
        y += 18;
        doc.text(`Total Faltas: ${totalFalta}`, margin, y);

        doc.save(`presenca_${data}.pdf`);

    } catch (error) {
        console.error("Erro ao exportar presença:", error);
        alert("Erro ao exportar PDF.");
    }
}

// ===== BOTÃO =====
const btnExportar = document.getElementById("btn-exportar-presenca");
if (btnExportar) {
    btnExportar.addEventListener("click", async () => {
        const inputData = document.getElementById("data-exportacao").value;
        const dataSelecionada = inputData ? inputData : hojeISO();
        await exportarPresencaDoDiaPDF(dataSelecionada);
    });
}

document.getElementById("data-exportacao").max = hojeISO();
