'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, Trophy } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface RecordGrantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  applicationTitle: string
  onSaved?: () => void
}

interface FormState {
  patent_number: string
  grant_date: string
  notes: string
}

const TODAY = new Date().toISOString().split('T')[0]

export function RecordGrantDialog({
  open,
  onOpenChange,
  applicationId,
  applicationTitle,
  onSaved,
}: RecordGrantDialogProps) {
  const [form, setForm] = useState<FormState>({
    patent_number: '',
    grant_date: TODAY,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ patent_number: '', grant_date: TODAY, notes: '' })
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
    if (!form.patent_number.trim()) {
      toast.error('Patent number is required')
      return
    }
    if (!form.grant_date) {
      toast.error('Grant date is required')
      return
    }
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      // 1. Update application: status → granted, patent_number, grant_date
      ops.push(
        prosecutionApi.updateApplication(applicationId, {
          status: 'granted',
          patent_number: form.patent_number.trim(),
          grant_date: form.grant_date,
        })
      )

      // 2. Add patent_granted prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'patent_granted',
          event_date: form.grant_date,
          title: `Patent Granted — ${form.patent_number.trim()}`,
          description: [
            `Patent number: ${form.patent_number.trim()}`,
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: { patent_number: form.patent_number.trim() },
        })
      )

      await Promise.allSettled(ops)

      toast.success(
        `Patent ${form.patent_number.trim()} recorded — application status set to Granted`
      )
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record grant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Record Patent Grant
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          <span className="font-medium">{applicationTitle}</span> has been granted. Record the patent
          number and issue date from the USPTO grant notice.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grant-patent-number">
              Patent Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="grant-patent-number"
              value={form.patent_number}
              onChange={e => setField('patent_number', e.target.value)}
              placeholder="e.g. US 12,345,678 B2"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-date">
              Grant Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="grant-date"
              type="date"
              value={form.grant_date}
              onChange={e => setField('grant_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-notes">Notes</Label>
            <Textarea
              id="grant-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Maintenance fee schedule, portfolio notes, licensing considerations…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Set application status to &ldquo;Granted&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Save patent number and grant date to the application record</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Add &ldquo;Patent Granted&rdquo; event to the prosecution timeline</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            To add this patent to your portfolio, visit the{' '}
            <a href="/dashboard/portfolio" className="underline text-primary">
              Portfolio module
            </a>{' '}
            and create a patent record using this number.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.patent_number.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Grant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
