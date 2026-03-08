"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children: FileNode[]
}

function buildFileTree(filePaths: string[]): FileNode[] {
  const root: FileNode = {
    name: "",
    path: "",
    type: "folder",
    children: [],
  }

  filePaths.forEach((path) => {
    const parts = path.split("/").filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const fullPath = parts.slice(0, index + 1).join("/")

      let child = current.children.find((c) => c.name === part)

      if (!child) {
        child = {
          name: part,
          path: fullPath,
          type: isFile ? "file" : "folder",
          children: [],
        }
        current.children.push(child)
      }

      if (!isFile) {
        current = child
      }
    })
  })

  // Sort children (folders first, then alphabetically)
  function sortChildren(node: FileNode) {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sortChildren)
  }

  sortChildren(root)
  return root.children
}

function TreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2) // Auto-expand first 2 levels

  const isFolder = node.type === "folder"
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 text-xs hover:bg-accent/50 rounded transition-colors ${
          isFolder ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3 w-3 shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-3 w-3 shrink-0 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <File className="h-3 w-3 shrink-0 text-muted-foreground" />
          </>
        )}
        <span
          className={`truncate font-mono ${isFolder ? "font-medium" : "text-muted-foreground"}`}
          title={node.path}
        >
          {node.name}
        </span>
      </div>

      {isFolder && isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ files }: { files: string[] }) {
  const tree = buildFileTree(files)

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode key={node.path} node={node} />
      ))}
    </div>
  )
}
