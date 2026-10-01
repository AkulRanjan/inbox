import Editor, { loader } from '@monaco-editor/react'
import { Icon } from './Icon'
import { fileIcon } from './Explorer'
import { useWorkspaceStore } from '../store/workspace'

export function languageForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    py: 'python',
    css: 'css',
    html: 'html'
  }
  return map[ext ?? ''] ?? 'plaintext'
}

loader.init().then((monaco) => {
  monaco.editor.defineTheme('dotwork-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1f1f1f',
      'editorGutter.background': '#1f1f1f',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#cccccc',
      'minimap.background': '#1f1f1f',
      'scrollbarSlider.background': '#79797966'
    }
  })
  monaco.editor.setTheme('dotwork-dark')
})

const SHORTCUTS: [string, string][] = [
  ['Show All Commands', 'Ctrl + Shift + P'],
  ['Go to File', 'Ctrl + P'],
  ['Find in Files', 'Ctrl + Shift + F'],
  ['Toggle Chat', 'Ctrl + Alt + B'],
  ['Toggle Terminal', 'Ctrl + J']
]

function Watermark(): React.JSX.Element {
  return (
    <div className="watermark">
      <Icon name="circle-large-filled" className="watermark__logo" />
      <table>
        <tbody>
          {SHORTCUTS.map(([label, keys]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>
                {keys.split(' + ').map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EditorArea(): React.JSX.Element {
  const { tabs, activeTabPath, rootPath, updateTabContent, markSaved, closeTab, setActiveTab, setCursor } =
    useWorkspaceStore()
  const activeTab = tabs.find((tab) => tab.path === activeTabPath)

  async function handleSave(): Promise<void> {
    const tab = useWorkspaceStore.getState().tabs.find((t) => t.path === activeTabPath)
    if (!tab) return
    await window.api.writeFile(tab.path, tab.content)
    markSaved(tab.path)
  }

  if (tabs.length === 0 || !activeTab) {
    return (
      <div className="editor-area">
        {tabs.length > 0 && <TabStrip />}
        <Watermark />
      </div>
    )
  }

  function TabStrip(): React.JSX.Element {
    return (
      <div className="tabs">
        {tabs.map((tab) => {
          const { icon, color } = fileIcon(tab.name)
          return (
            <div
              key={tab.path}
              className={`tab${tab.path === activeTabPath ? ' tab--active' : ''}`}
              onClick={() => setActiveTab(tab.path)}
            >
              <Icon name={icon} className="tab__icon" />
              <span style={{ color: tab.path === activeTabPath ? color : undefined }}>{tab.name}</span>
              <button
                className={`tab__close${tab.dirty ? ' tab__close--dirty' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.path)
                }}
              >
                <Icon name={tab.dirty ? 'circle-filled' : 'close'} />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const crumbs = (rootPath && activeTab.path.startsWith(rootPath)
    ? activeTab.path.slice(rootPath.length)
    : activeTab.path
  )
    .split(/[\\/]/)
    .filter(Boolean)

  return (
    <div className="editor-area">
      <TabStrip />
      <div className="breadcrumbs">
        {crumbs.map((c, i) => (
          <span key={i} className="breadcrumbs__item">
            {i > 0 && <Icon name="chevron-right" />}
            {c}
          </span>
        ))}
      </div>
      <div className="editor-area__editor">
        <Editor
          key={activeTab.path}
          path={activeTab.path}
          language={languageForPath(activeTab.path)}
          value={activeTab.content}
          theme="dotwork-dark"
          onChange={(value) => updateTabContent(activeTab.path, value ?? '')}
          onMount={(editor) => {
            editor.addCommand(2048 | 49 /* Ctrl/Cmd+S */, () => {
              handleSave()
            })
            editor.onDidChangeCursorPosition((e) =>
              setCursor(e.position.lineNumber, e.position.column)
            )
          }}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "Consolas, 'Courier New', monospace",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on'
          }}
        />
      </div>
    </div>
  )
}
