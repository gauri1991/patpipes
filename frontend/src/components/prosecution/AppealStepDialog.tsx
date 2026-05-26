'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ExternalLink } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

export type AppealStep =
  | 'examiner_answer'
  | 'reply_brief'
  | 'oral_hearing'
  | 'ptab_decision'
  | 'federal_circuit'

interface AppealStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  initialStep?: AppealStep
  onSaved?: () => void
}

const STEPS: { value: AppealStep; label: string; description: string }[] = [
  {
    value: 'examiner_answer',
    label: "Examiner's Answer",
    description:
      "The examiner responds to the appeal brief. A 2-month window opens to file a Reply Brief.",
  },
  {
    value: 'reply_brief',
    label: 'Reply Brief',
    description: "Applicant's optional response to the Examiner's Answer. Due 2 months after the Answer.",
  },
  {
    value: 'oral_hearing',
    label: 'Oral Hearing Request',
    description:
      'Request for an oral hearing before the PTAB. Must be filed within 2 months of the Examiner\'s Answer being forwarded to the Board.',
  },
  {
    value: 'ptab_decision',
    label: 'PTAB Decision',
    description: 'The Board issues its decision on the appeal. Outcomes: affirmed, reversed, or remanded.',
  },
  {
    value: 'federal_circuit',
    label: 'Federal Circuit Appeal',
    description:
      'Appeal of the PTAB decision to the U.S. Court of Appeals for the Federal Circuit. Must be filed within 63 days of the PTAB decision.',
  },
]

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]

export function AppealStepDialog({
  open,
  onOpenChange,
  applicationId,
  initialStep = 'examiner_answer',
  onSaved,
}: AppealStepDialogProps) {
  const [step, setStep] = useState<AppealStep>(initialStep)
  const [eventDate, setEventDate] = useState(TODAY)
  const [notes, setNotes] = useState('')

  // Examiner's Answer
  const [answerDeadlineDate, setAnswerDeadlineDate] = useState(addMonths(TODAY, 2))

  // Reply Brief
  const [replyBriefDocPath, setReplyBriefDocPath] = useState('')

  // Oral Hearing
  const [hearingDate, setHearingDate] = useState('')
  const [hearingRequestDeadline, setHearingRequestDeadline] = useState(addMonths(TODAY, 2))

  // PTAB Decision
  const [ptabOutcome, setPtabOutcome] = useState<'affirmed' | 'reversed' | 'remanded' | 'affirmed_in_part'>('reversed')
  const [ptabDecisionNumber, setPtabDecisionNumber] = useState('')

  // Federal Circuit
  const [fcBriefDeadline, setFcBriefDeadline] = useState(addDays(TODAY, 63))

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(initialStep)
      setEventDate(TODAY)
      setNotes('')
      setAnswerDeadlineDate(addMonths(TODAY, 2))
      setHearingDate('')
      setHearingRequestDeadline(addMonths(TODAY, 2))
      setPtabOutcome('reversed')
      setPtabDecisionNumber('')
      setFcBriefDeadline(addDays(TODAY, 63))
      setReplyBriefDocPath('')
    }
  }, [open, initialStep])

  // Auto-recalculate derived dates when eventDate changes
  function handleEventDateChange(date: string) {
    setEventDate(date)
    if (step === 'examiner_answer') setAnswerDeadlineDate(addMonths(date, 2))
    if (step === 'oral_hearing') setHearingRequestDeadline(addMonths(date, 2))
    if (step === 'federal_circuit') setFcBriefDeadline(addDays(date, 63))
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  function statusFromPtabOutcome(): string | undefined {
    if (ptabOutcome === 'affirmed') return 'rejected'
    if (ptabOutcome === 'reversed') return 'under_examination'
    return undefined
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDate) {
      toast.error('Date is required')
      return
    }
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      switch (step) {
        case 'examiner_answer': {
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'office_action_received',
              event_date: eventDate,
              title: "Examiner's Answer Received",
              description: notes,
              is_completed: true,
              is_urgent: true,
              metadata: { type: 'examiners_answer' },
            })
          )
          // Reply brief deadline: 2 months from examiner's answer
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'appeal_deadline',
              due_date: answerDeadlineDate,
              title: 'Reply Brief Due',
              priority: 'critical',
              description: "Optional Reply Brief due 2 months from Examiner's Answer.",
            })
          )
          break
        }

        case 'reply_brief': {
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'response_filed',
              event_date: eventDate,
              title: 'Reply Brief Filed',
              description: notes,
              is_completed: true,
              is_urgent: false,
              metadata: { type: 'reply_brief', document_path: replyBriefDocPath },
            })
          )
          if (replyBriefDocPath) {
            ops.push(
              prosecutionApi.createDocument({
                application: applicationId,
                title: 'Reply Brief',
                document_type: 'appeal',
                file_path: replyBriefDocPath,
                is_filed: true,
                filing_date: eventDate,
              })
            )
          }
          break
        }

        case 'oral_hearing': {
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'interview_scheduled',
              event_date: eventDate,
              title: 'Oral Hearing Requested',
              description: [
                hearingDate ? `Requested hearing date: ${new Date(hearingDate).toLocaleDateString()}` : '',
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: false,
              metadata: { type: 'ptab_oral_hearing', requested_hearing_date: hearingDate },
            })
          )
          // Deadline for filing the oral hearing request
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'appeal_deadline',
              due_date: hearingRequestDeadline,
              title: 'Oral Hearing Request Deadline',
              priority: 'high',
              description: 'Deadline to file the oral hearing request form.',
            }).then(async res => {
              if (res.success && res.data) {
                await prosecutionApi.completeDeadline(res.data.id)
              }
            })
          )
          if (hearingDate) {
            ops.push(
              prosecutionApi.createDeadline({
                application: applicationId,
                deadline_type: 'interview_deadline',
                due_date: hearingDate,
                title: 'PTAB Oral Hearing',
                priority: 'critical',
                description: 'Oral hearing before the Patent Trial and Appeal Board.',
              })
            )
          }
          break
        }

        case 'ptab_decision': {
          const outcomeLabels = {
            affirmed: 'Affirmed — claims remain rejected',
            reversed: 'Reversed — rejections overcome',
            remanded: 'Remanded — sent back to examiner',
            affirmed_in_part: 'Affirmed in Part',
          }
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'allowance_received',
              event_date: eventDate,
              title: `PTAB Decision — ${outcomeLabels[ptabOutcome]}`,
              description: [
                ptabDecisionNumber ? `Decision number: ${ptabDecisionNumber}` : '',
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: ptabOutcome === 'affirmed',
              metadata: {
                type: 'ptab_decision',
                outcome: ptabOutcome,
                decision_number: ptabDecisionNumber,
              },
            })
          )
          // Update application status based on outcome
          const newStatus = statusFromPtabOutcome()
          if (newStatus) {
            ops.push(prosecutionApi.updateApplication(applicationId, { status: newStatus }))
          }
          // If affirmed (rejected): create Federal Circuit deadline (63 days)
          if (ptabOutcome === 'affirmed' || ptabOutcome === 'affirmed_in_part') {
            ops.push(
              prosecutionApi.createDeadline({
                application: applicationId,
                deadline_type: 'appeal_deadline',
                due_date: addDays(eventDate, 63),
                title: 'Federal Circuit Appeal Deadline',
                priority: 'high',
                description:
                  'Deadline to appeal the PTAB decision to the U.S. Court of Appeals for the Federal Circuit (63 days from PTAB decision).',
              })
            )
          }
          break
        }

        case 'federal_circuit': {
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'appeal_filed',
              event_date: eventDate,
              title: 'Federal Circuit Appeal Filed',
              description: notes,
              is_completed: true,
              is_urgent: false,
              metadata: { type: 'federal_circuit_appeal' },
            })
          )
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'appeal_deadline',
              due_date: fcBriefDeadline,
              title: 'Federal Circuit Opening Brief Due',
              priority: 'critical',
              description:
                'Opening brief due in the Federal Circuit appeal. Consult litigation counsel for exact deadlines.',
            })
          )
          break
        }
      }

      await Promise.allSettled(ops)

      const stepInfo = STEPS.find(s => s.value === step)!
      toast.success(`${stepInfo.label} recorded`)
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record appeal step')
    } finally {
      setSaving(false)
    }
  }

  const stepInfo = STEPS.find(s => s.value === step)!

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Appeal Step</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Step</Label>
            <Select
              value={step}
              onValueChange={v => setStep(v as AppealStep)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STEPS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{stepInfo.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appeal-step-date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="appeal-step-date"
              type="date"
              value={eventDate}
              onChange={e => handleEventDateChange(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Examiner's Answer */}
          {step === 'examiner_answer' && (
            <div className="space-y-2">
              <Label htmlFor="answer-deadline">Reply Brief Deadline</Label>
              <Input
                id="answer-deadline"
                type="date"
                value={answerDeadlineDate}
                onChange={e => setAnswerDeadlineDate(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Auto-set to 2 months from the Examiner&apos;s Answer date.
              </p>
            </div>
          )}

          {/* Reply Brief */}
          {step === 'reply_brief' && (
            <div className="space-y-2">
              <Label htmlFor="reply-doc">Document Path / Reference</Label>
              <Input
                id="reply-doc"
                value={replyBriefDocPath}
                onChange={e => setReplyBriefDocPath(e.target.value)}
                placeholder="e.g. Reply_Brief_v1.pdf"
                disabled={saving}
              />
            </div>
          )}

          {/* Oral Hearing */}
          {step === 'oral_hearing' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="hearing-deadline">Request Filing Deadline</Label>
                <Input
                  id="hearing-deadline"
                  type="date"
                  value={hearingRequestDeadline}
                  onChange={e => setHearingRequestDeadline(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hearing-date">Scheduled Hearing Date (if known)</Label>
                <Input
                  id="hearing-date"
                  type="date"
                  value={hearingDate}
                  onChange={e => setHearingDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            </>
          )}

          {/* PTAB Decision */}
          {step === 'ptab_decision' && (
            <>
              <div className="space-y-2">
                <Label>Decision Outcome</Label>
                <Select
                  value={ptabOutcome}
                  onValueChange={v => setPtabOutcome(v as typeof ptabOutcome)}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reversed">Reversed — rejections overcome ✅</SelectItem>
                    <SelectItem value="remanded">Remanded — sent back to examiner</SelectItem>
                    <SelectItem value="affirmed_in_part">Affirmed in Part</SelectItem>
                    <SelectItem value="affirmed">Affirmed — claims remain rejected ❌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ptab-number">PTAB Decision Number / Appeal Number</Label>
                <Input
                  id="ptab-number"
                  value={ptabDecisionNumber}
                  onChange={e => setPtabDecisionNumber(e.target.value)}
                  placeholder="e.g. Appeal 2023-001234"
                  disabled={saving}
                />
              </div>
              {(ptabOutcome === 'affirmed' || ptabOutcome === 'affirmed_in_part') && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  An affirmed decision will create a 63-day Federal Circuit appeal deadline and set
                  the application status to Rejected.
                </div>
              )}
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 flex items-center gap-2">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span>
                  Track IPR/PTAB proceedings in the{' '}
                  <a href="/dashboard/infringement" className="underline font-medium">
                    Infringement module
                  </a>
                  .
                </span>
              </div>
            </>
          )}

          {/* Federal Circuit */}
          {step === 'federal_circuit' && (
            <div className="space-y-2">
              <Label htmlFor="fc-deadline">Opening Brief Deadline</Label>
              <Input
                id="fc-deadline"
                type="date"
                value={fcBriefDeadline}
                onChange={e => setFcBriefDeadline(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Auto-set to 63 days from the filing date. Consult litigation counsel for exact court
                deadlines.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="appeal-step-notes">Notes</Label>
            <Textarea
              id="appeal-step-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Key arguments, outstanding issues, strategy…"
              rows={3}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record {stepInfo.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
