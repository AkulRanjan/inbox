import { useEffect } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { TitleBar } from './components/TitleBar'
import { ActivityBar } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { EditorArea } from './components/EditorArea'
import { BottomPanel } from './components/BottomPanel'
import { ChatPanel } from './components/ChatPanel'
import { StatusBar } from './components/StatusBar'
import { useWorkspaceStore } from './store/workspace'

function App(): React.JSX.Element {
  const { sidebarVisible, panelVisible, chatVisible } = useWorkspaceStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const s = useWorkspaceStore.getState()
      const key = e.key.toLowerCase()
      if (key === 'b' && e.altKey) s.toggleChat()
      else if (key === 'b') s.toggleSidebar()
      else if (key === 'j') s.togglePanel()
      else if (key === 'e' && e.shiftKey) s.setActiveView('explorer')
      else if (key === 'f' && e.shiftKey) s.setActiveView('search')
      else if (key === 'g' && e.shiftKey) s.setActiveView('git')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="workbench">
      <TitleBar />
      <div className="workbench__body">
        <ActivityBar />
        <PanelGroup direction="horizontal" className="workbench__main">
          {sidebarVisible && (
            <>
              <Panel id="sidebar" order={1} defaultSize={18} minSize={10} maxSize={40}>
                <Sidebar />
              </Panel>
              <PanelResizeHandle className="sash sash--vertical" />
            </>
          )}
          <Panel id="center" order={2} minSize={20}>
            <PanelGroup direction="vertical">
              <Panel id="editor" order={1} minSize={20}>
                <EditorArea />
              </Panel>
              {panelVisible && (
                <>
                  <PanelResizeHandle className="sash sash--horizontal" />
                  <Panel id="bottom" order={2} defaultSize={30} minSize={10} maxSize={80}>
                    <BottomPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          {chatVisible && (
            <>
              <PanelResizeHandle className="sash sash--vertical" />
              <Panel id="chat" order={3} defaultSize={24} minSize={15} maxSize={50}>
                <ChatPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
      <StatusBar />
    </div>
  )
}

export default App
