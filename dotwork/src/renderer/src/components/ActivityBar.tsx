import { Icon } from './Icon'
import { ActivityView, useWorkspaceStore } from '../store/workspace'

const ITEMS: { id: ActivityView; label: string; icon: string }[] = [
  { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: 'files' },
  { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: 'search' },
  { id: 'git', label: 'Source Control (Ctrl+Shift+G)', icon: 'source-control' },
  { id: 'dots', label: 'Dots', icon: 'circle-large-filled' },
  { id: 'inbox', label: 'Dot Inbox', icon: 'inbox' }
]

export function ActivityBar(): React.JSX.Element {
  const { activeView, sidebarVisible, setActiveView } = useWorkspaceStore()
  return (
    <div className="activity-bar">
      <div className="activity-bar__group">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            title={item.label}
            className={`activity-bar__item${activeView === item.id && sidebarVisible ? ' activity-bar__item--active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <Icon name={item.icon} />
          </button>
        ))}
      </div>
      <div className="activity-bar__group">
        <button className="activity-bar__item" title="Accounts">
          <Icon name="account" />
        </button>
        <button className="activity-bar__item" title="Manage">
          <Icon name="settings-gear" />
        </button>
      </div>
    </div>
  )
}
