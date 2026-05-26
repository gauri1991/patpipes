'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { prosecutionApi, PatentApplication } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface MarkAsFiledDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: PatentApplication
  onSaved?: () => void
}

interface FormState {
  filing_date: string
  application_number: string
  fee_status: 'paid' | 'pending' | 'none'
  fee_amount: string
  notes: string
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]

export function MarkAsFiledDialog({
  open,
  onOpenChange,
  application,
  onSaved,
}: MarkAsFiledDialogProps) {
  const [form, setForm] = useState<FormState>({
    filing_date: TODAY,
    application_number: application.application_number ?? '',
    fee_status: 'pending',
    fee_amount: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        filing_date: TODAY,
        application_number: application.application_number ?? '',
        fee_status: 'pending',
        fee_amount: '',
        notes: '',
      })
    }
  }, [open, application])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  const isProvisional = application.application_type === 'provisional'
  const isPct = application.application_type === 'pct'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.filing_date) {
      toast.error('Filing date is required')
      return
    }

    setSaving(true)
    try {
      // 1. Update application status and key dates
      const appUpdate = await prosecutionApi.updateApplication(application.id, {
        status: 'filed',
        filing_date: form.filing_date,
        ...(form.application_number ? { application_number: form.application_number } : {}),
      })
      if (!appUpdate.success) {
        toast.error(appUpdate.error ?? 'Failed to update application status')
        return
      }

      // 2–6: Secondary operations — run in parallel, don't block on partial failure
      const secondaryOps: Promise<unknown>[] = []

      // 2. Create application_filed prosecution event
      secondaryOps.push(
        prosecutionApi.addEvent(application.id, {
          event_type: 'application_filed',
          event_date: form.filing_date,
          title: 'Application Filed',
          description: [
            form.application_number ? `Application No.: ${form.application_number}` : '',
            form.notes,
          ].filter(Boolean).join('\n').trim(),
          is_completed: true,
          is_urgent: false,
          metadata: { filing_date: form.filing_date },
        })
      )

      // 3. Filing fee deadline
      if (form.fee_status !== 'none') {
        secondaryOps.push(
          prosecutionApi.createDeadline({
            application: application.id,
            deadline_type: 'fee_payment',
            due_date: form.filing_date,
            title: 'USPTO Filing Fee',
            priority: 'critical',
            description: form.fee_amount
              ? `Filing fee: $${form.fee_amount}`
              : 'USPTO filing fee',
          }).then(async res => {
            if (res.success && res.data && form.fee_status === 'paid') {
              await prosecutionApi.completeDeadline(res.data.id)
            }
          })
        )
      }

      // 4. Provisional → Non-provisional conversion deadline (12 months)
      if (isProvisional) {
        secondaryOps.push(
          prosecutionApi.createDeadline({
            application: application.id,
            deadline_type: 'filing_deadline',
            due_date: addMonths(form.filing_date, 12),
            title: 'Convert Provisional to Non-Provisional (12-Month Deadline)',
            priority: 'critical',
            description:
              'File a non-provisional application claiming priority to this provisional within 12 months of the provisional filing date.',
          })
        )
      }

      // 5. PCT national phase entry deadline (30 months from priority date or filing date)
      if (isPct) {
        const baseDate = application.priority_date ?? form.filing_date
        secondaryOps.push(
          prosecutionApi.createDeadline({
            application: application.id,
            deadline_type: 'filing_deadline',
            due_date: addMonths(baseDate, 30),
            title: 'PCT National Phase Entry Deadline (30 Months)',
            priority: 'critical',
            description:
              'Enter national/regional phase in desired jurisdictions within 30 months of the earliest priority date (31 months in some countries). Track individual country entries separately.',
          })
        )
      }

      await Promise.allSettled(secondaryOps)

      toast.success(
        isProvisional
          ? 'Application filed — 12-month conversion deadline created'
          : isPct
          ? 'PCT application filed — 30-month national phase deadline created'
          : 'Application marked as filed'
      )

      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to file application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark Application as Filed</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Provisional / PCT banners */}
          {isProvisional && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Provisional application</strong> — a 12-month deadline to file the non-provisional will be created automatically.
              </span>
            </div>
          )}
          {isPct && (
            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>PCT application</strong> — a 30-month national phase entry deadline will be created automatically.
              </span>
            </div>
          )}

          {/* Filing date */}
          <div className="space-y-2">
            <Label htmlFor="maf-filing-date">
              Filing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="maf-filing-date"
              type="date"
              value={form.filing_date}
              onChange={e => setField('filing_date', e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Application number */}
          <div className="space-y-2">
            <Label htmlFor="maf-app-number">
              USPTO Application Number
            </Label>
            <Input
              id="maf-app-number"
              value={form.application_number}
              onChange={e => setField('application_number', e.target.value)}
              placeholder="e.g. 17/123,456"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Can be added later if not yet assigned.
            </p>
          </div>

          {/* Filing fee */}
          <div className="space-y-2">
            <Label>Filing Fee</Label>
            <Select
              value={form.fee_status}
              onValueChange={v => setField('fee_status', v as FormState['fee_status'])}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid — mark as completed</SelectItem>
                <SelectItem value="pending">Pending — create open deadline</SelectItem>
                <SelectItem value="none">Skip — do not create fee deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.fee_status !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="maf-fee-amount">Fee Amount ($)</Label>
              <Input
                id="maf-fee-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.fee_amount}
                onChange={e => setField('fee_amount', e.target.value)}
                placeholder="e.g. 1720.00"
                disabled={saving}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="maf-notes">Notes</Label>
            <Textarea
              id="maf-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Optional notes to add to the filing event"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Summary of auto-actions */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Set status to &ldquo;Filed&rdquo; and record the filing date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Add an &ldquo;Application Filed&rdquo; event to the prosecution timeline</span>
            </div>
            {form.fee_status !== 'none' && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>
                  Create a filing fee deadline
                  {form.fee_status === 'paid' ? ' (marked as paid)' : ' (pending)'}
                </span>
              </div>
            )}
            {isProvisional && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>
                  Create 12-month non-provisional conversion deadline
                  {form.filing_date ? ` (due ${addMonths(form.filing_date, 12)})` : ''}
                </span>
              </div>
            )}
            {isPct && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>
                  Create 30-month PCT national phase deadline
                  {(application.priority_date ?? form.filing_date)
                    ? ` (due ${addMonths(application.priority_date ?? form.filing_date, 30)})`
                    : ''}
                </span>
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
