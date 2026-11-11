import { INITIAL_RESEARCH_DATA } from './sample-data.js'

const STORAGE_KEY = 'fzl_caqdas_research_data_v1'

class ResearchStorageService {
  constructor() {
    this._data = this._loadData()
  }

  _loadData() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.error('Error parsing stored research data:', e)
      }
    }
    this._saveData(INITIAL_RESEARCH_DATA)
    return JSON.parse(JSON.stringify(INITIAL_RESEARCH_DATA))
  }

  _saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('caqdas-data-changed', { detail: data }))
  }

  getProject() {
    return this._data.project
  }

  getCategories() {
    return this._data.categories || []
  }

  getCodes() {
    return this._data.codes || []
  }

  getDocuments() {
    return this._data.documents || []
  }

  getMemos() {
    return this._data.memos || []
  }

  addDocument(doc) {
    const newDoc = {
      id: doc.id || `doc-${Date.now()}`,
      quotations: [],
      ...doc
    }
    this._data.documents.push(newDoc)
    this._saveData(this._data)
    return newDoc
  }

  addQuotation(docId, quotation) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc) return null
    const newQuote = {
      id: `quote-${Date.now()}`,
      ...quotation
    }
    doc.quotations = doc.quotations || []
    doc.quotations.push(newQuote)
    this._saveData(this._data)
    return newQuote
  }

  removeQuotation(docId, quoteId) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc || !doc.quotations) return
    doc.quotations = doc.quotations.filter(q => q.id !== quoteId)
    this._saveData(this._data)
  }

  addCode(code) {
    const newCode = {
      id: code.id || `code-${Date.now()}`,
      color: code.color || '#006a6a',
      ...code
    }
    this._data.codes.push(newCode)
    this._saveData(this._data)
    return newCode
  }

  addCategory(cat) {
    const newCat = {
      id: cat.id || `cat-${Date.now()}`,
      color: cat.color || '#006a6a',
      ...cat
    }
    this._data.categories.push(newCat)
    this._saveData(this._data)
    return newCat
  }

  addMemo(memo) {
    const newMemo = {
      id: memo.id || `memo-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      ...memo
    }
    this._data.memos.push(newMemo)
    this._saveData(this._data)
    return newMemo
  }

  resetToDefault() {
    this._data = JSON.parse(JSON.stringify(INITIAL_RESEARCH_DATA))
    this._saveData(this._data)
  }
}

export const researchStorage = new ResearchStorageService()
