'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, Globe } from 'lucide-react'
import { prosecutionApi } from '@/services/prosecutionApi'
import { toast } from 'sonner'

export type PctStep =
  | 'initial_deadlines'
  | 'isr_received'
  | 'written_opinion'
  | 'chapter_ii_demand'
  | 'iper_received'

interface PctStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  priorityDate?: string
  initialStep?: PctStep
  onSaved?: () => void
}

const STEPS: { value: PctStep; label: string; description: string }[] = [
  {
    value: 'initial_deadlines',
    label: 'Setup PCT Deadlines',
    description:
      'Create deadline reminders for key PCT milestones: ISR expected date, Chapter II demand window, and 30-month national phase deadline.',
  },
  {
    value: 'isr_received',
    label: 'International Search Report (ISR)',
    description:
      'The ISA has issued its search report listing prior art. A Written Opinion typically accompanies the ISR.',
  },
  {
    value: 'written_opinion',
    label: 'Written Opinion of ISA',
    description:
      'The ISA issues a preliminary opinion on patentability. You may file amendments or arguments within 2 months.',
  },
  {
    value: 'chapter_ii_demand',
    label: 'Demand for Chapter II (IPEA)',
    description:
      'Request international preliminary examination. Must be filed by 22 months from priority date. Delays national phase entry to 30 months.',
  },
  {
    value: 'iper_received',
    label: 'IPER Received',
    description:
      'International Preliminary Examination Report issued by the IPEA. Sent to designated national offices before national phase entry.',
  },
]

const ISA_CHOICES = ['USPTO', 'EPO', 'JPO', 'KIPO', 'SIPO (CNIPA)', 'IP Australia', 'ISA/EP', 'Other']
const IPEA_CHOICES = ['USPTO', 'EPO', 'JPO', 'KIPO', 'IP Australia', 'Other']

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]

export function PctStepDialog({
  open,
  onOpenChange,
  applicationId,
  priorityDate,
  initialStep = 'initial_deadlines',
  onSaved,
}: PctStepDialogProps) {
  const [step, setStep] = useState<PctStep>(initialStep)
  const [eventDate, setEventDate] = useState(TODAY)
  const [notes, setNotes] = useState('')

  // initial_deadlines
  const baseDateForCalc = priorityDate || TODAY
  const [isrExpected, setIsrExpected] = useState(addMonths(baseDateForCalc, 18))
  const [chapterIIWindow, setChapterIIWindow] = useState(addMonths(baseDateForCalc, 22))
  const [nationalPhaseDeadline, setNationalPhaseDeadline] = useState(addMonths(baseDateForCalc, 30))

  // isr_received
  const [isa, setIsa] = useState('USPTO')
  const [isrResult, setIsrResult] = useState<'positive' | 'mixed' | 'negative'>('mixed')
  const [nonUnity, setNonUnity] = useState(false)
  const [priorArtRefs, setPriorArtRefs] = useState('')

  // written_opinion
  const [wopiResult, setWopiResult] = useState<'positive' | 'negative' | 'partial'>('positive')
  const [amendmentDeadline, setAmendmentDeadline] = useState('')

  // chapter_ii_demand
  const [ipea, setIpea] = useState('USPTO')
  const [iperDeadline, setIperDeadline] = useState(addMonths(baseDateForCalc, 28))

  // iper_received
  const [iperResult, setIperResult] = useState<'patentable' | 'not_patentable' | 'mixed'>('patentable')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(initialStep)
      setEventDate(TODAY)
      setNotes('')
    }
  }, [open, initialStep])

  function handleEventDateChange(date: string) {
    setEventDate(date)
    if (step === 'isr_received' || step === 'written_opinion') {
      setAmendmentDeadline(addMonths(date, 2))
    }
  }

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []

      switch (step) {
        case 'initial_deadlines': {
          // ISR expected (18 months from priority)
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'examination_request',
              due_date: isrExpected,
              title: 'ISR Expected (18 months from priority)',
              priority: 'high',
              description: 'International Search Report expected from ISA approximately 18 months from priority date.',
            })
          )
          // Chapter II demand window (22 months)
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'filing_deadline',
              due_date: chapterIIWindow,
              title: 'Chapter II Demand Deadline (22 months)',
              priority: 'medium',
              description: 'Last date to file demand for Chapter II (International Preliminary Examination). Optional — extends national phase entry to 30 months in most countries.',
            })
          )
          // 30-month national phase deadline
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'filing_deadline',
              due_date: nationalPhaseDeadline,
              title: 'National Phase Entry Deadline (30 months)',
              priority: 'critical',
              description: 'Deadline to enter national phase in designated countries (30 months from earliest priority date). EP and AU allow 31 months.',
            })
          )
          // Setup event
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'application_filed',
              event_date: eventDate || TODAY,
              title: 'PCT Deadlines Configured',
              description: `ISR expected: ${new Date(isrExpected).toLocaleDateString()}\nChapter II demand deadline: ${new Date(chapterIIWindow).toLocaleDateString()}\nNational phase entry: ${new Date(nationalPhaseDeadline).toLocaleDateString()}`,
              is_completed: true,
              is_urgent: false,
              metadata: {
                type: 'pct_deadlines_setup',
                priority_date: priorityDate,
                isr_expected: isrExpected,
                chapter_ii_deadline: chapterIIWindow,
                national_phase_deadline: nationalPhaseDeadline,
              },
            })
          )
          break
        }

        case 'isr_received': {
          const resultLabels = { positive: 'Positive', mixed: 'Mixed', negative: 'Negative' }
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'office_action_received',
              event_date: eventDate,
              title: `ISR Received — ${resultLabels[isrResult]} (${isa})`,
              description: [
                `ISA: ${isa}`,
                `Result: ${resultLabels[isrResult]}`,
                nonUnity ? 'Non-unity of invention raised.' : '',
                priorArtRefs ? `Key prior art: ${priorArtRefs}` : '',
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: isrResult === 'negative' || nonUnity,
              metadata: {
                type: 'isr',
                isa,
                result: isrResult,
                non_unity: nonUnity,
              },
            })
          )
          // Amendment opportunity deadline (Article 19 amendments — 2 months from ISR)
          if (isrResult !== 'positive') {
            ops.push(
              prosecutionApi.createDeadline({
                application: applicationId,
                deadline_type: 'filing_deadline',
                due_date: addMonths(eventDate, 2),
                title: 'Article 19 Amendment Deadline',
                priority: 'high',
                description: 'Optional amendment to claims before the International Bureau (2 months from ISR mailing date).',
              })
            )
          }
          break
        }

        case 'written_opinion': {
          const opinionLabels = { positive: 'Positive', negative: 'Negative', partial: 'Partial (mixed claims)' }
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'office_action_received',
              event_date: eventDate,
              title: `Written Opinion of ISA — ${opinionLabels[wopiResult]}`,
              description: [
                `Outcome: ${opinionLabels[wopiResult]}`,
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: wopiResult !== 'positive',
              metadata: { type: 'written_opinion_isa', result: wopiResult },
            })
          )
          // Article 34 response deadline (2 months) — only relevant if Chapter II was demanded
          if (wopiResult !== 'positive' && amendmentDeadline) {
            ops.push(
              prosecutionApi.createDeadline({
                application: applicationId,
                deadline_type: 'office_action_response',
                due_date: amendmentDeadline,
                title: 'Article 34 Response Deadline',
                priority: 'high',
                description: 'Response to Written Opinion (Article 34 amendments/arguments) — 2 months from WO mailing date.',
              })
            )
          }
          break
        }

        case 'chapter_ii_demand': {
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'response_filed',
              event_date: eventDate,
              title: `Chapter II Demand Filed (IPEA: ${ipea})`,
              description: [
                `IPEA: ${ipea}`,
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: false,
              metadata: { type: 'chapter_ii_demand', ipea },
            })
          )
          // IPER deadline (~28 months from priority)
          ops.push(
            prosecutionApi.createDeadline({
              application: applicationId,
              deadline_type: 'examination_request',
              due_date: iperDeadline,
              title: 'IPER Expected (28 months from priority)',
              priority: 'medium',
              description: 'International Preliminary Examination Report (IPER) expected from IPEA.',
            })
          )
          break
        }

        case 'iper_received': {
          const iperLabels = {
            patentable: 'Claims Patentable',
            not_patentable: 'Claims Not Patentable',
            mixed: 'Mixed — some claims patentable',
          }
          ops.push(
            prosecutionApi.addEvent(applicationId, {
              event_type: 'allowance_received',
              event_date: eventDate,
              title: `IPER Received — ${iperLabels[iperResult]}`,
              description: [
                `Outcome: ${iperLabels[iperResult]}`,
                notes,
              ].filter(Boolean).join('\n'),
              is_completed: true,
              is_urgent: iperResult === 'not_patentable',
              metadata: { type: 'iper', result: iperResult },
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
      toast.error(err instanceof Error ? err.message : 'Failed to record PCT step')
    } finally {
      setSaving(false)
    }
  }

  const stepInfo = STEPS.find(s => s.value === step)!

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            PCT Step
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Step</Label>
            <Select value={step} onValueChange={v => setStep(v as PctStep)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STEPS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{stepInfo.description}</p>
          </div>

          {/* initial_deadlines */}
          {step === 'initial_deadlines' && (
            <div className="space-y-3">
              {priorityDate && (
                <p className="text-xs text-muted-foreground">
                  Dates calculated from priority date:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(priorityDate).toLocaleDateString()}
                  </span>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'ISR Expected (18 months)', value: isrExpected, onChange: setIsrExpected },
                  { label: 'Chapter II Demand Deadline (22 months)', value: chapterIIWindow, onChange: setChapterIIWindow },
                  { label: 'National Phase Entry (30 months)', value: nationalPhaseDeadline, onChange: setNationalPhaseDeadline },
                ].map(({ label, value, onChange }) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="date"
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      disabled={saving}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date field for all other steps */}
          {step !== 'initial_deadlines' && (
            <div className="space-y-2">
              <Label htmlFor="pct-date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pct-date"
                type="date"
                value={eventDate}
                onChange={e => handleEventDateChange(e.target.value)}
                disabled={saving}
              />
            </div>
          )}

          {/* ISR fields */}
          {step === 'isr_received' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>International Searching Authority</Label>
                  <Select value={isa} onValueChange={setIsa} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ISA_CHOICES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Search Result</Label>
                  <Select value={isrResult} onValueChange={v => setIsrResult(v as typeof isrResult)} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="non-unity"
                  type="checkbox"
                  checked={nonUnity}
                  onChange={e => setNonUnity(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="non-unity" className="font-normal text-sm">
                  Non-unity of invention raised
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prior-art">Key Prior Art References</Label>
                <Textarea
                  id="prior-art"
                  value={priorArtRefs}
                  onChange={e => setPriorArtRefs(e.target.value)}
                  placeholder="List the most relevant X/Y/A citations from the ISR…"
                  rows={3}
                  disabled={saving}
                />
              </div>
            </>
          )}

          {/* Written Opinion fields */}
          {step === 'written_opinion' && (
            <>
              <div className="space-y-2">
                <Label>Opinion Result</Label>
                <Select value={wopiResult} onValueChange={v => setWopiResult(v as typeof wopiResult)} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive — all claims considered patentable</SelectItem>
                    <SelectItem value="partial">Partial — some claims patentable</SelectItem>
                    <SelectItem value="negative">Negative — claims not patentable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {wopiResult !== 'positive' && (
                <div className="space-y-2">
                  <Label htmlFor="article34-deadline">Article 34 Response Deadline</Label>
                  <Input
                    id="article34-deadline"
                    type="date"
                    value={amendmentDeadline}
                    onChange={e => setAmendmentDeadline(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">Auto-set to 2 months from WO date.</p>
                </div>
              )}
            </>
          )}

          {/* Chapter II Demand fields */}
          {step === 'chapter_ii_demand' && (
            <>
              <div className="space-y-2">
                <Label>International Preliminary Examining Authority (IPEA)</Label>
                <Select value={ipea} onValueChange={setIpea} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IPEA_CHOICES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iper-deadline">IPER Expected Date</Label>
                <Input
                  id="iper-deadline"
                  type="date"
                  value={iperDeadline}
                  onChange={e => setIperDeadline(e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  IPER typically issued ~28 months from priority date.
                </p>
              </div>
            </>
          )}

          {/* IPER fields */}
          {step === 'iper_received' && (
            <div className="space-y-2">
              <Label>IPER Outcome</Label>
              <Select value={iperResult} onValueChange={v => setIperResult(v as typeof iperResult)} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="patentable">All claims patentable ✅</SelectItem>
                  <SelectItem value="mixed">Mixed — some claims patentable</SelectItem>
                  <SelectItem value="not_patentable">Claims not patentable ❌</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* initial_deadlines auto-actions */}
          {step === 'initial_deadlines' && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">This will create 3 deadlines:</p>
              {[
                { title: `ISR Expected — ${new Date(isrExpected).toLocaleDateString()}`, priority: 'High' },
                { title: `Chapter II Demand — ${new Date(chapterIIWindow).toLocaleDateString()}`, priority: 'Medium' },
                { title: `National Phase Entry — ${new Date(nationalPhaseDeadline).toLocaleDateString()}`, priority: 'Critical' },
              ].map(d => (
                <div key={d.title} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                  <span>{d.title} ({d.priority})</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pct-notes">Notes</Label>
            <Textarea
              id="pct-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, strategy, follow-up actions…"
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
              Record {stepInfo.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
