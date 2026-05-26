'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, GitBranch } from 'lucide-react'
import { prosecutionApi, PatentApplication } from '@/services/prosecutionApi'
import { toast } from 'sonner'

type ContinuationType = 'continuation' | 'cip' | 'divisional'

interface FileContinuationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parent: PatentApplication
  onSaved?: () => void
}

interface FormState {
  continuation_type: ContinuationType
  title: string
  filing_date: string
  application_number: string
  notes: string
}

const TYPE_META: Record<ContinuationType, { label: string; description: string }> = {
  continuation: {
    label: 'Continuation',
    description:
      "Claims the same disclosure as the parent. Must be pending before the parent issues. Shares the parent's priority date.",
  },
  cip: {
    label: 'Continuation-in-Part (CIP)',
    description:
      'Adds new matter beyond the parent disclosure. New claims get the CIP filing date; claims fully supported by the parent get the parent priority date.',
  },
  divisional: {
    label: 'Divisional',
    description:
      'Files a separate application for an invention restricted out of the parent. Must be filed while the parent is pending.',
  },
}

const TODAY = new Date().toISOString().split('T')[0]

export function FileContinuationDialog({
  open,
  onOpenChange,
  parent,
  onSaved,
}: FileContinuationDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    continuation_type: 'continuation',
    title: '',
    filing_date: TODAY,
    application_number: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        continuation_type: 'continuation',
        title: `${parent.title} — Continuation`,
        filing_date: TODAY,
        application_number: '',
        notes: '',
      })
    }
  }, [open, parent.title])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Auto-update title when type changes
  function handleTypeChange(type: ContinuationType) {
    const suffix =
      type === 'continuation' ? 'Continuation'
        : type === 'cip' ? 'CIP'
        : 'Divisional'
    // Only auto-update if still using a generated title
    setForm(prev => ({
      ...prev,
      continuation_type: type,
      title: prev.title.startsWith(parent.title)
        ? `${parent.title} — ${suffix}`
        : prev.title,
    }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      // 1. Create the child application
      const childRes = await prosecutionApi.createApplication({
        title: form.title.trim(),
        application_type: form.continuation_type,
        application_number: form.application_number.trim() || undefined,
        filing_date: form.filing_date || undefined,
        priority_date: parent.priority_date || parent.filing_date || undefined,
        jurisdiction: parent.jurisdiction,
        priority_level: parent.priority_level,
        technology_area: parent.technology_area || undefined,
        inventors: parent.inventors,
        assignees: parent.assignees,
        ipc_classes: parent.ipc_classes,
        keywords: parent.keywords,
        status: 'pending',
      })

      if (!childRes.success || !childRes.data) {
        throw new Error(childRes.error ?? 'Failed to create application')
      }

      const child = childRes.data
      const typeLabel = TYPE_META[form.continuation_type].label
      const ops: Promise<unknown>[] = []

      // 2. Log event on PARENT: to_child
      ops.push(
        prosecutionApi.addEvent(parent.id, {
          event_type: 'continuation_filed',
          event_date: form.filing_date || TODAY,
          title: `${typeLabel} Filed`,
          description: [
            `Child application: ${child.title}`,
            form.application_number ? `Application number: ${form.application_number}` : '',
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            direction: 'to_child',
            continuation_type: form.continuation_type,
            child_id: child.id,
            child_title: child.title,
            child_application_number: form.application_number || null,
          },
        })
      )

      // 3. Log event on CHILD: from_parent
      ops.push(
        prosecutionApi.addEvent(child.id, {
          event_type: 'continuation_filed',
          event_date: form.filing_date || TODAY,
          title: `Filed as ${typeLabel} of Parent`,
          description: [
            `Parent application: ${parent.title}`,
            parent.application_number ? `Parent number: ${parent.application_number}` : '',
            form.notes,
          ].filter(Boolean).join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: {
            direction: 'from_parent',
            continuation_type: form.continuation_type,
            parent_id: parent.id,
            parent_title: parent.title,
            parent_application_number: parent.application_number || null,
          },
        })
      )

      await Promise.allSettled(ops)

      toast.success(`${typeLabel} created — navigating to new application`)
      onSaved?.()
      onOpenChange(false)
      router.push(`/dashboard/prosecution/applications/${child.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to file continuation')
    } finally {
      setSaving(false)
    }
  }

  const typeMeta = TYPE_META[form.continuation_type]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            File Continuation Application
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Parent: <span className="font-medium text-foreground">{parent.title}</span>
          {parent.application_number && (
            <span className="ml-2 font-mono">{parent.application_number}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Continuation Type</Label>
            <Select
              value={form.continuation_type}
              onValueChange={v => handleTypeChange(v as ContinuationType)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="continuation">Continuation</SelectItem>
                <SelectItem value="cip">Continuation-in-Part (CIP)</SelectItem>
                <SelectItem value="divisional">Divisional</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{typeMeta.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cont-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cont-title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cont-date">Filing Date</Label>
              <Input
                id="cont-date"
                type="date"
                value={form.filing_date}
                onChange={e => setField('filing_date', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cont-number">Application Number</Label>
              <Input
                id="cont-number"
                value={form.application_number}
                onChange={e => setField('application_number', e.target.value)}
                placeholder="If already received"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cont-notes">Strategy Notes</Label>
            <Textarea
              id="cont-notes"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Claim scope, new matter added (CIP), restricted inventions (divisional)…"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Pre-filled data summary */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Pre-filled from parent:</p>
            {parent.inventors.length > 0 && (
              <p>Inventors: {parent.inventors.join(', ')}</p>
            )}
            {parent.assignees.length > 0 && (
              <p>Assignees: {parent.assignees.join(', ')}</p>
            )}
            {parent.technology_area && (
              <p>Technology area: {parent.technology_area}</p>
            )}
            {(parent.priority_date || parent.filing_date) && (
              <p>
                Priority date:{' '}
                {new Date(parent.priority_date || parent.filing_date!).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Auto-actions */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">This will automatically:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Create a new {typeMeta.label} application record</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Link it to this parent application via prosecution events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Navigate to the new child application</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File {TYPE_META[form.continuation_type].label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
