export function inferExtension(title = '', explicitExt = '') {
  const cleanExplicit = String(explicitExt || '').trim().toLowerCase()
  if (cleanExplicit) {
    return cleanExplicit.startsWith('.') ? cleanExplicit : `.${cleanExplicit}`
  }
  const cleanTitle = String(title || '').trim()
  const dot = cleanTitle.lastIndexOf('.')
  if (dot > 0) {
    const ext = cleanTitle.slice(dot).toLowerCase()
    if (/^\.[a-z0-9]{1,8}$/i.test(ext)) return ext
  }
  return ''
}

export function inferDocType(explicitType = '', ext = '', mimeType = '') {
  const given = String(explicitType || '').trim().toLowerCase()
  if (given && given !== 'unknown') return given

  const cleanExt = String(ext || '').trim().toLowerCase()
  const mime = String(mimeType || '').trim().toLowerCase()

  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  if (cleanExt === '.pdf' || mime === 'application/pdf') return 'pdf'
  if (cleanExt === '.docx' || mime.includes('wordprocessingml')) return 'docx'
  if (['.mp3', '.ogg', '.wav', '.m4a', '.aac'].includes(cleanExt)) return 'audio'
  if (['.mp4', '.mov', '.mkv', '.webm'].includes(cleanExt)) return 'video'
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(cleanExt)) return 'image'
  if (cleanExt === '.csv' || cleanExt === '.json') return cleanExt.slice(1)
  return 'interview'
}

/**
 * Restaura metadados de documentos vindos de `documentos.json` / `trechos.json` sem
 * sobrescrever conteúdo extraído (`content`, `docxBlocks`) ou marcações locais.
 */
export function mergeRemoteDocuments(localDocs, remoteDocsList, { formatFolder } = {}) {
  const docs = Array.isArray(localDocs) ? [...localDocs] : []
  const addedDocs = []
  let added = 0
  let updated = 0

  for (const raw of Array.isArray(remoteDocsList) ? remoteDocsList : []) {
    if (!raw || (!raw.id && !raw.title)) continue

    const remoteId = String(raw.remote?.fileId || raw.googleDriveFileId || '').trim()
    const remoteUrl = String(raw.remote?.url || raw.externalViewerUrl || '').trim()
    const rawProvider = raw.remote?.provider || raw.storageProvider || ''
    const remoteProvider = rawProvider === 'onedrive' ? 'onedrive' : rawProvider ? 'google-drive' : ''

    let idx = raw.id ? docs.findIndex((d) => d.id === raw.id) : -1
    if (idx < 0 && remoteId) {
      idx = docs.findIndex((d) => d.googleDriveFileId === remoteId)
    }
    if (idx < 0 && raw.title) {
      idx = docs.findIndex(
        (d) =>
          d.title === raw.title &&
          (!remoteId || !d.googleDriveFileId || d.googleDriveFileId === remoteId)
      )
    }

    if (idx >= 0) {
      const existing = docs[idx]
      const patch = {}
      if (remoteId && !existing.googleDriveFileId) {
        patch.status = 'synced'
        patch.storageProvider = remoteProvider || 'google-drive'
        patch.googleDriveFileId = remoteId
        if (remoteUrl) patch.externalViewerUrl = remoteUrl
        patch.externalViewerLabel =
          patch.storageProvider === 'onedrive' ? 'Abrir no OneDrive ↗' : 'Abrir no Google Drive ↗'
      } else if (remoteUrl && !existing.externalViewerUrl) {
        patch.externalViewerUrl = remoteUrl
      }
      const ext = inferExtension(raw.title, raw.extension)
      if (ext && !existing.extension) patch.extension = ext
      if (raw.mimeType && !existing.mimeType) patch.mimeType = String(raw.mimeType)
      if (raw.legislation && !existing.legislation) patch.legislation = raw.legislation

      if (Object.keys(patch).length > 0) {
        docs[idx] = { ...existing, ...patch }
        updated++
      }
      continue
    }

    const title = String(raw.title || raw.id || 'Documento')
    const ext = inferExtension(title, raw.extension)
    const mimeType = String(raw.mimeType || '').trim()
    const type = inferDocType(raw.type, ext, mimeType)
    const defaultSub =
      type === 'audio'
        ? 'capturas-audio'
        : type === 'image' || type === 'video'
          ? 'capturas-camera'
          : type === 'legislation'
            ? 'legislacao'
            : 'entrevistas'
    const folder = typeof formatFolder === 'function' ? formatFolder(raw.folder || defaultSub) : String(raw.folder || defaultSub)

    const stub = {
      id: String(raw.id || `doc-gh-${Date.now()}-${addedDocs.length}`),
      title,
      participant: String(raw.participant || 'Importado da nuvem'),
      group: String(raw.group || (type === 'legislation' ? 'Legislação' : 'Corpus Sincronizado')),
      folder,
      type,
      extension: ext,
      mimeType,
      size: Number(raw.size || 0),
      uploadedAt: Number(raw.uploadedAt || Date.now()),
      tags: Array.isArray(raw.tags) ? raw.tags : ['sincronizado', type],
      content: '',
      quotations: [],
      ...(raw.legislation ? { legislation: raw.legislation } : {}),
      ...(remoteId
        ? {
            status: 'synced',
            storageProvider: remoteProvider || 'google-drive',
            googleDriveFileId: remoteId,
            externalViewerUrl: remoteUrl,
            externalViewerLabel:
              remoteProvider === 'onedrive' ? 'Abrir no OneDrive ↗' : 'Abrir no Google Drive ↗'
          }
        : { status: 'synced' })
    }

    docs.push(stub)
    addedDocs.push(stub)
    added++
  }

  return { documents: docs, added, updated, addedDocs }
}

export const PROJECT_SCHEMA = 'caqdas-projeto/v1'
export const DOCUMENTS_SCHEMA = 'caqdas-documentos/v1'
const SNAPSHOT_VOLATILE_KEYS = new Set(['exportedAt', 'savedAt', 'savedBy'])

export function stableSnapshotJson(json) {
  return JSON.stringify(json, (k, v) => (SNAPSHOT_VOLATILE_KEYS.has(k) ? undefined : v))
}

/**
 * Monta os quatro arquivos canônicos do projeto (`projeto`, `documentos`, `trechos`, `grafo`)
 * para sincronização em nuvem (GitHub, Google Drive ou OneDrive).
 */
export function buildProjectSnapshotFiles({ project = {}, documents = [], excerpts = {}, grafo = {}, author = null } = {}) {
  const now = new Date().toISOString()
  const savedBy = author ? { name: author.name || '', app: 'caqdas' } : { app: 'caqdas' }
  const serializedDocs = (Array.isArray(documents) ? documents : []).map((d) => ({
    id: d.id,
    title: d.title || '',
    type: d.type || '',
    extension: d.extension || '',
    mimeType: d.mimeType || '',
    participant: d.participant || '',
    folder: d.folder || '',
    excerptCount: (d.quotations || []).length,
    ...(d.legislation ? { legislation: d.legislation } : {}),
    ...(d.googleDriveFileId
      ? {
          remote: {
            provider: d.storageProvider === 'onedrive' ? 'onedrive' : 'google-drive',
            fileId: d.googleDriveFileId,
            url: d.externalViewerUrl || ''
          }
        }
      : {})
  }))

  return {
    projeto: {
      schema: PROJECT_SCHEMA,
      savedAt: now,
      savedBy,
      project: {
        id: project.id || '',
        name: project.name || '',
        description: project.description || '',
        createdDate: project.createdDate || ''
      },
      files: { documentos: 'documentos.json', trechos: 'trechos.json', grafo: 'grafo.json' }
    },
    documentos: { schema: DOCUMENTS_SCHEMA, savedAt: now, documents: serializedDocs },
    trechos: { ...excerpts, savedBy },
    grafo: { ...grafo, savedBy }
  }
}

/**
 * Aplica metadados de projeto, documentos, códigos, trechos e grafo vindos de uma fonte remota
 * sobre o `storage` local, preservando conteúdo local e respeitando timestamps/tombstones.
 */
export function applyRemoteProjectSnapshot({
  remoteProjeto = null,
  remoteDocs = null,
  remoteTrechos = null,
  remoteGrafo = null,
  storage,
  excerptSchema = 'caqdas-trechos/v1',
  graphSchema = 'caqdas-grafo/v1',
  labelPrefix = ''
} = {}) {
  if (remoteTrechos && remoteTrechos.schema !== excerptSchema) {
    throw new Error(`${labelPrefix}trechos.json não está no formato ${excerptSchema}.`)
  }
  if (remoteGrafo && remoteGrafo.schema && remoteGrafo.schema !== graphSchema) {
    throw new Error(`${labelPrefix}grafo.json não está no formato ${graphSchema}.`)
  }

  if (remoteProjeto?.project) {
    storage.importProjectMeta(remoteProjeto.project)
  }

  const docsList = [
    ...(Array.isArray(remoteDocs?.documents) ? remoteDocs.documents : []),
    ...(Array.isArray(remoteTrechos?.documents) ? remoteTrechos.documents : [])
  ]
  const docsRes = docsList.length ? storage.importRemoteDocuments(docsList) : { added: 0, updated: 0 }

  let trechosRes = { added: 0, updated: 0, removed: 0, skipped: 0, codesAdded: 0 }
  if (remoteTrechos) {
    trechosRes = storage.importExcerpts(remoteTrechos)
  }

  let graphRes = { added: 0, updated: 0, removed: 0 }
  if (remoteGrafo) {
    graphRes = storage.importExcerptGraph(remoteGrafo)
  }

  return {
    found: Boolean(remoteProjeto || remoteDocs || remoteTrechos || remoteGrafo),
    docsAdded: docsRes.added,
    ...trechosRes,
    graphAdded: graphRes.added,
    graphUpdated: graphRes.updated,
    graphRemoved: graphRes.removed
  }
}

/**
 * Adiciona códigos vindos de `trechos.json.codes` que ainda não existam localmente.
 */
export function mergeRemoteCodes(localCodes, remoteCodes) {
  const codes = Array.isArray(localCodes) ? [...localCodes] : []
  const seen = new Set(codes.map((c) => c?.id).filter(Boolean))
  let added = 0

  for (const rc of Array.isArray(remoteCodes) ? remoteCodes : []) {
    if (!rc?.id || !rc?.name || seen.has(rc.id)) continue
    seen.add(rc.id)
    codes.push({
      id: String(rc.id),
      name: String(rc.name),
      color: rc.color ? String(rc.color) : '#006a6a',
      categoryId: rc.categoryId || null
    })
    added++
  }

  return { codes, added }
}
