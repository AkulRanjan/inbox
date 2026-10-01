import { z } from 'zod'

export const FileEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  isDirectory: z.boolean()
})
export type FileEntry = z.infer<typeof FileEntrySchema>

export const ReadDirArgsSchema = z.object({ dirPath: z.string() })
export const ReadFileArgsSchema = z.object({ filePath: z.string() })
export const WriteFileArgsSchema = z.object({ filePath: z.string(), content: z.string() })

export interface DotworkApi {
  openFolder(): Promise<string | null>
  readDir(dirPath: string): Promise<FileEntry[]>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
}
