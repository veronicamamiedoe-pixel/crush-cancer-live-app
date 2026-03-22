'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Image, File, Trash2, Download,
  Plus, Search, Filter, Lock, FolderOpen, Eye, X
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Document } from '@/types'
import toast from 'react-hot-toast'
import { cn, formatFileSize } from '@/lib/utils'

const CATEGORIES = [
  { value: 'medical_report', label: 'Medical Reports',  emoji: '📋', colour: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200' },
  { value: 'test_result',    label: 'Test Results',     emoji: '🔬', colour: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200' },
  { value: 'scan',           label: 'Scans & Imaging',  emoji: '🖼️', colour: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  { value: 'prescription',   label: 'Prescriptions',    emoji: '💊', colour: 'text-gold-600',   bg: 'bg-gold-50 border-gold-200' },
  { value: 'doctor_note',    label: "Doctor's Notes",   emoji: '📝', colour: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { value: 'insurance',      label: 'Insurance',        emoji: '🛡️', colour: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  { value: 'treatment_plan', label: 'Treatment Plans',  emoji: '🗺️', colour: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 'other',          label: 'Other',            emoji: '📁', colour: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
]

export default function DocumentsPage() {
  const [documents, setDocuments]     = useState<Document[]>([])
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [search, setSearch]           = useState('')
  const [activeCategory, setCategory] = useState('all')
  const [showUpload, setShowUpload]   = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [uploadForm, setUploadForm]   = useState({
    name: '', category: 'medical_report', date: '', doctor: '', notes: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewDoc, setPreviewDoc]   = useState<Document | null>(null)

  const fetchDocuments = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('documents').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!uploadForm.name) setUploadForm(f => ({ ...f, name: file.name.replace(/\.[^.]+$/, '') }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const uploadDocument = async () => {
    if (!selectedFile || !uploadForm.name) { toast.error('Please select a file and add a name'); return }
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upload to Supabase Storage
      const ext = selectedFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: upload, error: uploadError } = await supabase.storage
        .from('documents').upload(path, selectedFile, { contentType: selectedFile.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

      // Save metadata
      await supabase.from('documents').insert({
        user_id:   user.id,
        name:      uploadForm.name,
        category:  uploadForm.category,
        file_url:  publicUrl,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        date:      uploadForm.date || new Date().toISOString().split('T')[0],
        doctor:    uploadForm.doctor || null,
        notes:     uploadForm.notes || null,
        is_shared_with_caregiver: false,
      })

      toast.success('✅ Document uploaded securely!')
      setSelectedFile(null)
      setUploadForm({ name: '', category: 'medical_report', date: '', doctor: '', notes: '' })
      setShowUpload(false)
      fetchDocuments()
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (doc: Document) => {
    if (!confirm('Delete this document permanently?')) return
    const supabase = createClient()
    // Extract path from URL
    const path = doc.file_url.split('/storage/v1/object/public/documents/')[1]
    if (path) await supabase.storage.from('documents').remove([path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocuments(d => d.filter(x => x.id !== doc.id))
    toast('Document deleted')
  }

  const filtered = documents.filter(d => {
    const matchCat  = activeCategory === 'all' || d.category === activeCategory
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.doctor?.toLowerCase().includes(search.toLowerCase()) || false
    return matchCat && matchSearch
  })

  // Storage usage
  const totalBytes = documents.reduce((n, d) => n + (d.file_size || 0), 0)
  const storageLimit = 2 * 1024 * 1024 * 1024 // 2GB
  const storageUsedPct = Math.min((totalBytes / storageLimit) * 100, 100)

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return <Image className="w-5 h-5" />
    if (type?.includes('pdf'))   return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="sec-eyebrow">Encrypted & Secure</p>
              <span className="badge-teal flex items-center gap-1 text-xs"><Lock className="w-3 h-3" /> Private Vault</span>
            </div>
            <h2 className="font-bold text-4xl text-gray-900">
              Document <span className="text-teal-500">Vault</span>
            </h2>
            <p className="sec-intro">
              Securely store all your medical documents — reports, scans, prescriptions, and letters.
              Always accessible, always private.
            </p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-teal flex-shrink-0">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* Storage usage */}
        <div className="bg-white rounded-2xl border border-teal-100 p-4">
          <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
            <span className="flex items-center gap-1"><FolderOpen className="w-4 h-4 text-teal-500" /> Storage Used</span>
            <span className="text-teal-600">{formatFileSize(totalBytes)} / 2 GB</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
              style={{ width: `${storageUsedPct}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-400">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-gray-400">{(100 - storageUsedPct).toFixed(1)}% free</p>
          </div>
        </div>

        {/* Upload modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="bg-white rounded-3xl shadow-modal p-6 max-w-lg w-full">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-gray-800">📤 Upload Document</h3>
                  <button onClick={() => setShowUpload(false)} className="p-2 rounded-xl hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                  className={cn('border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4',
                    dragOver ? 'border-teal-400 bg-teal-50' : selectedFile ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200 hover:border-teal-300')}>
                  <input id="file-input" type="file" className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                  {selectedFile ? (
                    <div>
                      <div className="text-3xl mb-2">📄</div>
                      <p className="font-bold text-teal-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-600">Drop file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — max 50MB</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="ccl-label">Document Name *</label>
                    <input className="ccl-input" value={uploadForm.name}
                      onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. CT Scan Results March 2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ccl-label">Category</label>
                      <select className="ccl-select" value={uploadForm.category}
                        onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="ccl-label">Document Date</label>
                      <input type="date" className="ccl-input" value={uploadForm.date}
                        onChange={e => setUploadForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="ccl-label">Doctor / Issuing Hospital</label>
                    <input className="ccl-input" value={uploadForm.doctor}
                      onChange={e => setUploadForm(f => ({ ...f, doctor: e.target.value }))}
                      placeholder="Dr. Name or Hospital" />
                  </div>
                  <div>
                    <label className="ccl-label">Notes (optional)</label>
                    <input className="ccl-input" value={uploadForm.notes}
                      onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any notes about this document" />
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={uploadDocument} disabled={uploading || !selectedFile}
                    className="btn-teal flex-1 justify-center">
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      <><Lock className="w-4 h-4" /> Upload Securely</>
                    )}
                  </button>
                  <button onClick={() => setShowUpload(false)} className="btn-outline">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="ccl-input pl-9" placeholder="Search documents..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategory('all')}
            className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
              activeCategory === 'all' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
            All ({documents.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = documents.filter(d => d.category === cat.value).length
            if (count === 0) return null
            return (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all',
                  activeCategory === cat.value ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
                {cat.emoji} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-teal-100 p-10 text-center">
            <Lock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">
              {search ? 'No documents match your search' : 'Your vault is empty'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {!search && 'Upload your first document securely.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((doc, i) => {
              const cat = CATEGORIES.find(c => c.value === doc.category) || CATEGORIES[7]
              return (
                <motion.div key={doc.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn('bg-white rounded-2xl border-2 p-4 hover:shadow-card transition-all group', cat.bg)}>
                  {/* File type icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 border', cat.bg, cat.colour)}>
                    {getFileIcon(doc.file_type)}
                  </div>

                  <p className="font-bold text-sm text-gray-800 leading-tight line-clamp-2 mb-1">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    {doc.date ? format(new Date(doc.date), 'dd MMM yyyy') : format(new Date(doc.created_at), 'dd MMM yyyy')}
                  </p>
                  {doc.doctor && <p className="text-xs text-gray-400 truncate mt-0.5">{doc.doctor}</p>}
                  <p className="text-xs text-gray-300 mt-1">{formatFileSize(doc.file_size)}</p>

                  {/* Actions */}
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:border-teal-300 transition-all">
                      <Eye className="w-3 h-3" /> View
                    </a>
                    <a href={doc.file_url} download={doc.name}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-teal-500 hover:border-teal-200 transition-all">
                      <Download className="w-3 h-3" />
                    </a>
                    <button onClick={() => deleteDocument(doc)}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
