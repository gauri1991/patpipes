'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, Award } from 'lucide-react'
import { prosecutionApi, OfficeAction } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface NoticeOfAllowanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  officeAction: OfficeAction
  onSaved?: () => void
}

interface FormState {
  mailing_date: string
  issue_fee_amount: string
  issue_fee_status: 'paid' | 'pending'
  has_examiner_amendments: boolean
  examiner_amendments_summary: string
  formal_drawings_needed: boolean
  notes: string
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]

export function NoticeOfAllowanceDialog({
  open,
  onOpenChange,
  applicationId,
  officeAction,
  onSaved,
}: NoticeOfAllowanceDialogProps) {
  const [form, setForm] = useState<FormState>({
    mailing_date: officeAction.mailing_date ?? TODAY,
    issue_fee_amount: '',
    issue_fee_status: 'pending',
    has_examiner_amendments: false,
    examiner_amendments_summary: '',
    formal_drawings_needed: false,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        mailing_date: officeAction.mailing_date ?? TODAY,
        issue_fee_amount: '',
        issue_fee_status: 'pending',
        has_examiner_amendments: false,
        examiner_amendments_summary: '',
        formal_drawings_needed: false,
        notes: '',
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
    if (!form.mailing_date) {
      toast.error('Mailing date is required')
      return
    }
    setSaving(true)
    try {
      const issueFeeDeadline = addMonths(form.mailing_date, 3)
      const ops: Promise<unknown>[] = []

      // 1. Update application status → allowed
      ops.push(
        prosecutionApi.updateApplication(applicationId, { status: 'allowed' })
      )

      // 2. Add allowance_received event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'allowance_received',
          event_date: form.mailing_date,
          title: 'Notice of Allowance Received',
          description: [
            form.has_examiner_amendments
              ? `Examiner's amendments: ${form.examiner_amendments_summary}`
              : '',
            form.formal_drawings_needed ? 'Formal drawings required before issue.' : '',
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            has_examiner_amendments: form.has_examiner_amendments,
            formal_drawings_needed: form.formal_drawings_needed,
          },
        })
      )

      // 3. Issue fee payment deadline (3 months from mailing)
      ops.push(
        prosecutionApi.createDeadline({
          application: applicationId,
          deadline_type: 'fee_payment',
          due_date: issueFeeDeadline,
          title: 'Issue Fee Payment',
          priority: 'critical',
          description: form.issue_fee_amount
            ? `Issue fee: $${form.issue_fee_amount}`
            : 'USPTO issue fee due 3 months from Notice of Allowance mailing date.',
        }).then(async res => {
          if (res.success && res.data && form.issue_fee_status === 'paid') {
            await prosecutionApi.completeDeadline(res.data.id)
          }
        })
      )

      // 4. Examiner's amendments → urgent event to review
      if (form.has_examiner_amendments && form.examiner_amendments_summary) {
        ops.push(
          prosecutionApi.addEvent(applicationId, {
            event_type: 'response_filed',
            event_date: form.mailing_date,
            title: "Examiner's Amendments — Review Required",
            description: form.examiner_amendments_summary,
            is_completed: false,
            is_urgent: true,
            metadata: { type: 'examiner_amendments' },
          })
        )
      }

      // 5. Formal drawings → filing deadline (same as issue fee deadline)
      if (form.formal_drawings_needed) {
        ops.push(
          prosecutionApi.createDeadline({
            application: applicationId,
            deadline_type: 'filing_deadline',
            due_date: issueFeeDeadline,
            title: 'Formal Drawings Due',
            priority: 'high',
            description: 'File formal drawings no later than the issue fee deadline.',
          })
        )
      }

      // 6. Mark the NoA office action as handled
      ops.push(
        prosecutionApi.updateOfficeAction(officeAction.id, {
          response_status: 'filed',
        })
      )

      await Promise.allSettled(ops)

      toast.success('Notice of Allowance recorded — application status set to Allowed')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record allowance')
    } finally {
      setSaving(false)
    }
  }

  const issueFeeDeadlineLabel = form.mailing_date
    ? new Date(addMonths(form.mailing_date, 3)).toLocaleDateString()
    : '3 months from mailing'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-green-600" />
            Handle Notice of Allowance
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          A Notice of Allowance means the USPTO has found the claims allowable. The issue fee is
          due within 3 months of the mailing date (extendable to 6 months with fees).
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="noa-mailing-date">
              NoA Mailing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="noa-mailing-date"
              type="date"
              value={form.mailing_date}
              onChange={e => setField('mailing_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Issue Fee Status</Label>
            <Select
              value={form.issue_fee_status}
              onValueChange={v => setField('issue_fee_status', v as FormState['issue_fee_status'])}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending — create open deadline</SelectItem>
                <SelectItem value="paid">Already paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noa-fee">Issue Fee Amount ($)</Label>
            <Input
              id="noa-fee"
              type="number"
              min="0"
              step="0.01"
              value={form.issue_fee_amount}
              onChange={e => setField('issue_fee_amount', e.target.value)}
              placeholder="e.g. 1200.00"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              2024 USPTO rates: $1,200 large entity · $480 small entity · $240 micro entity
            </p>
          </div>

          {/* Examiner's amendments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="noa-amendments"
                type="checkbox"
                checked={form.has_examiner_amendments}
                onChange={e => setField('has_examiner_amendments', e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="noa-amendments">Contains examiner&apos;s amendments</Label>
            </div>
            {form.has_examiner_amendments && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Amendment Summary</Label>
                <Textarea
                  value={form.examiner_amendments_summary}
                  onChange={e => setField('examiner_amendments_summary', e.target.value)}
                  placeholder="Describe the examiner's amendments to claims…"
                  rows={3}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Formal drawings */}
          <div className="flex items-center gap-2">
            <input
              id="noa-drawings"
              type="checkbox"
              checked={form.formal_drawings_needed}
              onChange={e => setField('formal_drawings_needed', e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="noa-drawings">Formal drawings required before issue</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noa-notes">Notes</Label>
            <Textarea
              id="noa-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Any additional context or follow-up actions…"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Auto-actions summary */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Set application status to &ldquo;Allowed&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Add &ldquo;Allowance Received&rdquo; event to prosecution timeline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>
                Create issue fee deadline ({issueFeeDeadlineLabel})
                {form.issue_fee_status === 'paid' ? ' — marked as paid' : ''}
              </span>
            </div>
            {form.has_examiner_amendments && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>Flag examiner&apos;s amendments for review</span>
              </div>
            )}
            {form.formal_drawings_needed && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>Create formal drawings deadline ({issueFeeDeadlineLabel})</span>
              </div>
            )}
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
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Allowance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
