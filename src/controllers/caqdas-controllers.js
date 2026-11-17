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

const DRIVE_SESSION_TOKEN_KEY = 'fzl-caqdas:drive-session-token'

export function clearCachedCloudTokens() {
  try {
    sessionStorage.removeItem(DRIVE_SESSION_TOKEN_KEY)
  } catch {
    // Ignore storage unavailability
  }
}

/**
 * Controller especializado para envio e sincronização de documentos do Corpus
 * com a nuvem pessoal do pesquisador (Google Docs / Google Drive e OneDrive).
 */
export class CaqdasPersonalCloudDocsController extends FzlPersonalCloudDocsController {
  constructor(host, options = {}) {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    const socialCfg = authService.getSocialAuthConfig?.() || {}
    super(host, {
      convertToGoogleDocs: false,
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
    this._runtimeCloudTokens = new Map()
    this._driveScopeProbe = new Map()
    this._preloadGoogleGsi()
  }

  _preloadGoogleGsi() {
    if (typeof document === 'undefined') return
    const cfg = researchStorage.getCloudSyncConfig()
    const socialCfg = authService.getSocialAuthConfig?.() || {}
    if (!(cfg.googleClientId || socialCfg.googleClientId)) return
    if (document.getElementById('fzl-google-gsi-sdk')) return
    const script = document.createElement('script')
    script.id = 'fzl-google-gsi-sdk'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  get currentUser() {
    return super.currentUser || authService.getCurrentUser?.() || null
  }

  get isAuthenticated() {
    return Boolean(this.currentUser)
  }

  _getSessionCachedToken(provider, email = '') {
    const cacheKey = `${provider}:${email || ''}`
    const mem = this._runtimeCloudTokens.get(cacheKey)
    if (mem && mem.expiresAt > Date.now() + 60_000) {
      return mem.token
    }
    try {
      const raw = sessionStorage.getItem(DRIVE_SESSION_TOKEN_KEY)
      if (!raw) return ''
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        parsed.key === cacheKey &&
        parsed.token &&
        Number(parsed.expiresAt || 0) > Date.now() + 60_000
      ) {
        this._runtimeCloudTokens.set(cacheKey, parsed)
        return parsed.token
      }
    } catch {
      // Ignore parse errors
    }
    return ''
  }

  _saveSessionCachedToken(provider, email = '', token = '', expiresInSec = 3500) {
    if (!token) return
    const cacheKey = `${provider}:${email || ''}`
    const ttlMs = Math.max(120, Number(expiresInSec) || 3500) * 1000
    const entry = {
      key: cacheKey,
      token,
      expiresAt: Date.now() + ttlMs
    }
    this._runtimeCloudTokens.set(cacheKey, entry)
    try {
      sessionStorage.setItem(DRIVE_SESSION_TOKEN_KEY, JSON.stringify(entry))
    } catch {
      // Ignore storage quota errors
    }
  }

  _invalidateCloudTokens(provider = null, email = '') {
    if (!provider) {
      this._runtimeCloudTokens.clear()
      this._driveScopeProbe.clear()
      clearCachedCloudTokens()
    } else {
      const prefix = `${provider}:`
      for (const k of Array.from(this._runtimeCloudTokens.keys())) {
        if (k.startsWith(prefix)) this._runtimeCloudTokens.delete(k)
      }
      this._driveScopeProbe.clear()
      try {
        const raw = sessionStorage.getItem(DRIVE_SESSION_TOKEN_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed?.key === `${provider}:${email || ''}` || parsed?.key?.startsWith(prefix)) {
          clearCachedCloudTokens()
        }
      } catch {
        clearCachedCloudTokens()
      }
    }
    if (!this.authController.currentUser && this.authController.accessToken) {
      this.authController.logout()
    }
  }

  async _inspectGoogleToken(token) {
    if (!token) return { valid: false, hasDriveScope: false, expiresIn: 0 }
    try {
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`
      )
      if (!res.ok) {
        return { valid: false, hasDriveScope: false, expiresIn: 0 }
      }
      const data = await res.json()
      const scopeStr = String(data?.scope || '')
      const hasDriveScope = scopeStr
        .split(/\s+/)
        .some((s) => s === 'https://www.googleapis.com/auth/drive' || s.startsWith('https://www.googleapis.com/auth/drive.'))
      return {
        valid: true,
        hasDriveScope,
        expiresIn: Number(data?.expires_in || 3500)
      }
    } catch {
      return { valid: true, hasDriveScope: null, expiresIn: 3500 }
    }
  }

  _parseGoogleApiError(status, rawText = '') {
    let parsed = null
    const text = String(rawText || '')
    try {
      parsed = JSON.parse(text)
    } catch {
      const braceIdx = text.indexOf('{')
      if (braceIdx !== -1) {
        try {
          parsed = JSON.parse(text.slice(braceIdx))
        } catch {
          parsed = null
        }
      }
    }

    const errObj = parsed?.error || {}
    const reasons = [
      ...(Array.isArray(errObj.errors) ? errObj.errors.map((e) => e?.reason) : []),
      ...(Array.isArray(errObj.details) ? errObj.details.map((d) => d?.reason) : []),
      errObj.status
    ]
      .filter(Boolean)
      .map((r) => String(r))

    const apiMessage = String(errObj.message || text || '')
    const code = Number(errObj.code || status || 0)

    let activationUrl = ''
    if (Array.isArray(errObj.details)) {
      for (const detail of errObj.details) {
        if (detail?.metadata?.activationUrl) {
          activationUrl = String(detail.metadata.activationUrl)
          break
        }
        if (Array.isArray(detail?.links) && detail.links[0]?.url) {
          activationUrl = String(detail.links[0].url)
          break
        }
      }
    }

    const isInsufficientScope =
      code === 401 ||
      reasons.some((r) => r === 'insufficientPermissions' || r === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' || r === 'authError') ||
      /insufficient.*(permission|scope)|ACCESS_TOKEN_SCOPE_INSUFFICIENT|Invalid Credentials/i.test(apiMessage)

    const isApiDisabled =
      reasons.some((r) => r === 'accessNotConfigured' || r === 'SERVICE_DISABLED') ||
      /has not been used in project|Drive API.*disabled|Enable it by visiting/i.test(apiMessage)

    return {
      status: code,
      reasons,
      message: apiMessage,
      activationUrl,
      isInsufficientScope,
      isApiDisabled
    }
  }

  _createDriveApiError(errInfo, provider = 'google-drive') {
    const err = new Error(this._formatCloudError(provider, errInfo, errInfo?.message))
    err.isDriveScopeError = Boolean(errInfo?.isInsufficientScope)
    err.isApiDisabled = Boolean(errInfo?.isApiDisabled)
    err.status = errInfo?.status || 403
    return err
  }

  _formatCloudError(provider, errInfo, fallbackText = '') {
    if (provider === 'google-drive') {
      if (errInfo?.isApiDisabled) {
        return 'A Google Drive API não está ativada no projeto Google Cloud deste Client ID (erro 403 accessNotConfigured). Ative a "Google Drive API" no Google Cloud Console ou informe outro Client ID / token OAuth em Configurações > Persistência & Sincronização.'
      }
      if (errInfo?.isInsufficientScope) {
        return 'Sua sessão Google atual não possui permissão de escrita no Google Drive (escopo drive.file). Autorize o acesso ao Google Drive no popup de permissão ou reconecte sua conta.'
      }
    }
    const cleanMsg = errInfo?.message || fallbackText || 'Erro desconhecido na nuvem.'
    return cleanMsg
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

  async probeSessionDriveScope() {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    if (cloudCfg.googleAuthToken) return { status: 'manual-token', hasDriveScope: true }
    const appUser = authService.getCurrentUser?.()
    if (!appUser) return { status: 'not-signed-in', hasDriveScope: false }
    if (appUser.provider !== 'google') return { status: 'non-google', hasDriveScope: false }

    const cached = this._getSessionCachedToken('google-drive', appUser.email || '')
    if (cached) return { status: 'ready', hasDriveScope: true }

    const candidate = appUser.socialAccessToken || ''
    if (!candidate) {
      this._driveScopeProbe.set(appUser.email || '', false)
      return { status: 'needs-drive-scope', hasDriveScope: false }
    }
    if (this._driveScopeProbe.has(candidate)) {
      const ok = this._driveScopeProbe.get(candidate)
      return { status: ok ? 'ready' : 'needs-drive-scope', hasDriveScope: ok }
    }

    const info = await this._inspectGoogleToken(candidate)
    const ok = Boolean(info.valid && info.hasDriveScope === true)
    this._driveScopeProbe.set(candidate, ok)
    if (ok) {
      this._saveSessionCachedToken('google-drive', appUser.email || '', candidate, info.expiresIn)
      return { status: 'ready', hasDriveScope: true }
    }
    return { status: 'needs-drive-scope', hasDriveScope: false }
  }

  /**
   * Solicita autorização explícita de Google Drive (drive.file) diretamente a partir do gesto de clique.
   */
  async authorizeGoogleDrive() {
    this._syncInternalAuthConfig()
    const token = await this.resolveCloudAccessToken('google-drive', { forceRefresh: true })
    if (!token) {
      throw new Error('Não foi possível obter autorização OAuth2 para o Google Drive.')
    }
    return token
  }

  /**
   * Executa diagnóstico completo da conexão com Google Drive / Docs (login, escopo e API no GCP).
   */
  async diagnoseGoogleDriveConnection() {
    const cloudCfg = this._syncInternalAuthConfig()
    const appUser = authService.getCurrentUser?.()
    const email = appUser?.email || ''

    if (!cloudCfg.googleAuthToken && !appUser) {
      return {
        step: 'no-auth',
        hasDriveScope: false,
        message: 'Nenhum usuário conectado. Faça login com Google para testar a integração com Google Docs.'
      }
    }

    const candidateToken =
      cloudCfg.googleAuthToken ||
      this._getSessionCachedToken('google-drive', email) ||
      (appUser?.provider === 'google' ? appUser.socialAccessToken || '' : '')

    if (!candidateToken) {
      return {
        step: 'missing-scope',
        email,
        hasDriveScope: false,
        message: 'Sessão sem Access Token do Google Drive. Clique em "Autorizar Google Drive" para conceder permissão.'
      }
    }

    const tokenInfo = await this._inspectGoogleToken(candidateToken)
    if (!tokenInfo.valid || tokenInfo.hasDriveScope === false) {
      this._driveScopeProbe.set(candidateToken, false)
      return {
        step: 'missing-scope',
        email,
        hasDriveScope: false,
        message: 'O token atual não possui o escopo drive.file (ou expirou). Clique em "Autorizar Google Drive".'
      }
    }

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)', {
        headers: { Authorization: `Bearer ${candidateToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        this._saveSessionCachedToken('google-drive', email, candidateToken, tokenInfo.expiresIn)
        return {
          step: 'ok',
          email: data?.user?.emailAddress || email,
          driveUser: data?.user?.displayName || appUser?.name || '',
          hasDriveScope: true,
          message: `Google Drive API e permissão Google Docs ativas para ${data?.user?.emailAddress || email}.`
        }
      }

      const rawErr = await res.text()
      const errInfo = this._parseGoogleApiError(res.status, rawErr)
      if (errInfo.isApiDisabled) {
        return {
          step: 'api-disabled',
          email,
          hasDriveScope: true,
          activationUrl: errInfo.activationUrl || 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
          message: this._formatCloudError('google-drive', errInfo, rawErr)
        }
      }
      if (errInfo.isInsufficientScope) {
        this._driveScopeProbe.set(candidateToken, false)
        return {
          step: 'missing-scope',
          email,
          hasDriveScope: false,
          message: this._formatCloudError('google-drive', errInfo, rawErr)
        }
      }
      return {
        step: 'error',
        email,
        hasDriveScope: Boolean(tokenInfo.hasDriveScope),
        message: errInfo.message || `Erro HTTP ${res.status} ao consultar Google Drive API.`
      }
    } catch (err) {
      return {
        step: 'error',
        email,
        hasDriveScope: Boolean(tokenInfo.hasDriveScope),
        message: `Falha de rede ao consultar Google Drive API: ${err?.message || err}`
      }
    }
  }

  /**
   * Resolve um token OAuth2 válido com escopo de escrita em nuvem (Google Drive / OneDrive),
   * preservando o gesto do usuário quando um token de login antigo não possui escopo `drive.file`.
   */
  async resolveCloudAccessToken(provider, { forceRefresh = false } = {}) {
    const cloudCfg = this._syncInternalAuthConfig()
    const appUser = authService.getCurrentUser?.()
    const userEmail = appUser?.email || ''

    if (provider === 'google-drive' || provider === 'google') {
      if (cloudCfg.googleAuthToken && !forceRefresh) return cloudCfg.googleAuthToken
      if (forceRefresh) {
        this._invalidateCloudTokens('google-drive', userEmail)
      } else {
        const cached = this._getSessionCachedToken('google-drive', userEmail)
        if (cached) return cached

        if (appUser?.provider === 'google') {
          const candidate = appUser.socialAccessToken || ''
          const probedResult = candidate ? this._driveScopeProbe.get(candidate) : undefined
          if (candidate && probedResult === true) {
            return candidate
          }
          if (candidate && probedResult === undefined) {
            const info = await this._inspectGoogleToken(candidate)
            const hasScope = Boolean(info.valid && info.hasDriveScope !== false)
            this._driveScopeProbe.set(candidate, hasScope)
            if (hasScope) {
              this._saveSessionCachedToken('google-drive', userEmail, candidate, info.expiresIn)
              return candidate
            }
          }
        }
      }

      if (this.authController.accessToken) {
        this._invalidateCloudTokens('google-drive', userEmail)
      }
      const freshToken = (await this.authController.requestCloudAccessToken('google')) || ''
      if (freshToken) {
        const info = await this._inspectGoogleToken(freshToken)
        if (!info.valid || info.hasDriveScope === false) {
          throw new Error(
            'A permissão de acesso ao Google Drive (escopo drive.file) não foi concedida na tela de consentimento do Google.'
          )
        }
        this._driveScopeProbe.set(freshToken, true)
        this._saveSessionCachedToken('google-drive', userEmail, freshToken, info.expiresIn)
      }
      return freshToken
    }

    const storedAppToken = typeof authService.getAccessToken === 'function' ? await authService.getAccessToken() : ''
    const isJwtCredential = typeof storedAppToken === 'string' && storedAppToken.split('.').length === 3

    if (provider === 'onedrive' || provider === 'microsoft') {
      if (cloudCfg.oneDriveAuthToken && !forceRefresh) return cloudCfg.oneDriveAuthToken
      if (forceRefresh) {
        this._invalidateCloudTokens('onedrive', userEmail)
      } else {
        const cached = this._getSessionCachedToken('onedrive', userEmail)
        if (cached) return cached
        if (appUser?.provider === 'microsoft') {
          const candidate = appUser.socialAccessToken || (storedAppToken && !isJwtCredential ? storedAppToken : '')
          if (candidate) {
            this._saveSessionCachedToken('onedrive', userEmail, candidate, 3500)
            return candidate
          }
        }
      }
      const freshToken = (await this.authController.requestCloudAccessToken('microsoft')) || ''
      if (freshToken) {
        this._saveSessionCachedToken('onedrive', userEmail, freshToken, 3500)
      }
      return freshToken
    }

    return ''
  }

  /**
   * Localiza ou cria automaticamente a pasta inicial configurada (padrão APP-CAQDAS-HOME-DIR)
   * no Google Drive ou no OneDrive e salva seu ID real nas configurações locais.
   */
  async ensureCloudHomeFolderId(provider, token) {
    const cloudCfg = researchStorage.getCloudSyncConfig()
    const homeDirName = researchStorage.getHomeDirName()

    if (provider === 'google-drive') {
      if (cloudCfg.googleDriveFolderId) return cloudCfg.googleDriveFolderId
      if (!token) return ''

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
      } else {
        const errText = await searchRes.text()
        const errInfo = this._parseGoogleApiError(searchRes.status, errText)
        if (searchRes.status === 401 || searchRes.status === 403) {
          throw this._createDriveApiError(errInfo, 'google-drive')
        }
        console.warn('[CAQDAS] Consulta à pasta no Google Drive retornou erro:', searchRes.status, errText)
        return ''
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
      } else {
        const errText = await createRes.text()
        const errInfo = this._parseGoogleApiError(createRes.status, errText)
        if (createRes.status === 401 || createRes.status === 403) {
          throw this._createDriveApiError(errInfo, 'google-drive')
        }
        console.warn('[CAQDAS] Criação da pasta no Google Drive falhou:', createRes.status, errText)
      }
      return ''
    }

    if (provider === 'onedrive') {
      if (cloudCfg.oneDriveFolderId) return cloudCfg.oneDriveFolderId
      if (!token) return ''

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
      } else if (lookupRes.status === 404) {
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
        } else if (createRes.status === 401 || createRes.status === 403) {
          const err = new Error('Permissão insuficiente ou expirada para criar pasta no Microsoft OneDrive.')
          err.isDriveScopeError = true
          throw err
        }
      } else if (lookupRes.status === 401 || lookupRes.status === 403) {
        const err = new Error('Permissão insuficiente ou expirada para acessar o Microsoft OneDrive.')
        err.isDriveScopeError = true
        throw err
      }
      return ''
    }

    return ''
  }

  /**
   * Aplica automaticamente a configuração ativa de persistência (GDrive, OneDrive, Local ou REST)
   * e a pasta padrão inicial (APP-CAQDAS-HOME-DIR) nos 5 web components do fluxo.
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
    if (!isAuthenticated) {
      this._invalidateCloudTokens(null, '')
    }
    const rawProvider = isAuthenticated ? (cloudCfg.provider || 'local') : 'local'
    const effectiveProvider = rawProvider === 'local' ? 'rest' : rawProvider
    const allowCloudUpload = isAuthenticated && (rawProvider === 'google-drive' || rawProvider === 'onedrive')

    const googleTokenProvider = allowCloudUpload
      ? async () => {
          let token = await this.resolveCloudAccessToken('google-drive')
          if (token && !researchStorage.getCloudSyncConfig().googleDriveFolderId) {
            try {
              const folderId = await this.ensureCloudHomeFolderId('google-drive', token)
              if (folderId) {
                if (fileManager) fileManager.googleDriveFolderId = folderId
                if (documentPicker) documentPicker.googleDriveFolderId = folderId
              }
            } catch (err) {
              if (err?.isDriveScopeError && !researchStorage.getCloudSyncConfig().googleAuthToken) {
                token = await this.resolveCloudAccessToken('google-drive', { forceRefresh: true })
                if (token) {
                  const folderId = await this.ensureCloudHomeFolderId('google-drive', token)
                  if (folderId) {
                    if (fileManager) fileManager.googleDriveFolderId = folderId
                    if (documentPicker) documentPicker.googleDriveFolderId = folderId
                  }
                }
              } else {
                throw err
              }
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
          convertToGoogleDocs: false,
          googleDriveFolderId: cloudCfg.googleDriveFolderId || undefined,
          oneDriveFolderId: cloudCfg.oneDriveFolderId || undefined
        })
      } else {
        el.uploadController?.unbindSocialAuth?.()
      }

      el.storageProvider = effectiveProvider
      el.googleDriveFolderId = allowCloudUpload ? (cloudCfg.googleDriveFolderId || '') : ''
      el.oneDriveFolderId = allowCloudUpload ? (cloudCfg.oneDriveFolderId || '') : ''
      el.googleDriveConvertToDocs = false
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
        ? async (managedFile) => {
            const rawFile = await this._resolveUploadFilePayload(managedFile)
            const result = await this.uploadToPersonalCloud(rawFile, {
              convertToGoogleDocs: false,
              folderId: rawProvider === 'onedrive' ? cloudCfg.oneDriveFolderId : cloudCfg.googleDriveFolderId,
              context: { docId: managedFile.id, folder: managedFile.folder }
            })
            if (!result.success) {
              throw new Error(result.error || 'Falha ao sincronizar arquivo na nuvem.')
            }
            researchStorage.updateDocument(managedFile.id, {
              status: 'synced',
              storageProvider: result.provider,
              externalViewerUrl: result.externalViewerUrl,
              externalViewerLabel: result.externalViewerLabel,
              googleDriveFileId: result.fileId,
              syncedAt: Date.now()
            })
            return result
          }
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
   * Resolve o objeto File real (priorizando o arquivo binário salvo no IndexedDB/memória)
   * antes de recorrer a conteúdo textual, evitando o envio de stubs só com o nome do arquivo.
   */
  async _resolveUploadFilePayload(item) {
    if (!item) {
      throw new Error('Documento inválido para upload.')
    }
    if (item.file instanceof File || (item.file && typeof item.file.arrayBuffer === 'function')) {
      return item.file
    }
    const storedFile = await researchStorage.getBinaryFileAsync(item.id)
    if (storedFile) {
      return storedFile
    }

    const title = String(item.title || item.name || 'documento')
    const ext = String(
      item.extension ||
        (title.includes('.') ? title.slice(title.lastIndexOf('.')) : item.type === 'docx' ? '.docx' : '.txt')
    ).toLowerCase()
    const isBinaryFormat = researchStorage.isBinaryDocumentMeta(item)
    const text = typeof item.content === 'string' ? item.content : typeof item.textContent === 'string' ? item.textContent : ''

    if (isBinaryFormat || !text.trim()) {
      throw new Error(
        `O arquivo original "${title}" não está em cache neste navegador. Reimporte o arquivo em Fontes > Upload & Importação para enviá-lo na íntegra.`
      )
    }

    const hasDotExtension = /\.[a-z0-9]{2,5}$/i.test(title)
    const fileName = hasDotExtension ? title : `${title}${ext || '.txt'}`
    return new File([text], fileName, { type: 'text/plain; charset=UTF-8' })
  }

  /**
   * Sobrescreve o envio à nuvem pessoal para suportar a sessão do AppShell (authService)
   * e o provedor de persistência selecionado (Google Drive ou OneDrive), garantindo
   * validação de escopo Drive, recuperação automática de 401/403 por escopo insuficiente
   * e resolução da pasta inicial configurada (APP-CAQDAS-HOME-DIR).
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
    const hasManualToken = useOneDrive ? Boolean(cloudCfg.oneDriveAuthToken) : Boolean(cloudCfg.googleAuthToken)

    for (let attempt = 0; attempt < 2; attempt++) {
      let token = ''
      try {
        token = await this.resolveCloudAccessToken(targetCloud, { forceRefresh: attempt > 0 })
      } catch (err) {
        return {
          success: false,
          provider: targetCloud,
          error: err?.message || `Falha na autenticação ${useOneDrive ? 'Microsoft OneDrive' : 'Google Drive'}.`
        }
      }

      if (!token) {
        return {
          success: false,
          provider: targetCloud,
          error: `Autenticação ${useOneDrive ? 'Microsoft OneDrive' : 'Google Drive'} necessária para enviar o documento.`
        }
      }

      let resolvedFolderId = options.folderId || ''
      if (!resolvedFolderId) {
        try {
          resolvedFolderId = await this.ensureCloudHomeFolderId(targetCloud, token)
        } catch (err) {
          if (attempt === 0 && err?.isDriveScopeError && !hasManualToken) {
            this._invalidateCloudTokens(targetCloud, user?.email || '')
            continue
          }
          return {
            success: false,
            provider: targetCloud,
            error: err?.message || 'Não foi possível preparar a pasta de destino na nuvem.'
          }
        }
      }

      const overrideConfig =
        targetCloud === 'google-drive'
          ? {
              provider: 'google-drive',
              googleDriveConvertToDocs: false,
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
        return result
      }

      const errInfo = targetCloud === 'google-drive' ? this._parseGoogleApiError(null, result.error || '') : null
      if (attempt === 0 && targetCloud === 'google-drive' && errInfo?.isInsufficientScope && !hasManualToken) {
        this._invalidateCloudTokens('google-drive', user?.email || '')
        continue
      }

      return {
        ...result,
        error: this._formatCloudError(targetCloud, errInfo, result.error)
      }
    }

    return {
      success: false,
      provider: targetCloud,
      error: 'Não foi possível concluir o envio para a nuvem.'
    }
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
    let file
    try {
      file = await this._resolveUploadFilePayload(doc)
    } catch (err) {
      const targetCloud = researchStorage.getEffectivePersistenceProvider(this.currentUser) === 'onedrive' ? 'onedrive' : 'google-drive'
      return {
        success: false,
        provider: targetCloud,
        error: err?.message || 'Arquivo original indisponível para envio.'
      }
    }

    const result = await this.uploadToPersonalCloud(file, {
      convertToGoogleDocs: false,
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
