'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { prosecutionApi, OfficeAction } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface AfcpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  officeAction?: OfficeAction
  onSaved?: () => void
}

interface FormState {
  submission_date: string
  examiner_name: string
  request_type: string
  amendment_summary: string
  notes: string
  outcome: string
}

const REQUEST_TYPES = [
  { value: 'amendment', label: 'Claims Amendment' },
  { value: 'arguments', label: 'Arguments Only' },
  { value: 'both', label: 'Claims Amendment + Arguments' },
]

const OUTCOMES = [
  { value: 'pending', label: 'Pending — awaiting examiner decision' },
  { value: 'accepted', label: 'Accepted — examiner agreed to enter' },
  { value: 'rejected', label: 'Rejected — examiner declined to enter' },
]

const TODAY = new Date().toISOString().split('T')[0]

export function AfcpDialog({
  open,
  onOpenChange,
  applicationId,
  officeAction,
  onSaved,
}: AfcpDialogProps) {
  const [form, setForm] = useState<FormState>({
    submission_date: TODAY,
    examiner_name: officeAction?.examiner_name ?? '',
    request_type: 'both',
    amendment_summary: '',
    notes: '',
    outcome: 'pending',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        submission_date: TODAY,
        examiner_name: officeAction?.examiner_name ?? '',
        request_type: 'both',
        amendment_summary: '',
        notes: '',
        outcome: 'pending',
      })
    }
  }, [open, officeAction])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.submission_date) {
      toast.error('Submission date is required')
      return
    }
    setSaving(true)
    try {
      const outcomeLabel = OUTCOMES.find(o => o.value === form.outcome)?.label ?? form.outcome
      const requestLabel = REQUEST_TYPES.find(r => r.value === form.request_type)?.label ?? form.request_type

      const description = [
        `AFCP 2.0 Request — ${requestLabel}`,
        form.amendment_summary ? `Amendment summary: ${form.amendment_summary}` : '',
        `Outcome: ${outcomeLabel}`,
        form.notes,
      ].filter(Boolean).join('\n\n')

      const ops: Promise<unknown>[] = []

      // Create prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'response_filed',
          event_date: form.submission_date,
          title: `AFCP 2.0 Request Submitted (${requestLabel})`,
          description,
          is_completed: form.outcome !== 'pending',
          is_urgent: false,
          metadata: {
            type: 'afcp_2.0',
            request_type: form.request_type,
            outcome: form.outcome,
            office_action_id: officeAction?.id,
          },
        })
      )

      // If outcome is pending, create a deadline to track examiner's decision
      if (form.outcome === 'pending') {
        const decisionDue = new Date(form.submission_date)
        decisionDue.setDate(decisionDue.getDate() + 30)
        ops.push(
          prosecutionApi.createDeadline({
            application: applicationId,
            deadline_type: 'office_action_response',
            due_date: decisionDue.toISOString().split('T')[0],
            title: 'AFCP 2.0 — Examiner Decision Deadline',
            priority: 'high',
            description: 'Track examiner\'s decision on the AFCP 2.0 request. Update status when decision received.',
          })
        )
      }

      await Promise.allSettled(ops)

      toast.success('AFCP 2.0 request logged')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to log AFCP request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log AFCP 2.0 Request</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 mt-2">
          <strong>After Final Consideration Pilot (AFCP 2.0)</strong> — allows one request for reconsideration after a final rejection. The examiner considers the amendment without a count if it does not require a new search.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="afcp-date">
                Submission Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="afcp-date"
                type="date"
                value={form.submission_date}
                onChange={e => setField('submission_date', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afcp-examiner">Examiner Name</Label>
              <Input
                id="afcp-examiner"
                value={form.examiner_name}
                onChange={e => setField('examiner_name', e.target.value)}
                placeholder="USPTO examiner"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select
              value={form.request_type}
              onValueChange={v => setField('request_type', v)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="afcp-amendments">Amendment Summary</Label>
            <Textarea
              id="afcp-amendments"
              value={form.amendment_summary}
              onChange={e => setField('amendment_summary', e.target.value)}
              placeholder="Summary of claim amendments and/or arguments submitted…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Examiner&apos;s Decision</Label>
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
            <Label htmlFor="afcp-notes">Additional Notes</Label>
            <Textarea
              id="afcp-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Any additional context or follow-up actions…"
              rows={2}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log AFCP Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
