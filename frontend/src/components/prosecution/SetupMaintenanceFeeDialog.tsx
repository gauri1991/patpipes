'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, CalendarClock } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface SetupMaintenanceFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  grantDate: string
  onSaved?: () => void
}

type EntitySize = 'large' | 'small' | 'micro'

interface FeeWindow {
  label: string
  years: number
  surchargeYears: number
  fees: Record<EntitySize, number>
}

// USPTO 2024 maintenance fee schedule
const FEE_WINDOWS: FeeWindow[] = [
  {
    label: '1st Maintenance Fee (3.5 year)',
    years: 3.5,
    surchargeYears: 4,
    fees: { large: 2000, small: 800, micro: 400 },
  },
  {
    label: '2nd Maintenance Fee (7.5 year)',
    years: 7.5,
    surchargeYears: 8,
    fees: { large: 3760, small: 1504, micro: 752 },
  },
  {
    label: '3rd Maintenance Fee (11.5 year)',
    years: 11.5,
    surchargeYears: 12,
    fees: { large: 7700, small: 3080, micro: 1540 },
  },
]

function addYearsToDate(dateStr: string, years: number): string {
  const d = new Date(dateStr)
  const wholeYears = Math.floor(years)
  const hasHalfYear = years % 1 !== 0
  d.setFullYear(d.getFullYear() + wholeYears)
  if (hasHalfYear) d.setMonth(d.getMonth() + 6)
  return d.toISOString().split('T')[0]
}

interface FeeRow {
  window: FeeWindow
  due_date: string
  surcharge_date: string
  amount: string
  status: 'pending' | 'paid'
}

export function SetupMaintenanceFeeDialog({
  open,
  onOpenChange,
  applicationId,
  grantDate,
  onSaved,
}: SetupMaintenanceFeeDialogProps) {
  const [entitySize, setEntitySize] = useState<EntitySize>('small')
  const [rows, setRows] = useState<FeeRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && grantDate) {
      setEntitySize('small')
      setRows(
        FEE_WINDOWS.map(w => ({
          window: w,
          due_date: addYearsToDate(grantDate, w.years),
          surcharge_date: addYearsToDate(grantDate, w.surchargeYears),
          amount: String(w.fees.small),
          status: 'pending',
        }))
      )
    }
  }, [open, grantDate])

  function handleEntitySizeChange(size: EntitySize) {
    setEntitySize(size)
    setRows(prev => prev.map(row => ({ ...row, amount: String(row.window.fees[size]) })))
  }

  function updateRow(idx: number, updates: Partial<FeeRow>) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...updates } : r)))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      for (const row of rows) {
        // Main maintenance fee deadline
        ops.push(
          prosecutionApi.createDeadline({
            application: applicationId,
            deadline_type: 'maintenance_fee',
            due_date: row.due_date,
            title: row.window.label,
            priority: 'critical',
            description: row.amount
              ? `USPTO maintenance fee: $${row.amount} (${entitySize} entity)`
              : undefined,
          }).then(async res => {
            if (res.success && res.data && row.status === 'paid') {
              await prosecutionApi.completeDeadline(res.data.id)
            }
          })
        )

        // Surcharge window deadline (only for pending fees)
        if (row.status === 'pending') {
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'maintenance_fee',
              due_date: row.surcharge_date,
              title: `${row.window.label} — Surcharge Window Closes`,
              priority: 'high',
              description: `6-month surcharge grace period ends ${new Date(row.surcharge_date).toLocaleDateString()}. Late fees apply if paid in this window.`,
            })
          )
        }
      }

      await Promise.allSettled(ops)

      toast.success('Maintenance fee schedule created')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create maintenance schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Setup Maintenance Fee Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          US utility patents require maintenance fees at 3.5, 7.5, and 11.5 years from the grant date.
          A 6-month surcharge window follows each deadline. Failure to pay results in abandonment.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Entity Size</Label>
            <Select
              value={entitySize}
              onValueChange={v => handleEntitySizeChange(v as EntitySize)}
              disabled={saving}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="large">Large Entity</SelectItem>
                <SelectItem value="small">Small Entity</SelectItem>
                <SelectItem value="micro">Micro Entity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={idx} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{row.window.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      id={`fee-paid-${idx}`}
                      type="checkbox"
                      checked={row.status === 'paid'}
                      onChange={e => updateRow(idx, { status: e.target.checked ? 'paid' : 'pending' })}
                      disabled={saving}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`fee-paid-${idx}`} className="text-xs font-normal">
                      Already paid
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={row.due_date}
                      onChange={e => updateRow(idx, { due_date: e.target.value })}
                      disabled={saving}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Surcharge Window Closes</Label>
                    <Input
                      type="date"
                      value={row.surcharge_date}
                      onChange={e => updateRow(idx, { surcharge_date: e.target.value })}
                      disabled={saving}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fee Amount ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={e => updateRow(idx, { amount: e.target.value })}
                      disabled={saving}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will create:</p>
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span>
                  {row.window.label}
                  {row.status === 'pending'
                    ? ' + surcharge window deadline'
                    : ' (marked as paid)'}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
