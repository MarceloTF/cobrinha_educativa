// Configuração do Firebase para salvar as estatísticas e métricas do jogo
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const configuracaoFirebase = {
  apiKey: "AIzaSyAJrkEinErQNjULV-sJuLVeI-VQjmP60F4",
  authDomain: "cobrinha-database.firebaseapp.com",
  projectId: "cobrinha-database",
  storageBucket: "cobrinha-database.firebasestorage.app",
  messagingSenderId: "260787388267",
  appId: "1:260787388267:web:35814e92b836cf77bb562e"
};

// Inicializa o app do Firebase
const app = initializeApp(configuracaoFirebase);

// Conecta ao Firestore Database padrão
export const bancoDados = getFirestore(app);
export const db = bancoDados; // Mantém export antigo para compatibilidade

// Retorna ou cria um ID persistente para identificar o jogador no navegador
export function obterOuCriarIdJogador() {
  const CHAVE_STORAGE = 'id_jogador_cobrinha';
  try {
    let id = localStorage.getItem(CHAVE_STORAGE);
    if (!id) {
      id = 'aluno_' + (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
      localStorage.setItem(CHAVE_STORAGE, id);
    }
    return id;
  } catch (err) {
    return 'aluno_' + Math.random().toString(36).substring(2, 9);
  }
}

export const getOrCreateUserId = obterOuCriarIdJogador;
