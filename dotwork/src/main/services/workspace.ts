import { promises as fs } from 'fs'
import path from 'path'
import { dialog } from 'electron'
import { FileEntry } from '../../shared/ipc'

let workspaceRoot: string | null = null

export function getWorkspaceRoot(): string | null {
  return workspaceRoot
}

export async function openFolderDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled || result.filePaths.length === 0) return null
  workspaceRoot = result.filePaths[0]
  return workspaceRoot
}

/** Resolves a path and rejects anything that escapes the open workspace root. */
function resolveInWorkspace(targetPath: string): string {
  if (!workspaceRoot) throw new Error('No workspace open')
  const resolved = path.resolve(targetPath)
  const root = path.resolve(workspaceRoot)
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Path escapes workspace root')
  }
  return resolved
}

export async function readDir(dirPath: string): Promise<FileEntry[]> {
  const safePath = resolveInWorkspace(dirPath)
  const entries = await fs.readdir(safePath, { withFileTypes: true })
  return entries
    .map((entry) => ({
      name: entry.name,
      path: path.join(safePath, entry.name),
      isDirectory: entry.isDirectory()
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export async function readFile(filePath: string): Promise<string> {
  const safePath = resolveInWorkspace(filePath)
  return fs.readFile(safePath, 'utf-8')
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const safePath = resolveInWorkspace(filePath)
  await fs.writeFile(safePath, content, 'utf-8')
}
