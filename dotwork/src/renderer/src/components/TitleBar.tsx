import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useWorkspaceStore } from '../store/workspace'

interface MenuItem {
  label: string
  keys?: string
  action?: () => void
  separator?: boolean
}

export function TitleBar(): React.JSX.Element {
  const s = useWorkspaceStore()
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [])

  async function openFolder(): Promise<void> {
    const folder = await window.api.openFolder()
    if (!folder) return
    s.setRoot(folder, await window.api.readDir(folder))
  }

  async function save(): Promise<void> {
    const tab = s.tabs.find((t) => t.path === s.activeTabPath)
    if (!tab) return
    await window.api.writeFile(tab.path, tab.content)
    s.markSaved(tab.path)
  }

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'Open Folder...', keys: 'Ctrl+K Ctrl+O', action: openFolder },
      { label: '', separator: true },
      { label: 'Save', keys: 'Ctrl+S', action: save },
      {
        label: 'Close Editor',
        keys: 'Ctrl+W',
        action: () => s.activeTabPath && s.closeTab(s.activeTabPath)
      }
    ],
    Edit: [
      { label: 'Undo', keys: 'Ctrl+Z' },
      { label: 'Redo', keys: 'Ctrl+Y' }
    ],
    Selection: [{ label: 'Select All', keys: 'Ctrl+A' }],
    View: [
      { label: 'Explorer', keys: 'Ctrl+Shift+E', action: () => s.setActiveView('explorer') },
      { label: 'Search', keys: 'Ctrl+Shift+F', action: () => s.setActiveView('search') },
      { label: '', separator: true },
      { label: 'Toggle Primary Side Bar', keys: 'Ctrl+B', action: s.toggleSidebar },
      { label: 'Toggle Panel', keys: 'Ctrl+J', action: s.togglePanel },
      { label: 'Toggle Chat', keys: 'Ctrl+Alt+B', action: s.toggleChat }
    ],
    Go: [{ label: 'Go to File...', keys: 'Ctrl+P' }],
    Run: [{ label: 'Start Debugging', keys: 'F5' }],
    Terminal: [
      {
        label: 'New Terminal',
        keys: 'Ctrl+Shift+`',
        action: () => !s.panelVisible && s.togglePanel()
      }
    ],
    Help: [{ label: 'About Dotwork' }]
  }

  const title = s.rootPath ? s.rootPath.split(/[\\/]/).pop() : 'Dotwork'

  return (
    <div className="titlebar" ref={ref}>
      <div className="titlebar__left">
        <div className="titlebar__logo">
          <Icon name="circle-filled" />
        </div>
        <div className="titlebar__menus">
          {Object.entries(menus).map(([name, items]) => (
            <div key={name} className="menu">
              <button
                className={`menu__label${open === name ? ' menu__label--open' : ''}`}
                onClick={() => setOpen(open === name ? null : name)}
                onMouseEnter={() => open && setOpen(name)}
              >
                {name}
              </button>
              {open === name && (
                <div className="menu__dropdown">
                  {items.map((item, i) =>
                    item.separator ? (
                      <div key={i} className="menu__sep" />
                    ) : (
                      <button
                        key={item.label}
                        className="menu__item"
                        onClick={() => {
                          setOpen(null)
                          item.action?.()
                        }}
                      >
                        <span>{item.label}</span>
                        <span className="menu__keys">{item.keys}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="titlebar__center">
        <div className="titlebar__nav">
          <Icon name="arrow-left" />
          <Icon name="arrow-right" />
        </div>
        <button className="command-center">
          <Icon name="search" />
          <span>{title}</span>
        </button>
      </div>

      <div className="titlebar__right">
        <button title="Toggle Primary Side Bar (Ctrl+B)" onClick={s.toggleSidebar}>
          <Icon name={s.sidebarVisible ? 'layout-sidebar-left' : 'layout-sidebar-left-off'} />
        </button>
        <button title="Toggle Panel (Ctrl+J)" onClick={s.togglePanel}>
          <Icon name={s.panelVisible ? 'layout-panel' : 'layout-panel-off'} />
        </button>
        <button title="Toggle Chat (Ctrl+Alt+B)" onClick={s.toggleChat}>
          <Icon name={s.chatVisible ? 'layout-sidebar-right' : 'layout-sidebar-right-off'} />
        </button>
      </div>
    </div>
  )
}
