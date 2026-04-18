import { runPythonScript } from '../utils/pythonRunner.js'

const safeString = (value) => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

const appendContratosCsvArg = (args, contratosCsv) => {
  const csv = safeString(contratosCsv)
  if (csv) {
    args.push('--contratos-csv', csv)
  }
}

export const listarContratosEmAndamento = async (req, res) => {
  try {
    const contratosCsv = req.query?.contratosCsv

    const args = ['--listar-contratos-json']
    appendContratosCsvArg(args, contratosCsv)

    const result = await runPythonScript('analise.py', args)

    if (!result || result.status !== 'success') {
      return res.status(500).json({
        success: false,
        message: 'Falha ao listar contratos em andamento.',
        details: result,
      })
    }

    return res.status(200).json({
      success: true,
      total: result.total,
      contratos: result.contratos,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const analisarContratoSelecionado = async (req, res) => {
  try {
    const { numeroProcesso, indice, contratosCsv, output } = req.body ?? {}

    const numero = safeString(numeroProcesso)
    const hasIndice = indice !== undefined && indice !== null && String(indice).trim() !== ''

    if (!numero && !hasIndice) {
      return res.status(400).json({
        success: false,
        message: 'Informe numeroProcesso ou indice para analisar o contrato.',
      })
    }

    if (numero && hasIndice) {
      return res.status(400).json({
        success: false,
        message: 'Use apenas um critério: numeroProcesso OU indice.',
      })
    }

    const selectedOutput = safeString(output)
    const outputArg = selectedOutput === 'completo' ? 'completo' : 'resumo'

    const args = ['--output', outputArg]

    if (numero) {
      args.push('--contrato-processo', numero)
    } else {
      const parsedIndice = Number.parseInt(String(indice), 10)
      if (Number.isNaN(parsedIndice) || parsedIndice < 0) {
        return res.status(400).json({
          success: false,
          message: `indice inválido: ${indice}`,
        })
      }
      args.push('--contrato-indice', String(parsedIndice))
    }

    appendContratosCsvArg(args, contratosCsv)

    const result = await runPythonScript('analise.py', args)

    if (!result || result.status === 'error') {
      return res.status(400).json({
        success: false,
        message: 'Falha ao analisar contrato.',
        details: result,
      })
    }

    return res.status(200).json({
      success: true,
      resultado: result,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
