'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { prosecutionApi, PatentApplication } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface NationalPhaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pctApplication: PatentApplication
  onSaved?: () => void
}

interface Jurisdiction {
  code: string
  name: string
  deadlineMonths: number
  translationRequired: boolean
  note?: string
}

const JURISDICTIONS: Jurisdiction[] = [
  { code: 'US', name: 'United States', deadlineMonths: 30, translationRequired: false },
  { code: 'EP', name: 'Europe (EPO)', deadlineMonths: 31, translationRequired: true, note: 'European patent application, not individual country' },
  { code: 'JP', name: 'Japan', deadlineMonths: 30, translationRequired: true },
  { code: 'CN', name: 'China', deadlineMonths: 30, translationRequired: true },
  { code: 'KR', name: 'South Korea', deadlineMonths: 30, translationRequired: true },
  { code: 'CA', name: 'Canada', deadlineMonths: 30, translationRequired: false, note: 'English or French' },
  { code: 'AU', name: 'Australia', deadlineMonths: 31, translationRequired: false },
  { code: 'IN', name: 'India', deadlineMonths: 31, translationRequired: false },
  { code: 'BR', name: 'Brazil', deadlineMonths: 30, translationRequired: true },
  { code: 'MX', name: 'Mexico', deadlineMonths: 30, translationRequired: true },
]

interface JurisdictionEntry {
  jurisdiction: Jurisdiction
  selected: boolean
  title: string
  deadline: string
  applicationNumber: string
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function buildTitle(parentTitle: string, jurisdictionName: string): string {
  return `${parentTitle} — ${jurisdictionName} National Phase`
}

export function NationalPhaseDialog({
  open,
  onOpenChange,
  pctApplication,
  onSaved,
}: NationalPhaseDialogProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<JurisdictionEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ code: string; id: string; success: boolean }[]>([])
  const [done, setDone] = useState(false)

  const priorityBase = pctApplication.priority_date || pctApplication.filing_date || ''

  useEffect(() => {
    if (open) {
      setResult([])
      setDone(false)
      setEntries(
        JURISDICTIONS.map(j => ({
          jurisdiction: j,
          selected: false,
          title: buildTitle(pctApplication.title, j.name),
          deadline: priorityBase ? addMonths(priorityBase, j.deadlineMonths) : '',
          applicationNumber: '',
        }))
      )
    }
  }, [open, pctApplication.title, priorityBase])

  function toggleJurisdiction(code: string) {
    setEntries(prev =>
      prev.map(e => (e.jurisdiction.code === code ? { ...e, selected: !e.selected } : e))
    )
  }

  function updateEntry(code: string, updates: Partial<JurisdictionEntry>) {
    setEntries(prev =>
      prev.map(e => (e.jurisdiction.code === code ? { ...e, ...updates } : e))
    )
  }

  const selectedEntries = entries.filter(e => e.selected)

  function handleClose(value: boolean) {
    if (!saving) {
      setDone(false)
      onOpenChange(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedEntries.length === 0) {
      toast.error('Select at least one jurisdiction')
      return
    }
    setSaving(true)
    try {
      // Step 1: Create all child applications in parallel
      const createResults = await Promise.allSettled(
        selectedEntries.map(entry =>
          prosecutionApi.createApplication({
            title: entry.title,
            application_type: 'utility',
            application_number: entry.applicationNumber.trim() || undefined,
            jurisdiction: entry.jurisdiction.code,
            priority_date: pctApplication.priority_date || pctApplication.filing_date || undefined,
            filing_date: entry.deadline || undefined,
            priority_level: pctApplication.priority_level,
            technology_area: pctApplication.technology_area || undefined,
            inventors: pctApplication.inventors,
            assignees: pctApplication.assignees,
            ipc_classes: pctApplication.ipc_classes,
            keywords: pctApplication.keywords,
            status: 'pending',
          }).then(res => ({ entry, res }))
        )
      )

      const successes: { code: string; id: string }[] = []
      const eventOps: Promise<unknown>[] = []

      for (const r of createResults) {
        if (r.status === 'fulfilled' && r.value.res.success && r.value.res.data) {
          const child = r.value.res.data
          const entry = r.value.entry
          successes.push({ code: entry.jurisdiction.code, id: child.id })

          // Event on parent (PCT app): to_child
          eventOps.push(
            prosecutionApi.addEvent(pctApplication.id, {
              event_type: 'continuation_filed',
              event_date: entry.deadline || new Date().toISOString().split('T')[0],
              title: `National Phase Entry — ${entry.jurisdiction.name}`,
              is_completed: true,
              is_urgent: false,
              metadata: {
                direction: 'to_child',
                continuation_type: 'national_phase',
                jurisdiction: entry.jurisdiction.code,
                child_id: child.id,
                child_title: child.title,
                child_application_number: entry.applicationNumber || null,
              },
            })
          )

          // Event on child: from_parent
          eventOps.push(
            prosecutionApi.addEvent(child.id, {
              event_type: 'continuation_filed',
              event_date: entry.deadline || new Date().toISOString().split('T')[0],
              title: `National Phase Entry from PCT Application`,
              is_completed: true,
              is_urgent: false,
              metadata: {
                direction: 'from_parent',
                continuation_type: 'national_phase',
                parent_id: pctApplication.id,
                parent_title: pctApplication.title,
                parent_application_number: pctApplication.application_number || null,
              },
            })
          )

          // Filing deadline on child
          if (entry.deadline) {
            eventOps.push(
              prosecutionApi.createDeadline({
                application: child.id,
                deadline_type: 'filing_deadline',
                due_date: entry.deadline,
                title: `National Phase Filing Deadline — ${entry.jurisdiction.name}`,
                priority: 'critical',
                description: `National phase entry deadline: ${new Date(entry.deadline).toLocaleDateString()}`,
              })
            )
          }
        }
      }

      await Promise.allSettled(eventOps)

      const allResults = selectedEntries.map(e => ({
        code: e.jurisdiction.code,
        id: successes.find(s => s.code === e.jurisdiction.code)?.id ?? '',
        success: !!successes.find(s => s.code === e.jurisdiction.code),
      }))

      setResult(allResults)
      setDone(true)
      onSaved?.()
      toast.success(
        `${successes.length} national phase application${successes.length !== 1 ? 's' : ''} created`
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to enter national phase')
    } finally {
      setSaving(false)
    }
  }

  // ---- Done state: show results with navigation links ----
  if (done) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              National Phase Applications Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {result.map(r => {
              const j = JURISDICTIONS.find(x => x.code === r.code)
              return (
                <div key={r.code} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>{j?.name ?? r.code}</span>
                  </div>
                  {r.success && r.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/prosecution/applications/${r.id}`)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Enter National Phase
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          PCT Application:{' '}
          <span className="font-medium text-foreground">{pctApplication.title}</span>
          {priorityBase && (
            <span className="ml-2">
              · Priority: {new Date(priorityBase).toLocaleDateString()}
            </span>
          )}
        </div>

        {!priorityBase && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No priority date or filing date set on this PCT application — deadlines cannot be
            auto-calculated. Edit the application first to add dates.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Jurisdictions</Label>
            <div className="grid grid-cols-2 gap-2">
              {entries.map(entry => (
                <button
                  key={entry.jurisdiction.code}
                  type="button"
                  onClick={() => toggleJurisdiction(entry.jurisdiction.code)}
                  disabled={saving}
                  className={`text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                    entry.selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.jurisdiction.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {entry.jurisdiction.translationRequired && (
                        <Badge variant="outline" className="text-xs py-0">Translation</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {entry.jurisdiction.deadlineMonths}mo
                      </span>
                    </div>
                  </div>
                  {entry.jurisdiction.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.jurisdiction.note}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Expanded detail rows for selected jurisdictions */}
          {selectedEntries.length > 0 && (
            <div className="space-y-3">
              <Label>Filing Details</Label>
              {selectedEntries.map(entry => (
                <div key={entry.jurisdiction.code} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.jurisdiction.name}</span>
                    {entry.jurisdiction.translationRequired && (
                      <Badge variant="outline" className="text-xs">Translation required</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Filing Deadline</Label>
                      <Input
                        type="date"
                        value={entry.deadline}
                        onChange={e => updateEntry(entry.jurisdiction.code, { deadline: e.target.value })}
                        disabled={saving}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Application Number (if filed)</Label>
                      <Input
                        value={entry.applicationNumber}
                        onChange={e => updateEntry(entry.jurisdiction.code, { applicationNumber: e.target.value })}
                        placeholder="If already received"
                        disabled={saving}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              For each selected jurisdiction, this will:
            </p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Create a new application record (pre-filled from PCT parent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Link it to the PCT parent via prosecution events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>Create a critical filing deadline for national phase entry</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || selectedEntries.length === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enter National Phase ({selectedEntries.length})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
