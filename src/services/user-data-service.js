/**
 * Dados locais por usuário (FzlUserDataController) + arquivos do corpus com
 * exclusão consistente entre navegador e nuvem (FzlCrudBaseController).
 *
 * - Cada conta tem seu próprio escopo no navegador (localStorage e IndexedDB). O próximo
 *   usuário que entrar no mesmo navegador não vê os dados do anterior.
 * - Sem login, o app continua funcionando num escopo "visitante" local.
 * - Ao sair (signOut), os dados de quem saiu são apagados; se houver arquivos ainda não
 *   enviados à nuvem, o usuário confirma antes.
 * - Apagar um arquivo do corpus apaga também a cópia no Google Drive / OneDrive (vai
 *   para a lixeira). Se a nuvem falhar, o registro fica como exclusão pendente e é
 *   tentado de novo no próximo carregamento.
 */
import { authService } from 'fzl-fund-appshell--lit'
import {
  FzlUserDataController,
  FzlCrudBaseController,
  FzlIndexedDbCrudAdapter,
  FzlGoogleDriveRemoteAdapter,
  FzlOneDriveRemoteAdapter
} from '@fzl/webcomponents-lit/controllers'

export const GUEST_IDENTITY = Object.freeze({ id: 'visitante', provider: 'local', email: null, name: 'Visitante' })

const isGuest = (user) => user?.provider === GUEST_IDENTITY.provider && user?.id === GUEST_IDENTITY.id

/**
 * O escopo segue o e-mail da conta (normalizado): a mesma pessoa mantém os dados ao
 * entrar com Google ou Microsoft. O e-mail não aparece em claro no nome das chaves.
 */
export function toUserIdentity(user) {
  const email = String(user?.email || '').trim().toLowerCase()
  const id = email || (user?.id ? String(user.id) : '')
  if (!id) return GUEST_IDENTITY
  return { id, provider: 'account', email: email || null, name: user?.name || null }
}

class CaqdasUserDataController extends FzlUserDataController {
  shouldPurgeOnLogout(request) {
    // O escopo visitante não é "logout" de ninguém: entrar numa conta não apaga nada.
    if (isGuest(request.user)) return false
    // Só limpa quando o usuário sai por vontade própria (troca de provedor na
    // inicialização, sessão expirada ou troca direta de conta não apagam).
    if (request.reason !== 'signOut') return false
    return super.shouldPurgeOnLogout(request)
  }
}

export const userData = new CaqdasUserDataController(null, {
  appId: 'caqdas',
  logoutPolicy: 'purge',
  user: toUserIdentity(authService.getCurrentUser?.()),
  confirmPurge: ({ unsynced }) =>
    confirm(`${unsynced} arquivo(s) não enviados ao Drive. Apagar mesmo assim?`)
})

authService.subscribe((user, reason) => {
  if (reason === 'socialAuthConfig') return
  void userData.setUser(toUserIdentity(user), reason)
})

// --- token da nuvem ----------------------------------------------------------------
// O token vem do CaqdasPersonalCloudDocsController (registrado em main.js) para
// reaproveitar o cache de sessão e a verificação do escopo drive.file.
let cloudTokenProvider = null

export function setCloudTokenProvider(fn) {
  cloudTokenProvider = typeof fn === 'function' ? fn : null
}

const tokenFor = (provider) => async () => (cloudTokenProvider ? cloudTokenProvider(provider) : null)

/** Ids fictícios usados pela simulação de sincronização (não existem na nuvem). */
export const isSimulatedRemoteId = (id) => /^1docs_/.test(String(id || ''))

/**
 * Arquivos binários do corpus. id do registro = id do documento; data = { name, file? }.
 * O envio para a nuvem continua no pipeline do CaqdasPersonalCloudDocsController (pasta
 * inicial, renovação de token…); aqui só registramos onde a cópia remota está
 * (`linkRemote` → `attachRemote`) para que `delete()` consiga apagá-la.
 */
class CaqdasCorpusFilesController extends FzlCrudBaseController {
  load() {
    this._loadPromise = super.load()
    return this._loadPromise
  }

  /** Aguarda o carregamento atual (útil antes de decidir se um registro existe). */
  async whenLoaded() {
    await userData.whenReady()
    try {
      await this._loadPromise
    } catch {
      // erros de carga já são reportados por fzl-crud-error
    }
  }

  /** Salva (ou substitui) o arquivo binário de um documento no navegador. */
  async putFile(id, file) {
    if (!id || !file || !userData.isActive) return
    await this.whenLoaded()
    const current = this.get(id)
    if (!current) {
      await this.create({ name: file.name || id, file }, { id, sync: false })
      return
    }
    // Troca só o arquivo local: syncState e cópias remotas continuam como estão.
    await this.putLocal(id, (data) => ({ ...data, name: file.name || data?.name || id, file }))
  }

  /** Registra a cópia remota de um documento (cria o registro se ele só existe na nuvem). */
  async linkRemote(id, ref, name = '') {
    if (!id || !ref?.provider || !ref?.remoteId || !userData.isActive) return
    if (isSimulatedRemoteId(ref.remoteId)) return
    await this.whenLoaded()
    const current = this.get(id)
    const already = current?.remotes?.find((r) => r.provider === ref.provider && r.remoteId === ref.remoteId)
    if (already && current.syncState === 'synced') return
    await this.attachRemote(id, ref, current ? undefined : { name: name || id })
  }
}

const getFile = (record) => record?.data?.file || null

export const corpusFiles = new CaqdasCorpusFilesController(null, {
  userData,
  local: new FzlIndexedDbCrudAdapter({ dbName: 'arquivos', userData }),
  remotes: [
    new FzlGoogleDriveRemoteAdapter({ getToken: tokenFor('google-drive'), getFile }),
    new FzlOneDriveRemoteAdapter({ getToken: tokenFor('onedrive'), getFile })
  ],
  confirmDelete: (records) =>
    confirm(
      records.some((r) => r.remotes.length)
        ? 'Isso também removerá o arquivo do Google Drive. Continuar?'
        : 'Remover este arquivo do corpus da pesquisa?'
    )
})

// --- dados antigos (sem escopo de usuário) ------------------------------------------
// Decisão do usuário: apagar o armazenamento "global" anterior; os arquivos serão
// reinseridos. Não há migração de dados nem dos fileIds antigos do Drive.
const LEGACY_LOCAL_KEYS = ['fzl_caqdas_research_data_v1', 'fzl_caqdas_theory_study_v1', 'fzl_caqdas_document_bookmarks']
const LEGACY_DB_NAMES = ['fzl_caqdas_files_v1']

export function purgeLegacyGlobalData() {
  try {
    LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // storage indisponível
  }
  try {
    if (typeof indexedDB !== 'undefined') LEGACY_DB_NAMES.forEach((name) => indexedDB.deleteDatabase(name))
  } catch {
    // IndexedDB indisponível
  }
}
