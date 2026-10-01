import { Icon } from './Icon'
import { languageForPath } from './EditorArea'
import { useWorkspaceStore } from '../store/workspace'

export function StatusBar(): React.JSX.Element {
  const { rootPath, tabs, activeTabPath, cursor } = useWorkspaceStore()
  const activeTab = tabs.find((tab) => tab.path === activeTabPath)
  const lang = activeTab ? languageForPath(activeTab.path) : null

  return (
    <div className="status-bar">
      <div className="status-bar__group">
        <button className="status-bar__remote" title="Open a Remote Window">
          <Icon name="remote" />
        </button>
        {rootPath && (
          <button title="Checkout branch">
            <Icon name="git-branch" /> main
          </button>
        )}
        <button title="No Problems">
          <Icon name="error" /> 0 <Icon name="warning" /> 0
        </button>
        <button title="Dots">
          <Icon name="circle-large-filled" /> Dots: offline
        </button>
      </div>
      <div className="status-bar__group">
        {activeTab && (
          <>
            <button>
              Ln {cursor.line}, Col {cursor.column}
            </button>
            <button>Spaces: 2</button>
            <button>UTF-8</button>
            <button>LF</button>
            <button>{lang === 'plaintext' ? 'Plain Text' : lang}</button>
          </>
        )}
        <button title="Notifications">
          <Icon name="bell" />
        </button>
      </div>
    </div>
  )
}
