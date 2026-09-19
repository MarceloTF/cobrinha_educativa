import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { bancoDados, obterOuCriarIdJogador } from './firebase.js';

// Módulo de telemetria para registrar métricas pedagógicas e progresso das partidas
export const GerenciadorTelemetria = {
  idSessao: null,
  idUsuario: null,
  referenciaSessao: null,
  fasesConcluidas: 0,
  totalErros: 0,

  // Inicializa uma nova sessão quando o jogador clica em Iniciar
  async iniciarSessao(modoJogo, direcaoOrdem, tamanhoGrade, velocidadeMs) {
    this.idUsuario = obterOuCriarIdJogador();
    this.idSessao = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
    this.fasesConcluidas = 0;
    this.totalErros = 0;

    try {
      this.referenciaSessao = await addDoc(collection(bancoDados, 'telemetry_sessions'), {
        user_id: this.idUsuario,
        session_id: this.idSessao,
        start_timestamp: serverTimestamp(),
        game_mode: modoJogo,
        order_direction: direcaoOrdem,
        grid_size: tamanhoGrade,
        speed_interval_ms: velocidadeMs,
        completed_phases: this.fasesConcluidas,
        total_errors: this.totalErros
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
        completed_phases: this.fasesConcluidas,
        total_errors: this.totalErros,
        last_updated: serverTimestamp()
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
        user_id: this.idUsuario,
        session_id: this.idSessao,
        timestamp: serverTimestamp(),
        event_type: tipoEvento,
        ...dados
      });
    } catch (e) {
      console.warn('Não foi possível gravar o evento no banco:', e);
    }
  },

  // Métodos com alias para manter compatibilidade
  initSession(modo, direcao, grade, vel) { return this.iniciarSessao(modo, direcao, grade, vel); },
  incrementCompletedPhases() { return this.incrementarFases(); },
  incrementErrors() { return this.incrementarErros(); },
  trackEvent(tipo, dados) { return this.registrarEvento(tipo, dados); }
};

export const TelemetryManager = GerenciadorTelemetria;
