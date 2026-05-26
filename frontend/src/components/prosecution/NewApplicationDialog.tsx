'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface NewApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

interface FormState {
  title: string
  application_type: string
  jurisdiction: string
  priority_level: string
  technology_area: string
  filing_date: string
  priority_date: string
  abstract: string
}

const APPLICATION_TYPES = [
  { value: 'utility', label: 'Utility' },
  { value: 'design', label: 'Design' },
  { value: 'plant', label: 'Plant' },
  { value: 'provisional', label: 'Provisional' },
  { value: 'pct', label: 'PCT International' },
  { value: 'continuation', label: 'Continuation' },
  { value: 'divisional', label: 'Divisional' },
  { value: 'cip', label: 'Continuation-in-Part (CIP)' },
]

const JURISDICTIONS = [
  { value: 'US', label: 'United States (USPTO)' },
  { value: 'EP', label: 'European Patent Office' },
  { value: 'JP', label: 'Japan (JPO)' },
  { value: 'CN', label: 'China (CNIPA)' },
  { value: 'KR', label: 'South Korea (KIPO)' },
  { value: 'CA', label: 'Canada (CIPO)' },
  { value: 'AU', label: 'Australia (IP Australia)' },
  { value: 'PCT', label: 'PCT International' },
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const INITIAL_FORM: FormState = {
  title: '',
  application_type: 'utility',
  jurisdiction: 'US',
  priority_level: 'medium',
  technology_area: '',
  filing_date: '',
  priority_date: '',
  abstract: '',
}

export function NewApplicationDialog({ open, onOpenChange, onCreated }: NewApplicationDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        application_type: form.application_type,
        jurisdiction: form.jurisdiction,
        priority_level: form.priority_level,
        technology_area: form.technology_area,
        ...(form.filing_date && { filing_date: form.filing_date }),
        ...(form.priority_date && { priority_date: form.priority_date }),
        abstract: form.abstract,
      }
      const response = await prosecutionApi.createApplication(payload)
      if (response.success && response.data) {
        toast.success('Application created')
        setForm(INITIAL_FORM)
        onCreated?.()
        router.push(`/dashboard/prosecution/applications/${response.data.id}`)
      } else {
        toast.error('Failed to create application')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create application')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!saving) {
      if (!value) setForm(INITIAL_FORM)
      onOpenChange(value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Patent Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Enter application title"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="application_type">Application Type</Label>
              <Select
                value={form.application_type}
                onValueChange={v => setField('application_type', v)}
                disabled={saving}
              >
                <SelectTrigger id="application_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select
                value={form.jurisdiction}
                onValueChange={v => setField('jurisdiction', v)}
                disabled={saving}
              >
                <SelectTrigger id="jurisdiction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority_level">Priority Level</Label>
              <Select
                value={form.priority_level}
                onValueChange={v => setField('priority_level', v)}
                disabled={saving}
              >
                <SelectTrigger id="priority_level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="technology_area">Technology Area</Label>
              <Input
                id="technology_area"
                value={form.technology_area}
                onChange={e => setField('technology_area', e.target.value)}
                placeholder="e.g. Semiconductors, Biotech"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filing_date">Filing Date</Label>
              <Input
                id="filing_date"
                type="date"
                value={form.filing_date}
                onChange={e => setField('filing_date', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority_date">Priority Date</Label>
              <Input
                id="priority_date"
                type="date"
                value={form.priority_date}
                onChange={e => setField('priority_date', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={form.abstract}
              onChange={e => setField('abstract', e.target.value)}
              placeholder="Brief description of the invention"
              rows={4}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
