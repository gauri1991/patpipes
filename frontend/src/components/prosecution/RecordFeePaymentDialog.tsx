'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { prosecutionApi, ProsecutionDeadline } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface RecordFeePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  deadline: ProsecutionDeadline
  onSaved?: () => void
}

interface FormState {
  payment_date: string
  fee_amount: string
  payment_method: string
  notes: string
}

const TODAY = new Date().toISOString().split('T')[0]

const PAYMENT_METHODS = [
  { value: 'uspto_efs', label: 'USPTO Patent Center / EFS-Web' },
  { value: 'annuity_agent', label: 'Annuity / Maintenance Agent' },
  { value: 'credit_card', label: 'Credit Card via USPTO' },
  { value: 'check', label: 'Check (USPTO Deposit Account)' },
  { value: 'other', label: 'Other' },
]

export function RecordFeePaymentDialog({
  open,
  onOpenChange,
  applicationId,
  deadline,
  onSaved,
}: RecordFeePaymentDialogProps) {
  const [form, setForm] = useState<FormState>({
    payment_date: TODAY,
    fee_amount: '',
    payment_method: 'uspto_efs',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ payment_date: TODAY, fee_amount: '', payment_method: 'uspto_efs', notes: '' })
    }
  }, [open])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  // Detect surcharge window: payment date is after deadline due date
  const isLate = deadline.due_date && new Date(form.payment_date) > new Date(deadline.due_date)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.payment_date) {
      toast.error('Payment date is required')
      return
    }
    setSaving(true)
    try {
      const methodLabel =
        PAYMENT_METHODS.find(m => m.value === form.payment_method)?.label ?? form.payment_method
      const ops: Promise<unknown>[] = []

      // 1. Add fee_paid prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'fee_paid',
          event_date: form.payment_date,
          title: `${deadline.title} — Paid`,
          description: [
            form.fee_amount ? `Amount: $${form.fee_amount}` : '',
            `Method: ${methodLabel}`,
            isLate ? 'Paid within surcharge window — late surcharge fee applies.' : '',
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            deadline_id: deadline.id,
            fee_amount: form.fee_amount,
            payment_method: form.payment_method,
            in_surcharge_window: isLate,
          },
        })
      )

      // 2. Mark deadline complete
      ops.push(prosecutionApi.completeDeadline(deadline.id))

      await Promise.allSettled(ops)

      toast.success('Fee payment recorded')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{deadline.title}</span>
          {deadline.due_date && (
            <span className="ml-2">
              — due {new Date(deadline.due_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {isLate && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Payment date is after the due date — this falls within the 6-month surcharge window.
            A USPTO surcharge applies.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-date">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pay-date"
              type="date"
              value={form.payment_date}
              onChange={e => setField('payment_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount Paid ($)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.fee_amount}
              onChange={e => setField('fee_amount', e.target.value)}
              placeholder="e.g. 800.00"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={form.payment_method}
              onValueChange={v => setField('payment_method', v)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes</Label>
            <Textarea
              id="pay-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Confirmation number, agent reference…"
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
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
