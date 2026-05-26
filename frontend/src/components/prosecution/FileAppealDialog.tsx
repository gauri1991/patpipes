'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, Scale } from 'lucide-react'
import { prosecutionApi, OfficeAction } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface FileAppealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  officeAction?: OfficeAction
  onSaved?: () => void
}

interface FormState {
  appeal_date: string
  fee_status: 'paid' | 'pending'
  fee_amount: string
  brief_due_date: string
  brief_already_filed: boolean
  brief_filing_date: string
  strategy_notes: string
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]

export function FileAppealDialog({
  open,
  onOpenChange,
  applicationId,
  officeAction,
  onSaved,
}: FileAppealDialogProps) {
  const [form, setForm] = useState<FormState>({
    appeal_date: TODAY,
    fee_status: 'pending',
    fee_amount: '',
    brief_due_date: addMonths(TODAY, 2),
    brief_already_filed: false,
    brief_filing_date: TODAY,
    strategy_notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        appeal_date: TODAY,
        fee_status: 'pending',
        fee_amount: '',
        brief_due_date: addMonths(TODAY, 2),
        brief_already_filed: false,
        brief_filing_date: TODAY,
        strategy_notes: '',
      })
    }
  }, [open])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Recalculate brief due date when appeal date changes
  function handleAppealDateChange(date: string) {
    setForm(prev => ({
      ...prev,
      appeal_date: date,
      brief_due_date: date ? addMonths(date, 2) : prev.brief_due_date,
    }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.appeal_date) {
      toast.error('Appeal filing date is required')
      return
    }
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      // 1. Add appeal_filed event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'appeal_filed',
          event_date: form.appeal_date,
          title: 'Notice of Appeal Filed',
          description: [
            officeAction
              ? `Appeal of Final Office Action mailed ${officeAction.mailing_date ? new Date(officeAction.mailing_date).toLocaleDateString() : 'unknown date'}`
              : '',
            form.fee_status === 'paid'
              ? `Appeal fee paid${form.fee_amount ? ': $' + form.fee_amount : ''}`
              : 'Appeal fee pending.',
            form.strategy_notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            office_action_id: officeAction?.id,
            fee_status: form.fee_status,
            fee_amount: form.fee_amount,
          },
        })
      )

      // 2. Appeal fee deadline
      ops.push(
        prosecutionApi.createDeadline({
          application: applicationId,
          deadline_type: 'appeal_deadline',
          due_date: form.appeal_date,
          title: 'Appeal Filing Fee',
          priority: 'critical',
          description: form.fee_amount ? `Appeal fee: $${form.fee_amount}` : 'USPTO appeal filing fee',
        }).then(async res => {
          if (res.success && res.data && form.fee_status === 'paid') {
            await prosecutionApi.completeDeadline(res.data.id)
          }
        })
      )

      // 3. Appeal Brief deadline (2 months from Notice of Appeal)
      ops.push(
        prosecutionApi.createDeadline({
          application: applicationId,
          deadline_type: 'appeal_deadline',
          due_date: form.brief_due_date,
          title: 'Appeal Brief Due',
          priority: 'critical',
          description:
            'PTAB appeal brief due 2 months from the date the Notice of Appeal was filed (extendable).',
        }).then(async res => {
          if (res.success && res.data && form.brief_already_filed) {
            await prosecutionApi.completeDeadline(res.data.id)
          }
        })
      )

      // 4. If brief already filed: log the event + document
      if (form.brief_already_filed && form.brief_filing_date) {
        ops.push(
          prosecutionApi.addEvent(applicationId, {
            event_type: 'response_filed',
            event_date: form.brief_filing_date,
            title: 'Appeal Brief Filed',
            description: form.strategy_notes,
            is_completed: true,
            is_urgent: false,
            metadata: { type: 'appeal_brief' },
          })
        )
      }

      // 5. Mark the triggering Final OA as responded (appeal is the response)
      if (officeAction && officeAction.response_status !== 'filed') {
        ops.push(
          prosecutionApi.updateOfficeAction(officeAction.id, {
            response_status: 'filed',
          })
        )
      }

      await Promise.allSettled(ops)

      toast.success('Notice of Appeal filed — appeal brief deadline created')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to file appeal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            File Notice of Appeal (PTAB)
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          A Notice of Appeal initiates review by the Patent Trial and Appeal Board (PTAB). The
          Appeal Brief is due 2 months after the Notice of Appeal is filed (extendable by 1 month
          increments up to 5 months with fees).
        </div>

        {officeAction && (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Appealing Final Office Action mailed{' '}
            <span className="font-medium text-foreground">
              {officeAction.mailing_date
                ? new Date(officeAction.mailing_date).toLocaleDateString()
                : '(date unknown)'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appeal-date">
              Notice of Appeal Filing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="appeal-date"
              type="date"
              value={form.appeal_date}
              onChange={e => handleAppealDateChange(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Appeal Fee Status</Label>
              <Select
                value={form.fee_status}
                onValueChange={v => setField('fee_status', v as FormState['fee_status'])}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appeal-fee">Fee Amount ($)</Label>
              <Input
                id="appeal-fee"
                type="number"
                min="0"
                step="0.01"
                value={form.fee_amount}
                onChange={e => setField('fee_amount', e.target.value)}
                placeholder="e.g. 930.00"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief-due">Appeal Brief Due Date</Label>
            <Input
              id="brief-due"
              type="date"
              value={form.brief_due_date}
              onChange={e => setField('brief_due_date', e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Auto-set to 2 months from Notice of Appeal. Adjust if extensions were filed.
            </p>
          </div>

          {/* Brief already filed? */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="brief-filed"
                type="checkbox"
                checked={form.brief_already_filed}
                onChange={e => setField('brief_already_filed', e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="brief-filed">Appeal Brief already filed</Label>
            </div>
            {form.brief_already_filed && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Brief Filing Date</Label>
                <Input
                  type="date"
                  value={form.brief_filing_date}
                  onChange={e => setField('brief_filing_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appeal-strategy">Appeal Strategy / Notes</Label>
            <Textarea
              id="appeal-strategy"
              value={form.strategy_notes}
              onChange={e => setField('strategy_notes', e.target.value)}
              placeholder="Grounds of appeal, claim groupings, examiner error arguments…"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Auto-actions */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Add &ldquo;Notice of Appeal Filed&rdquo; event to timeline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>
                Create Appeal Brief deadline ({form.brief_due_date ? new Date(form.brief_due_date).toLocaleDateString() : '2 months from now'})
                {form.brief_already_filed ? ' — marked complete' : ''}
              </span>
            </div>
            {form.brief_already_filed && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>Add &ldquo;Appeal Brief Filed&rdquo; event</span>
              </div>
            )}
            {officeAction && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>Mark Final Office Action as responded</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File Notice of Appeal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
