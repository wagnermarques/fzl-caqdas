import { LitElement, html, css } from 'lit'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/**
 * Gravador de áudio para coleta de dados qualitativos (entrevistas e reuniões).
 *
 * Modos:
 *  - "microphone": grava apenas o microfone (entrevista presencial).
 *  - "meeting": mistura o áudio de uma aba/tela compartilhada (reunião online)
 *    com o microfone local, para capturar todos os participantes.
 *
 * Também permite selecionar um arquivo de áudio já existente no dispositivo (mode = "import").
 *
 * Emite `fzl-capture-audio` com detail.audio = { blob, mimeType, durationSeconds, timestamp, mode, fileName? }.
 */
export class CaqdasAudioRecorder extends LitElement {
  static properties = {
    mode: { type: String },
    _state: { state: true },
    _elapsed: { state: true },
    _error: { state: true },
    _level: { state: true }
  }

  static styles = css`
    :host {
      display: block;
    }
    .recorder {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      border: 1px solid #d0dcdc;
      border-radius: 12px;
      background: #fafdfd;
    }
    .modes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #b6cfcf;
      background: #fff;
      cursor: pointer;
      font: inherit;
      font-size: 0.9rem;
    }
    .mode-btn.active {
      background: #006a6a;
      border-color: #006a6a;
      color: #fff;
    }
    .mode-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .hint {
      font-size: 0.85rem;
      color: #4b5b5b;
      line-height: 1.4;
    }
    .import-input {
      display: none;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .timer {
      font-variant-numeric: tabular-nums;
      font-size: 1.6rem;
      font-weight: 600;
      min-width: 90px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #b0b0b0;
    }
    .dot.recording {
      background: #d32f2f;
      animation: pulse 1s infinite;
    }
    .dot.paused {
      background: #f59e0b;
    }
    @keyframes pulse {
      50% {
        opacity: 0.3;
      }
    }
    .meter {
      flex: 1;
      min-width: 120px;
      height: 8px;
      border-radius: 4px;
      background: #e3eded;
      overflow: hidden;
    }
    .meter > div {
      height: 100%;
      background: #00897b;
      transition: width 80ms linear;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .error {
      color: #b3261e;
      font-size: 0.85rem;
    }
  `

  constructor() {
    super()
    this.mode = 'microphone'
    this._state = 'idle'
    this._elapsed = 0
    this._error = ''
    this._level = 0
    this._chunks = []
    this._streams = []
    this._recorder = null
    this._audioCtx = null
    this._analyser = null
    this._raf = 0
    this._timer = 0
    this._accumulatedMs = 0
    this._segmentStart = 0
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this._state !== 'idle') this._stop({ discard: false })
  }

  get _supported() {
    return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  }

  get _meetingSupported() {
    return this._supported && !!navigator.mediaDevices?.getDisplayMedia
  }

  async _acquireStream() {
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    })
    this._streams.push(mic)

    this._audioCtx = new AudioContext()
    const destination = this._audioCtx.createMediaStreamDestination()
    this._analyser = this._audioCtx.createAnalyser()
    this._analyser.fftSize = 512

    const micSource = this._audioCtx.createMediaStreamSource(mic)
    micSource.connect(destination)
    micSource.connect(this._analyser)

    if (this.mode === 'meeting') {
      // O navegador exige vídeo para getDisplayMedia; usamos só a trilha de áudio.
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      this._streams.push(display)
      const displayAudio = display.getAudioTracks()
      if (displayAudio.length === 0) {
        throw new Error(
          'Nenhum áudio foi compartilhado. Ao escolher a aba/tela da reunião, marque "Compartilhar áudio".'
        )
      }
      const remoteSource = this._audioCtx.createMediaStreamSource(new MediaStream(displayAudio))
      remoteSource.connect(destination)
      remoteSource.connect(this._analyser)
      // Se o usuário encerrar o compartilhamento pelo navegador, finaliza a gravação.
      display.getVideoTracks().forEach((t) => t.addEventListener('ended', () => this._stop({ discard: false })))
    }

    return destination.stream
  }

  async _start() {
    this._error = ''
    if (!this._supported) {
      this._error = 'Este navegador não suporta gravação de áudio (MediaRecorder).'
      return
    }
    try {
      const stream = await this._acquireStream()
      const mimeType = pickMimeType()
      this._recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined)
      this._chunks = []
      this._recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this._chunks.push(e.data)
      }
      this._recorder.onstop = () => this._finalize()
      // Fatias de 5s limitam perda de dados se a aba travar.
      this._recorder.start(5000)
      this._accumulatedMs = 0
      this._segmentStart = performance.now()
      this._elapsed = 0
      this._state = 'recording'
      this._startTicking()
    } catch (err) {
      this._cleanup()
      this._state = 'idle'
      this._error =
        err?.name === 'NotAllowedError'
          ? 'Permissão negada para microfone ou compartilhamento de tela.'
          : err?.message || String(err)
    }
  }

  _pause() {
    if (this._recorder?.state !== 'recording') return
    this._recorder.pause()
    this._accumulatedMs += performance.now() - this._segmentStart
    this._state = 'paused'
  }

  _resume() {
    if (this._recorder?.state !== 'paused') return
    this._recorder.resume()
    this._segmentStart = performance.now()
    this._state = 'recording'
  }

  _stop({ discard }) {
    if (!this._recorder || this._recorder.state === 'inactive') return
    if (this._state === 'recording') this._accumulatedMs += performance.now() - this._segmentStart
    this._discard = discard
    this._recorder.stop()
  }

  _finalize() {
    const mimeType = this._recorder?.mimeType || 'audio/webm'
    const blob = new Blob(this._chunks, { type: mimeType })
    const durationSeconds = Math.round(this._accumulatedMs / 1000)
    const discard = this._discard
    this._chunks = []
    this._discard = false
    this._cleanup()
    this._state = 'idle'
    this._elapsed = 0

    if (discard || blob.size === 0) return
    this._emitAudio({ blob, mimeType, durationSeconds, timestamp: Date.now(), mode: this.mode })
  }

  _emitAudio(audio) {
    this.dispatchEvent(
      new CustomEvent('fzl-capture-audio', { bubbles: true, composed: true, detail: { audio } })
    )
  }

  async _handleImport(e) {
    const input = e.target
    const files = Array.from(input.files || [])
    input.value = ''
    for (const file of files) {
      const durationSeconds = await new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const el = new Audio()
        el.preload = 'metadata'
        el.onloadedmetadata = () => {
          URL.revokeObjectURL(url)
          resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : 0)
        }
        el.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(0)
        }
        el.src = url
      })
      this._emitAudio({
        blob: file,
        mimeType: file.type || 'audio/webm',
        durationSeconds,
        timestamp: file.lastModified || Date.now(),
        mode: 'import',
        fileName: file.name
      })
    }
  }

  _startTicking() {
    const data = new Uint8Array(this._analyser?.fftSize || 512)
    const tick = () => {
      if (this._state === 'idle') return
      const running = this._state === 'recording' ? performance.now() - this._segmentStart : 0
      this._elapsed = (this._accumulatedMs + running) / 1000
      if (this._analyser && this._state === 'recording') {
        this._analyser.getByteTimeDomainData(data)
        let peak = 0
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128))
        this._level = Math.min(1, peak / 64)
      } else {
        this._level = 0
      }
      this._raf = requestAnimationFrame(tick)
    }
    this._raf = requestAnimationFrame(tick)
  }

  _cleanup() {
    cancelAnimationFrame(this._raf)
    this._streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
    this._streams = []
    if (this._audioCtx) void this._audioCtx.close().catch(() => {})
    this._audioCtx = null
    this._analyser = null
    this._recorder = null
    this._level = 0
  }

  _renderModeButton(mode, icon, text, disabled = false) {
    return html`
      <button
        class="mode-btn ${this.mode === mode ? 'active' : ''}"
        ?disabled=${disabled || this._state !== 'idle'}
        @click=${() => {
          this.mode = mode
        }}
      >
        <md-icon>${icon}</md-icon>${text}
      </button>
    `
  }

  render() {
    if (!this._supported) {
      return html`<div class="recorder"><div class="error">Gravação de áudio não suportada neste navegador.</div></div>`
    }

    const idle = this._state === 'idle'
    return html`
      <div class="recorder">
        <div class="modes">
          ${this._renderModeButton('microphone', 'mic', 'Entrevista (microfone)')}
          ${this._renderModeButton('meeting', 'groups', 'Reunião online (aba + microfone)', !this._meetingSupported)}
        </div>

        <div class="hint">
          ${this.mode === 'meeting'
            ? html`Ao iniciar, escolha a <strong>aba ou tela da reunião</strong> (Meet, Zoom, Teams…) e marque
                <strong>"Compartilhar áudio"</strong>. O áudio dos participantes é mixado com o seu microfone.`
            : html`Grava o microfone deste dispositivo. Ideal para entrevistas presenciais e notas de campo faladas.`}
          Obtenha o consentimento dos participantes antes de gravar.
        </div>

        <div class="status-row">
          <span class="dot ${this._state}"></span>
          <span class="timer">${formatDuration(this._elapsed)}</span>
          <div class="meter"><div style="width: ${Math.round(this._level * 100)}%"></div></div>
        </div>

        <div class="actions">
          ${idle
            ? html`<md-filled-button @click=${this._start}>
                  <md-icon slot="icon">fiber_manual_record</md-icon>Iniciar gravação
              </md-filled-button>
              <md-outlined-button @click=${() => this.renderRoot.querySelector('.import-input')?.click()}>
                <md-icon slot="icon">audio_file</md-icon>Selecionar arquivo de áudio
              </md-outlined-button>
              <input class="import-input" type="file" accept="audio/*" multiple @change=${this._handleImport} />`
            : html`
                ${this._state === 'recording'
                  ? html`<md-outlined-button @click=${this._pause}>
                      <md-icon slot="icon">pause</md-icon>Pausar
                    </md-outlined-button>`
                  : html`<md-outlined-button @click=${this._resume}>
                      <md-icon slot="icon">play_arrow</md-icon>Retomar
                    </md-outlined-button>`}
                <md-filled-button @click=${() => this._stop({ discard: false })}>
                  <md-icon slot="icon">stop</md-icon>Parar e salvar
                </md-filled-button>
                <md-outlined-button @click=${() => this._stop({ discard: true })}>
                  <md-icon slot="icon">delete</md-icon>Descartar
                </md-outlined-button>
              `}
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
      </div>
    `
  }
}

if (!customElements.get('caqdas-audio-recorder')) {
  customElements.define('caqdas-audio-recorder', CaqdasAudioRecorder)
}
