import { Icon } from './Icon'
import { useWorkspaceStore } from '../store/workspace'

export function ChatPanel(): React.JSX.Element {
  const toggleChat = useWorkspaceStore((s) => s.toggleChat)
  return (
    <div className="chat">
      <div className="chat__header">
        <span className="chat__title">Chat</span>
        <span className="chat__actions">
          <button title="New Chat">
            <Icon name="add" />
          </button>
          <button title="Past Conversations">
            <Icon name="history" />
          </button>
          <button title="More">
            <Icon name="ellipsis" />
          </button>
          <button title="Close" onClick={toggleChat}>
            <Icon name="close" />
          </button>
        </span>
      </div>

      <div className="chat__empty">
        <Icon name="circle-large-filled" className="chat__logo" />
        <h2>Build with Dotwork</h2>
        <p>Ask about your code, or hand a task to a dot.</p>
      </div>

      <div className="chat__composer">
        <textarea placeholder="Ask anything, @ to add context" rows={3} />
        <div className="chat__composer-bar">
          <button className="chip">
            <Icon name="infinity" /> Agent <Icon name="chevron-down" />
          </button>
          <button className="chip">
            Model <Icon name="chevron-down" />
          </button>
          <span className="chat__spacer" />
          <button title="Add Context" className="icon-btn">
            <Icon name="attach" />
          </button>
          <button title="Send" className="send-btn">
            <Icon name="arrow-up" />
          </button>
        </div>
      </div>
    </div>
  )
}
