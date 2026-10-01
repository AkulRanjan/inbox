import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DotworkApi, FileEntry } from '../shared/ipc'

const api: DotworkApi = {
  openFolder: () => ipcRenderer.invoke('fs:openFolder'),
  readDir: (dirPath: string): Promise<FileEntry[]> => ipcRenderer.invoke('fs:readDir', { dirPath }),
  readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:readFile', { filePath }),
  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('fs:writeFile', { filePath, content })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
