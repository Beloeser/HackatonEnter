import User from '../models/UserModel.js'

export const login = async (req, res) => {
  try {
    const { username, password } = req.body ?? {}

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios.'
      })
    }

    const normalizedUsername = String(username).trim()
    const user = await User.findOne({ username: normalizedUsername })

    if (!user || user.password !== String(password)) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar login.'
    })
  }
}
