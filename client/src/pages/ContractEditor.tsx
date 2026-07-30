import { ChatbotPanel } from '@/components/chatbot/ChatbotPanel'
import { DocumentEditor } from '@/components/draft/DocumentEditor'

export function ContractEditor() {
  return (
    <div className="h-full flex flex-col lg:flex-row w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in min-h-[700px]">
      
      {/* Left Pane: Chatbot */}
      <div className="w-full lg:w-[400px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-background flex flex-col">
        <ChatbotPanel />
      </div>

      {/* Right Pane: Document Editor */}
      <div className="flex-1 min-w-0 bg-background flex flex-col relative">
        <DocumentEditor />
      </div>

    </div>
  )
}
