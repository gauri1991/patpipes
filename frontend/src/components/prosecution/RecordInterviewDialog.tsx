'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface RecordInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  examinerName?: string
  onSaved?: () => void
}

interface FormState {
  interview_date: string
  examiner_name: string
  outcome: string
  examiner_position: string
  applicant_position: string
  next_steps: string
  summary_submitted: boolean
  summary_submitted_date: string
}

const OUTCOMES = [
  { value: 'agreed_to_allow', label: 'Examiner agreed to allow (full or partial)' },
  { value: 'agreed_with_amendments', label: 'Examiner agreed if claims are amended' },
  { value: 'no_agreement', label: 'No agreement — prosecution continues' },
  { value: 'withdrew_rejection', label: 'Examiner withdrew rejection' },
]

const TODAY = new Date().toISOString().split('T')[0]

const INITIAL_FORM = (examinerName = ''): FormState => ({
  interview_date: TODAY,
  examiner_name: examinerName,
  outcome: 'agreed_with_amendments',
  examiner_position: '',
  applicant_position: '',
  next_steps: '',
  summary_submitted: false,
  summary_submitted_date: '',
})

export function RecordInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  examinerName = '',
  onSaved,
}: RecordInterviewDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM(examinerName))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(INITIAL_FORM(examinerName))
  }, [open, examinerName])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.interview_date) {
      toast.error('Interview date is required')
      return
    }
    setSaving(true)
    try {
      const outcomeLabel = OUTCOMES.find(o => o.value === form.outcome)?.label ?? form.outcome

      const description = [
        `Outcome: ${outcomeLabel}`,
        form.examiner_position ? `Examiner's position: ${form.examiner_position}` : '',
        form.applicant_position ? `Applicant's position: ${form.applicant_position}` : '',
        form.next_steps ? `Next steps: ${form.next_steps}` : '',
        form.summary_submitted
          ? `Interview summary submitted: ${form.summary_submitted_date || form.interview_date}`
          : '',
      ].filter(Boolean).join('\n\n')

      await prosecutionApi.addEvent(applicationId, {
        event_type: 'interview_completed',
        event_date: form.interview_date,
        title: `Examiner Interview Completed — ${outcomeLabel}`,
        description,
        is_completed: true,
        is_urgent: false,
        metadata: {
          outcome: form.outcome,
          examiner_name: form.examiner_name,
          summary_submitted: form.summary_submitted,
          summary_submitted_date: form.summary_submitted_date || null,
        },
      })

      toast.success('Interview outcome recorded')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record interview outcome')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Interview Outcome</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ri-date">
                Interview Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ri-date"
                type="date"
                value={form.interview_date}
                onChange={e => setField('interview_date', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ri-examiner">Examiner Name</Label>
              <Input
                id="ri-examiner"
                value={form.examiner_name}
                onChange={e => setField('examiner_name', e.target.value)}
                placeholder="USPTO examiner"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outcome</Label>
            <Select
              value={form.outcome}
              onValueChange={v => setField('outcome', v)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTCOMES.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ri-examiner-pos">Examiner&apos;s Stated Position</Label>
            <Textarea
              id="ri-examiner-pos"
              value={form.examiner_position}
              onChange={e => setField('examiner_position', e.target.value)}
              placeholder="Summary of examiner's position and reasoning…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ri-applicant-pos">Applicant&apos;s Position</Label>
            <Textarea
              id="ri-applicant-pos"
              value={form.applicant_position}
              onChange={e => setField('applicant_position', e.target.value)}
              placeholder="Arguments made by applicant's representative…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ri-next">Next Steps / Action Items</Label>
            <Textarea
              id="ri-next"
              value={form.next_steps}
              onChange={e => setField('next_steps', e.target.value)}
              placeholder="e.g. Amend claims 1, 5–7; submit after-final amendment…"
              rows={2}
              disabled={saving}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="ri-summary"
                type="checkbox"
                checked={form.summary_submitted}
                onChange={e => setField('summary_submitted', e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="ri-summary">Interview Summary submitted to USPTO</Label>
            </div>
            {form.summary_submitted && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="ri-summary-date">Summary Submission Date</Label>
                <Input
                  id="ri-summary-date"
                  type="date"
                  value={form.summary_submitted_date}
                  onChange={e => setField('summary_submitted_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Outcome
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
