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

export type PostGrantCategory =
  | 'terminal_disclaimer'
  | 'certificate_of_correction'
  | 'reissue'
  | 'ex_parte_reexamination'
  | 'assignment'

interface PostGrantEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  initialCategory?: PostGrantCategory
  onSaved?: () => void
}

const CATEGORIES: { value: PostGrantCategory; label: string; description: string }[] = [
  {
    value: 'terminal_disclaimer',
    label: 'Terminal Disclaimer',
    description:
      'Disclaims the terminal portion of the patent term to overcome obviousness-type or statutory double patenting.',
  },
  {
    value: 'certificate_of_correction',
    label: 'Certificate of Correction',
    description:
      'Corrects a mistake in the patent as issued — applicant errors incur a fee; USPTO errors do not.',
  },
  {
    value: 'reissue',
    label: 'Reissue Application',
    description:
      'Filed to correct errors that render the patent wholly or partly inoperative or invalid. Broadening reissues must be filed within 2 years of grant.',
  },
  {
    value: 'ex_parte_reexamination',
    label: 'Ex Parte Reexamination',
    description:
      'USPTO reexamines granted claims based on prior art raised by the patent owner or a third party.',
  },
  {
    value: 'assignment',
    label: 'Assignment Recordation',
    description: 'Records a transfer of patent ownership at the USPTO.',
  },
]

const TODAY = new Date().toISOString().split('T')[0]

export function PostGrantEventDialog({
  open,
  onOpenChange,
  applicationId,
  initialCategory = 'terminal_disclaimer',
  onSaved,
}: PostGrantEventDialogProps) {
  const [category, setCategory] = useState<PostGrantCategory>(initialCategory)
  const [eventDate, setEventDate] = useState(TODAY)
  const [notes, setNotes] = useState('')

  // Terminal disclaimer
  const [disclaimerType, setDisclaimerType] = useState<'obviousness' | 'statutory'>('obviousness')

  // Certificate of correction
  const [correctionType, setCorrectionType] = useState<'applicant_error' | 'uspto_error'>(
    'applicant_error'
  )

  // Reissue
  const [reissueType, setReissueType] = useState<'narrowing' | 'broadening'>('narrowing')

  // Ex parte reexamination
  const [requester, setRequester] = useState<'patent_owner' | 'third_party'>('patent_owner')
  const [priorArtCited, setPriorArtCited] = useState('')

  // Assignment
  const [assigneeName, setAssigneeName] = useState('')
  const [reelFrame, setReelFrame] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory(initialCategory)
      setEventDate(TODAY)
      setNotes('')
      setAssigneeName('')
      setReelFrame('')
      setPriorArtCited('')
    }
  }, [open, initialCategory])

  function handleClose(value: boolean) {
    if (!saving) onOpenChange(value)
  }

  function buildPayload() {
    switch (category) {
      case 'terminal_disclaimer':
        return {
          event_type: 'terminal_disclaimer_filed',
          event_date: eventDate,
          title: 'Terminal Disclaimer Filed',
          description: [
            `Type: ${disclaimerType === 'obviousness' ? 'Obviousness-type double patenting' : 'Statutory double patenting'}`,
            notes,
          ]
            .filter(Boolean)
            .join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: { disclaimer_type: disclaimerType },
        }

      case 'certificate_of_correction':
        return {
          event_type: 'certificate_of_correction_filed',
          event_date: eventDate,
          title: 'Certificate of Correction Filed',
          description: [
            `Error type: ${correctionType === 'applicant_error' ? 'Applicant error (fee required)' : 'USPTO error (no fee)'}`,
            notes,
          ]
            .filter(Boolean)
            .join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: { correction_type: correctionType },
        }

      case 'reissue':
        return {
          event_type: 'reissue_filed',
          event_date: eventDate,
          title: `Reissue Application Filed (${reissueType === 'broadening' ? 'Broadening' : 'Narrowing'})`,
          description: notes,
          is_completed: true,
          is_urgent: reissueType === 'broadening',
          metadata: { reissue_type: reissueType },
        }

      case 'ex_parte_reexamination':
        return {
          event_type: 'reexamination_filed',
          event_date: eventDate,
          title: 'Ex Parte Reexamination Filed',
          description: [
            `Requester: ${requester === 'patent_owner' ? 'Patent Owner' : 'Third Party'}`,
            priorArtCited ? `Prior art cited: ${priorArtCited}` : '',
            notes,
          ]
            .filter(Boolean)
            .join('\n'),
          is_completed: true,
          is_urgent: true,
          metadata: { requester, prior_art_cited: priorArtCited },
        }

      case 'assignment':
        return {
          event_type: 'assignment_recorded',
          event_date: eventDate,
          title: `Assignment Recorded${assigneeName ? ` → ${assigneeName}` : ''}`,
          description: [
            assigneeName ? `Assignee: ${assigneeName}` : '',
            reelFrame ? `Reel/Frame: ${reelFrame}` : '',
            notes,
          ]
            .filter(Boolean)
            .join('\n'),
          is_completed: true,
          is_urgent: false,
          metadata: { assignee_name: assigneeName, reel_frame: reelFrame },
        }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDate) {
      toast.error('Date is required')
      return
    }
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = [
        prosecutionApi.addEvent(applicationId, buildPayload()),
      ]

      // Ex parte reexamination: create a deadline to track USPTO's order (~3 months)
      if (category === 'ex_parte_reexamination') {
        const orderDate = new Date(eventDate)
        orderDate.setMonth(orderDate.getMonth() + 3)
        ops.push(
          prosecutionApi.createDeadline({
            application: applicationId,
            deadline_type: 'examination_request',
            due_date: orderDate.toISOString().split('T')[0],
            title: 'Reexamination Order Expected',
            priority: 'high',
            description:
              'USPTO typically issues an order granting or denying reexamination within 3 months of filing.',
          })
        )
      }

      await Promise.allSettled(ops)

      const cat = CATEGORIES.find(c => c.value === category)!
      toast.success(`${cat.label} recorded`)
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record event')
    } finally {
      setSaving(false)
    }
  }

  const catInfo = CATEGORIES.find(c => c.value === category)!

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Post-Grant Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as PostGrantCategory)}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{catInfo.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pg-date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pg-date"
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Terminal disclaimer */}
          {category === 'terminal_disclaimer' && (
            <div className="space-y-2">
              <Label>Disclaimer Type</Label>
              <Select
                value={disclaimerType}
                onValueChange={v => setDisclaimerType(v as typeof disclaimerType)}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obviousness">Obviousness-type double patenting</SelectItem>
                  <SelectItem value="statutory">Statutory double patenting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Certificate of correction */}
          {category === 'certificate_of_correction' && (
            <div className="space-y-2">
              <Label>Error Type</Label>
              <Select
                value={correctionType}
                onValueChange={v => setCorrectionType(v as typeof correctionType)}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="applicant_error">Applicant error (fee required)</SelectItem>
                  <SelectItem value="uspto_error">USPTO error (no fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reissue */}
          {category === 'reissue' && (
            <div className="space-y-2">
              <Label>Reissue Type</Label>
              <Select
                value={reissueType}
                onValueChange={v => setReissueType(v as typeof reissueType)}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrowing">Narrowing (any time within patent term)</SelectItem>
                  <SelectItem value="broadening">Broadening (must file within 2 years of grant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ex parte reexamination */}
          {category === 'ex_parte_reexamination' && (
            <>
              <div className="space-y-2">
                <Label>Requester</Label>
                <Select
                  value={requester}
                  onValueChange={v => setRequester(v as typeof requester)}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patent_owner">Patent Owner</SelectItem>
                    <SelectItem value="third_party">Third Party</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pg-prior-art">Prior Art Cited</Label>
                <Textarea
                  id="pg-prior-art"
                  value={priorArtCited}
                  onChange={e => setPriorArtCited(e.target.value)}
                  placeholder="List prior art references cited as the basis for reexamination…"
                  rows={2}
                  disabled={saving}
                />
              </div>
            </>
          )}

          {/* Assignment */}
          {category === 'assignment' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pg-assignee">Assignee Name</Label>
                <Input
                  id="pg-assignee"
                  value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)}
                  placeholder="New owner name"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pg-reel">Reel / Frame</Label>
                <Input
                  id="pg-reel"
                  value={reelFrame}
                  onChange={e => setReelFrame(e.target.value)}
                  placeholder="e.g. 063456/0789"
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pg-notes">Notes</Label>
            <Textarea
              id="pg-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional context or follow-up actions…"
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
              Record Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
