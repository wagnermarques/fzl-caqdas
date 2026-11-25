/**
 * Persistência dos trechos no GitHub (tarefa 4.0.6).
 *
 * Cada pesquisador usa o PRÓPRIO repositório privado (ex.: `usuario/caqdas-dados`):
 * a separação por usuário vem do dono do repositório, e dentro dele cada projeto tem sua pasta:
 *
 *   projetos/<id-do-projeto>/
 *     projeto.json     ← nome, descrição e quem gravou
 *     documentos.json  ← materiais do corpus e onde estão na nuvem
 *     trechos.json     ← trechos (schema caqdas-trechos/v1), com marcas de exclusão
 *     grafo.json       ← posições de nós e inter-relações temáticas (schema caqdas-grafo/v1)
 *
 * O acesso é por token pessoal fine-grained (Contents: read/write só nesse repositório),
 * digitado pelo próprio usuário e guardado no escopo dele no navegador (FzlUserDataController):
 * outro usuário do mesmo navegador não o vê, e o logout apaga.
 *
 * "Sincronizar" = baixa trechos.json e grafo.json → mescla (o mais recente vence; exclusões propagam) →
 * envia os quatro arquivos. Arquivos sem mudança não geram commit.
 */
import { userData } from './user-data-service.js'
import { researchStorage, EXCERPT_SCHEMA, GRAPH_SCHEMA } from './storage-service.js'
import {
  PROJECT_SCHEMA,
  DOCUMENTS_SCHEMA,
  stableSnapshotJson,
  buildProjectSnapshotFiles,
  applyRemoteProjectSnapshot
} from './corpus-sync-utils.js'

const CONFIG_KEY = 'github_sync_v1'
const API = 'https://api.github.com'
const DEFAULT_CONFIG = Object.freeze({ repo: '', branch: '', token: '', lastSyncAt: '', lastCommitUrl: '' })

export { PROJECT_SCHEMA, DOCUMENTS_SCHEMA }

export function getGithubConfig() {
  try {
    const raw = userData.getItem(CONFIG_KEY)
    return { ...DEFAULT_CONFIG, ...(raw ? JSON.parse(raw) : {}) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveGithubConfig(patch) {
  const next = { ...getGithubConfig(), ...patch }
  next.repo = normalizeRepo(next.repo)
  next.branch = String(next.branch || '').trim()
  next.token = String(next.token || '').trim()
  userData.setItem(CONFIG_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('caqdas-github-changed', { detail: { ...next, token: next.token ? '***' : '' } }))
  return next
}

export function isGithubConfigured(cfg = getGithubConfig()) {
  return Boolean(cfg.token && /^[\w.-]+\/[\w.-]+$/.test(cfg.repo))
}

/** Aceita "dono/repo", URL https://github.com/dono/repo(.git) ou git@github.com:dono/repo.git. */
export function normalizeRepo(value) {
  let v = String(value || '').trim()
  v = v.replace(/^git@github\.com:/i, '').replace(/^https?:\/\/(www\.)?github\.com\//i, '')
  v = v.replace(/\.git$/i, '').replace(/\/+$/, '')
  const [owner, repo] = v.split('/')
  return owner && repo ? `${owner}/${repo}` : v
}

/** Nome de pasta seguro a partir do id do projeto. */
export function projectFolder(project) {
  const slug = String(project?.id || 'projeto')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `projetos/${slug || 'projeto'}`
}

// --- HTTP ------------------------------------------------------------------------------
class GithubError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function gh(cfg, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 404) return null
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.message || ''
    } catch {
      // sem corpo
    }
    throw new GithubError(explain(res.status, detail), res.status)
  }
  return res.status === 204 ? {} : res.json()
}

function explain(status, detail) {
  if (status === 401) return 'Token inválido ou expirado. Gere um novo token no GitHub.'
  if (status === 403) return `Sem permissão no repositório (o token precisa de "Contents: Read and write"). ${detail}`.trim()
  if (status === 409) return 'O arquivo mudou no GitHub durante o envio. Tente sincronizar de novo.'
  if (status === 422) return `O GitHub recusou o envio: ${detail}`
  return `Erro do GitHub (${status})${detail ? `: ${detail}` : ''}`
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/')

function toBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function fromBase64(b64) {
  const binary = atob(String(b64 || '').replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

const refQuery = (cfg) => (cfg.branch ? `?ref=${encodeURIComponent(cfg.branch)}` : '')

async function readJson(cfg, path) {
  const file = await gh(cfg, `/repos/${cfg.repo}/contents/${encodePath(path)}${refQuery(cfg)}`)
  if (!file || Array.isArray(file)) return { sha: null, json: null }
  try {
    return { sha: file.sha, json: JSON.parse(fromBase64(file.content)) }
  } catch {
    throw new GithubError(`O arquivo ${path} no GitHub não é um JSON válido.`)
  }
}

async function writeJson(cfg, path, json, previous, message) {
  if (previous.json && stableSnapshotJson(previous.json) === stableSnapshotJson(json)) return null
  const result = await gh(cfg, `/repos/${cfg.repo}/contents/${encodePath(path)}`, {
    method: 'PUT',
    body: {
      message,
      content: toBase64(`${JSON.stringify(json, null, 2)}\n`),
      ...(previous.sha ? { sha: previous.sha } : {}),
      ...(cfg.branch ? { branch: cfg.branch } : {})
    }
  })
  return result?.commit?.html_url || ''
}

// --- operações ---------------------------------------------------------------------------

/** Confere token e repositório. Avisa se o repositório for público (dados de pesquisa). */
export async function testGithubConnection(cfg = getGithubConfig()) {
  if (!isGithubConfigured(cfg)) throw new GithubError('Informe o repositório (dono/nome) e o token.')
  const repo = await gh(cfg, `/repos/${cfg.repo}`)
  if (!repo) throw new GithubError(`Repositório ${cfg.repo} não encontrado (ou o token não tem acesso a ele).`)
  const canWrite = repo.permissions ? Boolean(repo.permissions.push || repo.permissions.admin) : true
  return {
    fullName: repo.full_name,
    private: Boolean(repo.private),
    defaultBranch: repo.default_branch,
    canWrite,
    url: repo.html_url
  }
}

function buildFiles(author) {
  const project = researchStorage.getProject() || {}
  const snapshot = buildProjectSnapshotFiles({
    project,
    documents: researchStorage.getDocuments(),
    excerpts: researchStorage.exportExcerpts(),
    grafo: researchStorage.exportExcerptGraph(),
    author
  })
  return {
    folder: projectFolder(project),
    ...snapshot
  }
}

/**
 * Baixa e mescla projeto, documentos, códigos, trechos e o grafo do GitHub (sem enviar nada).
 */
export async function pullFromGithub() {
  const cfg = getGithubConfig()
  if (!isGithubConfigured(cfg)) throw new GithubError('Configure o GitHub em Persistência antes de sincronizar.')
  const scopeBefore = userData.scope
  const folder = projectFolder(researchStorage.getProject())
  const paths = {
    projeto: `${folder}/projeto.json`,
    documentos: `${folder}/documentos.json`,
    trechos: `${folder}/trechos.json`,
    grafo: `${folder}/grafo.json`
  }
  const [remoteProjeto, remoteDocs, remoteTrechos, remoteGrafo] = await Promise.all([
    readJson(cfg, paths.projeto),
    readJson(cfg, paths.documentos),
    readJson(cfg, paths.trechos),
    readJson(cfg, paths.grafo)
  ])
  if (userData.scope !== scopeBefore) {
    return {
      found: false,
      aborted: true,
      docsAdded: 0,
      codesAdded: 0,
      added: 0,
      updated: 0,
      removed: 0,
      skipped: 0,
      graphAdded: 0,
      graphUpdated: 0,
      graphRemoved: 0
    }
  }
  if (!remoteProjeto.json && !remoteDocs.json && !remoteTrechos.json && !remoteGrafo.json) {
    return {
      found: false,
      docsAdded: 0,
      codesAdded: 0,
      added: 0,
      updated: 0,
      removed: 0,
      skipped: 0,
      graphAdded: 0,
      graphUpdated: 0,
      graphRemoved: 0
    }
  }
  try {
    return applyRemoteProjectSnapshot({
      remoteProjeto: remoteProjeto.json,
      remoteDocs: remoteDocs.json,
      remoteTrechos: remoteTrechos.json,
      remoteGrafo: remoteGrafo.json,
      storage: researchStorage,
      excerptSchema: EXCERPT_SCHEMA,
      graphSchema: GRAPH_SCHEMA,
      labelPrefix: `${folder}/`
    })
  } catch (err) {
    throw new GithubError(err.message)
  }
}

/**
 * Sincroniza: baixa e mescla projeto/documentos/trechos/grafo, depois envia os arquivos modificados.
 * @param {{ name?: string }} [author] quem está gravando (só o nome; o e-mail não vai para o repositório)
 */
export async function syncWithGithub(author) {
  const cfg = getGithubConfig()
  if (!isGithubConfigured(cfg)) throw new GithubError('Configure o GitHub em Persistência antes de sincronizar.')
  const scopeBefore = userData.scope
  const folder = projectFolder(researchStorage.getProject())
  const paths = {
    projeto: `${folder}/projeto.json`,
    documentos: `${folder}/documentos.json`,
    trechos: `${folder}/trechos.json`,
    grafo: `${folder}/grafo.json`
  }

  const [remoteProjeto, remoteDocs, remoteTrechos, remoteGrafo] = await Promise.all([
    readJson(cfg, paths.projeto),
    readJson(cfg, paths.documentos),
    readJson(cfg, paths.trechos),
    readJson(cfg, paths.grafo)
  ])
  if (userData.scope !== scopeBefore) {
    throw new GithubError('A conta ativa mudou durante a sincronização.')
  }

  let applied
  try {
    applied = applyRemoteProjectSnapshot({
      remoteProjeto: remoteProjeto.json,
      remoteDocs: remoteDocs.json,
      remoteTrechos: remoteTrechos.json,
      remoteGrafo: remoteGrafo.json,
      storage: researchStorage,
      excerptSchema: EXCERPT_SCHEMA,
      graphSchema: GRAPH_SCHEMA,
      labelPrefix: `${folder}/`
    })
  } catch (err) {
    throw new GithubError(err.message)
  }

  const files = buildFiles(author)
  const name = files.projeto.project.name || files.projeto.project.id
  const commits = []
  // Em sequência: commits paralelos no mesmo branch disputam a referência (409).
  for (const [key, previous] of [
    ['projeto', remoteProjeto],
    ['documentos', remoteDocs],
    ['trechos', remoteTrechos],
    ['grafo', remoteGrafo]
  ]) {
    const url = await writeJson(cfg, paths[key], files[key], previous, `caqdas: atualiza ${key}.json de "${name}"`)
    if (url !== null) commits.push(url)
  }

  const lastCommitUrl = commits.filter(Boolean).at(-1) || getGithubConfig().lastCommitUrl
  saveGithubConfig({ lastSyncAt: new Date().toISOString(), lastCommitUrl })
  return {
    ...applied,
    pushed: commits.length,
    folder,
    excerptCount: files.trechos.excerpts.length,
    relationCount: files.grafo.relations.length,
    lastCommitUrl
  }
}
