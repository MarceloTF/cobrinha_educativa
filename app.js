// Jogo da Cobrinha Educativa
// Projeto de Desenvolvimento Web Interdisciplinar
// Modos: Números e Alfabeto (Ordem Crescente e Decrescente)

import { GerenciadorTelemetria } from './telemetry.js';

document.addEventListener('DOMContentLoaded', () => {
  // Configurações do Tabuleiro e Velocidade
  let TAMANHO_GRADE = 10;
  // Velocidade da cobrinha (1: Muito lenta [500ms], 2: Lenta [330ms - padrão], 3: Média [165ms], 4: Rápida [110ms])
  let nivelVelocidade = 2;
  let INTERVALO_MOVIMENTO_MS = 330;

  // As 7 Cores do Arco-Íris utilizadas para guiar a ordenação
  const CORES_ARCO_IRIS = [
    { name: 'Vermelho', hex: 0xef4444, css: '#ef4444' },
    { name: 'Laranja',  hex: 0xf97316, css: '#f97316' },
    { name: 'Amarelo',  hex: 0xeab308, css: '#eab308' },
    { name: 'Verde',    hex: 0x22c55e, css: '#22c55e' },
    { name: 'Azul',     hex: 0x0ea5e9, css: '#0ea5e9' },
    { name: 'Anil',     hex: 0x4338ca, css: '#4338ca' },
    { name: 'Violeta',  hex: 0x8b5cf6, css: '#8b5cf6' }
  ];

  // Modos de jogo e orientações
  const ModoJogo = {
    NUMEROS: 'NUMEROS',
    ALFABETO: 'ALFABETO'
  };

  const DirecaoOrdem = {
    CRESCENTE: 'CRESCENTE',
    DECRESCENTE: 'DECRESCENTE'
  };

  const ModoMovimento = {
    AUTOMATICO: 'AUTOMATICO',
    MANUAL: 'MANUAL'
  };

  // Alfabeto completo (A até Z)
  const ALFABETO_COMPLETO = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  // Elementos da interface (DOM)
  const gameHeader = document.getElementById('game-header');
  const canvasContainer = document.getElementById('game-canvas-container');
  const phaseLabel = document.getElementById('phase-label');
  const targetLabel = document.getElementById('target-label');
  const alertToast = document.getElementById('alert-toast');
  const startPrompt = document.getElementById('start-prompt');

  // Botões do cabeçalho
  const btnMenu = document.getElementById('btn-menu');
  const btnPause = document.getElementById('btn-pause');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnExitFullscreen = document.getElementById('btn-exit-fullscreen');
  const btnSound = document.getElementById('btn-sound');
  const btnReset = document.getElementById('btn-reset');

  // Menu principal e seleção de etapas
  const menuOverlay = document.getElementById('menu-overlay');
  const menuStepMode = document.getElementById('menu-step-mode');
  const menuStepOrder = document.getElementById('menu-step-order');
  const btnChooseNumbers = document.getElementById('btn-choose-numbers');
  const btnChooseLetters = document.getElementById('btn-choose-letters');
  const selectedModeBadge = document.getElementById('selected-mode-badge');
  const orderStepTitle = document.getElementById('order-step-title');
  const orderCrescentTitle = document.getElementById('order-crescent-title');
  const orderCrescentDesc = document.getElementById('order-crescent-desc');
  const orderDecrescentTitle = document.getElementById('order-decrescent-title');
  const orderDecrescentDesc = document.getElementById('order-decrescent-desc');
  const btnOrderCrescent = document.getElementById('btn-order-crescent');
  const btnOrderDecrescent = document.getElementById('btn-order-decrescent');
  const btnBackToMode = document.getElementById('btn-back-to-mode');
  const menuStepMovement = document.getElementById('menu-step-movement');
  const movementModeBadge = document.getElementById('movement-mode-badge');
  const btnMovementManual = document.getElementById('btn-movement-manual');
  const btnMovementAuto = document.getElementById('btn-movement-auto');
  const btnBackToOrder = document.getElementById('btn-back-to-order');

  // Modais de pausa, métricas, quiz e vitória
  const pauseOverlay = document.getElementById('pause-overlay');
  const btnResumeGame = document.getElementById('btn-resume-game');
  const btnRestartPhase = document.getElementById('btn-restart-phase');
  const btnPauseMenu = document.getElementById('btn-pause-menu');
  const btnPauseMetrics = document.getElementById('btn-pause-metrics');

  const btnMetrics = document.getElementById('btn-metrics');
  const metricsOverlay = document.getElementById('metrics-overlay');
  const btnCloseMetrics = document.getElementById('btn-close-metrics');
  const btnReturnFromMetrics = document.getElementById('btn-return-from-metrics');
  const btnResetMetrics = document.getElementById('btn-reset-metrics');
  const metricFirstTry = document.getElementById('metric-first-try');
  const metricAvgAttempts = document.getElementById('metric-avg-attempts');
  const metricTotalCorrect = document.getElementById('metric-total-correct');
  const metricTotalWrong = document.getElementById('metric-total-wrong');
  const phaseMetricsList = document.getElementById('phase-metrics-list');

  const quizOverlay = document.getElementById('quiz-overlay');
  const quizBadgeIcon = document.getElementById('quiz-badge-icon');
  const quizBadgeText = document.getElementById('quiz-badge-text');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizFeedback = document.getElementById('quiz-feedback');
  const quizButtons = document.querySelectorAll('.quiz-btn');
  const btnQuizAudio = document.getElementById('btn-quiz-audio');

  const victoryOverlay = document.getElementById('victory-overlay');
  const victoryTitle = document.getElementById('victory-title');
  const victoryDesc = document.getElementById('victory-desc');
  const btnRestartGame = document.getElementById('btn-restart-game');
  const btnVictoryMenu = document.getElementById('btn-victory-menu');

  // Controles virtuais (D-pad)
  const controlsSection = document.getElementById('controls-section');
  const btnCloseDpad = document.getElementById('btn-close-dpad');
  const btnShowDpad = document.getElementById('btn-show-dpad');
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');

  // Sistema de som com Web Audio API e Síntese de Voz Didática
  let contextoAudio = null;
  let somHabilitado = true;
  let generoVoz = 'female';
  let vozEducadoraCache = null;
  let sinteseVozAquecida = false;

  function obterMelhorVozEducadora(vozes) {
    if (!vozes || vozes.length === 0) return null;

    const vozesPt = vozes.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
    if (vozesPt.length === 0) return null;

    const avaliarVoz = (v) => {
      let pontuacao = 0;
      const nome = (v.name || '').toLowerCase();
      const idioma = (v.lang || '').toLowerCase();

      if (idioma.includes('br') || idioma.includes('pt-br') || idioma.includes('pt_br')) {
        pontuacao += 60;
      }

      const ehMasculino = nome.includes('daniel') || nome.includes('felipe') || nome.includes('antonio') || nome.includes('antônio') || nome.includes('ricardo') || nome.includes('male') || nome.includes('homem') || nome.includes('thiago') || nome.includes('julio');
      const ehFeminino = nome.includes('francisca') || nome.includes('luciana') || nome.includes('thalita') || nome.includes('leticia') || nome.includes('letícia') || nome.includes('vitoria') || nome.includes('vitória') || nome.includes('camila') || nome.includes('maria') || nome.includes('joana') || nome.includes('heloisa') || nome.includes('heloísa') || nome.includes('female') || nome.includes('mulher');

      if (generoVoz === 'female') {
        if (nome.includes('francisca')) pontuacao += 120;
        else if (nome.includes('luciana')) pontuacao += 115;
        else if (nome.includes('thalita')) pontuacao += 110;
        else if (nome.includes('google') && (idioma.includes('br') || nome.includes('brasil'))) pontuacao += 100;
        else if (ehFeminino) pontuacao += 90;

        if (ehMasculino) pontuacao -= 150;
      } else {
        if (nome.includes('antonio') || nome.includes('antônio')) pontuacao += 120;
        else if (nome.includes('felipe')) pontuacao += 110;
        else if (nome.includes('daniel')) pontuacao += 100;
        else if (ehMasculino) pontuacao += 90;

        if (ehFeminino) pontuacao -= 150;
      }

      if (nome.includes('natural') || nome.includes('neural') || nome.includes('online') || nome.includes('enhanced') || nome.includes('premium')) {
        pontuacao += 40;
      }

      return pontuacao;
    };

    vozesPt.sort((a, b) => avaliarVoz(b) - avaliarVoz(a));
    return vozesPt[0];
  }

  function carregarVozesEducadoras() {
    if (!('speechSynthesis' in window)) return;
    const vozes = window.speechSynthesis.getVoices();
    if (vozes && vozes.length > 0) {
      vozEducadoraCache = obterMelhorVozEducadora(vozes);
    }
  }

  if ('speechSynthesis' in window) {
    carregarVozesEducadoras();
    window.speechSynthesis.onvoiceschanged = () => {
      carregarVozesEducadoras();
    };
  }

  function iniciarAudio() {
    // 1. Inicializa ou reativa o contexto de áudio
    if (!contextoAudio) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) contextoAudio = new AudioContextClass();
    }
    if (contextoAudio && contextoAudio.state === 'suspended') {
      contextoAudio.resume().catch(() => {});
    }

    // 2. Destrava canal de hardware de áudio com buffer de silêncio
    if (contextoAudio && contextoAudio.state === 'running') {
      try {
        const bufferSilencioso = contextoAudio.createBuffer(1, 1, 22050);
        const fonte = contextoAudio.createBufferSource();
        fonte.buffer = bufferSilencioso;
        fonte.connect(contextoAudio.destination);
        fonte.start(0);
      } catch (e) {
        // Ignora eventual restrição
      }
    }

    // 3. Pré-carrega vozes de síntese
    carregarVozesEducadoras();

    // 4. Pré-aquece a API de síntese para eliminar cold-start delay na primeira bolinha
    if ('speechSynthesis' in window && !sinteseVozAquecida) {
      sinteseVozAquecida = true;
      try {
        const aquecimento = new SpeechSynthesisUtterance(' ');
        aquecimento.volume = 0;
        aquecimento.rate = 10;
        if (vozEducadoraCache) aquecimento.voice = vozEducadoraCache;
        window.speechSynthesis.speak(aquecimento);
      } catch (e) {
        // Ignora se não puder falar de imediato
      }
    }
  }

  // Inicializa o áudio de imediato na abertura do app
  iniciarAudio();

  // Escuta qualquer primeira interação (toque, clique ou tecla) para destravar o subsistema sem atraso
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(nomeEvento => {
    window.addEventListener(nomeEvento, () => {
      iniciarAudio();
    }, { passive: true });
  });

  function tocarTom(frequencia, tipo = 'sine', duracao = 0.1, atraso = 0, volume = 0.16) {
    if (!somHabilitado) return;
    try {
      iniciarAudio();
      if (!contextoAudio) return;
      const osc = contextoAudio.createOscillator();
      const gain = contextoAudio.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(frequencia, contextoAudio.currentTime + atraso);
      gain.gain.setValueAtTime(volume, contextoAudio.currentTime + atraso);
      gain.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + atraso + duracao);
      osc.connect(gain);
      gain.connect(contextoAudio.destination);
      osc.start(contextoAudio.currentTime + atraso);
      osc.stop(contextoAudio.currentTime + atraso + duracao);
    } catch (e) {
      console.warn('Erro ao tocar tom:', e);
    }
  }

  function tocarSomAcerto() {
    tocarTom(523.25, 'triangle', 0.08, 0, 0.2);
    tocarTom(659.25, 'triangle', 0.12, 0.07, 0.2);
  }

  function tocarSomErro() {
    tocarTom(240, 'sawtooth', 0.14, 0, 0.18);
    tocarTom(160, 'sawtooth', 0.22, 0.12, 0.18);
  }

  function tocarSomVitoria() {
    tocarTom(523.25, 'sine', 0.11, 0.0, 0.2);
    tocarTom(659.25, 'sine', 0.11, 0.11, 0.2);
    tocarTom(783.99, 'sine', 0.11, 0.22, 0.2);
    tocarTom(1046.50, 'sine', 0.35, 0.33, 0.25);
  }

  // Inicialização do PixiJS
  if (typeof PIXI === 'undefined') {
    console.error('Biblioteca PixiJS não foi carregada.');
    return;
  }

  let tamanhoPixelTabuleiro = 480;
  let tamanhoBloco = tamanhoPixelTabuleiro / TAMANHO_GRADE;

  const appPixi = new PIXI.Application({
    width: tamanhoPixelTabuleiro,
    height: tamanhoPixelTabuleiro,
    backgroundColor: 0x0f172a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
  });

  appPixi.view.id = 'game-canvas';
  canvasContainer.appendChild(appPixi.view);

  const containerGrade = new PIXI.Container();
  const containerItens = new PIXI.Container();
  const containerCobra = new PIXI.Container();

  appPixi.stage.addChild(containerGrade);
  appPixi.stage.addChild(containerItens);
  appPixi.stage.addChild(containerCobra);

  function ajustarDimensoesTela() {
    if (!canvasContainer) return;
    const larguraDisp = canvasContainer.clientWidth;
    const alturaDisp = canvasContainer.clientHeight;
    if (larguraDisp <= 0 || alturaDisp <= 0) return;

    const novoTamanho = Math.max(260, Math.floor(Math.min(larguraDisp, alturaDisp) - 16));
    tamanhoPixelTabuleiro = novoTamanho;
    tamanhoBloco = tamanhoPixelTabuleiro / TAMANHO_GRADE;

    appPixi.renderer.resize(tamanhoPixelTabuleiro, tamanhoPixelTabuleiro);

    desenharGrade();
    renderizarCobra();
    reposicionarItens();
  }

  window.addEventListener('resize', ajustarDimensoesTela);

  function desenharGrade() {
    containerGrade.removeChildren();
    const g = new PIXI.Graphics();
    g.lineStyle(1, 0x1e293b, 0.6);

    for (let x = 0; x <= tamanhoPixelTabuleiro; x += tamanhoBloco) {
      g.moveTo(x, 0);
      g.lineTo(x, tamanhoPixelTabuleiro);
    }
    for (let y = 0; y <= tamanhoPixelTabuleiro; y += tamanhoBloco) {
      g.moveTo(0, y);
      g.lineTo(tamanhoPixelTabuleiro, y);
    }

    containerGrade.addChild(g);
  }

  // Estado do jogo
  let modoJogoAtivo = ModoJogo.NUMEROS;
  let direcaoOrdemAtiva = DirecaoOrdem.CRESCENTE;
  let modoMovimentoAtivo = ModoMovimento.AUTOMATICO;

  let indiceFaseAtual = 0;
  let sequenciaFaseAtual = [];
  let indiceSequencia = 0;

  let cobra = [];
  let crescimentoPendente = 0;
  let direcao = { x: 0, y: 0 };
  let proximaDirecao = { x: 0, y: 0 };
  let aguardandoPrimeiroComando = true;
  let jogoPausado = false;
  let emQuizOuVitoria = false;
  let transicaoParaQuiz = false;

  let itensTabuleiro = [];
  let maximoItensVisiveis = 3;
  let proximoIndiceSpawn = 0;
  let acumuladorMovimento = 0;
  let temporizadorNotificacao = null;
  let avisoInicialJaExibido = false;
  try {
    avisoInicialJaExibido = localStorage.getItem('cobrinha_aviso_inicial_visto') === 'true';
  } catch (e) {
    avisoInicialJaExibido = false;
  }

  function obterTotalFases() {
    if (modoJogoAtivo === ModoJogo.NUMEROS) {
      return 8; // Fases de 3 a 10 números
    } else {
      return 24; // Fases de 3 a 26 letras
    }
  }

  function gerarSequenciaFase(indiceFase) {
    const qtdItens = 3 + indiceFase;

    if (modoJogoAtivo === ModoJogo.NUMEROS) {
      const numeros = [];
      for (let i = 1; i <= qtdItens; i++) {
        numeros.push(i);
      }
      return (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE) ? numeros : numeros.reverse();
    } else {
      const letras = ALFABETO_COMPLETO.slice(0, qtdItens);
      return (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE) ? letras : letras.reverse();
    }
  }

  function obterValorAlvoAtual() {
    return sequenciaFaseAtual[indiceSequencia] ?? null;
  }

  function obterCorAlvoAtual() {
    return CORES_ARCO_IRIS[indiceSequencia % CORES_ARCO_IRIS.length];
  }

  function exibirNotificacao(mensagem, ehInformativo = false) {
    if (temporizadorNotificacao) clearTimeout(temporizadorNotificacao);
    alertToast.textContent = mensagem;
    alertToast.className = 'alert-toast show' + (ehInformativo ? ' info' : '');
    temporizadorNotificacao = setTimeout(() => {
      alertToast.className = 'alert-toast';
    }, 2800);
  }

  // Inicializa a cobra no centro do tabuleiro
  function iniciarCobra() {
    const centroX = Math.floor(TAMANHO_GRADE / 2);
    const centroY = Math.floor(TAMANHO_GRADE / 2);
    cobra = [
      { x: centroX, y: centroY }
    ];
    crescimentoPendente = 2; // segmentos extras que se esticam no primeiro movimento

    direcao = { x: 0, y: 0 };
    proximaDirecao = { x: 0, y: 0 };
    aguardandoPrimeiroComando = true;

    if (startPrompt) {
      if (!avisoInicialJaExibido && indiceFaseAtual === 0) {
        startPrompt.classList.remove('hidden');
        avisoInicialJaExibido = true;
        try {
          localStorage.setItem('cobrinha_aviso_inicial_visto', 'true');
        } catch (e) {
          // Fallback silencioso
        }
      } else {
        startPrompt.classList.add('hidden');
      }
    }
  }

  // Verifica se duas posições estão encostadas
  function estaColidindo(p1, p2) {
    return Math.abs(p1.x - p2.x) <= 1 && Math.abs(p1.y - p2.y) <= 1;
  }

  // Sorteia uma coordenada livre evitando proximidade excessiva
  function obterPosicaoAleatoriaSegura(posicoesExistentes = []) {
    const celulasSeguras = [];

    for (let x = 1; x < TAMANHO_GRADE - 1; x++) {
      for (let y = 1; y < TAMANHO_GRADE - 1; y++) {
        const encostaNaCobra = cobra.some(seg => estaColidindo({ x, y }, seg));
        if (encostaNaCobra) continue;

        const encostaEmItem = posicoesExistentes.some(p => estaColidindo({ x, y }, p));
        if (encostaEmItem) continue;

        celulasSeguras.push({ x, y });
      }
    }

    if (celulasSeguras.length > 0) {
      return celulasSeguras[Math.floor(Math.random() * celulasSeguras.length)];
    }

    // Fallback 1: se não houver células totalmente isoladas, busca casas sem toque ortogonal
    const celulasFallback = [];
    for (let x = 1; x < TAMANHO_GRADE - 1; x++) {
      for (let y = 1; y < TAMANHO_GRADE - 1; y++) {
        const sobreCobra = cobra.some(seg => seg.x === x && seg.y === y);
        if (sobreCobra) continue;

        const sobreItem = posicoesExistentes.some(p => p.x === x && p.y === y);
        if (sobreItem) continue;

        const toqueOrtogonal = posicoesExistentes.some(p =>
          (p.x === x && Math.abs(p.y - y) === 1) || (p.y === y && Math.abs(p.x - x) === 1)
        );
        if (toqueOrtogonal) continue;

        celulasFallback.push({ x, y });
      }
    }

    if (celulasFallback.length > 0) {
      return celulasFallback[Math.floor(Math.random() * celulasFallback.length)];
    }

    // Fallback 2: qualquer célula livre
    for (let x = 1; x < TAMANHO_GRADE - 1; x++) {
      for (let y = 1; y < TAMANHO_GRADE - 1; y++) {
        const sobreCobra = cobra.some(seg => seg.x === x && seg.y === y);
        const sobreItem = posicoesExistentes.some(p => p.x === x && p.y === y);
        if (!sobreCobra && !sobreItem) return { x, y };
      }
    }

    return { x: 2, y: 2 };
  }

  // Desenha ou redesenha os gráficos de um item (círculo, anel e texto) com base no tamanhoBloco atual
  function desenharGraficosDoItem(item) {
    const { container, value, colorHex } = item;
    container.removeChildren();

    // Raio da bolinha e do anel calculados estritamente para não extrapolar o quadrado do grid
    // O raio máximo teórico da célula a partir do centro é tamanhoBloco / 2 (0.50 * tamanhoBloco)
    const raioBolinha = Math.max(5, Math.round(tamanhoBloco * 0.35)); // Diâmetro de 70% da célula (folga de 15% para cada borda)
    const raioAnel = Math.max(7, Math.round(tamanhoBloco * 0.43));    // Diâmetro de 86% da célula (nunca ultrapassa a grade, mesmo pulsando)

    // Anel de destaque do item da vez
    const anel = new PIXI.Graphics();
    anel.name = 'targetRing';
    anel.lineStyle(Math.max(1.5, tamanhoBloco * 0.04), 0xffffff, 0.95);
    anel.drawCircle(0, 0, raioAnel);
    const alvoAtual = obterValorAlvoAtual();
    anel.visible = (value === alvoAtual);
    container.addChild(anel);
    item.ring = anel;

    // Círculo colorido com o tom pedagógico do arco-íris
    const circulo = new PIXI.Graphics();
    circulo.beginFill(colorHex);
    circulo.lineStyle(Math.max(1, tamanhoBloco * 0.035), 0xffffff, 0.95);
    circulo.drawCircle(0, 0, raioBolinha);
    circulo.endFill();
    container.addChild(circulo);

    // Texto com o número ou letra, perfeitamente contido dentro da bolinha
    const estiloTexto = new PIXI.TextStyle({
      fontFamily: 'Fredoka, Nunito, Arial, sans-serif',
      fontSize: Math.max(9, Math.round(tamanhoBloco * 0.38)),
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });
    const spriteTexto = new PIXI.Text(String(value), estiloTexto);
    spriteTexto.anchor.set(0.5);
    container.addChild(spriteTexto);
  }

  // Adiciona visualmente um novo item no tabuleiro
  function criarItemNoTabuleiro(valor, indiceItem) {
    const posicoesOcupadas = itensTabuleiro.map(it => ({ x: it.gridX, y: it.gridY }));
    const pos = obterPosicaoAleatoriaSegura(posicoesOcupadas);

    const infoCor = CORES_ARCO_IRIS[indiceItem % CORES_ARCO_IRIS.length];

    const containerItem = new PIXI.Container();
    containerItem.x = pos.x * tamanhoBloco + tamanhoBloco / 2;
    containerItem.y = pos.y * tamanhoBloco + tamanhoBloco / 2;

    const itemObj = {
      value: valor,
      seqIndex: indiceItem,
      gridX: pos.x,
      gridY: pos.y,
      container: containerItem,
      ring: null,
      colorHex: infoCor.hex,
      colorName: infoCor.name
    };

    desenharGraficosDoItem(itemObj);
    containerItens.addChild(containerItem);
    itensTabuleiro.push(itemObj);
  }

  // Gera os itens iniciais da fase
  function gerarItensDaFase() {
    containerItens.removeChildren();
    itensTabuleiro = [];
    proximoIndiceSpawn = 0;

    const contagemInicial = Math.min(maximoItensVisiveis, sequenciaFaseAtual.length);
    for (let i = 0; i < contagemInicial; i++) {
      criarItemNoTabuleiro(sequenciaFaseAtual[i], i);
    }
    proximoIndiceSpawn = contagemInicial;

    atualizarPainelHUD();
  }

  function reposicionarItens() {
    itensTabuleiro.forEach(it => {
      if (it.container) {
        it.container.x = it.gridX * tamanhoBloco + tamanhoBloco / 2;
        it.container.y = it.gridY * tamanhoBloco + tamanhoBloco / 2;
        desenharGraficosDoItem(it);
      }
    });
  }

  // Atualiza as informações do cabeçalho
  function atualizarPainelHUD() {
    const totalFases = obterTotalFases();
    const numeroFase = indiceFaseAtual + 1;
    const valorAlvo = obterValorAlvoAtual();
    const corAlvo = obterCorAlvoAtual();

    let descricaoModo = '';
    if (modoJogoAtivo === ModoJogo.NUMEROS) {
      const faixa = (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE)
        ? `1 a ${sequenciaFaseAtual.length}`
        : `${sequenciaFaseAtual.length} a 1`;
      const sufixoRitmo = (modoMovimentoAtivo === ModoMovimento.MANUAL) ? ' [Passo a Passo]' : '';
      descricaoModo = `Fase ${numeroFase}/${totalFases}: Números (${faixa})${sufixoRitmo}`;
    } else {
      const ultimaLetra = ALFABETO_COMPLETO[sequenciaFaseAtual.length - 1];
      const faixa = (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE)
        ? `A a ${ultimaLetra}`
        : `${ultimaLetra} a A`;
      const sufixoRitmo = (modoMovimentoAtivo === ModoMovimento.MANUAL) ? ' [Passo a Passo]' : '';
      descricaoModo = `Fase ${numeroFase}/${totalFases}: Alfabeto (${faixa})${sufixoRitmo}`;
    }

    phaseLabel.textContent = descricaoModo;

    if (valorAlvo !== null && corAlvo) {
      targetLabel.innerHTML = `Coma: <strong>${valorAlvo}</strong> <span class="target-color-indicator" style="background-color: ${corAlvo.css};">${corAlvo.name}</span>`;
    } else {
      targetLabel.innerHTML = `Coma: <strong>OK</strong>`;
    }

    itensTabuleiro.forEach(it => {
      if (it.ring) {
        it.ring.visible = (it.value === valorAlvo);
      }
    });
  }

  // Renderiza a cobra e seus olhos animados
  function renderizarCobra() {
    containerCobra.removeChildren();

    cobra.forEach((segmento, indice) => {
      const g = new PIXI.Graphics();
      const posX = segmento.x * tamanhoBloco;
      const posY = segmento.y * tamanhoBloco;

      if (indice === 0) {
        // Cabeça da cobrinha
        g.beginFill(0x22c55e);
        g.lineStyle(1.5, 0x15803d);
        g.drawRoundedRect(posX + 1, posY + 1, tamanhoBloco - 2, tamanhoBloco - 2, Math.max(4, tamanhoBloco * 0.3));
        g.endFill();

        const parado = (direcao.x === 0 && direcao.y === 0);
        let olhoX1, olhoY1, olhoX2, olhoY2;

        if (parado) {
          olhoX1 = posX + tamanhoBloco * 0.32;
          olhoY1 = posY + tamanhoBloco * 0.35;
          olhoX2 = posX + tamanhoBloco * 0.68;
          olhoY2 = posY + tamanhoBloco * 0.35;
        } else if (direcao.x === 1) {
          olhoX1 = posX + tamanhoBloco * 0.7;
          olhoX2 = posX + tamanhoBloco * 0.7;
          olhoY1 = posY + tamanhoBloco * 0.25;
          olhoY2 = posY + tamanhoBloco * 0.75;
        } else if (direcao.x === -1) {
          olhoX1 = posX + tamanhoBloco * 0.3;
          olhoX2 = posX + tamanhoBloco * 0.3;
          olhoY1 = posY + tamanhoBloco * 0.25;
          olhoY2 = posY + tamanhoBloco * 0.75;
        } else if (direcao.y === 1) {
          olhoX1 = posX + tamanhoBloco * 0.25;
          olhoX2 = posX + tamanhoBloco * 0.75;
          olhoY1 = posY + tamanhoBloco * 0.7;
          olhoY2 = posY + tamanhoBloco * 0.7;
        } else if (direcao.y === -1) {
          olhoX1 = posX + tamanhoBloco * 0.25;
          olhoX2 = posX + tamanhoBloco * 0.75;
          olhoY1 = posY + tamanhoBloco * 0.3;
          olhoY2 = posY + tamanhoBloco * 0.3;
        } else {
          olhoX1 = posX + tamanhoBloco * 0.32;
          olhoY1 = posY + tamanhoBloco * 0.35;
          olhoX2 = posX + tamanhoBloco * 0.68;
          olhoY2 = posY + tamanhoBloco * 0.35;
        }

        const raioOlho = Math.max(2, tamanhoBloco * 0.14);
        const raioPupila = Math.max(1, tamanhoBloco * 0.07);

        g.beginFill(0xffffff);
        g.drawCircle(olhoX1, olhoY1, raioOlho);
        g.drawCircle(olhoX2, olhoY2, raioOlho);
        g.endFill();

        const offsetPupilaX = parado ? 0 : direcao.x * (raioPupila * 0.7);
        const offsetPupilaY = parado ? 0 : direcao.y * (raioPupila * 0.7);

        g.beginFill(0x0f172a);
        g.drawCircle(olhoX1 + offsetPupilaX, olhoY1 + offsetPupilaY, raioPupila);
        g.drawCircle(olhoX2 + offsetPupilaX, olhoY2 + offsetPupilaY, raioPupila);
        g.endFill();

      } else {
        // Corpo da cobrinha
        const ehPar = indice % 2 === 0;
        g.beginFill(ehPar ? 0x16a34a : 0x15803d);
        g.lineStyle(1, 0x14532d);
        g.drawRoundedRect(posX + 2, posY + 2, tamanhoBloco - 4, tamanhoBloco - 4, Math.max(3, tamanhoBloco * 0.22));
        g.endFill();
      }

      containerCobra.addChild(g);
    });
  }

  // Métricas e histórico de tentativas salvas no navegador
  const CHAVE_METRICAS = 'metricas_aprendizado_cobrinha_v2';

  function obterMetricasPadrao() {
    return {
      phaseStats: {},
      totalQuizCorrect: 0,
      totalQuizWrong: 0
    };
  }

  function carregarMetricas() {
    try {
      const dados = localStorage.getItem(CHAVE_METRICAS);
      if (dados) return JSON.parse(dados);
    } catch (e) {
      console.warn('Erro ao carregar dados locais:', e);
    }
    return obterMetricasPadrao();
  }

  let metricasAprendizado = carregarMetricas();

  function salvarMetricas() {
    try {
      localStorage.setItem(CHAVE_METRICAS, JSON.stringify(metricasAprendizado));
    } catch (e) {
      console.warn('Erro ao gravar métricas:', e);
    }
  }

  function obterChaveFase(modo, ordem, indiceFase) {
    return `${modo}_${ordem}_fase_${indiceFase}`;
  }

  function registrarInicioFase(indiceFase) {
    const chave = obterChaveFase(modoJogoAtivo, direcaoOrdemAtiva, indiceFase);
    if (!metricasAprendizado.phaseStats[chave]) {
      metricasAprendizado.phaseStats[chave] = {
        phaseIdx: indiceFase,
        mode: modoJogoAtivo,
        order: direcaoOrdemAtiva,
        attempts: 1,
        errors: 0,
        completed: false,
        firstTrySuccess: null,
        history: []
      };
    } else {
      metricasAprendizado.phaseStats[chave].attempts++;
    }
    salvarMetricas();
  }

  function registrarRespostaQuiz(indiceFase, pergunta, textoEscolhido, textoCorreto, estaCorreto) {
    const chave = obterChaveFase(modoJogoAtivo, direcaoOrdemAtiva, indiceFase);
    if (!metricasAprendizado.phaseStats[chave]) {
      metricasAprendizado.phaseStats[chave] = {
        phaseIdx: indiceFase,
        mode: modoJogoAtivo,
        order: direcaoOrdemAtiva,
        attempts: 1,
        errors: 0,
        completed: false,
        firstTrySuccess: null,
        history: []
      };
    }

    const estatistica = metricasAprendizado.phaseStats[chave];
    estatistica.history.push({
      question: pergunta,
      chosenText: textoEscolhido,
      correctText: textoCorreto,
      isCorrect: estaCorreto,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    });

    if (estaCorreto) {
      metricasAprendizado.totalQuizCorrect++;
      estatistica.completed = true;
      if (estatistica.firstTrySuccess === null) {
        estatistica.firstTrySuccess = (estatistica.errors === 0);
      }
    } else {
      metricasAprendizado.totalQuizWrong++;
      estatistica.errors++;
      if (estatistica.firstTrySuccess === null) {
        estatistica.firstTrySuccess = false;
      }
    }
    salvarMetricas();
  }

  function atualizarInterfaceMetricas() {
    const listaEstatisticas = Object.values(metricasAprendizado.phaseStats);
    const fasesConcluidas = listaEstatisticas.filter(s => s.completed);
    const fasesDePrimeira = listaEstatisticas.filter(s => s.firstTrySuccess === true);

    const totalFasesJogadas = listaEstatisticas.length;
    const totalDePrimeira = fasesDePrimeira.length;

    if (metricFirstTry) {
      metricFirstTry.textContent = `${totalDePrimeira} / ${totalFasesJogadas}`;
    }

    if (metricAvgAttempts) {
      if (totalFasesJogadas > 0) {
        const totalTentativas = listaEstatisticas.reduce((acc, s) => acc + (s.attempts || 1), 0);
        const media = (totalTentativas / totalFasesJogadas).toFixed(1);
        metricAvgAttempts.textContent = `${media}x`;
      } else {
        metricAvgAttempts.textContent = '0';
      }
    }

    if (metricTotalCorrect) {
      metricTotalCorrect.textContent = String(metricasAprendizado.totalQuizCorrect);
    }

    if (metricTotalWrong) {
      metricTotalWrong.textContent = String(metricasAprendizado.totalQuizWrong);
    }

    if (phaseMetricsList) {
      phaseMetricsList.innerHTML = '';
      if (listaEstatisticas.length === 0) {
        phaseMetricsList.innerHTML = '<div style="color: #64748b; font-size: 0.85rem; text-align: center; padding: 12px;">Nenhuma fase registrada ainda. Jogue para gerar as métricas de aprendizado!</div>';
        return;
      }

      listaEstatisticas.forEach(stat => {
        const item = document.createElement('div');
        item.className = 'phase-metric-item';

        const rotuloModo = (stat.mode === ModoJogo.NUMEROS) ? 'Números' : 'Alfabeto';
        const numFase = stat.phaseIdx + 1;

        let textoStatus = '';
        let classeStatus = '';

        if (stat.completed) {
          if (stat.firstTrySuccess) {
            textoStatus = `Primeira tentativa (${stat.attempts} tentativa)`;
            classeStatus = 'first-try';
          } else {
            textoStatus = `Concluido apos ${stat.errors} ${stat.errors === 1 ? 'erro' : 'erros'} (${stat.attempts} tentativas)`;
            classeStatus = 'retried';
          }
        } else {
          textoStatus = `Em andamento (${stat.errors} ${stat.errors === 1 ? 'erro' : 'erros'})`;
          classeStatus = 'retried';
        }

        item.innerHTML = `
          <span class="phase-metric-title">Fase ${numFase} (${rotuloModo})</span>
          <span class="phase-metric-status ${classeStatus}">${textoStatus}</span>
        `;
        phaseMetricsList.appendChild(item);
      });
    }
  }

  function abrirPainelMetricas() {
    jogoPausado = true;
    appPixi.ticker.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    atualizarInterfaceMetricas();
    metricsOverlay.classList.remove('hidden');
  }

  function fecharPainelMetricas() {
    metricsOverlay.classList.add('hidden');
    if (!emQuizOuVitoria && menuOverlay.classList.contains('hidden') && pauseOverlay.classList.contains('hidden')) {
      jogoPausado = false;
      appPixi.ticker.start();
    }
  }

  function zerarDadosMetricas() {
    if (confirm('Deseja zerar todas as métricas de aprendizado registradas?')) {
      metricasAprendizado = obterMetricasPadrao();
      salvarMetricas();
      atualizarInterfaceMetricas();
      exibirNotificacao('Métricas de aprendizado zeradas com sucesso!', true);
    }
  }

  // Início e reinício de fases
  function iniciarFase(indiceFase) {
    indiceFaseAtual = indiceFase;
    sequenciaFaseAtual = gerarSequenciaFase(indiceFase);
    indiceSequencia = 0;
    jogoPausado = false;
    emQuizOuVitoria = false;
    transicaoParaQuiz = false;

    registrarInicioFase(indiceFase);

    menuOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    // A barra superior só deve aparecer depois que o jogo começar (se não estiver em tela cheia)
    if (gameHeader && !document.body.classList.contains('fullscreen-active')) {
      gameHeader.classList.remove('hidden');
    }

    // As setas direcionais só devem aparecer quando o jogo de fato começar
    if (controlsSection) {
      controlsSection.classList.remove('hidden');
    }
    if (btnShowDpad) {
      btnShowDpad.classList.add('hidden');
    }

    iniciarCobra();
    gerarItensDaFase();
    renderizarCobra();
    appPixi.ticker.start();

    const nomeModo = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'Números' : 'Alfabeto';
    const nomeOrdem = (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE) ? 'Crescente' : 'Decrescente / Inversa';
    const rotuloRitmo = (modoMovimentoAtivo === ModoMovimento.MANUAL) ? ' (Passo a Passo)' : '';
    exibirNotificacao(`Fase ${indiceFase + 1} de ${obterTotalFases()}: Modo ${nomeModo} (${nomeOrdem})${rotuloRitmo}`, true);
    setTimeout(ajustarDimensoesTela, 50);
  }

  function reiniciarFaseAtual(mensagemMotivo) {
    tocarSomErro();
    exibirNotificacao(mensagemMotivo || 'Opa! Vamos tentar esta fase novamente!');

    jogoPausado = true;
    setTimeout(() => {
      iniciarFase(indiceFaseAtual);
    }, 1000);
  }

  function narrarTexto(texto, aoConcluir) {
    if (!('speechSynthesis' in window) || !somHabilitado) {
      if (aoConcluir) aoConcluir();
      return;
    }
    try {
      iniciarAudio();
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      const locucao = new SpeechSynthesisUtterance(texto);
      locucao.lang = 'pt-BR';
      locucao.rate = 0.94;
      locucao.pitch = 1.10;

      if (!vozEducadoraCache) {
        carregarVozesEducadoras();
      }
      if (vozEducadoraCache) {
        locucao.voice = vozEducadoraCache;
      }

      if (btnQuizAudio) btnQuizAudio.classList.add('speaking');

      let jaFinalizou = false;
      const finalizarFala = () => {
        if (jaFinalizou) return;
        jaFinalizou = true;
        if (btnQuizAudio) btnQuizAudio.classList.remove('speaking');
        if (aoConcluir) aoConcluir();
      };

      locucao.onend = finalizarFala;
      locucao.onerror = finalizarFala;

      setTimeout(finalizarFala, Math.max(2500, texto.length * 150));
      window.speechSynthesis.speak(locucao);
    } catch (e) {
      console.warn('Síntese de voz indisponível:', e);
      if (btnQuizAudio) btnQuizAudio.classList.remove('speaking');
      if (aoConcluir) aoConcluir();
    }
  }

  const GerenciadorAudio = {
    narrarTexto
  };

  function lerPerguntaAtual() {
    if (!quizAtivoAtual) return;
    const textoPergunta = quizAtivoAtual.question;
    const opcao0 = quizAtivoAtual.options[0]?.text ?? '';
    const opcao1 = quizAtivoAtual.options[1]?.text ?? '';
    const opcao2 = quizAtivoAtual.options[2]?.text ?? '';

    const roteiroFala = `${textoPergunta} É ${opcao0}, ${opcao1} ou ${opcao2}?`;
    narrarTexto(roteiroFala);
  }

  if (btnQuizAudio) {
    btnQuizAudio.addEventListener('click', () => {
      lerPerguntaAtual();
    });
  }

  // Gera o quiz baseado no conteúdo já trabalhado na fase
  function gerarQuizFaseAtual() {
    const ehNumeros = (modoJogoAtivo === ModoJogo.NUMEROS);

    const itensConhecidos = ehNumeros
      ? [...sequenciaFaseAtual].sort((a, b) => a - b)
      : [...sequenciaFaseAtual].sort((a, b) => a.localeCompare(b));

    const modelosPerguntas = [];

    if (ehNumeros) {
      // Menor número
      modelosPerguntas.push(() => {
        const correto = itensConhecidos[0];
        return {
          q: 'Qual é o menor número desta fase?',
          audioId: 'q_num_menor',
          correct: correto
        };
      });

      // Maior número
      modelosPerguntas.push(() => {
        const correto = itensConhecidos[itensConhecidos.length - 1];
        return {
          q: 'Qual é o maior número desta fase?',
          audioId: 'q_num_maior',
          correct: correto
        };
      });

      // Número seguinte
      if (itensConhecidos.length >= 2) {
        modelosPerguntas.push(() => {
          const randIdx = Math.floor(Math.random() * (itensConhecidos.length - 1));
          const ref = itensConhecidos[randIdx];
          const correto = itensConhecidos[randIdx + 1];
          return {
            q: `Qual número vem logo depois do ${ref}?`,
            audioId: `q_num_depois_${ref}`,
            correct: correto
          };
        });
      }

      // Número anterior
      if (itensConhecidos.length >= 2) {
        modelosPerguntas.push(() => {
          const randIdx = 1 + Math.floor(Math.random() * (itensConhecidos.length - 1));
          const ref = itensConhecidos[randIdx];
          const correto = itensConhecidos[randIdx - 1];
          return {
            q: `Qual número vem logo antes do ${ref}?`,
            audioId: `q_num_antes_${ref}`,
            correct: correto
          };
        });
      }

      // Número do meio
      if (itensConhecidos.length === 3) {
        modelosPerguntas.push(() => {
          const correto = itensConhecidos[1];
          return {
            q: 'Qual número fica no meio?',
            audioId: 'q_num_meio',
            correct: correto
          };
        });
      }

    } else {
      // Primeira letra
      modelosPerguntas.push(() => {
        const correto = itensConhecidos[0];
        return {
          q: 'Qual é a primeira letra do alfabeto?',
          audioId: 'q_letra_primeira',
          correct: correto
        };
      });

      // Última letra da fase
      modelosPerguntas.push(() => {
        const correto = itensConhecidos[itensConhecidos.length - 1];
        return {
          q: 'Qual letra vem por último no alfabeto nesta fase?',
          audioId: 'q_letra_ultima',
          correct: correto
        };
      });

      // Letra seguinte
      if (itensConhecidos.length >= 2) {
        modelosPerguntas.push(() => {
          const randIdx = Math.floor(Math.random() * (itensConhecidos.length - 1));
          const ref = itensConhecidos[randIdx];
          const correto = itensConhecidos[randIdx + 1];
          return {
            q: `Qual letra vem logo depois da letra ${ref}?`,
            audioId: `q_letra_depois_${ref}`,
            correct: correto
          };
        });
      }

      // Letra anterior
      if (itensConhecidos.length >= 2) {
        modelosPerguntas.push(() => {
          const randIdx = 1 + Math.floor(Math.random() * (itensConhecidos.length - 1));
          const ref = itensConhecidos[randIdx];
          const correto = itensConhecidos[randIdx - 1];
          return {
            q: `Qual letra vem logo antes da letra ${ref}?`,
            audioId: `q_letra_antes_${ref}`,
            correct: correto
          };
        });
      }

      // Letra do meio
      if (itensConhecidos.length === 3) {
        modelosPerguntas.push(() => {
          const correto = itensConhecidos[1];
          return {
            q: 'Qual letra fica no meio?',
            audioId: 'q_letra_meio',
            correct: correto
          };
        });
      }
    }

    const templateEscolhido = modelosPerguntas[Math.floor(Math.random() * modelosPerguntas.length)]();
    const respostaCorreta = templateEscolhido.correct;

    const outrosItens = itensConhecidos.filter(item => item !== respostaCorreta);
    outrosItens.sort(() => Math.random() - 0.5);

    const distrator1 = outrosItens[0];
    const distrator2 = outrosItens[1] ?? outrosItens[0];

    const grupoOpcoes = [respostaCorreta, distrator1, distrator2];
    grupoOpcoes.sort(() => Math.random() - 0.5);

    return {
      question: templateEscolhido.q,
      audioId: templateEscolhido.audioId,
      correctAnswer: respostaCorreta,
      options: [
        { idx: 0, text: grupoOpcoes[0], isCorrect: grupoOpcoes[0] === respostaCorreta },
        { idx: 1, text: grupoOpcoes[1], isCorrect: grupoOpcoes[1] === respostaCorreta },
        { idx: 2, text: grupoOpcoes[2], isCorrect: grupoOpcoes[2] === respostaCorreta }
      ]
    };
  }

  let quizAtivoAtual = null;
  let quizParaRepetir = null;
  let momentoExibicaoQuiz = 0;

  function dispararQuizFase() {
    transicaoParaQuiz = false;
    emQuizOuVitoria = true;
    jogoPausado = true;
    appPixi.ticker.stop();
    tocarSomVitoria();

    if (quizParaRepetir) {
      quizAtivoAtual = quizParaRepetir;
      quizParaRepetir = null;
    } else {
      quizAtivoAtual = gerarQuizFaseAtual();
    }

    momentoExibicaoQuiz = Date.now();
 
    quizBadgeIcon.textContent = '';
    quizBadgeText.textContent = `Desafio da Fase ${indiceFaseAtual + 1}!`;
    quizQuestionText.textContent = quizAtivoAtual.question;

    quizAtivoAtual.options.forEach((dadosOpcao, idx) => {
      const elementoTexto = document.getElementById(`quiz-opt-text-${idx}`);
      if (elementoTexto) elementoTexto.textContent = String(dadosOpcao.text);
    });

    quizFeedback.textContent = '';
    quizFeedback.className = 'quiz-feedback';
    quizButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    });

    quizOverlay.classList.remove('hidden');

    setTimeout(() => {
      lerPerguntaAtual();
    }, 450);
  }

  function dispararVitoriaFinal() {
    emQuizOuVitoria = true;
    jogoPausado = true;
    appPixi.ticker.stop();
    tocarSomVitoria();

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    quizOverlay.classList.add('hidden');
    victoryOverlay.classList.remove('hidden');

    const nomeModo = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'Números (1 a 10)' : 'Alfabeto (A a Z)';
    const nomeOrdem = (direcaoOrdemAtiva === DirecaoOrdem.CRESCENTE) ? 'Crescente / Alfabética' : 'Decrescente / Inversa';

    victoryTitle.textContent = 'Sensacional! Você Venceu Tudo!';
    const listaEstatisticas = Object.values(metricasAprendizado.phaseStats);
    const qtdPrimeiraTentativa = listaEstatisticas.filter(s => s.firstTrySuccess === true).length;
    victoryDesc.textContent = `Parabéns! Você completou todas as ${obterTotalFases()} fases do Modo ${nomeModo} em ordem ${nomeOrdem} e aprendeu todas as 7 cores do arco-íris! Você acertou ${qtdPrimeiraTentativa} fases de primeira!`;

    narrarTexto('Parabéns! Você venceu todas as fases!');
  }

  // Cliques nos botões de resposta do quiz
  quizButtons.forEach(button => {
    button.addEventListener('click', () => {
      iniciarAudio();
      if (!quizAtivoAtual) return;

      const idxEscolhido = parseInt(button.getAttribute('data-opt-idx'), 10);
      const configOpcao = quizAtivoAtual.options[idxEscolhido];
      if (!configOpcao) return;

      quizButtons.forEach(b => {
        b.disabled = true;
        b.style.cursor = 'default';
      });

      if (configOpcao.isCorrect) {
        // Resposta Certa
        GerenciadorTelemetria.registrarEvento('RESPOSTA_QUIZ', {
          fase: indiceFaseAtual + 1,
          pergunta: quizAtivoAtual.question,
          esta_correto: true,
          resposta_escolhida: configOpcao.text,
          tempo_resposta_ms: Date.now() - momentoExibicaoQuiz,
          e_tentativa: (quizAtivoAtual.retry_attempts || 0) > 0,
          tentativas_repeticao: quizAtivoAtual.retry_attempts || 0
        });

        quizParaRepetir = null;
        tocarSomAcerto();
        registrarRespostaQuiz(indiceFaseAtual, quizAtivoAtual.question, configOpcao.text, quizAtivoAtual.correctAnswer, true);
        GerenciadorTelemetria.incrementarFases();

        const numProximaFase = indiceFaseAtual + 2;
        const ehFinal = (indiceFaseAtual + 1 >= obterTotalFases());

        quizFeedback.textContent = ehFinal
          ? 'Muito bem, resposta certa!'
          : `Muito bem, resposta certa! Avançando para a Fase ${numProximaFase}...`;
        quizFeedback.className = 'quiz-feedback correct';

        narrarTexto('muito bem, resposta certa');

        setTimeout(() => {
          quizOverlay.classList.add('hidden');
          if (ehFinal) {
            dispararVitoriaFinal();
          } else {
            iniciarFase(indiceFaseAtual + 1);
          }
        }, 3000);

      } else {
        // Resposta Errada
        quizAtivoAtual.retry_attempts = (quizAtivoAtual.retry_attempts || 0) + 1;

        GerenciadorTelemetria.registrarEvento('RESPOSTA_QUIZ', {
          fase: indiceFaseAtual + 1,
          pergunta: quizAtivoAtual.question,
          esta_correto: false,
          resposta_escolhida: configOpcao.text,
          tempo_resposta_ms: Date.now() - momentoExibicaoQuiz,
          e_tentativa: quizAtivoAtual.retry_attempts > 1,
          tentativas_repeticao: quizAtivoAtual.retry_attempts
        });
        GerenciadorTelemetria.incrementarErros();

        quizParaRepetir = quizAtivoAtual;
        tocarSomErro();
        registrarRespostaQuiz(indiceFaseAtual, quizAtivoAtual.question, configOpcao.text, quizAtivoAtual.correctAnswer, false);

        quizFeedback.textContent = `Resposta errada! Vamos jogar a Fase ${indiceFaseAtual + 1} novamente para praticar.`;
        quizFeedback.className = 'quiz-feedback wrong';

        narrarTexto('resposta errada');

        setTimeout(() => {
          quizOverlay.classList.add('hidden');
          iniciarFase(indiceFaseAtual);
          exibirNotificacao(`Fase ${indiceFaseAtual + 1} reiniciada! Colete os itens na ordem certa para praticar e tentar o quiz de novo.`, true);
        }, 3000);
      }
    });
  });

  // Pausa e retorno
  function alternarPausa() {
    if (emQuizOuVitoria || transicaoParaQuiz || !menuOverlay.classList.contains('hidden') || !metricsOverlay.classList.contains('hidden')) return;

    jogoPausado = !jogoPausado;

    if (jogoPausado) {
      appPixi.ticker.stop();
      pauseOverlay.classList.remove('hidden');
      if (btnPause) {
        btnPause.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
        btnPause.setAttribute('title', 'Continuar jogo (ESC)');
      }
    } else {
      pauseOverlay.classList.add('hidden');
      if (btnPause) {
        btnPause.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
        btnPause.setAttribute('title', 'Pausar jogo (ESC)');
      }
      appPixi.ticker.start();
    }
  }

  if (btnPause) btnPause.addEventListener('click', alternarPausa);
  if (btnResumeGame) btnResumeGame.addEventListener('click', alternarPausa);
  if (btnRestartPhase) btnRestartPhase.addEventListener('click', () => {
    pauseOverlay.classList.add('hidden');
    iniciarFase(indiceFaseAtual);
  });
  if (btnPauseMetrics) btnPauseMetrics.addEventListener('click', () => {
    pauseOverlay.classList.add('hidden');
    abrirPainelMetricas();
  });

  // Abertura e fechamento das telas
  if (btnMetrics) btnMetrics.addEventListener('click', abrirPainelMetricas);
  if (btnCloseMetrics) btnCloseMetrics.addEventListener('click', fecharPainelMetricas);
  if (btnReturnFromMetrics) btnReturnFromMetrics.addEventListener('click', fecharPainelMetricas);
  if (btnResetMetrics) btnResetMetrics.addEventListener('click', zerarDadosMetricas);

  function abrirMenuPrincipal() {
    jogoPausado = true;
    emQuizOuVitoria = false;
    quizParaRepetir = null;
    appPixi.ticker.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    pauseOverlay.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    menuStepMode.classList.remove('hidden');
    menuStepOrder.classList.add('hidden');
    if (menuStepMovement) menuStepMovement.classList.add('hidden');
    menuOverlay.classList.remove('hidden');

    // A barra superior não deve aparecer por cima do menu inicial
    if (gameHeader) {
      gameHeader.classList.add('hidden');
    }

    // As setas direcionais nunca devem aparecer por cima do menu inicial
    if (controlsSection) {
      controlsSection.classList.add('hidden');
    }
    if (btnShowDpad) {
      btnShowDpad.classList.add('hidden');
    }
    setTimeout(ajustarDimensoesTela, 50);
  }

  if (btnMenu) btnMenu.addEventListener('click', abrirMenuPrincipal);
  if (btnPauseMenu) btnPauseMenu.addEventListener('click', abrirMenuPrincipal);
  if (btnVictoryMenu) btnVictoryMenu.addEventListener('click', abrirMenuPrincipal);

  // Navegação no menu inicial
  if (btnChooseNumbers) {
    btnChooseNumbers.addEventListener('click', () => {
      iniciarAudio();
      modoJogoAtivo = ModoJogo.NUMEROS;
      selectedModeBadge.textContent = 'Modo Números (1 a 10)';
      orderStepTitle.textContent = 'Como você quer a ordem dos números?';
      orderCrescentTitle.textContent = 'Ordem Crescente';
      orderCrescentDesc.textContent = 'Do menor para o maior (1, 2, 3...)';
      orderDecrescentTitle.textContent = 'Ordem Decrescente';
      orderDecrescentDesc.textContent = 'Do maior para o menor (...3, 2, 1)';

      menuStepMode.classList.add('hidden');
      menuStepOrder.classList.remove('hidden');
    });
  }

  if (btnChooseLetters) {
    btnChooseLetters.addEventListener('click', () => {
      iniciarAudio();
      modoJogoAtivo = ModoJogo.ALFABETO;
      selectedModeBadge.textContent = 'Modo Alfabeto (A a Z)';
      orderStepTitle.textContent = 'Como você quer a ordem das letras?';
      orderCrescentTitle.textContent = 'Ordem Alfabética';
      orderCrescentDesc.textContent = 'Começa na letra A (A, B, C...)';
      orderDecrescentTitle.textContent = 'Ordem Inversa';
      orderDecrescentDesc.textContent = 'De trás para frente (...C, B, A)';

      menuStepMode.classList.add('hidden');
      menuStepOrder.classList.remove('hidden');
    });
  }

  if (btnBackToMode) {
    btnBackToMode.addEventListener('click', () => {
      iniciarAudio();
      menuStepOrder.classList.add('hidden');
      menuStepMode.classList.remove('hidden');
    });
  }

  if (btnOrderCrescent) {
    btnOrderCrescent.addEventListener('click', () => {
      iniciarAudio();
      direcaoOrdemAtiva = DirecaoOrdem.CRESCENTE;
      menuStepOrder.classList.add('hidden');
      if (menuStepMovement) menuStepMovement.classList.remove('hidden');
      if (movementModeBadge) {
        const rotuloModo = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'Números' : 'Alfabeto';
        movementModeBadge.textContent = `${rotuloModo} • Ordem Crescente`;
      }
    });
  }

  if (btnOrderDecrescent) {
    btnOrderDecrescent.addEventListener('click', () => {
      iniciarAudio();
      direcaoOrdemAtiva = DirecaoOrdem.DECRESCENTE;
      menuStepOrder.classList.add('hidden');
      if (menuStepMovement) menuStepMovement.classList.remove('hidden');
      if (movementModeBadge) {
        const rotuloModo = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'Números' : 'Alfabeto';
        const rotuloOrdem = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'Ordem Decrescente' : 'Ordem Inversa';
        movementModeBadge.textContent = `${rotuloModo} • ${rotuloOrdem}`;
      }
    });
  }

  if (btnBackToOrder) {
    btnBackToOrder.addEventListener('click', () => {
      iniciarAudio();
      if (menuStepMovement) menuStepMovement.classList.add('hidden');
      menuStepOrder.classList.remove('hidden');
    });
  }

  if (btnMovementManual) {
    btnMovementManual.addEventListener('click', () => {
      iniciarAudio();
      modoMovimentoAtivo = ModoMovimento.MANUAL;
      GerenciadorTelemetria.iniciarSessao(modoJogoAtivo, direcaoOrdemAtiva, TAMANHO_GRADE, INTERVALO_MOVIMENTO_MS, modoMovimentoAtivo);
      iniciarFase(0);
    });
  }

  if (btnMovementAuto) {
    btnMovementAuto.addEventListener('click', () => {
      iniciarAudio();
      modoMovimentoAtivo = ModoMovimento.AUTOMATICO;
      GerenciadorTelemetria.iniciarSessao(modoJogoAtivo, direcaoOrdemAtiva, TAMANHO_GRADE, INTERVALO_MOVIMENTO_MS, modoMovimentoAtivo);
      iniciarFase(0);
    });
  }

  if (btnRestartGame) {
    btnRestartGame.addEventListener('click', () => {
      GerenciadorTelemetria.iniciarSessao(modoJogoAtivo, direcaoOrdemAtiva, TAMANHO_GRADE, INTERVALO_MOVIMENTO_MS, modoMovimentoAtivo);
      iniciarFase(0);
    });
  }

  // Modal de opções e configurações
  const btnOpenOptions = document.getElementById('btn-open-options');
  const btnSaveOptions = document.getElementById('btn-save-options');
  const optionsOverlay = document.getElementById('options-overlay');
  const gridSizeRadios = document.getElementsByName('gridSize');
  const speedSlider = document.getElementById('speed-slider');
  const dpadSizeSlider = document.getElementById('dpad-size-slider');
  const voiceGenderRadios = document.getElementsByName('voiceGender');

  // Tamanho do D-pad (1: pequeno, 2: médio, 3: grande [padrão])
  let nivelTamanhoDpad = 3;

  function aplicarTamanhoDpad(nivel) {
    nivelTamanhoDpad = nivel;
    if (!controlsSection) return;
    controlsSection.classList.remove('dpad-small', 'dpad-medium', 'dpad-large');
    if (nivel === 1) {
      controlsSection.classList.add('dpad-small');
    } else if (nivel === 2) {
      controlsSection.classList.add('dpad-medium');
    } else {
      controlsSection.classList.add('dpad-large');
    }
    try {
      localStorage.setItem('tamanho_dpad_cobrinha', String(nivel));
    } catch (e) {}
    setTimeout(ajustarDimensoesTela, 60);
  }

  // Carrega tamanho salvo ou mantém Grande (3) como padrão
  try {
    const tamanhoSalvo = localStorage.getItem('tamanho_dpad_cobrinha');
    if (tamanhoSalvo) {
      nivelTamanhoDpad = parseInt(tamanhoSalvo, 10) || 3;
    }
  } catch (e) {}
  if (dpadSizeSlider) {
    dpadSizeSlider.value = String(nivelTamanhoDpad);
  }
  aplicarTamanhoDpad(nivelTamanhoDpad);

  function aplicarVelocidade(nivel) {
    nivelVelocidade = nivel;
    if (nivel === 1) {
      INTERVALO_MOVIMENTO_MS = 500; // Muito Lenta (Mais tempo de reação para crianças pequenas)
    } else if (nivel === 2) {
      INTERVALO_MOVIMENTO_MS = 330; // Lenta (Padrão original mantido)
    } else if (nivel === 3) {
      INTERVALO_MOVIMENTO_MS = 165; // Média
    } else if (nivel === 4) {
      INTERVALO_MOVIMENTO_MS = 110; // Rápida
    } else {
      nivelVelocidade = 2;
      INTERVALO_MOVIMENTO_MS = 330;
    }
    try {
      localStorage.setItem('velocidade_cobrinha', String(nivelVelocidade));
    } catch (e) {}
  }

  // Carrega velocidade salva ou mantém Lenta (2 - 330ms) como padrão
  try {
    const velocidadeSalva = localStorage.getItem('velocidade_cobrinha');
    if (velocidadeSalva) {
      const v = parseInt(velocidadeSalva, 10);
      if (v >= 1 && v <= 4) {
        aplicarVelocidade(v);
      }
    }
  } catch (e) {}

  if (speedSlider) {
    speedSlider.value = String(nivelVelocidade);
  }

  if (btnOpenOptions) {
    btnOpenOptions.addEventListener('click', () => {
      if (dpadSizeSlider) dpadSizeSlider.value = String(nivelTamanhoDpad);
      if (speedSlider) speedSlider.value = String(nivelVelocidade);
      optionsOverlay.classList.remove('hidden');
      menuStepMode.classList.add('hidden');
    });
  }

  if (btnSaveOptions) {
    btnSaveOptions.addEventListener('click', () => {
      let gradeSelecionada = 10;
      for (const radio of gridSizeRadios) {
        if (radio.checked) gradeSelecionada = parseInt(radio.value, 10);
      }
      TAMANHO_GRADE = gradeSelecionada;
      maximoItensVisiveis = (TAMANHO_GRADE === 20) ? 5 : 3;

      const valorVelocidade = parseInt(speedSlider.value, 10) || 2;
      aplicarVelocidade(valorVelocidade);

      if (dpadSizeSlider) {
        const novoTamanhoDpad = parseInt(dpadSizeSlider.value, 10) || 3;
        aplicarTamanhoDpad(novoTamanhoDpad);
      }

      for (const radio of voiceGenderRadios) {
        if (radio.checked) generoVoz = radio.value;
      }
      carregarVozesEducadoras();

      ajustarDimensoesTela();
      optionsOverlay.classList.add('hidden');
      menuStepMode.classList.remove('hidden');
    });
  }

  // Loop de renderização do PixiJS
  appPixi.ticker.add(() => {
    if (jogoPausado || emQuizOuVitoria || transicaoParaQuiz) return;

    const valorAlvoAtual = obterValorAlvoAtual();
    const itemAtivo = itensTabuleiro.find(it => it.value === valorAlvoAtual);
    if (itemAtivo && itemAtivo.ring) {
      const escala = 1 + Math.sin(Date.now() / 160) * 0.05;
      itemAtivo.ring.scale.set(escala);
    }

    if (aguardandoPrimeiroComando) return;

    if (modoMovimentoAtivo === ModoMovimento.MANUAL) return;

    acumuladorMovimento += appPixi.ticker.elapsedMS;
    if (acumuladorMovimento >= INTERVALO_MOVIMENTO_MS) {
      acumuladorMovimento = 0;
      atualizarPassoCobra();
    }
  });

  // Movimento da cobra e detecção de colisões
  function atualizarPassoCobra() {
    direcao = { ...proximaDirecao };
    if (direcao.x === 0 && direcao.y === 0) return;

    const cabeca = cobra[0];
    const novaCabeca = { x: cabeca.x + direcao.x, y: cabeca.y + direcao.y };

    // Colisão com as bordas
    if (novaCabeca.x < 0 || novaCabeca.x >= TAMANHO_GRADE || novaCabeca.y < 0 || novaCabeca.y >= TAMANHO_GRADE) {
      GerenciadorTelemetria.registrarEvento('ERRO_FATAL', { fase: indiceFaseAtual + 1, motivo: 'COLISAO_PAREDE' });
      reiniciarFaseAtual('Bateu na parede! Reiniciando esta fase...');
      return;
    }

    // Colisão com o próprio corpo
    const colidiuConsigo = cobra.some(seg => seg.x === novaCabeca.x && seg.y === novaCabeca.y);
    if (colidiuConsigo) {
      GerenciadorTelemetria.registrarEvento('ERRO_FATAL', { fase: indiceFaseAtual + 1, motivo: 'COLISAO_CORPO' });
      reiniciarFaseAtual('Bateu no próprio corpo! Reiniciando esta fase...');
      return;
    }

    cobra.unshift(novaCabeca);

    // Verificação de coleta de itens
    const indiceItemComido = itensTabuleiro.findIndex(item => item.gridX === novaCabeca.x && item.gridY === novaCabeca.y);

    if (indiceItemComido !== -1) {
      const itemComido = itensTabuleiro[indiceItemComido];
      const alvoEsperado = obterValorAlvoAtual();

      if (itemComido.value === alvoEsperado) {
        // Coleta correta
        GerenciadorTelemetria.registrarEvento('SEQUENCIA_CORRETA', {
          fase: indiceFaseAtual + 1,
          alvo_esperado: alvoEsperado,
          item_comido: itemComido.value
        });
        tocarSomAcerto();

        const item = itemComido;
        containerItens.removeChild(itemComido.container);
        itensTabuleiro.splice(indiceItemComido, 1);

        indiceSequencia++;

        if (proximoIndiceSpawn < sequenciaFaseAtual.length) {
          criarItemNoTabuleiro(sequenciaFaseAtual[proximoIndiceSpawn], proximoIndiceSpawn);
          proximoIndiceSpawn++;
        }

        atualizarPainelHUD();

        const ehUltimoItem = (indiceSequencia >= sequenciaFaseAtual.length);

        if (ehUltimoItem) {
          // Última bolinha da fase:
          // 1. Congela o movimento para a cobrinha não colidir
          transicaoParaQuiz = true;
          // 2. Narra a última bolinha sincronizada com o som de acerto
          setTimeout(() => {
            GerenciadorAudio.narrarTexto(item.value.toString());
          }, 60);
          // 3. Aguarda a fala da bolinha e em seguida aguarda 1 segundo completo para exibir o quiz
          setTimeout(() => {
            dispararQuizFase();
          }, 1600);
          return;
        } else {
          // Bolinha intermediária: narra sincronizada com o som de acerto
          setTimeout(() => {
            GerenciadorAudio.narrarTexto(item.value.toString());
          }, 60);
        }

      } else {
        // Coleta fora de ordem
        let topologiaErro = 'ALEATORIA';
        const strEsperado = String(alvoEsperado);
        const strAtual = String(itemComido.value);
        if (modoJogoAtivo === ModoJogo.NUMEROS) {
          if (parseInt(strAtual) === parseInt(strEsperado) + 1 || parseInt(strAtual) === parseInt(strEsperado) - 1) {
            topologiaErro = 'ADJACENTE';
          }
        } else {
          if (Math.abs(strAtual.charCodeAt(0) - strEsperado.charCodeAt(0)) === 1) {
            topologiaErro = 'ADJACENTE';
          }
        }

        GerenciadorTelemetria.registrarEvento('ERRO_DE_SEQUENCIA', {
          fase: indiceFaseAtual + 1,
          alvo_esperado: alvoEsperado,
          item_comido: itemComido.value,
          topologia_erro: topologiaErro
        });
        GerenciadorTelemetria.incrementarErros();

        const substantivo = (modoJogoAtivo === ModoJogo.NUMEROS) ? 'número' : 'letra';
        reiniciarFaseAtual(`Ops! Você comeu o ${substantivo} ${itemComido.value}, mas a ordem correta era o ${alvoEsperado}!`);
        return;
      }

    } else {
      if (crescimentoPendente > 0) {
        crescimentoPendente--;
      } else {
        cobra.pop();
      }
    }

    renderizarCobra();
  }

  // Direcionamento e eventos de entrada
  function definirDirecao(x, y) {
    iniciarAudio();
    if (jogoPausado || emQuizOuVitoria || transicaoParaQuiz || !menuOverlay.classList.contains('hidden')) return;

    if (aguardandoPrimeiroComando) {
      aguardandoPrimeiroComando = false;
      if (startPrompt) startPrompt.classList.add('hidden');
      direcao = { x, y };
      proximaDirecao = { x, y };
      if (modoMovimentoAtivo === ModoMovimento.MANUAL) {
        atualizarPassoCobra();
      } else {
        renderizarCobra();
      }
      return;
    }

    if (cobra.length > 1) {
      if (x !== 0 && x === -direcao.x) return;
      if (y !== 0 && y === -direcao.y) return;
    }

    proximaDirecao = { x, y };

    if (modoMovimentoAtivo === ModoMovimento.MANUAL) {
      atualizarPassoCobra();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!metricsOverlay.classList.contains('hidden')) {
        fecharPainelMetricas();
        return;
      }
      alternarPausa();
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        definirDirecao(0, -1);
        destacarBotaoDpad(btnUp);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        definirDirecao(0, 1);
        destacarBotaoDpad(btnDown);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        definirDirecao(-1, 0);
        destacarBotaoDpad(btnLeft);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        definirDirecao(1, 0);
        destacarBotaoDpad(btnRight);
        break;
    }
  });

  function destacarBotaoDpad(botao) {
    if (!botao) return;
    botao.classList.add('pressed');
    setTimeout(() => botao.classList.remove('pressed'), 120);
  }

  function configurarBotaoDpad(elemento, x, y) {
    if (!elemento) return;
    elemento.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      definirDirecao(x, y);
    });
  }

  configurarBotaoDpad(btnUp, 0, -1);
  configurarBotaoDpad(btnDown, 0, 1);
  configurarBotaoDpad(btnLeft, -1, 0);
  configurarBotaoDpad(btnRight, 1, 0);

  // Controle de deslize para dispositivos touch
  let toqueInicialX = 0;
  let toqueInicialY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      toqueInicialX = e.touches[0].clientX;
      toqueInicialY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!jogoPausado && !emQuizOuVitoria && menuOverlay.classList.contains('hidden')) {
      const alvo = e.target;
      if (!alvo.closest('#quiz-overlay') && !alvo.closest('#victory-overlay') && !alvo.closest('#pause-overlay') && !alvo.closest('#menu-overlay')) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    if (jogoPausado || emQuizOuVitoria || !menuOverlay.classList.contains('hidden')) return;

    const toqueFinalX = e.changedTouches[0].clientX;
    const toqueFinalY = e.changedTouches[0].clientY;
    const deltaX = toqueFinalX - toqueInicialX;
    const deltaY = toqueFinalY - toqueInicialY;
    const distancia = Math.hypot(deltaX, deltaY);

    if (distancia > 22) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          definirDirecao(1, 0);
          destacarBotaoDpad(btnRight);
        } else {
          definirDirecao(-1, 0);
          destacarBotaoDpad(btnLeft);
        }
      } else {
        if (deltaY > 0) {
          definirDirecao(0, 1);
          destacarBotaoDpad(btnDown);
        } else {
          definirDirecao(0, -1);
          destacarBotaoDpad(btnUp);
        }
      }
    }
  }, { passive: true });

  // Gerenciamento de Tela Cheia (com ocultação do cabeçalho superior e botão de sair)
  function entrarTelaCheia() {
    document.body.classList.add('fullscreen-active');
    if (btnFullscreen) {
      btnFullscreen.classList.add('hidden');
    }
    if (btnExitFullscreen) {
      btnExitFullscreen.classList.remove('hidden');
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Fullscreen API não permitida ou rejeitada no iframe, usando modo CSS fullscreen:', err);
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen().catch?.(() => {});
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen().catch?.(() => {});
    }

    setTimeout(ajustarDimensoesTela, 100);
    setTimeout(ajustarDimensoesTela, 300);
  }

  function sairTelaCheia() {
    document.body.classList.remove('fullscreen-active');
    if (btnFullscreen) {
      btnFullscreen.classList.remove('hidden');
    }
    if (btnExitFullscreen) {
      btnExitFullscreen.classList.add('hidden');
    }
    // Reexibe a barra superior somente se o jogo estiver em andamento (menu inicial fechado)
    if (gameHeader && menuOverlay && menuOverlay.classList.contains('hidden')) {
      gameHeader.classList.remove('hidden');
    }

    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch?.(() => {});
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen().catch?.(() => {});
      }
    }

    setTimeout(ajustarDimensoesTela, 100);
    setTimeout(ajustarDimensoesTela, 300);
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      entrarTelaCheia();
    });
  }

  if (btnExitFullscreen) {
    btnExitFullscreen.addEventListener('click', () => {
      sairTelaCheia();
    });
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove('fullscreen-active');
      if (btnFullscreen) {
        btnFullscreen.classList.remove('hidden');
      }
      if (btnExitFullscreen) {
        btnExitFullscreen.classList.add('hidden');
      }
      if (gameHeader && menuOverlay && menuOverlay.classList.contains('hidden')) {
        gameHeader.classList.remove('hidden');
      }
      setTimeout(ajustarDimensoesTela, 100);
    } else {
      document.body.classList.add('fullscreen-active');
      if (gameHeader) {
        gameHeader.classList.add('hidden');
      }
      if (btnFullscreen) {
        btnFullscreen.classList.add('hidden');
      }
      if (btnExitFullscreen) {
        btnExitFullscreen.classList.remove('hidden');
      }
      setTimeout(ajustarDimensoesTela, 100);
    }
  });

  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement) {
      document.body.classList.remove('fullscreen-active');
      if (btnFullscreen) {
        btnFullscreen.classList.remove('hidden');
      }
      if (btnExitFullscreen) {
        btnExitFullscreen.classList.add('hidden');
      }
      if (gameHeader && menuOverlay && menuOverlay.classList.contains('hidden')) {
        gameHeader.classList.remove('hidden');
      }
      setTimeout(ajustarDimensoesTela, 100);
    } else {
      document.body.classList.add('fullscreen-active');
      if (gameHeader) {
        gameHeader.classList.add('hidden');
      }
      if (btnFullscreen) {
        btnFullscreen.classList.add('hidden');
      }
      if (btnExitFullscreen) {
        btnExitFullscreen.classList.remove('hidden');
      }
      setTimeout(ajustarDimensoesTela, 100);
    }
  });

  // Tecla ESC para sair de tela cheia se estiver ativa
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('fullscreen-active')) {
      sairTelaCheia();
    }
  });

  // Botões de exibição do D-pad e áudio
  if (btnCloseDpad) {
    btnCloseDpad.addEventListener('click', () => {
      controlsSection.classList.add('hidden');
      btnShowDpad.classList.remove('hidden');
      setTimeout(ajustarDimensoesTela, 50);
    });
  }

  if (btnShowDpad) {
    btnShowDpad.addEventListener('click', () => {
      controlsSection.classList.remove('hidden');
      btnShowDpad.classList.add('hidden');
      setTimeout(ajustarDimensoesTela, 50);
    });
  }

  if (btnSound) {
    btnSound.addEventListener('click', () => {
      iniciarAudio();
      somHabilitado = !somHabilitado;
      btnSound.innerHTML = somHabilitado
        ? '<img src="/assets/icons/som-ativo.svg" alt="Som Ativo" width="18" height="18" />'
        : '<img src="/assets/icons/som-mudo.svg" alt="Som Mudo" width="18" height="18" />';
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      iniciarFase(indiceFaseAtual);
    });
  }

  // Inicialização do tabuleiro e menu
  ajustarDimensoesTela();
  abrirMenuPrincipal();
});
