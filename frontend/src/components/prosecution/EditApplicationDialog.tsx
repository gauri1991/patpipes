'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, Plus } from 'lucide-react'
import { prosecutionApi, PatentApplication } from '@/services/prosecutionApi'
import { toast } from 'sonner'

// ==================== Types ====================

interface EditApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: PatentApplication
  onSaved?: (updated: PatentApplication) => void
}

interface FormState {
  title: string
  application_number: string
  patent_number: string
  status: string
  application_type: string
  jurisdiction: string
  priority_level: string
  technology_area: string
  abstract: string
  background: string
  summary: string
  priority_date: string
  filing_date: string
  publication_date: string
  grant_date: string
  expiry_date: string
  inventors: string[]
  assignees: string[]
  ipc_classes: string[]
  us_classes: string[]
  keywords: string[]
  estimated_value: string
  costs_to_date: string
  estimated_total_cost: string
}

// ==================== Constants ====================

const APPLICATION_TYPES = [
  { value: 'utility', label: 'Utility Patent' },
  { value: 'design', label: 'Design Patent' },
  { value: 'plant', label: 'Plant Patent' },
  { value: 'provisional', label: 'Provisional Application' },
  { value: 'pct', label: 'PCT International' },
  { value: 'continuation', label: 'Continuation' },
  { value: 'divisional', label: 'Divisional' },
  { value: 'cip', label: 'Continuation-in-Part' },
]

const JURISDICTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'EP', label: 'European Patent Office' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IN', label: 'India' },
  { value: 'PCT', label: 'PCT (International)' },
]

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'filed', label: 'Filed' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_examination', label: 'Under Examination' },
  { value: 'office_action', label: 'Office Action' },
  { value: 'allowed', label: 'Allowed' },
  { value: 'granted', label: 'Granted' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

// ==================== StringArrayField ====================

interface StringArrayFieldProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  disabled?: boolean
}

function StringArrayField({ label, items, onChange, placeholder, disabled }: StringArrayFieldProps) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !items.includes(val)) {
      onChange([...items, val])
    }
    setInput('')
  }

  function remove(item: string) {
    onChange(items.filter(i => i !== item))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={disabled || !input.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {items.map(item => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1 pr-1">
              {item}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Helpers ====================

function toDateInput(s?: string): string {
  if (!s) return ''
  return s.split('T')[0]
}

function initForm(app: PatentApplication): FormState {
  return {
    title: app.title ?? '',
    application_number: app.application_number ?? '',
    patent_number: app.patent_number ?? '',
    status: app.status ?? 'draft',
    application_type: app.application_type ?? 'utility',
    jurisdiction: app.jurisdiction ?? 'US',
    priority_level: app.priority_level ?? 'medium',
    technology_area: app.technology_area ?? '',
    abstract: app.abstract ?? '',
    background: app.background ?? '',
    summary: app.summary ?? '',
    priority_date: toDateInput(app.priority_date),
    filing_date: toDateInput(app.filing_date),
    publication_date: toDateInput(app.publication_date),
    grant_date: toDateInput(app.grant_date),
    expiry_date: toDateInput(app.expiry_date),
    inventors: [...(app.inventors ?? [])],
    assignees: [...(app.assignees ?? [])],
    ipc_classes: [...(app.ipc_classes ?? [])],
    us_classes: [...(app.us_classes ?? [])],
    keywords: [...(app.keywords ?? [])],
    estimated_value: String(app.estimated_value ?? 0),
    costs_to_date: String(app.costs_to_date ?? 0),
    estimated_total_cost: String(app.estimated_total_cost ?? 0),
  }
}

// ==================== Main Dialog ====================

export function EditApplicationDialog({
  open,
  onOpenChange,
  application,
  onSaved,
}: EditApplicationDialogProps) {
  const [form, setForm] = useState<FormState>(() => initForm(application))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(initForm(application))
  }, [open, application])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const payload: Partial<PatentApplication> = {
        title: form.title.trim(),
        application_number: form.application_number || undefined,
        patent_number: form.patent_number || undefined,
        status: form.status,
        application_type: form.application_type,
        jurisdiction: form.jurisdiction,
        priority_level: form.priority_level,
        technology_area: form.technology_area,
        abstract: form.abstract,
        background: form.background,
        summary: form.summary,
        priority_date: form.priority_date || undefined,
        filing_date: form.filing_date || undefined,
        publication_date: form.publication_date || undefined,
        grant_date: form.grant_date || undefined,
        expiry_date: form.expiry_date || undefined,
        inventors: form.inventors,
        assignees: form.assignees,
        ipc_classes: form.ipc_classes,
        us_classes: form.us_classes,
        keywords: form.keywords,
        estimated_value: parseFloat(form.estimated_value) || 0,
        costs_to_date: parseFloat(form.costs_to_date) || 0,
        estimated_total_cost: parseFloat(form.estimated_total_cost) || 0,
      }
      const response = await prosecutionApi.updateApplication(application.id, payload)
      if (!response.success || !response.data) {
        toast.error(response.error ?? 'Failed to save application')
        return
      }
      toast.success('Application updated')
      onSaved?.(response.data)
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="dates">Dates</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="classification">Classification</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            {/* ---- Details ---- */}
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ea-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ea-title"
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="Patent application title"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ea-app-number">Application Number</Label>
                  <Input
                    id="ea-app-number"
                    value={form.application_number}
                    onChange={e => setField('application_number', e.target.value)}
                    placeholder="e.g. 17/123,456"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ea-pat-number">Patent Number</Label>
                  <Input
                    id="ea-pat-number"
                    value={form.patent_number}
                    onChange={e => setField('patent_number', e.target.value)}
                    placeholder="e.g. US11,234,567"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Type</Label>
                  <Select
                    value={form.application_type}
                    onValueChange={v => setField('application_type', v)}
                    disabled={saving}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPLICATION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Select
                    value={form.jurisdiction}
                    onValueChange={v => setField('jurisdiction', v)}
                    disabled={saving}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={v => setField('status', v)}
                    disabled={saving}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select
                    value={form.priority_level}
                    onValueChange={v => setField('priority_level', v)}
                    disabled={saving}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ea-tech">Technology Area</Label>
                <Input
                  id="ea-tech"
                  value={form.technology_area}
                  onChange={e => setField('technology_area', e.target.value)}
                  placeholder="e.g. Machine Learning, Biotech, Semiconductors"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ea-abstract">Abstract</Label>
                <Textarea
                  id="ea-abstract"
                  value={form.abstract}
                  onChange={e => setField('abstract', e.target.value)}
                  placeholder="Patent abstract"
                  rows={4}
                  disabled={saving}
                />
              </div>
            </TabsContent>

            {/* ---- Dates ---- */}
            <TabsContent value="dates" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ea-priority-date">Priority Date</Label>
                  <Input
                    id="ea-priority-date"
                    type="date"
                    value={form.priority_date}
                    onChange={e => setField('priority_date', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ea-filing-date">Filing Date</Label>
                  <Input
                    id="ea-filing-date"
                    type="date"
                    value={form.filing_date}
                    onChange={e => setField('filing_date', e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ea-pub-date">Publication Date</Label>
                  <Input
                    id="ea-pub-date"
                    type="date"
                    value={form.publication_date}
                    onChange={e => setField('publication_date', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ea-grant-date">Grant Date</Label>
                  <Input
                    id="ea-grant-date"
                    type="date"
                    value={form.grant_date}
                    onChange={e => setField('grant_date', e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ea-expiry-date">Expiry Date</Label>
                  <Input
                    id="ea-expiry-date"
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setField('expiry_date', e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ---- People ---- */}
            <TabsContent value="people" className="space-y-6">
              <StringArrayField
                label="Inventors"
                items={form.inventors}
                onChange={v => setField('inventors', v)}
                placeholder="Full name, e.g. Jane Smith"
                disabled={saving}
              />
              <StringArrayField
                label="Assignees"
                items={form.assignees}
                onChange={v => setField('assignees', v)}
                placeholder="Organization or individual name"
                disabled={saving}
              />
            </TabsContent>

            {/* ---- Classification ---- */}
            <TabsContent value="classification" className="space-y-6">
              <StringArrayField
                label="IPC Classes"
                items={form.ipc_classes}
                onChange={v => setField('ipc_classes', v)}
                placeholder="e.g. G06F 3/01"
                disabled={saving}
              />
              <StringArrayField
                label="US Classes"
                items={form.us_classes}
                onChange={v => setField('us_classes', v)}
                placeholder="e.g. 345/156"
                disabled={saving}
              />
              <StringArrayField
                label="Keywords"
                items={form.keywords}
                onChange={v => setField('keywords', v)}
                placeholder="e.g. neural network"
                disabled={saving}
              />
            </TabsContent>

            {/* ---- Financials ---- */}
            <TabsContent value="financials" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ea-value">Estimated Patent Value ($)</Label>
                <Input
                  id="ea-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimated_value}
                  onChange={e => setField('estimated_value', e.target.value)}
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ea-costs">Costs to Date ($)</Label>
                <Input
                  id="ea-costs"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costs_to_date}
                  onChange={e => setField('costs_to_date', e.target.value)}
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ea-total-cost">Estimated Total Cost ($)</Label>
                <Input
                  id="ea-total-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimated_total_cost}
                  onChange={e => setField('estimated_total_cost', e.target.value)}
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 pt-4 border-t">
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
