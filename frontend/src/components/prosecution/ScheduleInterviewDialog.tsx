'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface ScheduleInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  examinerName?: string
  onSaved?: () => void
}

interface FormState {
  interview_date: string
  interview_type: string
  examiner_name: string
  representative: string
  topics: string
  prep_deadline: string
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone' },
  { value: 'video', label: 'Video / Virtual' },
  { value: 'in_person', label: 'In Person' },
]

const INITIAL_FORM = (examinerName = ''): FormState => ({
  interview_date: '',
  interview_type: 'phone',
  examiner_name: examinerName,
  representative: '',
  topics: '',
  prep_deadline: '',
})

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  examinerName = '',
  onSaved,
}: ScheduleInterviewDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM(examinerName))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(INITIAL_FORM(examinerName))
  }, [open, examinerName])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleInterviewDateChange(date: string) {
    setForm(prev => ({
      ...prev,
      interview_date: date,
      prep_deadline: date && !prev.prep_deadline ? subtractDays(date, 2) : prev.prep_deadline,
    }))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.interview_date) {
      toast.error('Interview date is required')
      return
    }
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      // 1. Create interview_scheduled prosecution event
      ops.push(
        prosecutionApi.addEvent(applicationId, {
          event_type: 'interview_scheduled',
          event_date: form.interview_date,
          title: `Examiner Interview Scheduled (${INTERVIEW_TYPES.find(t => t.value === form.interview_type)?.label ?? form.interview_type})`,
          description: [
            form.examiner_name ? `Examiner: ${form.examiner_name}` : '',
            form.representative ? `Representative: ${form.representative}` : '',
            form.topics ? `Topics: ${form.topics}` : '',
          ].filter(Boolean).join('\n'),
          is_completed: false,
          is_urgent: false,
          metadata: {
            interview_type: form.interview_type,
            examiner_name: form.examiner_name,
            representative: form.representative,
          },
        })
      )

      // 2. Create interview prep deadline
      if (form.prep_deadline) {
        ops.push(
          prosecutionApi.createDeadline({
            application: applicationId,
            deadline_type: 'interview_deadline',
            due_date: form.prep_deadline,
            title: 'Interview Preparation Deadline',
            priority: 'high',
            description: `Prepare for examiner interview scheduled on ${form.interview_date}.`,
          })
        )
      }

      await Promise.allSettled(ops)

      toast.success('Interview scheduled')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule interview')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Examiner Interview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="si-date">
                Interview Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="si-date"
                type="date"
                value={form.interview_date}
                onChange={e => handleInterviewDateChange(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <Select
                value={form.interview_type}
                onValueChange={v => setField('interview_type', v)}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="si-examiner">Examiner Name</Label>
              <Input
                id="si-examiner"
                value={form.examiner_name}
                onChange={e => setField('examiner_name', e.target.value)}
                placeholder="USPTO examiner"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-rep">Applicant&apos;s Representative</Label>
              <Input
                id="si-rep"
                value={form.representative}
                onChange={e => setField('representative', e.target.value)}
                placeholder="Attorney / agent name"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="si-topics">Topics to Discuss</Label>
            <Textarea
              id="si-topics"
              value={form.topics}
              onChange={e => setField('topics', e.target.value)}
              placeholder="Claim amendments, prior art distinctions, examiner's rejections…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="si-prep">Interview Prep Deadline</Label>
            <Input
              id="si-prep"
              type="date"
              value={form.prep_deadline}
              onChange={e => setField('prep_deadline', e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              A high-priority deadline will be created on this date for interview preparation.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Interview
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
