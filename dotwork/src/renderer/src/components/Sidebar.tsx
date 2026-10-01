import { Icon } from './Icon'
import { Explorer } from './Explorer'
import { useWorkspaceStore } from '../store/workspace'

const PLACEHOLDERS = {
  search: { title: 'Search', note: 'Project-wide ripgrep search — not wired up yet.' },
  git: { title: 'Source Control', note: 'Status, stage and diff view — not wired up yet.' },
  dots: { title: 'Dots', note: 'List and create dots, live status — not wired up yet.' },
  inbox: { title: 'Dot Inbox', note: 'Review proposals from dots — not wired up yet.' }
}

export function Sidebar(): React.JSX.Element {
  const view = useWorkspaceStore((s) => s.activeView)
  if (view === 'explorer') return <Explorer />
  const { title, note } = PLACEHOLDERS[view]
  return (
    <div className="sidebar">
      <div className="sidebar__title">
        <span>{title}</span>
        <span className="sidebar__actions">
          <Icon name="ellipsis" />
        </span>
      </div>
      {view === 'search' && (
        <div className="search-box">
          <div className="input-row">
            <input placeholder="Search" />
            <Icon name="case-sensitive" />
            <Icon name="whole-word" />
            <Icon name="regex" />
          </div>
          <div className="input-row">
            <input placeholder="Replace" />
            <Icon name="replace-all" />
          </div>
        </div>
      )}
      <p className="sidebar__note">{note}</p>
    </div>
  )
}
