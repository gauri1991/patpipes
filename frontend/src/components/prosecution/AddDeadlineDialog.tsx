'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X } from 'lucide-react'
import { prosecutionApi, ProsecutionDeadline } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface AddDeadlineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId?: string
  deadline?: ProsecutionDeadline | null
  onSaved?: () => void
}

interface FormState {
  deadline_type: string
  title: string
  due_date: string
  priority: string
  description: string
  reminder_dates: string[]
}

const DEADLINE_TYPES = [
  { value: 'office_action_response', label: 'Office Action Response' },
  { value: 'filing_deadline', label: 'Filing Deadline' },
  { value: 'fee_payment', label: 'Fee Payment' },
  { value: 'examination_request', label: 'Examination Request' },
  { value: 'maintenance_fee', label: 'Maintenance Fee' },
  { value: 'publication_request', label: 'Publication Request' },
  { value: 'interview_deadline', label: 'Interview Deadline' },
  { value: 'appeal_deadline', label: 'Appeal Deadline' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const INITIAL_FORM: FormState = {
  deadline_type: 'office_action_response',
  title: '',
  due_date: '',
  priority: 'high',
  description: '',
  reminder_dates: [],
}

export function AddDeadlineDialog({
  open,
  onOpenChange,
  applicationId,
  deadline,
  onSaved,
}: AddDeadlineDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (deadline) {
      setForm({
        deadline_type: deadline.deadline_type ?? 'office_action_response',
        title: deadline.title ?? '',
        due_date: deadline.due_date ?? '',
        priority: deadline.priority ?? 'high',
        description: deadline.description ?? '',
        reminder_dates: Array.isArray(deadline.reminder_dates) ? [...deadline.reminder_dates] : [],
      })
    } else {
      setForm(INITIAL_FORM)
    }
  }, [deadline, open])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.due_date) {
      toast.error('Due date is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        deadline_type: form.deadline_type,
        title: form.title.trim(),
        due_date: form.due_date,
        priority: form.priority as ProsecutionDeadline['priority'],
        description: form.description,
        reminder_dates: form.reminder_dates.filter(Boolean),
        ...(applicationId && { application: applicationId }),
      }
      if (deadline) {
        const response = await prosecutionApi.updateDeadline(deadline.id, payload)
        if (!response.success) {
          toast.error('Failed to update deadline')
          return
        }
        toast.success('Deadline updated')
      } else {
        const response = await prosecutionApi.createDeadline(payload)
        if (!response.success) {
          toast.error('Failed to create deadline')
          return
        }
        toast.success('Deadline created')
      }
      onSaved?.()
      handleOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save deadline')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!saving) {
      if (!value && !deadline) setForm(INITIAL_FORM)
      onOpenChange(value)
    }
  }

  const isEdit = !!deadline

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Deadline' : 'Add Deadline'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="deadline_type">Deadline Type</Label>
            <Select
              value={form.deadline_type}
              onValueChange={v => setField('deadline_type', v)}
              disabled={saving}
            >
              <SelectTrigger id="deadline_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEADLINE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Deadline title"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date <span className="text-red-500">*</span></Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={e => setField('due_date', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={v => setField('priority', v)}
                disabled={saving}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Additional details about this deadline"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Reminder dates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Reminders</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() =>
                  setField('reminder_dates', [...form.reminder_dates, ''])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Reminder
              </Button>
            </div>
            {form.reminder_dates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reminders set.</p>
            ) : (
              <div className="space-y-2">
                {form.reminder_dates.map((date, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={e => {
                        const updated = [...form.reminder_dates]
                        updated[idx] = e.target.value
                        setField('reminder_dates', updated)
                      }}
                      disabled={saving}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setField('reminder_dates', form.reminder_dates.filter((_, i) => i !== idx))
                      }
                      disabled={saving}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Deadline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
