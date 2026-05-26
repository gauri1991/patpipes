'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, RotateCcw } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface RceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  rceNumber: number
  onSaved?: () => void
}

interface FormState {
  filing_date: string
  includes_amendment: boolean
  amendment_summary: string
  fee_status: 'paid' | 'pending'
  fee_amount: string
  notes: string
}

const TODAY = new Date().toISOString().split('T')[0]

export function RceDialog({
  open,
  onOpenChange,
  applicationId,
  rceNumber,
  onSaved,
}: RceDialogProps) {
  const [form, setForm] = useState<FormState>({
    filing_date: TODAY,
    includes_amendment: false,
    amendment_summary: '',
    fee_status: 'pending',
    fee_amount: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        filing_date: TODAY,
        includes_amendment: false,
        amendment_summary: '',
        fee_status: 'pending',
        fee_amount: '',
        notes: '',
      })
    }
  }, [open])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.filing_date) {
      toast.error('Filing date is required')
      return
    }
    setSaving(true)
    try {
      const rceLabel = rceNumber === 1 ? 'RCE' : `RCE #${rceNumber}`
      const description = [
        rceNumber > 1 ? `This is RCE #${rceNumber} for this application.` : '',
        form.includes_amendment ? `Filed with amendment: ${form.amendment_summary}` : 'Filed without amendment.',
        form.fee_status === 'paid'
          ? `Filing fee paid${form.fee_amount ? ': $' + form.fee_amount : ''}`
          : 'Filing fee pending.',
        form.notes,
      ].filter(Boolean).join('\n')

      const ops: Promise<unknown>[] = []

      // 1. Create rce_filed prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'rce_filed',
          event_date: form.filing_date,
          title: `${rceLabel} Filed`,
          description,
          is_completed: true,
          is_urgent: false,
          metadata: {
            rce_number: rceNumber,
            includes_amendment: form.includes_amendment,
            fee_status: form.fee_status,
            fee_amount: form.fee_amount,
          },
        })
      )

      // 2. Update application status to under_examination
      ops.push(
        prosecutionApi.updateApplication(applicationId, {
          status: 'under_examination',
        })
      )

      // 3. Create filing fee deadline
      ops.push(
        prosecutionApi.createDeadline({
          application: applicationId,
          deadline_type: 'fee_payment',
          due_date: form.filing_date,
          title: `${rceLabel} Filing Fee`,
          priority: 'critical',
          description: form.fee_amount ? `RCE filing fee: $${form.fee_amount}` : 'RCE filing fee',
        }).then(async res => {
          if (res.success && res.data && form.fee_status === 'paid') {
            await prosecutionApi.completeDeadline(res.data.id)
          }
        })
      )

      // 4. If filed with amendment, also create amendment_filed event
      if (form.includes_amendment && form.amendment_summary) {
        ops.push(
          prosecutionApi.addEvent(applicationId, {
            event_type: 'amendment_filed',
            event_date: form.filing_date,
            title: `Amendment Filed with ${rceLabel}`,
            description: form.amendment_summary,
            is_completed: true,
            is_urgent: false,
            metadata: { rce_number: rceNumber },
          })
        )
      }

      await Promise.allSettled(ops)

      toast.success(
        `${rceLabel} filed — application status reset to Under Examination`
      )
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to file RCE')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            File Request for Continued Examination (RCE{rceNumber > 1 ? ` #${rceNumber}` : ''})
          </DialogTitle>
        </DialogHeader>

        {rceNumber > 1 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This application has had {rceNumber - 1} prior RCE{rceNumber > 2 ? 's' : ''}. Each additional RCE carries higher fees and continued prosecution risk.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rce-date">
              Filing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rce-date"
              type="date"
              value={form.filing_date}
              onChange={e => setField('filing_date', e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Amendment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="rce-amendment"
                type="checkbox"
                checked={form.includes_amendment}
                onChange={e => setField('includes_amendment', e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rce-amendment">Filed with claims amendment</Label>
            </div>
            {form.includes_amendment && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Amendment Summary</Label>
                <Textarea
                  value={form.amendment_summary}
                  onChange={e => setField('amendment_summary', e.target.value)}
                  placeholder="Describe the claim amendments filed with this RCE…"
                  rows={3}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Filing fee */}
          <div className="space-y-2">
            <Label>Filing Fee</Label>
            <Select
              value={form.fee_status}
              onValueChange={v => setField('fee_status', v as FormState['fee_status'])}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid at time of filing</SelectItem>
                <SelectItem value="pending">Pending — create open deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rce-fee">Fee Amount ($)</Label>
            <Input
              id="rce-fee"
              type="number"
              min="0"
              step="0.01"
              value={form.fee_amount}
              onChange={e => setField('fee_amount', e.target.value)}
              placeholder="e.g. 2800.00 (large entity)"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              2024 USPTO rates: $2,800 large entity · $1,400 small entity · $700 micro entity
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rce-notes">Notes</Label>
            <Textarea
              id="rce-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Strategy rationale, examiner's outstanding concerns…"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Auto-actions summary */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Add an &ldquo;RCE Filed&rdquo; event to the prosecution timeline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Reset application status to &ldquo;Under Examination&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>
                Create a filing fee deadline
                {form.fee_status === 'paid' ? ' (marked as paid)' : ' (pending)'}
              </span>
            </div>
            {form.includes_amendment && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>Add an &ldquo;Amendment Filed&rdquo; event to the timeline</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File RCE
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
