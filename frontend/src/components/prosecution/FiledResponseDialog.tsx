'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { prosecutionApi, OfficeAction } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface FiledResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  officeAction: OfficeAction
  applicationId: string
  onSaved?: () => void
}

interface FormState {
  response_filed_date: string
  response_type: string
  response_document: string
  notes: string
}

const RESPONSE_TYPES = [
  { value: 'response', label: 'Response / Remarks Only (no amendments)', eventType: 'response_filed' },
  { value: 'amendment', label: 'Amendment + Response (claims amended)', eventType: 'amendment_filed' },
  { value: 'election', label: 'Election Response (restriction)', eventType: 'response_filed' },
  { value: 'after_final', label: 'After-Final Amendment / AFCP 2.0', eventType: 'response_filed' },
]

const TODAY = new Date().toISOString().split('T')[0]

const ACTION_TYPE_LABELS: Record<string, string> = {
  non_final: 'Non-Final Office Action',
  final: 'Final Office Action',
  restriction: 'Restriction Requirement',
  advisory: 'Advisory Action',
}

export function FiledResponseDialog({
  open,
  onOpenChange,
  officeAction,
  applicationId,
  onSaved,
}: FiledResponseDialogProps) {
  const [form, setForm] = useState<FormState>({
    response_filed_date: TODAY,
    response_type: officeAction.action_type === 'restriction' ? 'election' : 'response',
    response_document: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        response_filed_date: TODAY,
        response_type: officeAction.action_type === 'restriction' ? 'election' : 'response',
        response_document: '',
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
    if (!form.response_filed_date) {
      toast.error('Filing date is required')
      return
    }
    setSaving(true)
    try {
      const selectedType = RESPONSE_TYPES.find(t => t.value === form.response_type)
      const eventType = selectedType?.eventType ?? 'response_filed'

      const ops: Promise<unknown>[] = []

      // 1. Update OA: response_status='filed', response_filed_date
      ops.push(
        prosecutionApi.updateOfficeAction(officeAction.id, {
          response_status: 'filed',
          response_filed_date: form.response_filed_date,
          ...(form.response_document ? { response_document: form.response_document } : {}),
        } as Partial<OfficeAction>)
      )

      // 2. Create prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: eventType,
          event_date: form.response_filed_date,
          title: `${selectedType?.label ?? 'Response'} Filed — ${ACTION_TYPE_LABELS[officeAction.action_type] ?? officeAction.action_type}`,
          description: [
            officeAction.mailing_date ? `In response to OA mailed ${new Date(officeAction.mailing_date).toLocaleDateString()}` : '',
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            office_action_id: officeAction.id,
            response_type: form.response_type,
            response_document: form.response_document,
          },
        })
      )

      // 3. Register response document record if file path provided
      if (form.response_document) {
        ops.push(
          prosecutionApi.createDocument({
            application: applicationId,
            document_type: 'response',
            title: `Response to ${ACTION_TYPE_LABELS[officeAction.action_type] ?? 'Office Action'} (${new Date(officeAction.mailing_date).toLocaleDateString()})`,
            description: form.notes,
            file_path: form.response_document,
            file_size: 0,
            file_type: form.response_document.split('.').pop()?.toLowerCase() ?? '',
            version: '1',
            is_current_version: true,
            is_filed: true,
            filing_date: form.response_filed_date,
          })
        )
      }

      const results = await Promise.allSettled(ops)
      const firstFail = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
      if (firstFail) throw firstFail.reason

      toast.success('Response filed successfully')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to file response')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>File Response</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Responding to: </span>
            <span className="font-medium">
              {ACTION_TYPE_LABELS[officeAction.action_type] ?? officeAction.action_type}
            </span>
            {officeAction.mailing_date && (
              <span className="text-muted-foreground">
                {' '}mailed {new Date(officeAction.mailing_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Response Type</Label>
            <Select
              value={form.response_type}
              onValueChange={v => setField('response_type', v)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESPONSE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fr-date">
              Filing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fr-date"
              type="date"
              value={form.response_filed_date}
              onChange={e => setField('response_filed_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fr-doc">Response Document (file path / URL)</Label>
            <Input
              id="fr-doc"
              value={form.response_document}
              onChange={e => setField('response_document', e.target.value)}
              placeholder="Optional — paste path or URL to filed document"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fr-notes">Notes</Label>
            <Textarea
              id="fr-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Key arguments, claim amendments summary…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Set office action status to &ldquo;Filed&rdquo; with the filing date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Add a response event to the prosecution timeline</span>
            </div>
            {form.response_document && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>Register the response document in the Documents tab</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File Response
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
