import { alunosMock } from "./mock.js";

export async function buscarAlunos() {
  // simula tempo de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  return alunosMock;
}
