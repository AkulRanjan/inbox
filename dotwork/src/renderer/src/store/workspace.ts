import { create } from 'zustand'
import type { FileEntry } from '../../../shared/ipc'

export interface OpenTab {
  path: string
  name: string
  content: string
  dirty: boolean
}

export type ActivityView = 'explorer' | 'search' | 'git' | 'dots' | 'inbox'

interface WorkspaceState {
  rootPath: string | null
  entries: FileEntry[]
  children: Record<string, FileEntry[]>
  expanded: Record<string, boolean>
  tabs: OpenTab[]
  activeTabPath: string | null
  cursor: { line: number; column: number }

  activeView: ActivityView
  sidebarVisible: boolean
  panelVisible: boolean
  chatVisible: boolean

  setRoot: (rootPath: string, entries: FileEntry[]) => void
  toggleDir: (path: string) => Promise<void>
  openTab: (path: string, name: string, content: string) => void
  updateTabContent: (path: string, content: string) => void
  markSaved: (path: string) => void
  closeTab: (path: string) => void
  setActiveTab: (path: string) => void
  setCursor: (line: number, column: number) => void

  setActiveView: (view: ActivityView) => void
  toggleSidebar: () => void
  togglePanel: () => void
  toggleChat: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: null,
  entries: [],
  children: {},
  expanded: {},
  tabs: [],
  activeTabPath: null,
  cursor: { line: 1, column: 1 },

  activeView: 'explorer',
  sidebarVisible: true,
  panelVisible: true,
  chatVisible: true,

  setRoot: (rootPath, entries) =>
    set({ rootPath, entries, children: {}, expanded: {}, tabs: [], activeTabPath: null }),

  toggleDir: async (path) => {
    const isOpen = get().expanded[path]
    if (!isOpen && !get().children[path]) {
      const kids = await window.api.readDir(path)
      set((s) => ({ children: { ...s.children, [path]: kids } }))
    }
    set((s) => ({ expanded: { ...s.expanded, [path]: !isOpen } }))
  },

  openTab: (path, name, content) => {
    if (get().tabs.some((tab) => tab.path === path)) {
      set({ activeTabPath: path })
      return
    }
    set((state) => ({
      tabs: [...state.tabs, { path, name, content, dirty: false }],
      activeTabPath: path
    }))
  },

  updateTabContent: (path, content) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.path === path ? { ...tab, content, dirty: true } : tab))
    })),

  markSaved: (path) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.path === path ? { ...tab, dirty: false } : tab))
    })),

  closeTab: (path) =>
    set((state) => {
      const tabs = state.tabs.filter((tab) => tab.path !== path)
      const activeTabPath =
        state.activeTabPath === path ? (tabs[tabs.length - 1]?.path ?? null) : state.activeTabPath
      return { tabs, activeTabPath }
    }),

  setActiveTab: (path) => set({ activeTabPath: path }),
  setCursor: (line, column) => set({ cursor: { line, column } }),

  setActiveView: (view) =>
    set((s) =>
      s.activeView === view && s.sidebarVisible
        ? { sidebarVisible: false }
        : { activeView: view, sidebarVisible: true }
    ),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  togglePanel: () => set((s) => ({ panelVisible: !s.panelVisible })),
  toggleChat: () => set((s) => ({ chatVisible: !s.chatVisible }))
}))
