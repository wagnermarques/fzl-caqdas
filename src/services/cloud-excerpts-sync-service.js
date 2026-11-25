import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage, EXCERPT_SCHEMA, GRAPH_SCHEMA } from './storage-service.js'
import { userData } from './user-data-service.js'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import {
  stableSnapshotJson,
  buildProjectSnapshotFiles,
  applyRemoteProjectSnapshot
} from './corpus-sync-utils.js'

const SYNC_FOLDER_NAME = '.caqdas-dados'
const FILE_KEYS = ['projeto', 'documentos', 'trechos', 'grafo']

let sharedController = null
let inflightCloudSync = null

function getCloudController() {
  if (!sharedController) {
    sharedController = new CaqdasPersonalCloudDocsController(null)
  }
  return sharedController
}

export function isPersonalCloudSyncReady() {
  const user = authService.getCurrentUser?.() || null
  if (!researchStorage.isCloudAuthenticated(user)) return false
  const provider = researchStorage.getEffectivePersistenceProvider(user)
  return provider === 'google-drive' || provider === 'onedrive'
}

async function resolveTokenQuietly(controller, provider, { interactive = false } = {}) {
  const user = authService.getCurrentUser?.() || null
  if (!interactive) {
    if (provider === 'google-drive') {
      const probe = await controller.probeSessionDriveScope()
      if (!probe?.hasDriveScope) return ''
    } else if (provider === 'onedrive') {
      const cfg = researchStorage.getCloudSyncConfig()
      const cached = controller._getSessionCachedToken('onedrive', user?.email || '')
      if (!cfg.oneDriveAuthToken && !cached && user?.provider !== 'microsoft') {
        return ''
      }
    }
  }
  return (await controller.resolveCloudAccessToken(provider)) || ''
}

// --- Google Drive helpers -------------------------------------------------------------

async function findDriveSyncFolder(token, homeFolderId, { createIfMissing = false } = {}) {
  const q = encodeURIComponent(
    `name='${SYNC_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and '${homeFolderId}' in parents and trashed=false`
  )
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime)&orderBy=createdTime&pageSize=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Google Drive (${res.status})`)
  const data = await res.json()
  if (data?.files?.[0]?.id) return data.files[0].id
  if (!createIfMissing) return ''

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: SYNC_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [homeFolderId]
    })
  })
  if (!createRes.ok) throw new Error(`Falha ao criar pasta de sincronização no Drive (${createRes.status})`)
  const created = await createRes.json()
  return created?.id || ''
}

async function listDriveSyncFiles(token, syncFolderId) {
  if (!syncFolderId) return new Map()
  const q = encodeURIComponent(`'${syncFolderId}' in parents and trashed=false`)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Google Drive (${res.status})`)
  const data = await res.json()
  const map = new Map()
  for (const f of data?.files || []) {
    if (f?.name && !map.has(f.name)) map.set(f.name, f.id)
  }
  return map
}

async function readDriveJson(token, fileId) {
  if (!fileId) return { id: null, json: null }
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.status === 404) return { id: null, json: null }
  if (!res.ok) throw new Error(`Google Drive (${res.status})`)
  try {
    return { id: fileId, json: await res.json() }
  } catch {
    return { id: fileId, json: null }
  }
}

async function writeDriveJson(token, syncFolderId, fileName, json, existingId = null) {
  const boundary = `caqdas_sync_${Date.now().toString(36)}`
  const metadata = existingId
    ? { name: fileName, mimeType: 'application/json' }
    : { name: fileName, parents: [syncFolderId], mimeType: 'application/json' }
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(json, null, 2)}\n\r\n` +
    `--${boundary}--`

  const endpoint = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id'
  const res = await fetch(endpoint, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  })
  if (!res.ok) throw new Error(`Falha ao gravar ${fileName} no Drive (${res.status})`)
  const data = await res.json()
  return data?.id || existingId || ''
}

// --- OneDrive helpers -----------------------------------------------------------------

async function readOneDriveJson(token, homeFolderId, fileName) {
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(homeFolderId)}:/${encodeURIComponent(SYNC_FOLDER_NAME)}/${encodeURIComponent(fileName)}:/content`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) return { id: null, json: null }
  if (!res.ok) throw new Error(`OneDrive (${res.status})`)
  try {
    return { id: fileName, json: await res.json() }
  } catch {
    return { id: fileName, json: null }
  }
}

async function writeOneDriveJson(token, homeFolderId, fileName, json) {
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(homeFolderId)}:/${encodeURIComponent(SYNC_FOLDER_NAME)}/${encodeURIComponent(fileName)}:/content`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: `${JSON.stringify(json, null, 2)}\n`
  })
  if (!res.ok) throw new Error(`Falha ao gravar ${fileName} no OneDrive (${res.status})`)
  return fileName
}

// --- Operação principal ---------------------------------------------------------------

async function runPersonalCloudSync({ interactive = false, push = true } = {}) {
  await userData.whenReady()
  const scopeBefore = userData.scope
  if (!isPersonalCloudSyncReady()) {
    return { skipped: true, reason: 'unauthenticated' }
  }

  const controller = getCloudController()
  const provider = controller._activeCloudProvider()
  const token = await resolveTokenQuietly(controller, provider, { interactive })
  if (!token) {
    return { skipped: true, reason: 'sem-token', provider }
  }

  const homeFolderId = await controller.ensureCloudHomeFolderId(provider, token)
  if (!homeFolderId) {
    return { skipped: true, reason: 'no-home-folder', provider }
  }

  let syncFolderId = ''
  let remoteByKey = {}

  if (provider === 'google-drive') {
    syncFolderId = await findDriveSyncFolder(token, homeFolderId, { createIfMissing: false })
    const fileMap = await listDriveSyncFiles(token, syncFolderId)
    const entries = await Promise.all(
      FILE_KEYS.map(async (k) => [k, await readDriveJson(token, fileMap.get(`${k}.json`) || null)])
    )
    remoteByKey = Object.fromEntries(entries)
  } else {
    const entries = await Promise.all(
      FILE_KEYS.map(async (k) => [k, await readOneDriveJson(token, homeFolderId, `${k}.json`)])
    )
    remoteByKey = Object.fromEntries(entries)
  }

  if (userData.scope !== scopeBefore) {
    return { found: false, aborted: true, provider }
  }

  const applied = applyRemoteProjectSnapshot({
    remoteProjeto: remoteByKey.projeto?.json || null,
    remoteDocs: remoteByKey.documentos?.json || null,
    remoteTrechos: remoteByKey.trechos?.json || null,
    remoteGrafo: remoteByKey.grafo?.json || null,
    storage: researchStorage,
    excerptSchema: EXCERPT_SCHEMA,
    graphSchema: GRAPH_SCHEMA,
    labelPrefix: `${SYNC_FOLDER_NAME}/`
  })

  let pushed = 0
  const user = authService.getCurrentUser?.() || null
  const excerpts = researchStorage.exportExcerpts()
  const grafo = researchStorage.exportExcerptGraph()
  const documents = researchStorage.getDocuments()
  const hasMeaningfulLocalData =
    excerpts.excerpts.length > 0 ||
    (excerpts.deleted || []).length > 0 ||
    grafo.relations.length > 0 ||
    Object.keys(grafo.nodes || {}).length > 0 ||
    documents.length > 0

  if (push && (applied.found || hasMeaningfulLocalData)) {
    const files = buildProjectSnapshotFiles({
      project: researchStorage.getProject() || {},
      documents,
      excerpts,
      grafo,
      author: user ? { name: user.name || '' } : null
    })

    const dirtyKeys = FILE_KEYS.filter(
      (k) => !remoteByKey[k]?.json || stableSnapshotJson(remoteByKey[k].json) !== stableSnapshotJson(files[k])
    )

    if (dirtyKeys.length > 0) {
      if (provider === 'google-drive' && !syncFolderId) {
        syncFolderId = await findDriveSyncFolder(token, homeFolderId, { createIfMissing: true })
      }
      for (const k of dirtyKeys) {
        if (provider === 'google-drive') {
          await writeDriveJson(token, syncFolderId, `${k}.json`, files[k], remoteByKey[k]?.id || null)
        } else {
          await writeOneDriveJson(token, homeFolderId, `${k}.json`, files[k])
        }
        pushed++
      }
    }
  }

  return {
    ...applied,
    provider,
    pushed,
    excerptCount: excerpts.excerpts.length,
    relationCount: grafo.relations.length
  }
}

/**
 * Sincroniza projeto, documentos, códigos, trechos e grafo na pasta `.caqdas-dados`
 * do Google Drive ou OneDrive do usuário autenticado.
 */
export function syncWithPersonalCloud({ interactive = false, push = true } = {}) {
  if (inflightCloudSync) return inflightCloudSync
  const task = runPersonalCloudSync({ interactive, push }).finally(() => {
    if (inflightCloudSync === task) inflightCloudSync = null
  })
  inflightCloudSync = task
  return task
}
