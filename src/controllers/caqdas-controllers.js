/**
 * @license
 * FZL CAQDAS — Controladores Reativos Especializados para Pesquisa Qualitativa
 *
 * Estende e especializa os controllers headless do ecossistema FZL:
 * - FzlPersonalCloudDocsController -> CaqdasPersonalCloudDocsController (envio direto e sincronização com Google Docs / OneDrive)
 * - FzlDocxReaderController -> CaqdasDocxCodingController (decomposição em Unidades de Registro de Bardin)
 * - FzlBookmarksController -> CaqdasBookmarksController (favoritos e destaque de documentos do corpus)
 */

import { authService } from 'fzl-fund-appshell--lit'
import {
  FzlPersonalCloudDocsController,
  FzlDocxReaderController,
  FzlBookmarksController,
  FzlSocialAuthController
} from '@fzl/webcomponents-lit/controllers'
import { researchStorage } from '../services/storage-service.js'

/**
 * Controller especializado para envio e sincronização de documentos do Corpus
 * com a nuvem pessoal do pesquisador (Google Docs / Google Drive e OneDrive).
 */
export class CaqdasPersonalCloudDocsController extends FzlPersonalCloudDocsController {
  constructor(host, options = {}) {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    const socialCfg = authService.getSocialAuthConfig?.() || {}
    super(host, {
      convertToGoogleDocs: cloudCfg.googleDriveConvertToDocs ?? true,
      googleDriveFolderId: cloudCfg.googleDriveFolderId || undefined,
      oneDriveFolderId: cloudCfg.oneDriveFolderId || undefined,
      authConfig: {
        googleClientId: cloudCfg.googleClientId || socialCfg.googleClientId || undefined,
        microsoftClientId: cloudCfg.microsoftClientId || socialCfg.microsoftClientId || undefined,
        microsoftTenantId: cloudCfg.microsoftTenantId || socialCfg.microsoftTenantId || 'common',
        requestDriveScope: true
      },
      ...options
    })
  }

  get currentUser() {
    return super.currentUser || authService.getCurrentUser?.() || null
  }

  get isAuthenticated() {
    return Boolean(this.currentUser)
  }

  /**
   * Garante que a configuração de Client IDs do authController interno acompanhe
   * dinamicamente o AppShell (appshell.config.js) e a configuração local.
   */
  _syncInternalAuthConfig() {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    const socialCfg = authService.getSocialAuthConfig?.() || {}
    this.authController.configure(
      {
        googleClientId: cloudCfg.googleClientId || socialCfg.googleClientId || '',
        microsoftClientId: cloudCfg.microsoftClientId || socialCfg.microsoftClientId || '',
        microsoftTenantId: cloudCfg.microsoftTenantId || socialCfg.microsoftTenantId || 'common',
        requestDriveScope: true
      },
      false
    )
    return cloudCfg
  }

  /**
   * Resolve um token OAuth2 válido para Google Drive ou Microsoft OneDrive,
   * priorizando tokens configurados manualmente, token social da sessão do AppShell
   * e fallback sob demanda via FzlSocialAuthController.
   */
  async resolveCloudAccessToken(provider) {
    const cloudCfg = this._syncInternalAuthConfig()
    const appUser = authService.getCurrentUser?.()
    const storedAppToken = typeof authService.getAccessToken === 'function' ? await authService.getAccessToken() : ''
    const isJwtCredential = typeof storedAppToken === 'string' && storedAppToken.split('.').length === 3

    if (provider === 'google-drive' || provider === 'google') {
      if (cloudCfg.googleAuthToken) return cloudCfg.googleAuthToken
      if (appUser?.provider === 'google') {
        if (appUser.socialAccessToken) return appUser.socialAccessToken
        if (storedAppToken && !isJwtCredential) return storedAppToken
      }
      return (await this.authController.requestCloudAccessToken('google')) || ''
    }

    if (provider === 'onedrive' || provider === 'microsoft') {
      if (cloudCfg.oneDriveAuthToken) return cloudCfg.oneDriveAuthToken
      if (appUser?.provider === 'microsoft') {
        if (appUser.socialAccessToken) return appUser.socialAccessToken
        if (storedAppToken && !isJwtCredential) return storedAppToken
      }
      return (await this.authController.requestCloudAccessToken('microsoft')) || ''
    }

    return ''
  }

  /**
   * Localiza ou cria automaticamente a pasta inicial configurada (padrão APP-CADDAS-HOME-DIR)
   * no Google Drive ou no OneDrive e salva seu ID real nas configurações locais.
   */
  async ensureCloudHomeFolderId(provider, token) {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    const homeDirName = researchStorage.getHomeDirName()

    if (provider === 'google-drive') {
      if (cloudCfg.googleDriveFolderId) return cloudCfg.googleDriveFolderId
      if (!token) return ''

      try {
        const escapedName = homeDirName.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        const query = encodeURIComponent(
          `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
        )
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const foundId = searchData?.files?.[0]?.id
          if (foundId) {
            researchStorage.saveCloudSyncConfig({ googleDriveFolderId: foundId })
            return foundId
          }
        }

        const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: homeDirName,
            mimeType: 'application/vnd.google-apps.folder'
          })
        })
        if (createRes.ok) {
          const created = await createRes.json()
          if (created?.id) {
            researchStorage.saveCloudSyncConfig({ googleDriveFolderId: created.id })
            return created.id
          }
        }
      } catch (err) {
        console.warn('[CAQDAS] Não foi possível localizar/criar a pasta no Google Drive:', err)
      }
      return ''
    }

    if (provider === 'onedrive') {
      if (cloudCfg.oneDriveFolderId) return cloudCfg.oneDriveFolderId
      if (!token) return ''

      try {
        const encodedDir = encodeURIComponent(homeDirName)
        const lookupRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodedDir}?$select=id,name`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (lookupRes.ok) {
          const existing = await lookupRes.json()
          if (existing?.id) {
            researchStorage.saveCloudSyncConfig({ oneDriveFolderId: existing.id })
            return existing.id
          }
        }

        if (lookupRes.status === 404) {
          const createRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: homeDirName,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename'
            })
          })
          if (createRes.ok) {
            const created = await createRes.json()
            if (created?.id) {
              researchStorage.saveCloudSyncConfig({ oneDriveFolderId: created.id })
              return created.id
            }
          }
        }
      } catch (err) {
        console.warn('[CAQDAS] Não foi possível localizar/criar a pasta no OneDrive:', err)
      }
      return ''
    }

    return ''
  }

  /**
   * Aplica automaticamente a configuração ativa de persistência (GDrive, OneDrive, Local ou REST)
   * e a pasta padrão inicial (APP-CADDAS-HOME-DIR) nos 5 web components do fluxo.
   */
  configurePersistenceComponents({
    fileManager,
    documentPicker,
    cameraCapture,
    chapterViewGroup,
    chapterViews = []
  } = {}) {
    const cloudCfg = this._syncInternalAuthConfig()
    const homeDirName = researchStorage.getHomeDirName()
    const user = this.currentUser
    const isAuthenticated = researchStorage.isCloudAuthenticated(user)
    const rawProvider = isAuthenticated ? (cloudCfg.provider || 'local') : 'local'
    const effectiveProvider = rawProvider === 'local' ? 'rest' : rawProvider
    const allowCloudUpload = isAuthenticated && (rawProvider === 'google-drive' || rawProvider === 'onedrive')

    const googleTokenProvider = allowCloudUpload
      ? async () => {
          const token = await this.resolveCloudAccessToken('google-drive')
          if (token && !researchStorage.getCloudSyncConfig().googleDriveFolderId) {
            const folderId = await this.ensureCloudHomeFolderId('google-drive', token)
            if (folderId) {
              if (fileManager) fileManager.googleDriveFolderId = folderId
              if (documentPicker) documentPicker.googleDriveFolderId = folderId
            }
          }
          return token
        }
      : undefined

    const oneDriveTokenProvider = allowCloudUpload
      ? async () => {
          const token = await this.resolveCloudAccessToken('onedrive')
          if (token && !researchStorage.getCloudSyncConfig().oneDriveFolderId) {
            const folderId = await this.ensureCloudHomeFolderId('onedrive', token)
            if (folderId) {
              if (fileManager) fileManager.oneDriveFolderId = folderId
              if (documentPicker) documentPicker.oneDriveFolderId = folderId
            }
          }
          return token
        }
      : undefined

    for (const el of [fileManager, documentPicker]) {
      if (!el) continue
      if (typeof el.bindSocialAuth === 'function' && allowCloudUpload && cloudCfg.autoConfigureByAuthProvider !== false) {
        el.bindSocialAuth(this.authController, {
          convertToGoogleDocs: Boolean(cloudCfg.googleDriveConvertToDocs),
          googleDriveFolderId: cloudCfg.googleDriveFolderId || undefined,
          oneDriveFolderId: cloudCfg.oneDriveFolderId || undefined
        })
      } else {
        el.uploadController?.unbindSocialAuth?.()
      }

      el.storageProvider = effectiveProvider
      el.googleDriveFolderId = allowCloudUpload ? (cloudCfg.googleDriveFolderId || '') : ''
      el.oneDriveFolderId = allowCloudUpload ? (cloudCfg.oneDriveFolderId || '') : ''
      el.googleDriveConvertToDocs = allowCloudUpload && Boolean(cloudCfg.googleDriveConvertToDocs)
      el.googleAuthToken = allowCloudUpload ? (cloudCfg.googleAuthToken || '') : ''
      el.oneDriveAuthToken = allowCloudUpload ? (cloudCfg.oneDriveAuthToken || '') : ''
      el.googleTokenProvider = googleTokenProvider
      el.oneDriveTokenProvider = oneDriveTokenProvider
      if (el.dataset) {
        el.dataset.storageProvider = rawProvider
        el.dataset.homeDir = homeDirName
        el.dataset.cloudAuthenticated = String(isAuthenticated)
      }
    }

    if (fileManager) {
      if (!fileManager.currentFolder || fileManager.currentFolder === '/') {
        fileManager.currentFolder = `/${homeDirName}`
      }
      fileManager.uploadHandler = allowCloudUpload
        ? undefined
        : async () => {
            const msg = !isAuthenticated
              ? 'Você não está conectado. Faça login com Google ou Microsoft para enviar arquivos à nuvem.'
              : 'O destino está em Armazenamento Local. Selecione Google Drive ou OneDrive para sincronizar na nuvem.'
            throw new Error(msg)
          }
    }

    for (const el of [cameraCapture, chapterViewGroup, ...(chapterViews || [])]) {
      if (!el?.dataset) continue
      el.dataset.storageProvider = rawProvider
      el.dataset.homeDir = homeDirName
      el.dataset.cloudAuthenticated = String(isAuthenticated)
    }
  }

  /**
   * Sobrescreve o envio à nuvem pessoal para suportar a sessão do AppShell (authService)
   * e o provedor de persistência selecionado (Google Drive ou OneDrive), garantindo
   * a resolução automática da pasta inicial configurada (APP-CADDAS-HOME-DIR).
   */
  async uploadToPersonalCloud(file, options = {}) {
    const cloudCfg = this._syncInternalAuthConfig()
    const user = this.currentUser

    if (!user && !cloudCfg.googleAuthToken && !cloudCfg.oneDriveAuthToken) {
      return super.uploadToPersonalCloud(file, options)
    }

    const useOneDrive =
      cloudCfg.provider === 'onedrive' ||
      (cloudCfg.provider !== 'google-drive' && user?.provider === 'microsoft')
    const targetCloud = useOneDrive ? 'onedrive' : 'google-drive'
    const token = await this.resolveCloudAccessToken(targetCloud)

    if (!token) {
      return {
        success: false,
        provider: targetCloud,
        error: `Autenticação ${useOneDrive ? 'Microsoft OneDrive' : 'Google Drive'} necessária para enviar o documento.`
      }
    }

    const resolvedFolderId = options.folderId || (await this.ensureCloudHomeFolderId(targetCloud, token))
    const overrideConfig =
      targetCloud === 'google-drive'
        ? {
            provider: 'google-drive',
            googleDriveConvertToDocs: options.convertToGoogleDocs ?? cloudCfg.googleDriveConvertToDocs ?? true,
            googleDriveFolderId: resolvedFolderId || undefined,
            googleAuthToken: token
          }
        : {
            provider: 'onedrive',
            oneDriveFolderId: resolvedFolderId || undefined,
            oneDriveAuthToken: token
          }

    const result = await this.uploadFile(file, overrideConfig, options.context)

    if (result.success) {
      const effectiveUser = user || {
        name: 'Pesquisador',
        email: '',
        provider: useOneDrive ? 'microsoft' : 'google'
      }
      await this.onPersonalDocUploaded(file, result, effectiveUser)
      this.emitHostEvent('fzl-personal-cloud-uploaded', { file, result, user: effectiveUser })
    }

    return result
  }

  /**
   * Hook protegido acionado automaticamente quando o upload para o Google Docs
   * ou OneDrive é concluído com sucesso. Registra a URL externa e o status
   * 'synced' no armazenamento do projeto de pesquisa.
   */
  async onPersonalDocUploaded(file, result, user) {
    await super.onPersonalDocUploaded(file, result, user)

    const docs = researchStorage.getDocuments()
    let targetDoc = docs.find((d) => d.title === file.name || d.id === result.fileId)

    if (targetDoc) {
      researchStorage.updateDocument(targetDoc.id, {
        status: 'synced',
        storageProvider: result.provider,
        externalViewerUrl: result.externalViewerUrl,
        externalViewerLabel: result.externalViewerLabel,
        googleDriveFileId: result.fileId,
        syncedBy: user.email,
        syncedAt: Date.now()
      })
    } else {
      // Se for um novo documento importado diretamente pela nuvem
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.txt'
      targetDoc = researchStorage.addDocument({
        title: file.name,
        participant: user.name || 'Pesquisador',
        group: 'Nuvem Pessoal',
        folder: researchStorage.formatPersistenceFolder('documentos'),
        type: ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'interview',
        extension: ext,
        size: file.size,
        status: 'synced',
        storageProvider: result.provider,
        externalViewerUrl: result.externalViewerUrl,
        externalViewerLabel: result.externalViewerLabel,
        googleDriveFileId: result.fileId,
        syncedBy: user.email,
        syncedAt: Date.now(),
        tags: ['nuvem', result.provider],
        quotations: []
      })
    }
  }

  /**
   * Sincroniza sob demanda um documento já existente no corpus local
   * com a nuvem configurada (Google Docs/Drive ou OneDrive).
   */
  async syncCorpusDocument(doc, options = {}) {
    const text = doc.content || doc.title || ''
    const mime =
      doc.extension === '.docx' || doc.type === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'text/plain'

    const fileName = doc.title.includes('.') ? doc.title : `${doc.title}.txt`
    const file = new File([text], fileName, { type: mime })

    const result = await this.uploadToPersonalCloud(file, {
      convertToGoogleDocs: options.convertToGoogleDocs ?? true,
      folderId: options.folderId,
      context: { docId: doc.id, participant: doc.participant }
    })

    if (result.success && result.externalViewerUrl) {
      researchStorage.updateDocument(doc.id, {
        status: 'synced',
        storageProvider: result.provider,
        externalViewerUrl: result.externalViewerUrl,
        externalViewerLabel: result.externalViewerLabel,
        googleDriveFileId: result.fileId,
        syncedAt: Date.now()
      })
    }

    return result
  }
}

/**
 * Controller especializado para leitura e decomposição de documentos Word (.docx)
 * e transcrições em Unidades de Registro (UR) segundo a metodologia de Bardin.
 */
export class CaqdasDocxCodingController extends FzlDocxReaderController {
  /**
   * Converte os parágrafos e seções em Unidades de Registro (UR) de Bardin
   * indexadas e prontas para categorização qualitativa.
   */
  toRegistrationUnits() {
    const verses = this.toStudyVerses()
    return verses.map((v, index) => ({
      urId: `ur-${index + 1}`,
      codeIndex: index + 1,
      label: `UR §${index + 1}`,
      text: v.text,
      type: v.type,
      wordCount: v.text.split(/\s+/).filter(Boolean).length
    }))
  }
}

/**
 * Controller especializado para gestão de marcadores e favoritos de documentos
 * do corpus de pesquisa com sincronização cross-tab e persistência local.
 */
export class CaqdasBookmarksController extends FzlBookmarksController {
  constructor(host, options = {}) {
    super(host, {
      storageKey: 'fzl_caqdas_document_bookmarks',
      ...options
    })
  }

  /**
   * Marca ou desmarca um documento do corpus como prioritário para análise.
   */
  toggleCorpusBookmark(doc) {
    if (this.isBookmarked(doc.id)) {
      this.remove(doc.id)
      return false
    }
    this.add({
      id: doc.id,
      name: doc.title,
      category: doc.type === 'pdf' ? 'pdf' : 'text',
      extension: doc.extension || '.txt',
      size: doc.size,
      tags: doc.tags || [],
      notes: `Participante: ${doc.participant || 'N/A'}`
    })
    return true
  }
}
