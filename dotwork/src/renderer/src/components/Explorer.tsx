import { Icon } from './Icon'
import { useWorkspaceStore } from '../store/workspace'
import type { FileEntry } from '../../../shared/ipc'

export function fileIcon(name: string): { icon: string; color: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, [string, string]> = {
    ts: ['symbol-file', '#3178c6'],
    tsx: ['symbol-file', '#3b9fd8'],
    js: ['symbol-file', '#e8d44d'],
    jsx: ['symbol-file', '#3b9fd8'],
    json: ['json', '#cbcb41'],
    md: ['markdown', '#519aba'],
    py: ['symbol-file', '#4b8bbe'],
    css: ['symbol-color', '#519aba'],
    html: ['code', '#e37933'],
    png: ['file-media', '#a074c4'],
    svg: ['file-media', '#a074c4']
  }
  const [icon, color] = map[ext] ?? ['file', '#a9a9a9']
  return { icon, color }
}

function Row({ entry, depth }: { entry: FileEntry; depth: number }): React.JSX.Element {
  const { expanded, children, toggleDir, openTab, activeTabPath } = useWorkspaceStore()
  const isOpen = expanded[entry.path]
  const pad = 8 + depth * 8

  if (entry.isDirectory) {
    return (
      <>
        <div className="tree-row" style={{ paddingLeft: pad }} onClick={() => toggleDir(entry.path)}>
          <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} className="tree-row__chevron" />
          <span className="tree-row__label">{entry.name}</span>
        </div>
        {isOpen &&
          children[entry.path]?.map((child) => (
            <Row key={child.path} entry={child} depth={depth + 1} />
          ))}
      </>
    )
  }

  const { icon, color } = fileIcon(entry.name)
  return (
    <div
      className={`tree-row${activeTabPath === entry.path ? ' tree-row--active' : ''}`}
      style={{ paddingLeft: pad + 16 }}
      onClick={async () => openTab(entry.path, entry.name, await window.api.readFile(entry.path))}
    >
      <Icon name={icon} className="tree-row__icon" />
      <span className="tree-row__label" style={{ color }}>
        {entry.name}
      </span>
    </div>
  )
}

export function Explorer(): React.JSX.Element {
  const { rootPath, entries, setRoot } = useWorkspaceStore()

  async function handleOpenFolder(): Promise<void> {
    const folder = await window.api.openFolder()
    if (!folder) return
    setRoot(folder, await window.api.readDir(folder))
  }

  return (
    <div className="sidebar">
      <div className="sidebar__title">
        <span>Explorer</span>
        <span className="sidebar__actions">
          <Icon name="ellipsis" />
        </span>
      </div>
      {!rootPath ? (
        <div className="explorer-empty">
          <p>You have not yet opened a folder.</p>
          <button className="btn-primary" onClick={handleOpenFolder}>
            Open Folder
          </button>
        </div>
      ) : (
        <>
          <div className="section-header">
            <Icon name="chevron-down" />
            <span title={rootPath}>{rootPath.split(/[\\/]/).pop()}</span>
            <span className="section-header__actions">
              <Icon name="new-file" />
              <Icon name="new-folder" />
              <Icon name="refresh" />
              <Icon name="collapse-all" />
            </span>
          </div>
          <div className="tree">
            {entries.map((entry) => (
              <Row key={entry.path} entry={entry} depth={0} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
