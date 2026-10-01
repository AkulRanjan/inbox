import { ipcMain } from 'electron'
import { ReadDirArgsSchema, ReadFileArgsSchema, WriteFileArgsSchema } from '../../shared/ipc'
import { openFolderDialog, readDir, readFile, writeFile } from '../services/workspace'

export function registerFsHandlers(): void {
  ipcMain.handle('fs:openFolder', async () => openFolderDialog())

  ipcMain.handle('fs:readDir', async (_event, args) => {
    const { dirPath } = ReadDirArgsSchema.parse(args)
    return readDir(dirPath)
  })

  ipcMain.handle('fs:readFile', async (_event, args) => {
    const { filePath } = ReadFileArgsSchema.parse(args)
    return readFile(filePath)
  })

  ipcMain.handle('fs:writeFile', async (_event, args) => {
    const { filePath, content } = WriteFileArgsSchema.parse(args)
    return writeFile(filePath, content)
  })
}
