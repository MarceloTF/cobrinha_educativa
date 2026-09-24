import { collection, addDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { bancoDados, obterOuCriarIdJogador } from './firebase.js';

// Módulo de telemetria para registrar métricas pedagógicas e progresso das partidas
export const GerenciadorTelemetria = {
  idSessao: null,
  idUsuario: null,
  referenciaSessao: null,
  fasesConcluidas: 0,
  totalErros: 0,

  // Inicializa uma nova sessão quando o jogador clica em Iniciar
  async iniciarSessao(modoJogo, direcaoOrdem, tamanhoGrade, velocidadeMs, modoMovimento = 'AUTOMATICO') {
    this.idUsuario = obterOuCriarIdJogador();
    this.idSessao = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
    this.fasesConcluidas = 0;
    this.totalErros = 0;

    try {
      this.referenciaSessao = await addDoc(collection(bancoDados, 'telemetry_sessions'), {
        id_usuario: this.idUsuario,
        id_sessao: this.idSessao,
        horario_inicio: serverTimestamp(),
        modo_jogo: modoJogo,
        direcao_ordem: direcaoOrdem,
        modo_movimento: modoMovimento,
        tamanho_grade: tamanhoGrade,
        intervalo_velocidade_ms: velocidadeMs,
        fases_concluidas: this.fasesConcluidas,
        total_erros: this.totalErros
      });
    } catch (e) {
      console.warn('Não foi possível registrar a sessão no banco:', e);
    }
  },

  // Incrementa a contagem de fases vencidas
  async incrementarFases() {
    this.fasesConcluidas++;
    this.atualizarMetricasSessao();
  },

  // Incrementa a contagem de erros da partida
  async incrementarErros() {
    this.totalErros++;
    this.atualizarMetricasSessao();
  },

  async atualizarMetricasSessao() {
    if (!this.referenciaSessao) return;
    try {
      await updateDoc(this.referenciaSessao, {
        fases_concluidas: this.fasesConcluidas,
        total_erros: this.totalErros,
        ultima_atualizacao: serverTimestamp()
      });
    } catch (e) {
      console.warn('Não foi possível atualizar métricas da sessão:', e);
    }
  },

  // Salva micro-interações do jogo (respostas do quiz, erros de ordem, colisões)
  async registrarEvento(tipoEvento, dados = {}) {
    if (!this.idUsuario) {
      this.idUsuario = obterOuCriarIdJogador();
    }
    if (!this.idSessao) return;

    try {
      await addDoc(collection(bancoDados, 'telemetry_events'), {
        id_usuario: this.idUsuario,
        id_sessao: this.idSessao,
        horario_registro: serverTimestamp(),
        tipo_evento: tipoEvento,
        ...dados
      });
    } catch (e) {
      console.warn('Não foi possível gravar o evento no banco:', e);
    }
  },

  // Métodos com alias para manter compatibilidade
  initSession(modo, direcao, grade, vel, mov) { return this.iniciarSessao(modo, direcao, grade, vel, mov); },
  incrementCompletedPhases() { return this.incrementarFases(); },
  incrementErrors() { return this.incrementarErros(); },
  trackEvent(tipo, dados) { return this.registrarEvento(tipo, dados); }
};

export const TelemetryManager = GerenciadorTelemetria;
