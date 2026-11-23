import { LitElement, html, css, nothing } from 'lit'
import { authService } from 'fzl-fund-appshell--lit'
import { userData } from '../services/user-data-service.js'
import { researchStorage } from '../services/storage-service.js'
import {
  getGithubConfig,
  saveGithubConfig,
  isGithubConfigured,
  testGithubConnection,
  syncWithGithub,
  pullFromGithub,
  projectFolder
} from '../services/github-sync-service.js'
import '@material/web/icon/icon.js'

const TOKEN_HELP_URL =
  'https://github.com/settings/personal-access-tokens/new?name=caqdas&description=Trechos%20do%20caqdas&contents=write'
const NEW_REPO_URL = 'https://github.com/new?name=caqdas-dados&visibility=private'

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/**
 * Painel de sincronização dos trechos com o GitHub.
 * - completo (padrão): configuração de repositório/token + testar + sincronizar;
 * - `compact`: só o botão de sincronizar e o estado (usado na Área de Codificação).
 */
export class CaqdasGithubSyncPanel extends LitElement {
  static properties = {
    compact: { type: Boolean, reflect: true },
    _cfg: { state: true },
    _repoDraft: { state: true },
    _branchDraft: { state: true },
    _tokenDraft: { state: true },
    _busy: { state: true },
    _status: { state: true },
    _repoInfo: { state: true }
  }

  static styles = css`
    :host {
      display: block;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      font-size: 0.88rem;
      color: var(--md-sys-color-on-surface, #1f2937);
    }
    h2 {
      margin: 0 0 6px;
      font-size: 1.1rem;
      color: #24292f;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    p {
      margin: 0 0 10px;
      color: #4b5563;
      line-height: 1.45;
    }
    code {
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 0.82rem;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
      margin: 10px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
    }
    input {
      font: inherit;
      font-weight: 400;
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      min-width: 0;
    }
    .hint {
      font-weight: 400;
      color: #64748b;
      font-size: 0.75rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font: inherit;
      font-size: 0.82rem;
      cursor: pointer;
      color: inherit;
    }
    button.primary {
      background: #24292f;
      border-color: #24292f;
      color: #fff;
    }
    button[disabled] {
      opacity: 0.55;
      cursor: default;
    }
    button md-icon {
      font-size: 16px;
    }
    :host([compact]) button {
      height: 26px;
      padding: 0 8px;
    }
    .status {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      line-height: 1.4;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .status.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .status.ok {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .status.warn {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }
    .muted {
      color: #64748b;
      font-size: 0.78rem;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    a {
      color: #0969da;
    }
    ol {
      margin: 6px 0 0;
      padding-left: 18px;
      color: #334155;
      line-height: 1.5;
    }
  `

  constructor() {
    super()
    this.compact = false
    this._busy = ''
    this._status = null
    this._repoInfo = null
    this._loadConfig()
  }

  connectedCallback() {
    super.connectedCallback()
    this._onChanged = () => {
      this._cfg = getGithubConfig()
    }
    window.addEventListener('caqdas-github-changed', this._onChanged)
    // Configuração é por usuário: troca de conta recarrega (e esconde o token anterior).
    this._unsubUserData = userData.subscribe(() => {
      this._loadConfig()
      this._status = null
      this._repoInfo = null
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-github-changed', this._onChanged)
    this._unsubUserData?.()
  }

  _loadConfig() {
    this._cfg = getGithubConfig()
    this._repoDraft = this._cfg.repo
    this._branchDraft = this._cfg.branch
    this._tokenDraft = ''
  }

  _save() {
    const patch = { repo: this._repoDraft, branch: this._branchDraft }
    if (this._tokenDraft.trim()) patch.token = this._tokenDraft
    this._cfg = saveGithubConfig(patch)
    this._repoDraft = this._cfg.repo
    this._tokenDraft = ''
    return this._cfg
  }

  _forgetToken() {
    if (!confirm('Remover o token do GitHub deste navegador?')) return
    this._cfg = saveGithubConfig({ token: '' })
    this._status = { kind: 'info', text: 'Token removido deste navegador.' }
    this._repoInfo = null
  }

  async _run(kind, fn) {
    if (this._busy) return
    this._busy = kind
    this._status = null
    try {
      await fn()
    } catch (err) {
      this._status = { kind: 'error', text: err?.message || String(err) }
    } finally {
      this._busy = ''
    }
  }

  _test() {
    return this._run('test', async () => {
      const cfg = this._save()
      const info = await testGithubConnection(cfg)
      this._repoInfo = info
      if (!info.canWrite) {
        this._status = { kind: 'error', text: `O token lê ${info.fullName}, mas não tem permissão de escrita.` }
      } else if (!info.private) {
        this._status = {
          kind: 'warn',
          text: `Conectado a ${info.fullName}, mas o repositório é PÚBLICO. Trechos de entrevistas são dados de pesquisa: prefira um repositório privado.`
        }
      } else {
        this._status = { kind: 'ok', text: `Conectado a ${info.fullName} (privado). Pronto para sincronizar.` }
      }
    })
  }

  _sync() {
    return this._run('sync', async () => {
      if (!this.compact) this._save()
      const cfg = getGithubConfig()
      if (!cfg.lastSyncAt && !this.compact) {
        const info = this._repoInfo || (await testGithubConnection(cfg))
        if (!info.private && !confirm(`${info.fullName} é público: qualquer pessoa poderá ler os trechos. Enviar mesmo assim?`)) {
          return
        }
      }
      const user = authService.getCurrentUser?.()
      const r = await syncWithGithub(user ? { name: user.name || '' } : null)
      const merged = [
        r.added && `${r.added} trecho(s) novo(s) vindos do GitHub`,
        r.updated && `${r.updated} atualizado(s)`,
        r.removed && `${r.removed} removido(s) (excluídos em outro aparelho)`,
        r.graphAdded && `${r.graphAdded} relação(ões) nova(s) do grafo`,
        r.graphUpdated && `${r.graphUpdated} relação(ões) atualizada(s)`
      ].filter(Boolean)
      const relInfo = r.relationCount ? ` e ${r.relationCount} relação(ões)` : ''
      this._status = {
        kind: 'ok',
        text:
          `${r.excerptCount} trecho(s)${relInfo} em ${r.folder}/. ` +
          (r.pushed ? `${r.pushed} arquivo(s) atualizado(s) no GitHub.` : 'Nada mudou desde a última sincronização.') +
          (merged.length ? ` Mesclado: ${merged.join(', ')}.` : ''),
        link: r.pushed ? r.lastCommitUrl : ''
      }
    })
  }

  _pull() {
    return this._run('pull', async () => {
      if (!this.compact) this._save()
      const r = await pullFromGithub()
      this._status = r.found
        ? {
            kind: 'ok',
            text: `Trazido do GitHub: ${r.added} novo(s), ${r.updated} atualizado(s), ${r.removed} removido(s)` +
              (r.skipped ? `, ${r.skipped} ignorado(s).` : '.')
          }
        : { kind: 'info', text: 'Ainda não há trechos deste projeto no GitHub.' }
    })
  }

  _renderStatus() {
    if (!this._status) return nothing
    return html`<div class="status ${this._status.kind}" role="status">
      ${this._status.text}
      ${this._status.link ? html` <a href=${this._status.link} target="_blank" rel="noopener noreferrer">Ver commit ↗</a>` : nothing}
    </div>`
  }

  _renderCompact() {
    const configured = isGithubConfigured(this._cfg)
    if (!configured) {
      return html`<div class="row muted">
        <md-icon style="font-size: 16px;">cloud_off</md-icon>
        GitHub não configurado — <a href="#/config/persistencia">configurar</a>
      </div>`
    }
    return html`
      <div class="row">
        <button type="button" class="primary" ?disabled=${Boolean(this._busy)} @click=${this._sync}
          title="Baixa os trechos do GitHub, mescla e envia ${this._cfg.repo}">
          <md-icon>${this._busy === 'sync' ? 'sync' : 'cloud_sync'}</md-icon>
          ${this._busy === 'sync' ? 'Sincronizando…' : 'Sincronizar GitHub'}
        </button>
        <span class="muted">
          ${this._cfg.repo}${this._cfg.lastSyncAt ? html` · ${formatDate(this._cfg.lastSyncAt)}` : nothing}
        </span>
      </div>
      ${this._renderStatus()}
    `
  }

  render() {
    if (this.compact) return this._renderCompact()
    const hasToken = Boolean(this._cfg.token)
    const folder = projectFolder(researchStorage.getProject())
    const canAct = Boolean(this._repoDraft.trim() && (hasToken || this._tokenDraft.trim()))
    return html`
      <h2><md-icon>commit</md-icon> GitHub — trechos e projeto em JSON</h2>
      <p>
        Use um <strong>repositório privado seu</strong> (ex.: <code>seu-usuario/caqdas-dados</code>). Os arquivos deste
        projeto ficam em <code>${folder}/</code> (<code>projeto.json</code>, <code>documentos.json</code>,
        <code>trechos.json</code>, <code>grafo.json</code>). Cada sincronização vira um commit, com histórico.
      </p>

      <div class="grid">
        <label>
          Repositório
          <input
            type="text"
            placeholder="dono/caqdas-dados"
            autocomplete="off"
            spellcheck="false"
            .value=${this._repoDraft}
            @input=${(e) => (this._repoDraft = e.target.value)}
          />
          <span class="hint">dono/nome ou a URL do repositório</span>
        </label>
        <label>
          Branch (opcional)
          <input
            type="text"
            placeholder="padrão do repositório"
            autocomplete="off"
            spellcheck="false"
            .value=${this._branchDraft}
            @input=${(e) => (this._branchDraft = e.target.value)}
          />
          <span class="hint">vazio = branch padrão</span>
        </label>
        <label>
          Token pessoal (fine-grained)
          <input
            type="password"
            autocomplete="off"
            placeholder=${hasToken ? '•••••••• (salvo — digite para trocar)' : 'github_pat_…'}
            .value=${this._tokenDraft}
            @input=${(e) => (this._tokenDraft = e.target.value)}
          />
          <span class="hint">guardado só neste navegador, na sua conta; apagado ao sair</span>
        </label>
      </div>

      <div class="row">
        <button type="button" ?disabled=${!canAct || Boolean(this._busy)} @click=${this._test}>
          <md-icon>${this._busy === 'test' ? 'sync' : 'verified'}</md-icon>
          ${this._busy === 'test' ? 'Testando…' : 'Salvar e testar'}
        </button>
        <button type="button" class="primary" ?disabled=${!canAct || Boolean(this._busy)} @click=${this._sync}>
          <md-icon>${this._busy === 'sync' ? 'sync' : 'cloud_sync'}</md-icon>
          ${this._busy === 'sync' ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
        <button type="button" ?disabled=${!canAct || Boolean(this._busy)} @click=${this._pull}
          title="Só baixa e mescla; não envia nada">
          <md-icon>cloud_download</md-icon> Trazer do GitHub
        </button>
        ${hasToken
          ? html`<button type="button" ?disabled=${Boolean(this._busy)} @click=${this._forgetToken}>
              <md-icon>key_off</md-icon> Esquecer token
            </button>`
          : nothing}
      </div>
      ${this._cfg.lastSyncAt
        ? html`<div class="muted" style="margin-top: 6px;">
            Última sincronização: ${formatDate(this._cfg.lastSyncAt)}
            ${this._cfg.lastCommitUrl
              ? html`· <a href=${this._cfg.lastCommitUrl} target="_blank" rel="noopener noreferrer">último commit ↗</a>`
              : nothing}
          </div>`
        : nothing}
      ${this._renderStatus()}

      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; font-weight: 600;">Como criar o repositório e o token</summary>
        <ol>
          <li><a href=${NEW_REPO_URL} target="_blank" rel="noopener noreferrer">Crie um repositório privado</a> (ex.: <code>caqdas-dados</code>), marcando “Add a README” para ele já ter um branch.</li>
          <li>
            <a href=${TOKEN_HELP_URL} target="_blank" rel="noopener noreferrer">Gere um token fine-grained</a>:
            em <em>Repository access</em> escolha <strong>Only select repositories</strong> → esse repositório; em
            <em>Permissions → Contents</em> escolha <strong>Read and write</strong>. Defina uma validade.
          </li>
          <li>Cole o repositório e o token acima e clique em <strong>Salvar e testar</strong>.</li>
        </ol>
        <p class="muted" style="margin-top: 8px;">
          O token fica no armazenamento deste navegador; qualquer script da página pode lê-lo. Por isso ele deve dar
          acesso <strong>só</strong> a esse repositório. Seu e-mail não é gravado nos arquivos — só o seu nome.
        </p>
      </details>
    `
  }
}

customElements.define('caqdas-github-sync-panel', CaqdasGithubSyncPanel)
