import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'

export default function DropZone({ file, onFile }) {
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-teal bg-teal/5">
        <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-medium text-sm truncate">{file.name}</p>
          <p className="text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFile(null) }}
          className="w-7 h-7 rounded-full hover:bg-rust/10 flex items-center justify-center transition-colors"
        >
          <X size={14} className="text-muted hover:text-rust" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-8
        flex flex-col items-center gap-3 transition-all duration-200
        ${isDragActive
          ? 'border-teal bg-teal/5 scale-[1.01]'
          : 'border-cream hover:border-muted hover:bg-cream/50'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center transition-colors
        ${isDragActive ? 'bg-teal/15' : 'bg-cream'}
      `}>
        <Upload size={22} className={isDragActive ? 'text-teal' : 'text-muted'} />
      </div>
      <div className="text-center">
        <p className="font-body font-medium text-sm">
          {isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}
        </p>
        <p className="text-muted text-xs mt-1">
          PDF, DOCX, DOC, TXT · Max 5 MB
        </p>
      </div>
      <button
        type="button"
        className="mt-1 px-4 py-1.5 rounded-lg bg-ink text-paper text-xs font-medium font-body hover:bg-teal transition-colors"
      >
        Browse Files
      </button>
    </div>
  )
}
