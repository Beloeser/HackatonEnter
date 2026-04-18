import Case from '../models/CaseModel.js'
import mongoose from 'mongoose'

function normalizeStatus(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function mapStatusToFolderId(status) {
  const normalized = normalizeStatus(status)

  if (
    normalized.includes('urgente') ||
    normalized.includes('prazo') ||
    normalized.includes('liminar')
  ) {
    return 4
  }

  if (
    normalized.includes('arquiv') ||
    normalized.includes('baixado') ||
    normalized.includes('transito')
  ) {
    return 3
  }

  if (
    normalized.includes('aguardando') ||
    normalized.includes('pendente') ||
    normalized.includes('concluso') ||
    normalized.includes('despacho')
  ) {
    return 2
  }

  if (
    normalized.includes('analise') ||
    normalized.includes('triagem') ||
    normalized.includes('revisao')
  ) {
    return 1
  }

  return 0
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function mapCaseToDocument(caseItem) {
  return {
    id: String(caseItem._id),
    folderId: mapStatusToFolderId(caseItem.status),
    title: `Processo ${caseItem.processNumber}`,
    type: caseItem.subject || 'Assunto nao informado',
    subType: caseItem.subSubject || '',
    date: formatDate(caseItem.updatedAt || caseItem.createdAt),
    status: caseItem.status || 'em_analise',
    processNumber: caseItem.processNumber,
    uf: caseItem.uf,
    claimValue: caseItem.claimValue,
    condemnationValue: caseItem.condemnationValue,
    macroResult: caseItem.macroResult,
    microResult: caseItem.microResult,
    recommendation: caseItem.recommendation || {},
    result: caseItem.result || {},
    assignedLawyerId: caseItem.assignedLawyerId ? String(caseItem.assignedLawyerId) : null,
  }
}

export const listCases = async (req, res) => {
  try {
    const cases = await Case.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()

    const documents = cases.map(mapCaseToDocument)

    return res.status(200).json({
      success: true,
      total: documents.length,
      data: documents,
    })
  } catch (error) {
    console.error('Erro ao listar processos:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar processos.',
    })
  }
}

export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de processo invalido.',
      })
    }

    const caseItem = await Case.findById(id).lean()

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Processo nao encontrado.',
      })
    }

    return res.status(200).json({
      success: true,
      data: mapCaseToDocument(caseItem),
    })
  } catch (error) {
    console.error('Erro ao buscar processo por ID:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar processo.',
    })
  }
}
