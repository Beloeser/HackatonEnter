import { spawn } from 'child_process'
import path from 'path'

export const runPythonScript = (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), 'backend', 'ml', scriptName)
    const pythonBin = process.env.PYTHON_BIN || 'python3'
    const python = spawn(pythonBin, [pythonPath, ...args])

    let output = ''
    let error = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
    })

    python.stderr.on('data', (data) => {
      error += data.toString()
    })

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || `Script falhou com código ${code}`))
      } else {
        try {
          resolve(JSON.parse(output))
        } catch (e) {
          resolve(output)
        }
      }
    })
  })
}
