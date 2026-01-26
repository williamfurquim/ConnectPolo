// ===== IMPORTAÇÕES =====
import { db } from "../firebase.js";

import {
    collection,
    getDocs,
    collectionGroup
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { hojeISO } from "../data.js";

// ===== FUNÇÃO PRINCIPAL =====
async function exportarPresencaDoDia(data) {
    try {
        // 1. Busca todos os usuários
        const alunosSnap = await getDocs(collection(db, "usuarios"));

        // 2. Busca TODAS as subcoleções "dias"
        const diasSnap = await getDocs(
            collectionGroup(db, "dias")
        );

        // 3. Mapas de presença e justificativa
        const presencasMap = new Set();
        const justificativasMap = new Set();

        diasSnap.forEach(docSnap => {
            // Garantimos que é a data correta
            if (docSnap.id !== data) return;

            
            // Caminho: presencas/{alunoId}/dias/{data}
            if (docSnap.ref.parent.parent.parent.id === "presencas") {
                presencasMap.add(docSnap.ref.parent.parent.id);
            }
            
            // Caminho: justificativas/{alunoId}/dias/{data}
            if (docSnap.ref.parent.parent.parent.id === "justificativas") {
                justificativasMap.add(docSnap.ref.parent.parent.id);
            }
        });
        
        if (presencasMap.size === 0 && justificativasMap.size === 0) {
            alert(
                "Não existem registos para essa data."
            );

            return;
        }
        // 4. Monta CSV
        const linhas = [];
        linhas.push("Aluno,Email,Data,Status");

        alunosSnap.forEach(aluno => {
            const d = aluno.data();
            if (d.role !== "aluno") return;

            let status = "Falta";

            if (presencasMap.has(aluno.id)) {
                status = "Presente";
            } else if (justificativasMap.has(aluno.id)) {
                status = "Justificado";
            }

            const nome = d.nome || "Sem nome";
            const email = d.email || "";

            linhas.push(
                `"${nome}","${email}","${data}","${status}"`
            );
        });

        // 5. Gera e baixa o CSV
        const csv = linhas.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `presenca_${data}.csv`;
        a.click();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Erro ao exportar presença:", error);
        alert("Erro ao exportar planilha.");
    }
}

// ===== BOTÃO =====
const btnExportar = document.getElementById("btn-exportar-presenca");

if (btnExportar) {
    btnExportar.addEventListener("click", async () => {
        const inputData = document.getElementById("data-exportacao").value;

        const dataSelecionada = inputData
            ? inputData // yyyy-mm-dd
            : hojeISO();

        await exportarPresencaDoDia(dataSelecionada);
    });
}

document.getElementById("data-exportacao").max = hojeISO();