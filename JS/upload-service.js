// =========== IMPORTAÇÕES =====
import { storage } from "./firebase.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";



// =========== FUNÇÕES =====
/**
 * Comprime e redimensiona imagem antes do upload
 * @param {File} file - Arquivo original
 * @param {number} maxWidth - Largura máxima (padrão: 800px)
 * @param {number} quality - Qualidade JPEG (0-1, padrão: 0.8)
 * @returns {Promise<Blob>} - Imagem otimizada
 */

export async function comprimirImagem(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✂️ Imagem reduzida: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Erro ao comprimir imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}



/**
 * Faz upload de imagem para Firebase Storage
 * @param {File|Blob} file - Arquivo de imagem
 * @param {string} path - Caminho no Storage (ex: "alunos/abc123.jpg")
 * @returns {Promise<string>} - URL pública da imagem
 */

export async function uploadImagem(file, path) {
  try {
    console.log(`📤 Iniciando upload: ${path}`);

    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    });

    console.log('✅ Upload concluído');

    const url = await getDownloadURL(snapshot.ref);

    console.log(`🔗 URL gerada: ${url}`);

    return url;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
}



/**
 * Deleta imagem do Firebase Storage
 * @param {string} path - Caminho no Storage
 */

export async function deletarImagem(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log(`🗑️ Imagem deletada: ${path}`);
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.warn('⚠️ Imagem não existe mais');
    } else {
      console.error('❌ Erro ao deletar:', error);
      throw error;
    }
  }
}



/**
 * Extrai caminho do Storage de uma URL
 * @param {string} url - URL do Firebase Storage
 * @returns {string} - Caminho (ex: "alunos/abc123.jpg")
 */

export function extrairCaminhoDeURL(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/o/')[1];
    return decodeURIComponent(path.split('?')[0]);
  } catch (error) {
    console.error('❌ URL inválida:', url);
    return null;
  }
}



/**
 * Fluxo completo: Comprimir + Upload otimizado
 * @param {File} file - Arquivo original
 * @param {string} alunoId - ID do aluno
 * @returns {Promise<string>} - URL da imagem
 */

export async function uploadFotoAluno(file, alunoId) {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo não é uma imagem');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Imagem muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB`);
    }

    console.log(`📸 Processando foto do aluno: ${alunoId}`);
    console.log(`   Tamanho original: ${(file.size / 1024).toFixed(2)}KB`);

    const blobComprimido = await comprimirImagem(file, 800, 0.8);

    const timestamp = Date.now();
    const path = `alunos/${alunoId}_${timestamp}.jpg`;
    const url = await uploadImagem(blobComprimido, path);

    console.log('🎉 Foto salva com sucesso.');

    return url;
  } catch (error) {
    console.error('❌ Erro no fluxo de upload:', error);
    throw error;
  }
}