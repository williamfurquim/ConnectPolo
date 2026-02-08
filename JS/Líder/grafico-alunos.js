// =========== IMPORTAÇÕES =====
import { buscarAlunos, buscarTurmas, buscarCursos } from "../api-service.js";



// =========== ATUALIZAÇÃO EM TEMPO REAL =====
async function atualizarNumerosDashboard() {
    try {
        const [alunosRes, turmasRes, cursosRes] = await Promise.all([
            buscarAlunos({ ativo: true }),
            buscarTurmas({ ativa: true }),
            buscarCursos({ ativo: true })
        ]);

        const totalAlunos = alunosRes.success
        ? alunosRes.data.filter(a => a.role === "aluno").length
        : 0;

        const totalTurmas = turmasRes.success ? turmasRes.count : 0;
        const totalCursos = cursosRes.success ? cursosRes.count : 0;

        const elTurmas = document.getElementById("total-turmas");
        const elAlunos = document.getElementById("total-alunos");
        const elCursos = document.getElementById("total-cursos");

        if (elTurmas) elTurmas.textContent = totalTurmas;
        if (elAlunos) elAlunos.textContent = totalAlunos;
        if (elCursos) elCursos.textContent = totalCursos;

        console.log("✅ Dashboard atualizado:", { totalTurmas, totalAlunos, totalCursos });
    } catch (error) {
        console.error("❌ Erro ao atualizar dashboard:", error);
    }
}

window.addEventListener("load", atualizarNumerosDashboard);