import { useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { Send, Sparkles, User } from 'lucide-react'

const Panel = styled.aside`
  grid-column: 4;
  grid-row: 2;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 420px;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: -1px 0 0 rgba(15, 23, 42, 0.03);
`

const Header = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 18px 24px;
`

const HeaderTitle = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
`

const HeaderCopy = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const BotIcon = styled.div`
  display: flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #ffb300;
  color: #111827;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.15);
`

const HeaderText = styled.h2`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`

const HeaderContext = styled.p`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
`

const CloseButton = styled.button`
  display: flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #9ca3af;
  font-size: 22px;
  font-weight: 300;
  line-height: 1;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #6b7280;
  }
`

const Body = styled.div`
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  background: #fafbfc;
  padding: 24px;
`

const MessageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const BotMessageRow = styled.div`
  display: flex;
  gap: 14px;
`

const UserMessageRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 14px;
`

const MiniBotIcon = styled(BotIcon)`
  align-self: flex-start;
`

const UserAvatar = styled.div`
  display: flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
`

const BotBubble = styled.div`
  max-width: calc(100% - 48px);
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  border-top-left-radius: 6px;
  background: #ffffff;
  padding: 16px 20px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
`

const UserBubble = styled.div`
  max-width: min(85%, 320px);
  border: 1px solid #1f2937;
  border-radius: 14px;
  border-top-right-radius: 6px;
  background: #1a1a1a;
  padding: 16px 20px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
`

const Footer = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 20px 24px 24px;
`

const InputForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

const MessageInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 48px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 0 16px;
  color: #111827;
  font-size: 15px;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #ffb300;
    box-shadow: 0 0 0 2px rgba(255, 179, 0, 0.25);
  }
`

const SendButton = styled.button`
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: ${({ $disabled }) => ($disabled ? '#fde7a2' : '#ffb300')};
  color: #111827;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ $disabled }) => ($disabled ? '#fde7a2' : '#e6a200')};
  }
`

const ErrorText = styled.p`
  margin: 0;
  color: #dc2626;
  font-size: 12px;
  line-height: 1.4;
`

const LoadingText = styled.span`
  color: #6b7280;
  font-size: 13px;
`

const BottomAnchor = styled.div`
  height: 1px;
`

export default function AssistantPanel({
  isOpen,
  onClose,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  error,
  contextLabel,
  contextDescription,
}) {
  const bottomRef = useRef(null)

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isLoading, [inputValue, isLoading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (!isOpen) {
    return null
  }

  return (
    <Panel>
      <Header>
        <HeaderTitle>
          <BotIcon>
            <Sparkles size={18} strokeWidth={2} />
          </BotIcon>
          <HeaderCopy>
            <HeaderText>Assistente IA</HeaderText>
            <HeaderContext>{contextDescription}: {contextLabel}</HeaderContext>
          </HeaderCopy>
        </HeaderTitle>

        <CloseButton type="button" onClick={onClose} aria-label="Fechar chat">
          x
        </CloseButton>
      </Header>

      <Body>
        <MessageStack>
          {messages.map((message) => {
            if (message.role === 'assistant') {
              return (
                <BotMessageRow key={message.id}>
                  <MiniBotIcon>
                    <Sparkles size={18} strokeWidth={2} />
                  </MiniBotIcon>
                  <BotBubble>{message.content}</BotBubble>
                </BotMessageRow>
              )
            }

            return (
              <UserMessageRow key={message.id}>
                <UserBubble>{message.content}</UserBubble>
                <UserAvatar>
                  <User size={18} strokeWidth={2} />
                </UserAvatar>
              </UserMessageRow>
            )
          })}

          {isLoading && (
            <BotMessageRow>
              <MiniBotIcon>
                <Sparkles size={18} strokeWidth={2} />
              </MiniBotIcon>
              <BotBubble>
                <LoadingText>Pensando...</LoadingText>
              </BotBubble>
            </BotMessageRow>
          )}

          <BottomAnchor ref={bottomRef} />
        </MessageStack>
      </Body>

      <Footer>
        <InputForm
          onSubmit={(event) => {
            event.preventDefault()
            onSendMessage()
          }}
        >
          <InputRow>
            <MessageInput
              type="text"
              placeholder="Digite sua mensagem..."
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
            />
            <SendButton type="submit" $disabled={!canSend} disabled={!canSend} aria-label="Enviar mensagem">
              <Send size={20} strokeWidth={2} />
            </SendButton>
          </InputRow>

          {error ? <ErrorText>{error}</ErrorText> : null}
        </InputForm>
      </Footer>
    </Panel>
  )
}
