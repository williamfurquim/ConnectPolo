// Agora tudo roda direto no Firestore, sem precisar de backend.

import { db } from "./firebase.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ========== ALUNOS ==========

/**
 * Busca todos os alunos (com filtros opcionais)
 * @param {Object} filtros - {turmaId, ativo}
 */
export async function buscarAlunos(filtros = {}) {
  try {
    let q = collection(db, "usuarios");
    
    // Sempre filtrar por role aluno
    q = query(q, where("role", "==", "aluno"));
    
    // Filtro por turma
    if (filtros.turmaId) {
      q = query(q, where("turmaId", "==", filtros.turmaId));
    }
    
    // Filtro por status ativo
    if (filtros.ativo !== undefined) {
      q = query(q, where("ativo", "==", filtros.ativo));
    }
    
    const snapshot = await getDocs(q);
    
    const alunos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      count: alunos.length,
      data: alunos
    };
  } catch (error) {
    console.error("❌ Erro ao buscar alunos:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Busca um aluno específico por ID
 */
export async function buscarAlunoPorId(alunoId) {
  try {
    const docRef = doc(db, "usuarios", alunoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: "Aluno não encontrado"
      };
    }
    
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    console.error("❌ Erro ao buscar aluno:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Busca aluno por email
 */
export async function buscarAlunoPorEmail(email) {
  try {
    const q = query(
      collection(db, "usuarios"),
      where("email", "==", email.toLowerCase()),
      where("role", "==", "aluno")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: "Aluno não encontrado"
      };
    }
    
    const doc = snapshot.docs[0];
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    console.error("❌ Erro ao buscar aluno por email:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cadastra novo aluno (cria no Authentication E no Firestore automaticamente)
 */
export async function cadastrarAluno(dados) {
  const auth = getAuth();
  
  try {
    console.log("🔐 [1/3] Verificando se email já existe...");
    
    // Verificar se email já existe no Firestore
    const emailExists = await buscarAlunoPorEmail(dados.email);
    
    if (emailExists.success) {
      return {
        success: false,
        error: "Email já cadastrado no sistema"
      };
    }
    
    console.log("🔐 [2/3] Criando usuário no Firebase Authentication...");
    
    // ✨ CRIAR USUÁRIO NO AUTHENTICATION
    // Gera senha automática ou usa senha padrão
    const senhaTemporaria = dados.senha || gerarSenhaAleatoria();
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth, 
        dados.email.toLowerCase(), 
        senhaTemporaria
      );
    } catch (authError) {
      console.error("❌ Erro ao criar usuário no Authentication:", authError);
      
      if (authError.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: "Email já está cadastrado no Authentication"
        };
      }
      
      return {
        success: false,
        error: `Erro no Authentication: ${authError.message}`
      };
    }
    
    const userId = userCredential.user.uid;
    console.log(`✅ Usuário criado no Authentication com ID: ${userId}`);
    
    console.log("📝 [3/3] Criando documento no Firestore...");
    
    // ✨ CRIAR DOCUMENTO NO FIRESTORE COM O MESMO ID
    const novoAluno = {
      nome: dados.nomeCompleto,
      nomeExibicao: dados.nomeExibicao || dados.nomeCompleto,
      email: dados.email.toLowerCase(),
      setor: dados.setor,
      dataNascimento: dados.dataNascimento || null,
      tempoExperiencia: dados.tempoExperiencia || "0 meses",
      foto: dados.foto || null,
      matricula: dados.matricula || null,
      turmaId: dados.turmaId || null,
      role: "aluno",
      ativo: true,
      senhaTemporaria: senhaTemporaria, // ⚠️ Armazena para enviar ao aluno
      criadoEm: serverTimestamp()
    };
    
    // Usar setDoc com o UID do Authentication
    await setDoc(doc(db, "usuarios", userId), novoAluno);
    
    console.log(`✅ Documento criado no Firestore com ID: ${userId}`);
    console.log(`🔑 Senha temporária: ${senhaTemporaria}`);
    
    return {
      success: true,
      message: "Aluno cadastrado com sucesso no Authentication e Firestore",
      data: {
        id: userId,
        ...novoAluno,
        senhaTemporaria: senhaTemporaria
      }
    };
    
  } catch (error) {
    console.error("❌ Erro geral ao cadastrar aluno:", error);
    
    // Se criou no Authentication mas falhou no Firestore, tentar limpar
    if (error.message.includes('Firestore')) {
      console.warn("⚠️ Usuário foi criado no Authentication mas falhou no Firestore");
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gera senha aleatória segura
 */
function gerarSenhaAleatoria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%';
  let senha = '';
  for (let i = 0; i < 10; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

/**
 * Atualiza dados de um aluno
 */
export async function atualizarAluno(alunoId, dados) {
  try {
    const docRef = doc(db, "usuarios", alunoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: "Aluno não encontrado"
      };
    }
    
    const atualizacao = {
      ...(dados.nome && { nome: dados.nome }),
      ...(dados.nomeExibicao && { nomeExibicao: dados.nomeExibicao }), // ✨ NOVO
      ...(dados.email && { email: dados.email.toLowerCase() }),
      ...(dados.setor && { setor: dados.setor }),
      ...(dados.dataNascimento !== undefined && { dataNascimento: dados.dataNascimento }),
      ...(dados.tempoExperiencia !== undefined && { tempoExperiencia: dados.tempoExperiencia }),
      ...(dados.foto !== undefined && { foto: dados.foto }),
      ...(dados.matricula !== undefined && { matricula: dados.matricula }),
      ...(dados.turmaId !== undefined && { turmaId: dados.turmaId }),
      ...(dados.ativo !== undefined && { ativo: dados.ativo }),
      atualizadoEm: serverTimestamp()
    };
    
    await updateDoc(docRef, atualizacao);
    
    console.log("✅ Aluno atualizado:", alunoId);
    
    return {
      success: true,
      message: "Aluno atualizado com sucesso",
      data: { id: alunoId, ...atualizacao }
    };
  } catch (error) {
    console.error("❌ Erro ao atualizar aluno:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========== TURMAS ==========

export async function buscarTurmas(filtros = {}) {
  try {
    let q = collection(db, "turmas");
    
    if (filtros.ativa !== undefined) {
      q = query(q, where("ativa", "==", filtros.ativa));
    }
    
    const snapshot = await getDocs(q);
    
    const turmas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      count: turmas.length,
      data: turmas
    };
  } catch (error) {
    console.error("❌ Erro ao buscar turmas:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function buscarTurmaPorId(turmaId) {
  try {
    const docRef = doc(db, "turmas", turmaId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: "Turma não encontrada"
      };
    }
    
    // Buscar alunos da turma
    const alunosResult = await buscarAlunos({ turmaId, ativo: true });
    
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data(),
        alunos: alunosResult.data || [],
        totalAlunos: alunosResult.count || 0
      }
    };
  } catch (error) {
    console.error("❌ Erro ao buscar turma:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========== CURSOS ==========

export async function buscarCursos(filtros = {}) {
  try {
    let q = collection(db, "cursos");
    
    if (filtros.ativo !== undefined) {
      q = query(q, where("ativo", "==", filtros.ativo));
    }
    
    if (filtros.categoria) {
      q = query(q, where("categoria", "==", filtros.categoria));
    }
    
    const snapshot = await getDocs(q);
    
    const cursos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        totalModulos: data.modulos ? data.modulos.length : 0
      };
    });
    
    return {
      success: true,
      count: cursos.length,
      data: cursos
    };
  } catch (error) {
    console.error("❌ Erro ao buscar cursos:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function buscarCursoPorId(cursoId) {
  try {
    const docRef = doc(db, "cursos", cursoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: "Curso não encontrado"
      };
    }
    
    const data = docSnap.data();
    
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        totalModulos: data.modulos ? data.modulos.length : 0
      }
    };
  } catch (error) {
    console.error("❌ Erro ao buscar curso:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========== PROGRESSO ==========

export async function buscarProgressoAluno(alunoId, cursoId = null) {
  try {
    if (cursoId) {
      // Buscar progresso de um curso específico
      const docRef = doc(db, "progresso", alunoId, "cursos", cursoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: true,
          data: {
            alunoId,
            cursoId,
            modulosConcluidos: 0,
            totalModulos: 0,
            porcentagem: 0,
            concluido: false
          }
        };
      }
      
      return {
        success: true,
        data: {
          alunoId,
          cursoId,
          ...docSnap.data()
        }
      };
    } else {
      // Buscar todos os cursos do aluno
      const cursosRef = collection(db, "progresso", alunoId, "cursos");
      const snapshot = await getDocs(cursosRef);
      
      const cursosProgresso = [];
      
      for (const doc of snapshot.docs) {
        const cursoData = doc.data();
        
        // Buscar informações do curso
        const cursoInfo = await buscarCursoPorId(doc.id);
        
        cursosProgresso.push({
          cursoId: doc.id,
          titulo: cursoInfo.success ? cursoInfo.data.titulo : "Curso não encontrado",
          ...cursoData
        });
      }
      
      return {
        success: true,
        data: {
          alunoId,
          totalCursos: cursosProgresso.length,
          cursos: cursosProgresso
        }
      };
    }
  } catch (error) {
    console.error("❌ Erro ao buscar progresso:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function atualizarProgresso(alunoId, cursoId, modulosConcluidos) {
  try {
    const cursoResult = await buscarCursoPorId(cursoId);
    
    if (!cursoResult.success) {
      return cursoResult;
    }
    
    const totalModulos = cursoResult.data.totalModulos;
    const porcentagem = totalModulos > 0 
      ? Math.round((modulosConcluidos / totalModulos) * 100)
      : 0;
    
    const progressoRef = doc(db, "progresso", alunoId, "cursos", cursoId);
    
    await setDoc(progressoRef, {
      modulosConcluidos,
      totalModulos,
      porcentagem,
      concluido: porcentagem === 100,
      ultimaAtualizacao: serverTimestamp()
    });
    
    console.log("✅ Progresso atualizado:", alunoId, cursoId);
    
    return {
      success: true,
      message: "Progresso atualizado com sucesso",
      data: {
        alunoId,
        cursoId,
        modulosConcluidos,
        totalModulos,
        porcentagem
      }
    };
  } catch (error) {
    console.error("❌ Erro ao atualizar progresso:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========== DASHBOARD ==========

export async function buscarDadosDashboard() {
  try {
    const [alunosResult, turmasResult, cursosResult] = await Promise.all([
      buscarAlunos(),
      buscarTurmas(),
      buscarCursos()
    ]);
    
    const totalAlunos = alunosResult.count || 0;
    const alunosAtivos = alunosResult.data?.filter(a => a.ativo).length || 0;
    
    const totalTurmas = turmasResult.count || 0;
    const turmasAtivas = turmasResult.data?.filter(t => t.ativa).length || 0;
    
    const totalCursos = cursosResult.count || 0;
    const cursosAtivos = cursosResult.data?.filter(c => c.ativo).length || 0;
    
    return {
      success: true,
      data: {
        alunos: {
          total: totalAlunos,
          ativos: alunosAtivos,
          inativos: totalAlunos - alunosAtivos
        },
        turmas: {
          total: totalTurmas,
          ativas: turmasAtivas,
          inativas: totalTurmas - turmasAtivas
        },
        cursos: {
          total: totalCursos,
          ativos: cursosAtivos,
          inativos: totalCursos - cursosAtivos
        }
      }
    };
  } catch (error) {
    console.error("❌ Erro ao buscar dados do dashboard:", error);
    return {
      success: false,
      error: error.message
    };
  }
}