'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

import { prosecutionApi, PatentApplication, ProsecutionDeadline, ProsecutionDocument } from '@/services/prosecutionApi'
import { AttorneyPopover } from '@/components/prosecution/AttorneyPopover'
import { OfficeActionSection } from '@/components/prosecution/OfficeActionSection'
import { ProsecutionTimeline } from '@/components/prosecution/ProsecutionTimeline'
import { AddDeadlineDialog } from '@/components/prosecution/AddDeadlineDialog'
import { EditApplicationDialog } from '@/components/prosecution/EditApplicationDialog'
import { DocumentUploadDialog } from '@/components/prosecution/DocumentUploadDialog'
import { MarkAsFiledDialog } from '@/components/prosecution/MarkAsFiledDialog'
import { ClaimsTab } from '@/components/prosecution/ClaimsTab'
import { RecordGrantDialog } from '@/components/prosecution/RecordGrantDialog'
import { SetupMaintenanceFeeDialog } from '@/components/prosecution/SetupMaintenanceFeeDialog'
import { RecordFeePaymentDialog } from '@/components/prosecution/RecordFeePaymentDialog'
import { PostGrantEventDialog } from '@/components/prosecution/PostGrantEventDialog'
import { FileContinuationDialog } from '@/components/prosecution/FileContinuationDialog'
import { FileAppealDialog } from '@/components/prosecution/FileAppealDialog'
import { AppealStepDialog } from '@/components/prosecution/AppealStepDialog'
import { PctStepDialog } from '@/components/prosecution/PctStepDialog'
import { NationalPhaseDialog } from '@/components/prosecution/NationalPhaseDialog'

import { useEffect, Suspense } from 'react'

// ==================== Helpers ====================

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—')

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const formatFileSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    filed: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    under_examination: 'bg-blue-100 text-blue-800',
    office_action: 'bg-red-100 text-red-800',
    allowed: 'bg-green-100 text-green-800',
    granted: 'bg-green-100 text-green-800',
    abandoned: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return colors[status] ?? 'bg-yellow-100 text-yellow-800'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }
  return colors[priority] ?? 'bg-blue-100 text-blue-800'
}

function humanReadableApplicationType(type: string): string {
  const map: Record<string, string> = {
    utility: 'Utility Patent',
    design: 'Design Patent',
    plant: 'Plant Patent',
    provisional: 'Provisional Application',
    pct: 'PCT International',
    cip: 'Continuation-in-Part',
    continuation: 'Continuation',
    divisional: 'Divisional',
  }
  return map[type] ?? type
}

function humanReadableDeadlineType(type: string): string {
  const map: Record<string, string> = {
    office_action_response: 'Office Action Response',
    filing_deadline: 'Filing Deadline',
    fee_payment: 'Fee Payment',
    examination_request: 'Examination Request',
    maintenance_fee: 'Maintenance Fee',
    publication_request: 'Publication Request',
    interview_deadline: 'Interview Deadline',
    appeal_deadline: 'Appeal Deadline',
  }
  return map[type] ?? type.replace(/_/g, ' ')
}

function getDeadlineDateColor(dueDate: string, isCompleted: boolean): string {
  if (isCompleted) return 'text-muted-foreground'
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffMs < 0) return 'text-red-600 font-semibold'
  if (diffDays <= 7) return 'text-red-500 font-medium'
  if (diffDays <= 30) return 'text-yellow-600 font-medium'
  return 'text-foreground'
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now()
}

// ==================== Sub-components ====================

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

interface DocumentGroupProps {
  documentType: string
  documents: ProsecutionDocument[]
}

function DocumentGroup({ documentType, documents }: DocumentGroupProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="capitalize">{documentType.replace(/_/g, ' ')}</span>
          <Badge variant="outline" className="text-xs">{documents.length}</Badge>
        </span>
      </button>
      {expanded && (
        <div className="divide-y">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent/30">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {doc.document_type.replace(/_/g, ' ')}
                </Badge>
                <span className="font-medium truncate">{doc.title}</span>
                {doc.version !== '1' && (
                  <span className="text-xs text-muted-foreground shrink-0">v{doc.version}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {doc.is_filed && doc.filing_date && (
                  <span className="text-xs text-muted-foreground">
                    Filed {formatDate(doc.filing_date)}
                  </span>
                )}
                {doc.file_size > 0 && (
                  <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                )}
                {doc.is_filed && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Filed</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Loading skeleton ====================

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

// ==================== Main Page ====================

function ApplicationDetailPageInner() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()

  const [application, setApplication] = useState<PatentApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'overview')
  const [syncing, setSyncing] = useState(false)
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [docUploadOpen, setDocUploadOpen] = useState(false)
  const [markFiledOpen, setMarkFiledOpen] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [postGrantOpen, setPostGrantOpen] = useState(false)
  const [payingDeadline, setPayingDeadline] = useState<ProsecutionDeadline | null>(null)
  const [continuationOpen, setContinuationOpen] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)
  const [appealStepOpen, setAppealStepOpen] = useState(false)
  const [pctStepOpen, setPctStepOpen] = useState(false)
  const [nationalPhaseOpen, setNationalPhaseOpen] = useState(false)

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await prosecutionApi.getApplication(id)
      if (response.success && response.data) {
        setApplication(response.data)
      } else {
        setError(response.error ?? 'Failed to load application')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }, [id])

  const refreshApplication = useCallback(async () => {
    try {
      const response = await prosecutionApi.getApplication(id)
      if (response.success && response.data) {
        setApplication(response.data)
      }
    } catch {
      // silent refresh failure
    }
  }, [id])

  useEffect(() => {
    fetchApplication()
  }, [fetchApplication])

  async function handleSync() {
    if (!application?.application_number) return
    setSyncing(true)
    try {
      const response = await prosecutionApi.syncFromODP({
        application_number: application.application_number,
      })
      if (response.success) {
        toast.success('Synced successfully')
        await refreshApplication()
      } else {
        toast.error(response.error ?? 'Sync failed')
      }
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function handleCompleteDeadline(deadlineId: string) {
    setCompletingId(deadlineId)
    try {
      const response = await prosecutionApi.completeDeadline(deadlineId)
      if (response.success) {
        toast.success('Deadline marked as completed')
        await refreshApplication()
      } else {
        toast.error(response.error ?? 'Failed to complete deadline')
      }
    } catch {
      toast.error('Failed to complete deadline')
    } finally {
      setCompletingId(null)
    }
  }

  async function handleReopenDeadline(deadlineId: string) {
    setCompletingId(deadlineId)
    try {
      const response = await prosecutionApi.reopenDeadline(deadlineId)
      if (response.success) {
        toast.success('Deadline reopened')
        await refreshApplication()
      } else {
        toast.error(response.error ?? 'Failed to reopen deadline')
      }
    } catch {
      toast.error('Failed to reopen deadline')
    } finally {
      setCompletingId(null)
    }
  }

  if (loading) return <PageSkeleton />

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/prosecution"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prosecution
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">
              {error ?? 'Application not found'}
            </p>
            <Button variant="outline" className="mt-4" onClick={fetchApplication}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- Appeal state (derived from events) ----
  const appealFiled = (application.events ?? []).some(e => e.event_type === 'appeal_filed')

  // ---- Sorted deadlines ----
  const deadlines = [...(application.deadlines ?? [])].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )
  const overdueDeadlines = deadlines.filter(d => !d.is_completed && isOverdue(d.due_date))
  const upcomingDeadlines = deadlines.filter(d => !(!d.is_completed && isOverdue(d.due_date)))

  // ---- Documents grouped by type ----
  const documentGroups = (application.documents ?? []).reduce<Record<string, ProsecutionDocument[]>>(
    (acc, doc) => {
      const key = doc.document_type ?? 'other'
      if (!acc[key]) acc[key] = []
      acc[key].push(doc)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/prosecution"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prosecution
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight truncate">{application.title}</h1>
              <Badge className={getStatusColor(application.status)}>
                {application.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {application.application_number && (
                <span className="font-mono">{application.application_number}</span>
              )}
              {application.patent_number && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="font-mono">{application.patent_number}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {application.filing_date && (
                <span>Filed {formatDate(application.filing_date)}</span>
              )}
              {application.grant_date && (
                <span>Granted {formatDate(application.grant_date)}</span>
              )}
              {application.attorney && (
                <span className="flex items-center gap-1">
                  Attorney:{' '}
                  <AttorneyPopover
                    firstName={application.attorney.first_name ?? ''}
                    lastName={application.attorney.last_name ?? ''}
                    email={application.attorney.email}
                  />
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 flex-wrap">
            {['draft', 'pending'].includes(application.status) && (
              <Button onClick={() => setMarkFiledOpen(true)}>
                Mark as Filed
              </Button>
            )}
            {application.status === 'allowed' && (
              <Button
                onClick={() => setGrantDialogOpen(true)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Record Grant
              </Button>
            )}
            {application.status === 'granted' &&
              !application.deadlines?.some(d => d.deadline_type === 'maintenance_fee') && (
                <Button variant="outline" onClick={() => setMaintenanceDialogOpen(true)}>
                  Setup Maintenance Fees
                </Button>
              )}
            {application.status === 'granted' && (
              <Button variant="outline" onClick={() => setPostGrantOpen(true)}>
                Post-Grant Action
              </Button>
            )}
            {application.application_type === 'pct' && (
              <>
                <Button variant="outline" onClick={() => setPctStepOpen(true)}>
                  PCT Steps
                </Button>
                <Button variant="outline" onClick={() => setNationalPhaseOpen(true)}>
                  Enter National Phase
                </Button>
              </>
            )}
            {application.status === 'office_action' && !appealFiled && (
              <Button
                variant="outline"
                className="text-orange-700 border-orange-300 hover:bg-orange-50"
                onClick={() => setAppealOpen(true)}
              >
                File Appeal
              </Button>
            )}
            {appealFiled && !['granted', 'abandoned', 'rejected'].includes(application.status) && (
              <Button
                variant="outline"
                className="text-orange-700 border-orange-300 hover:bg-orange-50"
                onClick={() => setAppealStepOpen(true)}
              >
                Log Appeal Step
              </Button>
            )}
            {!['draft', 'abandoned', 'rejected', 'withdrawn'].includes(application.status) && (
              <Button variant="outline" onClick={() => setContinuationOpen(true)}>
                File Continuation
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              Edit Application
            </Button>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing || !application.application_number}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sync from ODP
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="office-actions">Office Actions</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ==================== Tab 1: Overview ==================== */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailRow
                  label="Application Type"
                  value={humanReadableApplicationType(application.application_type)}
                />
                <DetailRow label="Jurisdiction" value={application.jurisdiction} />
                <DetailRow
                  label="Priority Level"
                  value={
                    <Badge className={getPriorityColor(application.priority_level)}>
                      {application.priority_level}
                    </Badge>
                  }
                />
                <DetailRow label="Technology Area" value={application.technology_area} />
                {application.ipc_classes.length > 0 && (
                  <DetailRow
                    label="IPC Classes"
                    value={application.ipc_classes.join(', ')}
                  />
                )}
                {application.keywords.length > 0 && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {application.keywords.map(kw => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <DetailRow label="Priority Date" value={formatDate(application.priority_date)} />
                <DetailRow label="Filing Date" value={formatDate(application.filing_date)} />
                {application.publication_date && (
                  <DetailRow label="Publication Date" value={formatDate(application.publication_date)} />
                )}
                {application.grant_date && (
                  <DetailRow label="Grant Date" value={formatDate(application.grant_date)} />
                )}
                {application.expiry_date && (
                  <DetailRow label="Expiry Date" value={formatDate(application.expiry_date)} />
                )}
              </CardContent>
            </Card>

            {/* Inventors & Assignees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inventors &amp; Assignees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Inventors</p>
                  {application.inventors.length > 0 ? (
                    <ul className="space-y-1">
                      {application.inventors.map((inv, i) => (
                        <li key={i} className="text-sm">{inv}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">None listed</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Assignees</p>
                  {application.assignees.length > 0 ? (
                    <ul className="space-y-1">
                      {application.assignees.map((asgn, i) => (
                        <li key={i} className="text-sm">{asgn}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">None listed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Costs to Date</p>
                  <p className="text-2xl font-bold">{formatCurrency(application.costs_to_date)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(application.estimated_total_cost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(application.estimated_value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Examiner Information */}
          {(() => {
            const latestOA = [...(application.office_actions ?? [])]
              .filter(oa => oa.examiner_name || oa.art_unit)
              .sort((a, b) => new Date(b.mailing_date ?? 0).getTime() - new Date(a.mailing_date ?? 0).getTime())[0]
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Examiner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestOA ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <DetailRow label="Examiner" value={latestOA.examiner_name || '—'} />
                      <DetailRow label="Phone" value={latestOA.examiner_phone || '—'} />
                      <DetailRow label="Art Unit" value={latestOA.art_unit || '—'} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No examiner assigned yet.{' '}
                      <button
                        className="underline text-primary"
                        onClick={() => setActiveTab('office-actions')}
                      >
                        Log an office action
                      </button>{' '}
                      to capture examiner details.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* RCE History */}
          {(() => {
            const rceEvents = (application.events ?? []).filter(e => e.event_type === 'rce_filed')
            if (rceEvents.length === 0) return null
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    RCE History
                    <Badge variant="outline">{rceEvents.length} filed</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rceEvents.length > 1 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      This application has {rceEvents.length} RCEs on file. Each additional RCE carries higher fees and continued prosecution risk.
                    </div>
                  )}
                  <div className="space-y-2">
                    {rceEvents.map((event, idx) => {
                      const meta = (event.metadata ?? {}) as {
                        includes_amendment?: boolean
                        fee_status?: string
                        fee_amount?: string | number
                      }
                      return (
                        <div key={event.id ?? idx} className="flex items-start gap-3 text-sm">
                          <span className="shrink-0 w-16 text-muted-foreground">
                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : '—'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium">{event.title}</p>
                            {meta.includes_amendment && (
                              <p className="text-xs text-muted-foreground mt-0.5">Filed with amendment</p>
                            )}
                            {meta.fee_status === 'paid' && (
                              <p className="text-xs text-green-700 mt-0.5">
                                Fee paid{meta.fee_amount ? `: $${meta.fee_amount}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Related Applications (continuations / divisionals) */}
          {(() => {
            const events = application.events ?? []
            type RelMeta = {
              direction?: string
              continuation_type?: string
              child_id?: string
              child_title?: string
              child_application_number?: string | null
              parent_id?: string
              parent_title?: string
              parent_application_number?: string | null
            }

            const childEvents = events.filter(
              e =>
                e.event_type === 'continuation_filed' &&
                (e.metadata as RelMeta)?.direction === 'to_child'
            )
            const parentEvent = events.find(
              e =>
                e.event_type === 'continuation_filed' &&
                (e.metadata as RelMeta)?.direction === 'from_parent'
            )

            if (childEvents.length === 0 && !parentEvent) return null

            const TYPE_LABEL: Record<string, string> = {
              continuation: 'Continuation',
              cip: 'CIP',
              divisional: 'Divisional',
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Related Applications
                    <Badge variant="outline">
                      {childEvents.length + (parentEvent ? 1 : 0)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {parentEvent && (() => {
                    const m = parentEvent.metadata as RelMeta
                    return (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Parent Application</p>
                        <button
                          onClick={() => m.parent_id && router.push(`/dashboard/prosecution/applications/${m.parent_id}`)}
                          className="flex items-center gap-2 text-sm hover:underline text-primary"
                        >
                          <span>{m.parent_title ?? 'Parent Application'}</span>
                          {m.parent_application_number && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {m.parent_application_number}
                            </span>
                          )}
                        </button>
                      </div>
                    )
                  })()}

                  {childEvents.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Child Applications ({childEvents.length})
                      </p>
                      <div className="space-y-2">
                        {childEvents.map((event, idx) => {
                          const m = event.metadata as RelMeta
                          return (
                            <div key={event.id ?? idx} className="flex items-center justify-between gap-2">
                              <button
                                onClick={() =>
                                  m.child_id &&
                                  router.push(`/dashboard/prosecution/applications/${m.child_id}`)
                                }
                                className="flex items-center gap-2 text-sm hover:underline text-primary text-left"
                              >
                                <span>{m.child_title ?? 'Child Application'}</span>
                                {m.child_application_number && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {m.child_application_number}
                                  </span>
                                )}
                              </button>
                              {m.continuation_type && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {TYPE_LABEL[m.continuation_type] ?? m.continuation_type}
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Abstract */}
          {application.abstract && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {application.abstract}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== Tab 2: Claims ==================== */}
        <TabsContent value="claims">
          <ClaimsTab applicationId={id} />
        </TabsContent>

        {/* ==================== Tab 3: Office Actions ==================== */}
        <TabsContent value="office-actions">
          <OfficeActionSection
            applicationId={id}
            officeActions={application.office_actions ?? []}
            events={application.events ?? []}
            onRefresh={refreshApplication}
          />
        </TabsContent>

        {/* ==================== Tab 3: Deadlines ==================== */}
        <TabsContent value="deadlines" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Deadlines</h2>
            <Button size="sm" onClick={() => setDeadlineDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deadline
            </Button>
          </div>

          {deadlines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No deadlines recorded for this application.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {overdueDeadlines.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Overdue
                  </p>
                  <DeadlineList
                    deadlines={overdueDeadlines}
                    completingId={completingId}
                    onComplete={handleCompleteDeadline}
                    onReopen={handleReopenDeadline}
                    onRecordPayment={setPayingDeadline}
                  />
                </div>
              )}
              {upcomingDeadlines.length > 0 && (
                <div className="space-y-2">
                  {overdueDeadlines.length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Upcoming
                    </p>
                  )}
                  <DeadlineList
                    deadlines={upcomingDeadlines}
                    completingId={completingId}
                    onComplete={handleCompleteDeadline}
                    onReopen={handleReopenDeadline}
                    onRecordPayment={setPayingDeadline}
                  />
                </div>
              )}
            </div>
          )}

          <AddDeadlineDialog
            open={deadlineDialogOpen}
            onOpenChange={setDeadlineDialogOpen}
            applicationId={id}
            onSaved={() => {
              setDeadlineDialogOpen(false)
              refreshApplication()
            }}
          />
        </TabsContent>

        {/* ==================== Tab 4: Timeline ==================== */}
        <TabsContent value="timeline">
          <ProsecutionTimeline
            applicationId={id}
            applicationNumber={application.application_number}
          />
        </TabsContent>

        {/* ==================== Tab 5: Documents ==================== */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <Button size="sm" onClick={() => setDocUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Register Document
            </Button>
          </div>
          {Object.keys(documentGroups).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No documents registered yet.{' '}
                <button
                  className="underline text-primary"
                  onClick={() => setDocUploadOpen(true)}
                >
                  Register the first document.
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {Object.entries(documentGroups).map(([type, docs]) => (
                <DocumentGroup key={type} documentType={type} documents={docs} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Dialogs ==================== */}
      <EditApplicationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        application={application}
        onSaved={updated => {
          setApplication(updated)
          setEditDialogOpen(false)
        }}
      />

      <DocumentUploadDialog
        open={docUploadOpen}
        onOpenChange={setDocUploadOpen}
        applicationId={id}
        onSaved={refreshApplication}
      />

      <MarkAsFiledDialog
        open={markFiledOpen}
        onOpenChange={setMarkFiledOpen}
        application={application}
        onSaved={fetchApplication}
      />

      <RecordGrantDialog
        open={grantDialogOpen}
        onOpenChange={setGrantDialogOpen}
        applicationId={id}
        applicationTitle={application.title}
        onSaved={fetchApplication}
      />

      <SetupMaintenanceFeeDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        applicationId={id}
        grantDate={application.grant_date ?? ''}
        onSaved={refreshApplication}
      />

      <PostGrantEventDialog
        open={postGrantOpen}
        onOpenChange={setPostGrantOpen}
        applicationId={id}
        onSaved={refreshApplication}
      />

      {payingDeadline && (
        <RecordFeePaymentDialog
          open={!!payingDeadline}
          onOpenChange={open => { if (!open) setPayingDeadline(null) }}
          applicationId={id}
          deadline={payingDeadline}
          onSaved={() => { setPayingDeadline(null); refreshApplication() }}
        />
      )}

      <FileContinuationDialog
        open={continuationOpen}
        onOpenChange={setContinuationOpen}
        parent={application}
        onSaved={refreshApplication}
      />

      <FileAppealDialog
        open={appealOpen}
        onOpenChange={setAppealOpen}
        applicationId={id}
        onSaved={refreshApplication}
      />

      <AppealStepDialog
        open={appealStepOpen}
        onOpenChange={setAppealStepOpen}
        applicationId={id}
        onSaved={refreshApplication}
      />

      <PctStepDialog
        open={pctStepOpen}
        onOpenChange={setPctStepOpen}
        applicationId={id}
        priorityDate={application.priority_date || application.filing_date}
        onSaved={refreshApplication}
      />

      <NationalPhaseDialog
        open={nationalPhaseOpen}
        onOpenChange={setNationalPhaseOpen}
        pctApplication={application}
        onSaved={refreshApplication}
      />
    </div>
  )
}

// ==================== Deadline List Sub-component ====================

interface DeadlineListProps {
  deadlines: ProsecutionDeadline[]
  completingId: string | null
  onComplete: (id: string) => void
  onReopen: (id: string) => void
  onRecordPayment?: (deadline: ProsecutionDeadline) => void
}

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationDetailPageInner />
    </Suspense>
  )
}

function DeadlineList({ deadlines, completingId, onComplete, onReopen, onRecordPayment }: DeadlineListProps) {
  return (
    <div className="space-y-2">
      {deadlines.map(deadline => (
        <Card key={deadline.id} className={deadline.is_completed ? 'opacity-60' : undefined}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 text-center min-w-[5rem]">
                  <p className={`text-sm font-medium ${getDeadlineDateColor(deadline.due_date, deadline.is_completed)}`}>
                    {formatDate(deadline.due_date)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${deadline.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                    {deadline.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {humanReadableDeadlineType(deadline.deadline_type)}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deadline.is_completed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    disabled={completingId === deadline.id}
                    onClick={() => onReopen(deadline.id)}
                    title="Reopen deadline"
                  >
                    {completingId === deadline.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <>
                    {deadline.deadline_type === 'maintenance_fee' && onRecordPayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                        onClick={() => onRecordPayment(deadline)}
                        disabled={completingId === deadline.id}
                      >
                        Record Payment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={completingId === deadline.id}
                      onClick={() => onComplete(deadline.id)}
                      title="Mark as complete"
                    >
                      {completingId === deadline.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
