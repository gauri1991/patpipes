'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  onSaved?: () => void
}

const DOCUMENT_TYPES = [
  { value: 'specification', label: 'Specification' },
  { value: 'claims', label: 'Claims' },
  { value: 'drawing', label: 'Drawing / Figure' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'office_action', label: 'Office Action' },
  { value: 'response', label: 'Response / Amendment' },
  { value: 'fee_payment', label: 'Fee Payment' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' },
]

interface FormState {
  document_type: string
  title: string
  description: string
  version: string
  is_filed: boolean
  filing_date: string
  file_path: string
  file_size: number
  file_type: string
}

const INITIAL_FORM: FormState = {
  document_type: 'specification',
  title: '',
  description: '',
  version: '1',
  is_filed: false,
  filing_date: '',
  file_path: '',
  file_size: 0,
  file_type: '',
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  applicationId,
  onSaved,
}: DocumentUploadDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(prev => ({
      ...prev,
      file_path: file.name,
      file_size: file.size,
      file_type: file.name.split('.').pop()?.toLowerCase() ?? '',
      title: prev.title || file.name.replace(/\.[^.]+$/, ''),
    }))
  }

  function handleClose(value: boolean) {
    if (!saving) {
      if (!value) setForm(INITIAL_FORM)
      onOpenChange(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.file_path.trim()) {
      toast.error('File or file path is required')
      return
    }
    setSaving(true)
    try {
      const response = await prosecutionApi.createDocument({
        application: applicationId,
        document_type: form.document_type,
        title: form.title.trim(),
        description: form.description,
        version: form.version || '1',
        is_current_version: true,
        is_filed: form.is_filed,
        filing_date: form.is_filed && form.filing_date ? form.filing_date : undefined,
        file_path: form.file_path.trim(),
        file_size: form.file_size,
        file_type: form.file_type,
      })
      if (!response.success) {
        toast.error(response.error ?? 'Failed to register document')
        return
      }
      toast.success('Document registered')
      setForm(INITIAL_FORM)
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to register document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={form.document_type}
              onValueChange={v => setField('document_type', v)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <label className="block w-full cursor-pointer">
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-accent/30 transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {form.file_path || 'Choose file…'}
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={saving}
              />
            </label>
            <Input
              value={form.file_path}
              onChange={e => setField('file_path', e.target.value)}
              placeholder="or paste a file path / URL"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="du-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="du-title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Document title"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="du-version">Version</Label>
              <Input
                id="du-version"
                value={form.version}
                onChange={e => setField('version', e.target.value)}
                placeholder="1"
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                id="du-filed"
                type="checkbox"
                checked={form.is_filed}
                onChange={e => setField('is_filed', e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="du-filed">Filed with USPTO</Label>
            </div>
          </div>

          {form.is_filed && (
            <div className="space-y-2">
              <Label htmlFor="du-filing-date">Filing Date</Label>
              <Input
                id="du-filing-date"
                type="date"
                value={form.filing_date}
                onChange={e => setField('filing_date', e.target.value)}
                disabled={saving}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="du-description">Description</Label>
            <Textarea
              id="du-description"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Optional notes about this document"
              rows={2}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
