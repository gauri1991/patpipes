'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { prosecutionApi, OfficeAction } from '@/services/prosecutionApi'
import { toast } from 'sonner'

// ==================== Rejection types ====================

interface Rejection {
  id: string
  rejection_type: string
  affected_claims: string
  prior_art: string
  notes: string
  argument: string
}

const REJECTION_TYPES = [
  { value: '101', label: '§ 101 — Patent-eligible subject matter' },
  { value: '102', label: '§ 102 — Novelty (anticipation)' },
  { value: '103', label: '§ 103 — Obviousness' },
  { value: '112a', label: '§ 112(a) — Written description / enablement' },
  { value: '112b', label: '§ 112(b) — Indefiniteness' },
  { value: 'dp', label: 'Double patenting' },
  { value: 'other', label: 'Other' },
]

function newRejection(): Rejection {
  return { id: Math.random().toString(36).slice(2), rejection_type: '103', affected_claims: '', prior_art: '', notes: '', argument: '' }
}

function hasPriorArt(type: string): boolean {
  return type === '102' || type === '103'
}

interface AddOfficeActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  officeAction?: OfficeAction | null
  onSaved?: () => void
}

interface FormState {
  action_type: string
  mailing_date: string
  response_due_date: string
  examiner_name: string
  examiner_phone: string
  art_unit: string
  summary: string
  response_strategy: string
  response_status: string
}

const ACTION_TYPES = [
  { value: 'non_final', label: 'Non-Final Office Action' },
  { value: 'final', label: 'Final Office Action' },
  { value: 'restriction', label: 'Restriction Requirement' },
  { value: 'advisory', label: 'Advisory Action' },
  { value: 'notice_allowance', label: 'Notice of Allowance' },
  { value: 'notice_abandonment', label: 'Notice of Abandonment' },
]

const RESPONSE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'filed', label: 'Filed' },
  { value: 'overdue', label: 'Overdue' },
]

const INITIAL_FORM: FormState = {
  action_type: 'non_final',
  mailing_date: '',
  response_due_date: '',
  examiner_name: '',
  examiner_phone: '',
  art_unit: '',
  summary: '',
  response_strategy: '',
  response_status: 'pending',
}

// Deadline quick-pick chips: statutory 3 mo + up to 3 extension months
const DEADLINE_MONTHS = [
  { months: 3, label: '3 mo (statutory)' },
  { months: 4, label: '4 mo (+1 ext)' },
  { months: 5, label: '5 mo (+2 ext)' },
  { months: 6, label: '6 mo (max)' },
]

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().split('T')[0]
}

function getActionTypeLabel(value: string): string {
  return ACTION_TYPES.find(t => t.value === value)?.label ?? value
}

export function AddOfficeActionDialog({
  open,
  onOpenChange,
  applicationId,
  officeAction,
  onSaved,
}: AddOfficeActionDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [rejections, setRejections] = useState<Rejection[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (officeAction) {
      setForm({
        action_type: officeAction.action_type ?? 'non_final',
        mailing_date: officeAction.mailing_date ?? '',
        response_due_date: officeAction.response_due_date ?? '',
        examiner_name: officeAction.examiner_name ?? '',
        examiner_phone: officeAction.examiner_phone ?? '',
        art_unit: officeAction.art_unit ?? '',
        summary: officeAction.summary ?? '',
        response_strategy: officeAction.response_strategy ?? '',
        response_status: officeAction.response_status ?? 'pending',
      })
      // Hydrate rejections from persisted JSON
      const raw = officeAction.rejections
      if (Array.isArray(raw) && raw.length > 0) {
        setRejections(
          raw.map((r: any) => ({
            id: Math.random().toString(36).slice(2),
            rejection_type: r.rejection_type ?? r.type ?? '103',
            affected_claims: r.affected_claims ?? r.claims ?? '',
            prior_art: r.prior_art ?? '',
            notes: r.notes ?? '',
            argument: r.argument ?? '',
          }))
        )
      } else {
        setRejections([])
      }
    } else {
      setForm(INITIAL_FORM)
      setRejections([])
    }
  }, [officeAction, open])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleMailingDateChange(value: string) {
    setForm(prev => {
      const autoDate = value && !prev.response_due_date ? addMonths(value, 3) : prev.response_due_date
      return { ...prev, mailing_date: value, response_due_date: autoDate }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.mailing_date) {
      toast.error('Mailing date is required')
      return
    }
    if (!form.response_due_date) {
      toast.error('Response due date is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        application: applicationId,
        response_status: form.response_status as OfficeAction['response_status'],
        rejections: rejections.map(({ rejection_type, affected_claims, prior_art, notes, argument }) => ({
          rejection_type, affected_claims, prior_art, notes, argument,
        })),
      }
      if (officeAction) {
        const response = await prosecutionApi.updateOfficeAction(officeAction.id, payload)
        if (!response.success) {
          toast.error('Failed to update office action')
          return
        }
        toast.success('Office action updated')
      } else {
        const response = await prosecutionApi.createOfficeAction(payload)
        if (!response.success) {
          toast.error('Failed to create office action')
          return
        }
        await prosecutionApi.createDeadline({
          application: applicationId,
          deadline_type: 'office_action_response',
          due_date: form.response_due_date,
          title: `Respond to ${getActionTypeLabel(form.action_type)}`,
          priority: 'critical',
          description: 'Auto-created from office action',
        })
        toast.success('Office action created')
      }
      onSaved?.()
      handleOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save office action')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!saving) {
      if (!value && !officeAction) setForm(INITIAL_FORM)
      onOpenChange(value)
    }
  }

  const isEdit = !!officeAction

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Office Action' : 'Add Office Action'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="action_type">Action Type</Label>
            <Select
              value={form.action_type}
              onValueChange={v => setField('action_type', v)}
              disabled={saving}
            >
              <SelectTrigger id="action_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mailing_date">Mailing Date <span className="text-red-500">*</span></Label>
              <Input
                id="mailing_date"
                type="date"
                value={form.mailing_date}
                onChange={e => handleMailingDateChange(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response_due_date">Response Due Date <span className="text-red-500">*</span></Label>
              <Input
                id="response_due_date"
                type="date"
                value={form.response_due_date}
                onChange={e => setField('response_due_date', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Deadline quick-pick (only shown when mailing date is set) */}
          {form.mailing_date && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">Quick-set deadline:</span>
              {DEADLINE_MONTHS.map(({ months, label }) => {
                const date = addMonths(form.mailing_date, months)
                const active = form.response_due_date === date
                return (
                  <button
                    key={months}
                    type="button"
                    disabled={saving}
                    onClick={() => setField('response_due_date', date)}
                    className={`text-xs rounded-full px-2.5 py-0.5 border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examiner_name">Examiner Name</Label>
              <Input
                id="examiner_name"
                value={form.examiner_name}
                onChange={e => setField('examiner_name', e.target.value)}
                placeholder="Examiner full name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examiner_phone">Examiner Phone</Label>
              <Input
                id="examiner_phone"
                value={form.examiner_phone}
                onChange={e => setField('examiner_phone', e.target.value)}
                placeholder="(555) 000-0000"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="art_unit">Art Unit</Label>
              <Input
                id="art_unit"
                value={form.art_unit}
                onChange={e => setField('art_unit', e.target.value)}
                placeholder="e.g. 2100"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response_status">Response Status</Label>
              <Select
                value={form.response_status}
                onValueChange={v => setField('response_status', v)}
                disabled={saving}
              >
                <SelectTrigger id="response_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={e => setField('summary', e.target.value)}
              placeholder="Summary of rejections or requirements"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_strategy">Response Strategy</Label>
            <Textarea
              id="response_strategy"
              value={form.response_strategy}
              onChange={e => setField('response_strategy', e.target.value)}
              placeholder="Planned approach for responding to this office action"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* ---- Rejections editor ---- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rejections</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejections(prev => [...prev, newRejection()])}
                disabled={saving}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Rejection
              </Button>
            </div>
            {rejections.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rejections logged.</p>
            ) : (
              <div className="space-y-3">
                {rejections.map((rej, idx) => (
                  <div key={rej.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Rejection {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejections(prev => prev.filter(r => r.id !== rej.id))}
                        disabled={saving}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Rejection Type</Label>
                        <Select
                          value={rej.rejection_type}
                          onValueChange={v => setRejections(prev =>
                            prev.map(r => r.id === rej.id ? { ...r, rejection_type: v } : r)
                          )}
                          disabled={saving}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REJECTION_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Affected Claims</Label>
                        <Input
                          className="h-8 text-xs"
                          value={rej.affected_claims}
                          onChange={e => setRejections(prev =>
                            prev.map(r => r.id === rej.id ? { ...r, affected_claims: e.target.value } : r)
                          )}
                          placeholder="e.g. 1, 3–5, 8"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    {hasPriorArt(rej.rejection_type) && (
                      <div className="space-y-1">
                        <Label className="text-xs">Prior Art References</Label>
                        <Input
                          className="h-8 text-xs"
                          value={rej.prior_art}
                          onChange={e => setRejections(prev =>
                            prev.map(r => r.id === rej.id ? { ...r, prior_art: e.target.value } : r)
                          )}
                          placeholder="e.g. Smith (US 9,123,456); Jones et al."
                          disabled={saving}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Examiner&apos;s Reasoning</Label>
                      <Textarea
                        className="text-xs"
                        value={rej.notes}
                        onChange={e => setRejections(prev =>
                          prev.map(r => r.id === rej.id ? { ...r, notes: e.target.value } : r)
                        )}
                        placeholder="Examiner's stated basis for rejection…"
                        rows={2}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-green-700">Applicant&apos;s Response Argument</Label>
                      <Textarea
                        className="text-xs"
                        value={rej.argument}
                        onChange={e => setRejections(prev =>
                          prev.map(r => r.id === rej.id ? { ...r, argument: e.target.value } : r)
                        )}
                        placeholder="Counter-argument, distinguishing features, proposed amendments…"
                        rows={2}
                        disabled={saving}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {isEdit ? 'Save Changes' : 'Add Office Action'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
