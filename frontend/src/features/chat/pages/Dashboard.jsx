import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import remarkGfm from 'remark-gfm'
import {
  Paperclip,
  X,
  ArrowUp,
  Plus,
  MessageSquare,
  Menu,
  FileText,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react'

const SUGGESTIONS = [
  'Explain a concept simply',
  'Summarize a document',
  'Brainstorm some ideas',
]

const Dashboard = () => {
  const chat = useChat()
  const [chatInput, setChatInput] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const chats = useSelector((state) => state.chat.chats)
  const currentchatId = useSelector((state) => state.chat.currentchatId)
  const isLoading = useSelector((state) => state.chat.isLoading)

  const chatList = Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  )
  const filteredChatList = chatList.filter((c) =>
    (c.title || 'New Chat').toLowerCase().includes(searchQuery.trim().toLowerCase())
  )
  const activeMessages = chats[currentchatId]?.messages || []

  useEffect(() => {
    chat.initializedsocketconnection()
    chat.handleGetChats()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  // auto-grow textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
  }, [chatInput])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  const removeSelectedImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setSelectedImage(null)
    setImagePreviewUrl(null)
  }

  // PDF is uploaded immediately on selection, not queued with the next message
  const handlePdfSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!currentchatId) {
      alert('Start a chat with a text message first, then attach a PDF.')
      return
    }

    setSelectedPdf(file)
    setPdfUploading(true)

    try {
      await chat.uploadPdfHandler({ file, chatId: currentchatId })
    } catch (err) {
      console.error('PDF upload failed', err)
      alert('Failed to process PDF. Please try again.')
      setSelectedPdf(null)
    } finally {
      setPdfUploading(false)
    }
  }

  const removeSelectedPdf = () => {
    setSelectedPdf(null)
  }

  const handleSubmitMessage = (event) => {
    event.preventDefault()
    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage && !selectedImage) return

    chat.sendmessagehandler({
      message: trimmedMessage,
      chatId: currentchatId,
      image: selectedImage,
    })

    setChatInput('')
    removeSelectedImage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmitMessage(event)
    }
  }

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
    setSidebarOpen(false)
  }

  const handleNewChat = () => {
    chat.startnewchat?.()
    setChatInput('')
    removeSelectedImage()
    removeSelectedPdf()
    setSidebarOpen(false)
  }

  const formatRelativeTime = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const SidebarContent = (
    <>
      <div className='mb-5 flex items-center gap-2.5 px-1'>
        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C86FF] to-[#565fcf]'>
          <Sparkles size={14} className='text-white' />
        </div>
        <h1 className='text-[15px] font-semibold tracking-tight text-white'>Perplexity</h1>
      </div>

      <button
        onClick={handleNewChat}
        type='button'
        className='mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] font-medium text-[#e4e4e7] transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C86FF]/40'
      >
        <Plus size={15} />
        New chat
      </button>

      {chatList.length > 0 && (
        <div className='relative mb-4'>
          <Search size={13} className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5c5f68]' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search chats'
            className='w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 pl-8 pr-2.5 text-[13px] text-[#e4e4e7] outline-none transition-colors duration-150 placeholder:text-[#5c5f68] focus:border-[#7C86FF]/40'
          />
        </div>
      )}

      {chatList.length > 0 && (
        <p className='mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-[#54565f]'>Recent</p>
      )}

      <div className='custom-scroll flex-1 space-y-0.5 overflow-y-auto'>
        {chatList.length === 0 && (
          <p className='px-2 py-4 text-center text-xs text-[#5c5f68]'>No conversations yet</p>
        )}

        {chatList.length > 0 && filteredChatList.length === 0 && (
          <p className='px-2 py-4 text-center text-xs text-[#5c5f68]'>No matches found</p>
        )}

        {filteredChatList.map((c) => {
          const isActive = c.id === currentchatId
          return (
            <button
              key={c.id}
              onClick={() => openChat(c.id)}
              type='button'
              className={`group relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C86FF]/40 ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-[#9a9da5] hover:bg-white/[0.03] hover:text-[#d5d6db]'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full transition-colors duration-150 ${
                  isActive ? 'bg-[#7C86FF]' : 'bg-transparent'
                }`}
              />
              <span className='truncate pl-1'>{(c.title || 'New Chat').replace(/\*\*/g, '')}</span>
              <span className='ml-auto shrink-0 text-[10px] text-[#54565f]'>{formatRelativeTime(c.lastUpdated)}</span>
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <main className='main flex h-screen w-full overflow-hidden bg-[#08090c] text-[#e4e4e7] antialiased'>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
      `}</style>

      {/* Desktop sidebar */}
      <aside className='hidden h-full w-[272px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0c10] p-3.5 md:flex'>
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className='fixed inset-0 z-40 md:hidden'>
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={() => setSidebarOpen(false)}
          />
          <aside className='absolute left-0 top-0 flex h-full w-[272px] flex-col border-r border-white/[0.06] bg-[#0b0c10] p-3.5 shadow-2xl animate-in slide-in-from-left duration-200'>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <section className='relative flex h-full min-w-0 flex-1 flex-col'>

        {/* Mobile top bar */}
        <div className='sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[#08090c]/85 px-3 py-3 backdrop-blur-md md:hidden'>
          <button
            onClick={() => setSidebarOpen(true)}
            type='button'
            className='flex h-9 w-9 items-center justify-center rounded-lg text-[#9a9da5] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white'
          >
            <Menu size={19} />
          </button>
          <h1 className='truncate text-[15px] font-semibold tracking-tight text-white'>
            {chats[currentchatId]?.title?.replace(/\*\*/g, '') || 'Perplexity'}
          </h1>
          <button
            onClick={handleNewChat}
            type='button'
            className='ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#9a9da5] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white'
          >
            <Plus size={19} />
          </button>
        </div>

        {/* Messages */}
        <div className='relative flex-1 overflow-hidden'>
          <div className='pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[#08090c] to-transparent' />

          <div className='custom-scroll h-full space-y-4 overflow-y-auto px-3 pb-4 pt-6 md:px-8 md:pt-8'>
            {activeMessages.length === 0 && (
              <div className='flex h-full flex-col items-center justify-center px-4 text-center'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]'>
                  <MessageSquare size={20} className='text-[#7C86FF]' />
                </div>
                <p className='text-[15px] font-medium text-[#d5d6db]'>
                  {currentchatId ? 'No messages yet' : 'Start a new conversation'}
                </p>
                <p className='mt-1 text-sm text-[#5c5f68]'>Ask anything, attach an image or a PDF to begin.</p>

                <div className='mt-5 flex flex-wrap justify-center gap-2'>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type='button'
                      onClick={() => setChatInput(s)}
                      className='rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-xs text-[#9a9da5] transition-colors duration-150 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white'
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((message, i) => {
              const isUser = message.role === 'user'
              return (
                <div
                  key={message.id || i}
                  className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isUser && (
                    <div className='mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C86FF]/15 text-[#9aa0ff]'>
                      <Sparkles size={12} />
                    </div>
                  )}

                  <div
                    className={`w-fit max-w-[82%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed md:max-w-[65%] md:text-[15px] ${
                      isUser
                        ? 'rounded-br-md bg-[#7C86FF]/12 border border-[#7C86FF]/20 text-white'
                        : 'rounded-bl-md border border-white/[0.06] bg-white/[0.03] text-[#d5d6db]'
                    }`}
                  >
                    {message.imageurl && (
                      <img src={message.imageurl} alt='attachment' className='mb-2 max-h-64 w-full rounded-xl object-cover' />
                    )}

                    {isUser ? (
                      message.content && <p className='whitespace-pre-wrap'>{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                          ul: ({ children }) => (
                            <ul className='mb-2 list-disc space-y-1 pl-5 marker:text-[#5c5f68]'>{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className='mb-2 list-decimal space-y-1 pl-5 marker:text-[#5c5f68]'>{children}</ol>
                          ),
                          li: ({ children }) => <li className='leading-relaxed'>{children}</li>,
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target='_blank'
                              rel='noreferrer'
                              className='text-[#9aa0ff] underline underline-offset-2 hover:text-[#b4b9ff]'
                            >
                              {children}
                            </a>
                          ),
                          strong: ({ children }) => <strong className='font-semibold text-white'>{children}</strong>,
                          code: ({ children }) => (
                            <code className='rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px]'>{children}</code>
                          ),
                          pre: ({ children }) => (
                            <pre className='mb-2 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 font-mono text-[13px]'>
                              {children}
                            </pre>
                          ),
                        }}
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className='flex items-end gap-2'>
                <div className='mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C86FF]/15 text-[#9aa0ff]'>
                  <Sparkles size={12} />
                </div>
                <div className='flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.03] px-4 py-3'>
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF] [animation-delay:-0.3s]' />
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF] [animation-delay:-0.15s]' />
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF]' />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className='px-3 pb-4 pt-2 md:px-8 md:pb-6'>
          <div className='mx-auto w-full max-w-3xl'>
            {imagePreviewUrl && (
              <div className='relative mb-2 overflow-hidden rounded-2xl border border-white/[0.06]'>
                <img src={imagePreviewUrl} alt='selected preview' className='max-h-56 w-full object-cover' />
                <button
                  type='button'
                  onClick={removeSelectedImage}
                  className='absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors duration-150 hover:bg-black/90'
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {selectedPdf && (
              <div className='mb-2 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2'>
                {pdfUploading ? (
                  <Loader2 size={16} className='shrink-0 animate-spin text-[#7C86FF]' />
                ) : (
                  <FileText size={16} className='shrink-0 text-[#7C86FF]' />
                )}
                <span className='truncate text-sm text-[#d5d6db]'>{selectedPdf.name}</span>
                <span className='shrink-0 text-xs text-[#5c5f68]'>
                  {pdfUploading ? 'Processing…' : 'Ready'}
                </span>
                <button
                  type='button'
                  onClick={removeSelectedPdf}
                  className='ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white'
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmitMessage}
              className='flex items-end gap-1 rounded-[26px] border border-white/[0.08] bg-[#111318] px-2.5 py-2 shadow-lg shadow-black/30 transition-colors duration-150 focus-within:border-[#7C86FF]/40'
            >
              <input type='file' accept='image/*' ref={fileInputRef} onChange={handleFileSelect} className='hidden' />
              <input type='file' accept='application/pdf' ref={pdfInputRef} onChange={handlePdfSelect} className='hidden' />

              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white'
                title='Attach image'
              >
                <Paperclip size={18} />
              </button>

              <button
                type='button'
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfUploading}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white disabled:opacity-40'
                title='Attach PDF'
              >
                <FileText size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Message Perplexity...'
                rows={1}
                className='max-h-[200px] w-full resize-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-[#5c5f68]'
              />

              <button
                type='submit'
                disabled={!chatInput.trim() && !selectedImage}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C86FF] text-white transition-colors duration-150 hover:bg-[#8b93ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-[#5c5f68]'
              >
                <ArrowUp size={17} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard;