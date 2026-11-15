/**
 * @license
 * FZL CAQDAS — Controladores Reativos Especializados para Pesquisa Qualitativa
 *
 * Estende e especializa os controllers headless do ecossistema FZL:
 * - FzlPersonalCloudDocsController -> CaqdasPersonalCloudDocsController (envio direto e sincronização com Google Docs)
 * - FzlDocxReaderController -> CaqdasDocxCodingController (decomposição em Unidades de Registro de Bardin)
 * - FzlBookmarksController -> CaqdasBookmarksController (favoritos e destaque de documentos do corpus)
 */

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
    super(host, {
      convertToGoogleDocs: cloudCfg.googleDriveConvertToDocs ?? true,
      googleDriveFolderId: cloudCfg.googleDriveFolderId || undefined,
      oneDriveFolderId: cloudCfg.oneDriveFolderId || undefined,
      ...options
    })
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
      const ext = file.name.slice(file.name.lastIndexOf('.'))
      targetDoc = researchStorage.addDocument({
        title: file.name,
        participant: user.name || 'Pesquisador',
        group: 'Nuvem Pessoal',
        folder: '/documentos',
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
   * com o Google Docs do pesquisador.
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
