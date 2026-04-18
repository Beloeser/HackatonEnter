import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { AlertCircle, Eye, EyeOff, Gavel, Scale, ShieldCheck } from 'lucide-react'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Page = styled.section`
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 179, 0, 0.2), transparent 28%),
    radial-gradient(circle at 86% 80%, rgba(249, 180, 55, 0.18), transparent 30%),
    linear-gradient(148deg, #0b0b0b 0%, #1d1d1d 54%, #0f0f0f 100%);

  @media (max-width: 800px) {
    padding: 16px;
  }
`

const Shell = styled.div`
  width: min(1120px, 100%);
  min-height: min(92vh, 760px);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`

const Showcase = styled.aside`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 22%, rgba(255, 179, 0, 0.27), transparent 35%),
    radial-gradient(circle at 24% 88%, rgba(255, 179, 0, 0.18), transparent 42%),
    linear-gradient(162deg, #111111 0%, #1a1a1a 46%, #0e0e0e 100%);
  color: #f8fafc;
  padding: 52px 48px;

  &::after {
    content: '';
    position: absolute;
    right: -120px;
    bottom: -140px;
    width: 320px;
    height: 320px;
    border-radius: 999px;
    border: 1px solid rgba(255, 179, 0, 0.3);
  }

  @media (max-width: 980px) {
    padding: 36px 24px 30px;
  }
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 34px;
  animation: ${fadeInUp} 0.4s ease both;
`

const BrandMark = styled.div`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffb300, #e2a005);
  color: #121212;
  font-weight: 800;
  letter-spacing: 0.02em;
`

const BrandName = styled.h1`
  font-size: 19px;
  letter-spacing: 0.01em;
  font-weight: 700;
  margin: 0;
`

const HeroTitle = styled.h2`
  margin: 0;
  max-width: 420px;
  font-size: clamp(30px, 3.7vw, 44px);
  line-height: 1.08;
  letter-spacing: -0.02em;
  animation: ${fadeInUp} 0.45s ease 0.08s both;
`

const HeroSubtitle = styled.p`
  margin: 16px 0 0;
  max-width: 440px;
  color: rgba(248, 250, 252, 0.82);
  font-size: 15px;
  line-height: 1.65;
  animation: ${fadeInUp} 0.45s ease 0.16s both;
`

const FeatureList = styled.ul`
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: grid;
  gap: 14px;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  animation: ${fadeInUp} 0.45s ease ${({ $delay }) => `${$delay}s`} both;
`

const FeatureText = styled.span`
  color: rgba(248, 250, 252, 0.9);
  font-size: 13px;
  line-height: 1.45;
`

const Auth = styled.section`
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  padding: 52px 46px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 980px) {
    padding: 34px 24px 28px;
  }
`

const AuthHeader = styled.div`
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.42s ease 0.12s both;
`

const AuthTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 28px;
  letter-spacing: -0.02em;
`

const AuthSubtitle = styled.p`
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
`

const Form = styled.form`
  display: grid;
  gap: 16px;
  animation: ${fadeInUp} 0.45s ease 0.2s both;
`

const Field = styled.label`
  display: grid;
  gap: 7px;
`

const Label = styled.span`
  color: #374151;
  font-size: 13px;
  font-weight: 600;
`

const Input = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid ${({ $error }) => ($error ? '#ef4444' : '#e5e7eb')};
  border-radius: 10px;
  background: #ffffff;
  padding: 0 14px;
  font-size: 15px;
  color: #111827;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#ffb300')};
    box-shadow: 0 0 0 2px
      ${({ $error }) => ($error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 179, 0, 0.22)')};
  }
`

const PasswordField = styled.div`
  position: relative;
`

const PasswordInput = styled(Input)`
  padding-right: 44px;
`

const TogglePassword = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #6b7280;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
`

const Error = styled.p`
  margin: -2px 0 0;
  font-size: 12px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 6px;
`

const FormFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
`

const Remember = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
`

const Checkbox = styled.input`
  accent-color: #ffb300;
  width: 15px;
  height: 15px;
`

const LinkButton = styled.button`
  border: 0;
  background: transparent;
  color: #9f6700;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`

const Submit = styled.button`
  margin-top: 2px;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffb300, #e2a005);
  color: #101010;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 16px rgba(255, 179, 0, 0.25);
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;

  &:hover {
    filter: brightness(1.02);
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(255, 179, 0, 0.3);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    filter: saturate(0.7) brightness(0.98);
  }
`

const BottomText = styled.p`
  margin: 16px 0 0;
  color: #6b7280;
  font-size: 13px;
  text-align: center;
`

export default function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha para continuar.')
      return
    }

    setError('')
    setIsSubmitting(true)

    // Mock de autenticacao para navegacao local.
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (remember) {
      localStorage.setItem('coffeebreakers.last_email', email.trim())
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <Page>
      <Shell>
        <Showcase>
          <Brand>
            <BrandMark>CB</BrandMark>
            <BrandName>CoffeeBreakers Legal</BrandName>
          </Brand>

          <HeroTitle>Controle juridico com contexto e velocidade de decisao.</HeroTitle>
          <HeroSubtitle>
            Entre no painel para acompanhar processos, conversar com IA juridica e priorizar
            prazos criticos em um fluxo unico.
          </HeroSubtitle>

          <FeatureList>
            <FeatureItem $delay={0.24}>
              <Scale size={16} />
              <FeatureText>Visao centralizada de processos ativos e em analise.</FeatureText>
            </FeatureItem>
            <FeatureItem $delay={0.3}>
              <ShieldCheck size={16} />
              <FeatureText>Historico persistente por pasta e por processo.</FeatureText>
            </FeatureItem>
            <FeatureItem $delay={0.36}>
              <Gavel size={16} />
              <FeatureText>Assistente IA orientado para linguagem juridica.</FeatureText>
            </FeatureItem>
          </FeatureList>
        </Showcase>

        <Auth>
          <AuthHeader>
            <AuthTitle>Entrar na Plataforma</AuthTitle>
            <AuthSubtitle>Acesse com seu e-mail corporativo.</AuthSubtitle>
          </AuthHeader>

          <Form onSubmit={handleSubmit}>
            <Field>
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="nome@escritorio.com.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                $error={Boolean(error)}
              />
            </Field>

            <Field>
              <Label>Senha</Label>
              <PasswordField>
                <PasswordInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  $error={Boolean(error)}
                />
                <TogglePassword
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </TogglePassword>
              </PasswordField>
            </Field>

            {error ? (
              <Error>
                <AlertCircle size={14} />
                {error}
              </Error>
            ) : null}

            <FormFooter>
              <Remember>
                <Checkbox
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Manter conectado
              </Remember>
              <LinkButton type="button">Esqueci minha senha</LinkButton>
            </FormFooter>

            <Submit type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar no Dashboard'}
            </Submit>
          </Form>

          <BottomText>Ambiente seguro. Acesso restrito para usuarios autorizados.</BottomText>
        </Auth>
      </Shell>
    </Page>
  )
}
