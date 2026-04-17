import { useState } from 'react'
import {
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  MessageSquare,
  Settings,
  Folder,
  FileText,
  Clock,
  TrendingUp,
  User,
  Sparkles,
  Send,
} from 'lucide-react'

const GRID_OPEN = {
  display: 'grid',
  gridTemplateColumns: '76px 360px minmax(0, 1fr) 420px',
  gridTemplateRows: '96px minmax(0, 1fr)',
  minHeight: 0,
  minWidth: 0,
}

const GRID_CLOSED = {
  display: 'grid',
  gridTemplateColumns: '76px 360px minmax(0, 1fr)',
  gridTemplateRows: '96px minmax(0, 1fr)',
  minHeight: 0,
  minWidth: 0,
}

export default function HomeScreen() {
  const [selectedFolder, setSelectedFolder] = useState(0)
  const [viewMode, setViewMode] = useState('list')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [sidebarActive, setSidebarActive] = useState('chat')

  const folders = [
    { id: 0, name: 'Processos Ativos', count: 24, icon: Folder },
    { id: 1, name: 'Em Análise', count: 8, icon: TrendingUp },
    { id: 2, name: 'Aguardando Decisão', count: 12, icon: Clock },
    { id: 3, name: 'Arquivados', count: 156, icon: FileText },
    { id: 4, name: 'Urgentes', count: 3, icon: Sparkles },
  ]

  const documents = [
    { id: 1, title: 'Processo 0001234-56.2026.8.26.0100', type: 'Ação Civil Pública', date: '15/04/2026', status: 'Em andamento' },
    { id: 2, title: 'Processo 0007890-12.2026.8.26.0224', type: 'Recurso de Apelação', date: '14/04/2026', status: 'Aguardando análise' },
    { id: 3, title: 'Processo 0003456-78.2026.8.26.0587', type: 'Petição Inicial', date: '12/04/2026', status: 'Protocolado' },
    { id: 4, title: 'Processo 0009876-54.2026.8.26.0344', type: 'Mandado de Segurança', date: '10/04/2026', status: 'Em andamento' },
    { id: 5, title: 'Processo 0002468-13.2026.8.26.0176', type: 'Ação Trabalhista', date: '08/04/2026', status: 'Audiência agendada' },
  ]

  const topbarPlacement = isChatOpen
    ? { gridColumn: '2 / 5', gridRow: '1' }
    : { gridColumn: '2 / 4', gridRow: '1' }

  return (
    <div
      className="h-full min-h-0 w-full overflow-hidden bg-[#F3F4F6]"
      style={isChatOpen ? GRID_OPEN : GRID_CLOSED}
    >
      {/* 1) Sidebar — coluna 1, altura total */}
      <aside
        className="flex min-h-0 w-full flex-col items-center bg-[#0B0B0B] pt-9 pb-9"
        style={{ gridColumn: '1', gridRow: '1 / -1' }}
      >
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFB300] text-[#111827] shadow-[0_2px_14px_rgba(255,179,0,0.38)] transition hover:brightness-105"
          aria-label="Perfil"
        >
          <User className="h-5 w-5" strokeWidth={2} />
        </button>

        <nav className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-12" aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => setSidebarActive('chat')}
            className={`relative flex h-11 w-full shrink-0 items-center justify-center rounded-[10px] transition-colors ${
              sidebarActive === 'chat'
                ? 'text-[#FFB300]'
                : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100'
            }`}
            aria-label="Mensagens"
            aria-current={sidebarActive === 'chat' ? 'true' : undefined}
          >
            {sidebarActive === 'chat' && (
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-sm bg-[#FFB300]"
                aria-hidden
              />
            )}
            <MessageSquare className="h-5 w-5" strokeWidth={sidebarActive === 'chat' ? 2 : 1.75} />
          </button>
          <button
            type="button"
            onClick={() => setSidebarActive('settings')}
            className={`relative flex h-11 w-full shrink-0 items-center justify-center rounded-[10px] transition-colors ${
              sidebarActive === 'settings'
                ? 'text-[#FFB300]'
                : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100'
            }`}
            aria-label="Configurações"
            aria-current={sidebarActive === 'settings' ? 'true' : undefined}
          >
            {sidebarActive === 'settings' && (
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-sm bg-[#FFB300]"
                aria-hidden
              />
            )}
            <Settings className="h-5 w-5" strokeWidth={sidebarActive === 'settings' ? 2 : 1.75} />
          </button>
        </nav>
      </aside>

      {/* Topbar — colunas 2–4 (ou 2–3 sem chat) */}
      <header
        className="flex min-h-0 items-center justify-between gap-10 overflow-hidden border-b border-[#E5E7EB] bg-white px-8 py-0 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        style={topbarPlacement}
      >
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Pesquisar processos, documentos..."
              className="h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white py-[13px] pl-12 pr-4 text-[15px] font-normal leading-[1.45] text-[#111827] placeholder:text-[#9CA3AF] transition-shadow focus:border-[#FFB300] focus:outline-none focus:ring-2 focus:ring-[#FFB300]/25"
            />
          </div>
          <button
            type="button"
            className="flex h-12 shrink-0 items-center gap-2.5 rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[15px] font-medium leading-none text-[#374151] transition-colors hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
          >
            <Filter className="h-[18px] w-[18px] text-[#6B7280]" strokeWidth={2} />
            Filtros
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <div className="flex items-center gap-0.5 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-1.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors ${
                viewMode === 'list' ? 'bg-[#FFB300] text-[#111827] shadow-sm' : 'text-[#6B7280] hover:bg-white'
              }`}
              aria-label="Lista"
            >
              <LayoutList className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors ${
                viewMode === 'grid' ? 'bg-[#FFB300] text-[#111827] shadow-sm' : 'text-[#6B7280] hover:bg-white'
              }`}
              aria-label="Grade"
            >
              <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex h-12 shrink-0 items-center gap-2.5 rounded-[10px] bg-[#FFB300] px-6 text-[15px] font-semibold leading-none tracking-tight text-[#111827] shadow-sm transition-colors hover:bg-[#E6A200]"
          >
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
            IA Chat
          </button>
        </div>
      </header>

      {/* 2) Pastas — coluna 2, linha 2 */}
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[#E5E7EB] bg-white shadow-[1px_0_0_rgba(15,23,42,0.03)]"
        style={{ gridColumn: '2', gridRow: '2' }}
      >
        <div className="shrink-0 border-b border-[#E5E7EB] px-6 pb-5 pt-7">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.02em] text-[#111827]">Pastas</h2>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-[#E5E7EB] overflow-y-auto">
          {folders.map((folder) => {
            const active = selectedFolder === folder.id
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex w-full items-center gap-4 px-6 py-[18px] text-left transition-colors ${
                  active
                    ? 'bg-[#FFFBF0] ring-1 ring-inset ring-[#F5E9C8]'
                    : 'bg-transparent hover:bg-[#FAFAFA]'
                }`}
              >
                <span className="flex w-9 shrink-0 items-center justify-center">
                  <folder.icon
                    className={`h-5 w-5 ${active ? 'text-[#B45309]' : 'text-[#6B7280]'}`}
                    strokeWidth={active ? 2 : 1.75}
                  />
                </span>
                <span
                  className={`min-w-0 flex-1 text-[15px] leading-[1.4] ${
                    active ? 'font-bold text-[#111827]' : 'font-normal text-[#4B5563]'
                  }`}
                >
                  {folder.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold tabular-nums leading-none ${
                    active
                      ? 'border border-[#E8D48A] bg-[#FFF4D6] text-[#713F12]'
                      : 'border border-transparent bg-[#F3F4F6] text-[#4B5563]'
                  }`}
                >
                  {folder.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3) Conteúdo — coluna 3, linha 2 */}
      <main
        className="min-h-0 min-w-0 overflow-y-auto bg-[#F3F4F6] px-10 py-8 sm:px-12"
        style={{ gridColumn: '3', gridRow: '2' }}
      >
        <div className="mb-8 text-left">
          <h1 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-[#111827]">
            {folders.find((f) => f.id === selectedFolder)?.name}
          </h1>
          <p className="mt-2 text-[15px] font-normal leading-snug text-[#6B7280]">
            {documents.length} processos encontrados
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="rounded-[10px] border border-[#E5E7EB] bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-shadow hover:border-[#E8E8E8] hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]"
            >
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-[15px] font-bold leading-[1.45] tracking-tight text-[#111827]">{doc.title}</h3>
                  <p className="mt-2.5 text-[14px] font-normal leading-relaxed text-[#6B7280]">{doc.type}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#E8D48A] bg-[#FFFCF5] px-3 py-1.5 text-center text-[12px] font-semibold leading-tight tracking-tight text-[#92400E]">
                  {doc.status}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-left text-[13px] font-normal leading-normal tracking-wide text-[#9CA3AF]">
                <Clock className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                <span>{doc.date}</span>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* 4) Chat — coluna 4, linha 2 */}
      {isChatOpen && (
        <div
          className="flex min-h-0 w-full min-w-0 max-w-[420px] flex-col overflow-hidden border-l border-[#E5E7EB] bg-white shadow-[-1px_0_0_rgba(15,23,42,0.03)]"
          style={{ gridColumn: '4', gridRow: '2' }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-6 py-[18px]">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFB300] text-[#111827] shadow-sm">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
              </div>
              <h2 className="truncate text-lg font-bold leading-tight tracking-[-0.02em] text-[#111827]">Assistente IA</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
              aria-label="Fechar chat"
            >
              <span className="text-lg font-light leading-none">✕</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFBFC] px-6 py-6">
            <div className="flex flex-col gap-7">
              <div className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-[10px] bg-[#FFB300] text-[#111827] shadow-sm">
                  <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 max-w-[calc(100%-3rem)] rounded-[14px] rounded-tl-[6px] border border-[#E5E7EB] bg-white px-5 py-4 text-left text-[14px] font-normal leading-[1.55] text-[#1F2937] shadow-sm">
                  Olá! Sou seu assistente jurídico inteligente. Como posso ajudá-lo hoje?
                </div>
              </div>

              <div className="flex items-end justify-end gap-3.5">
                <div className="max-w-[min(85%,20rem)] rounded-[14px] rounded-tr-[6px] border border-[#1F2937] bg-[#1A1A1A] px-5 py-4 text-left text-[14px] font-normal leading-[1.55] text-white shadow-sm">
                  Pode analisar o Processo 0001234-56.2026?
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6]">
                  <User className="h-[18px] w-[18px] text-[#6B7280]" strokeWidth={2} />
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-[10px] bg-[#FFB300] text-[#111827] shadow-sm">
                  <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 max-w-[calc(100%-3rem)] rounded-[14px] rounded-tl-[6px] border border-[#E5E7EB] bg-white px-5 py-4 text-left text-[14px] leading-[1.55] text-[#1F2937] shadow-sm">
                  <p className="mb-3.5 font-normal leading-[1.5]">Analisando o processo... Aqui está um resumo:</p>
                  <ul className="list-disc space-y-2.5 pl-5 text-[14px] leading-[1.5] text-[#4B5563]">
                    <li>Tipo: Ação Civil Pública</li>
                    <li>Status: Em andamento</li>
                    <li>Próxima audiência: 22/04/2026</li>
                    <li>Recomendação: Revisar documentação anexa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-6 pb-6 pt-5">
            <div className="flex items-center gap-3.5">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="h-12 min-w-0 flex-1 rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-[15px] font-normal leading-normal text-[#111827] placeholder:text-[#9CA3AF] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-[#FFB300] focus:outline-none focus:ring-2 focus:ring-[#FFB300]/25"
              />
              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFB300] text-[#111827] shadow-sm transition-colors hover:bg-[#E6A200]"
                aria-label="Enviar mensagem"
              >
                <Send className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
