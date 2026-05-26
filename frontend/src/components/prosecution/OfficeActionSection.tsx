'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { prosecutionApi, OfficeAction, ProsecutionEvent } from '@/services/prosecutionApi'
import { AddOfficeActionDialog } from './AddOfficeActionDialog'
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog'
import { RecordInterviewDialog } from './RecordInterviewDialog'
import { FiledResponseDialog } from './FiledResponseDialog'
import { AfcpDialog } from './AfcpDialog'
import { RceDialog } from './RceDialog'
import { NoticeOfAllowanceDialog } from './NoticeOfAllowanceDialog'
import { FileAppealDialog } from './FileAppealDialog'

// ==================== Types ====================

interface OfficeActionSectionProps {
  applicationId: string
  officeActions: OfficeAction[]
  events?: ProsecutionEvent[]
  onRefresh: () => void
}

type ResponseStatusFilter = 'all' | 'pending' | 'in_progress' | 'filed' | 'overdue'

// ==================== Constants ====================

const ACTION_TYPE_LABELS: Record<string, string> = {
  non_final: 'Non-Final Office Action',
  final: 'Final Office Action',
  restriction: 'Restriction Requirement',
  advisory: 'Advisory Action',
  notice_allowance: 'Notice of Allowance',
  notice_abandonment: 'Notice of Abandonment',
}

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  filed: 'Filed',
  overdue: 'Overdue',
}

// ==================== Badge color helpers ====================

function getActionTypeBadgeClass(actionType: string): string {
  const map: Record<string, string> = {
    non_final: 'bg-blue-100 text-blue-800',
    final: 'bg-red-100 text-red-800',
    restriction: 'bg-orange-100 text-orange-800',
    advisory: 'bg-yellow-100 text-yellow-800',
    notice_allowance: 'bg-green-100 text-green-800',
    notice_abandonment: 'bg-gray-100 text-gray-800',
  }
  return map[actionType] ?? 'bg-gray-100 text-gray-800'
}

function getResponseStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    filed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

function isResponseDueDatePast(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}

// ==================== OfficeActionCard ====================

interface OfficeActionCardProps {
  oa: OfficeAction
  onEdit: (oa: OfficeAction) => void
  onStatusChange: (oa: OfficeAction, newStatus: string) => void
  onFileResponse: (oa: OfficeAction) => void
  onAfcp: (oa: OfficeAction) => void
  onRce: (oa: OfficeAction) => void
  onNoA: (oa: OfficeAction) => void
  onAppeal: (oa: OfficeAction) => void
  updatingId: string | null
}

function OfficeActionCard({ oa, onEdit, onStatusChange, onFileResponse, onAfcp, onRce, onNoA, onAppeal, updatingId }: OfficeActionCardProps) {
  const isNoA = oa.action_type === 'notice_allowance'
  const isDatePast = oa.response_due_date
    ? isResponseDueDatePast(oa.response_due_date)
    : false
  const dueDateIsRed =
    oa.response_status === 'overdue' || (isDatePast && oa.response_status !== 'filed')

  const mailingLabel = oa.mailing_date
    ? new Date(oa.mailing_date).toLocaleDateString()
    : '—'

  const dueDateLabel = oa.response_due_date
    ? new Date(oa.response_due_date).toLocaleDateString()
    : '—'

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getActionTypeBadgeClass(oa.action_type)}>
              {ACTION_TYPE_LABELS[oa.action_type] ?? oa.action_type.replace(/_/g, ' ')}
            </Badge>
            <Badge className={getResponseStatusBadgeClass(oa.response_status)}>
              {RESPONSE_STATUS_LABELS[oa.response_status] ?? oa.response_status}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            Mailed {mailingLabel}
          </span>
        </div>

        {/* Examiner / Art Unit */}
        {(oa.examiner_name || oa.art_unit) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {oa.examiner_name && <span>Examiner: {oa.examiner_name}</span>}
            {oa.art_unit && <span>Art Unit: {oa.art_unit}</span>}
          </div>
        )}

        {/* Response due date */}
        {oa.response_due_date && (
          <div className="text-sm">
            <span className="text-muted-foreground">Response due: </span>
            <span className={dueDateIsRed ? 'text-red-600 font-semibold' : 'text-foreground font-medium'}>
              {dueDateLabel}
            </span>
          </div>
        )}

        {/* Summary */}
        {oa.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">{oa.summary}</p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <Select
            value={oa.response_status}
            disabled={updatingId === oa.id}
            onValueChange={newValue => onStatusChange(oa, newValue)}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(oa)}
            disabled={updatingId === oa.id}
          >
            Edit
          </Button>

          {/* Notice of Allowance: dedicated handler */}
          {isNoA && oa.response_status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => onNoA(oa)}
              disabled={updatingId === oa.id}
            >
              Handle Allowance
            </Button>
          )}

          {/* Non-NoA: file response, AFCP, RCE */}
          {!isNoA && oa.response_status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => onFileResponse(oa)}
              disabled={updatingId === oa.id}
            >
              File Response
            </Button>
          )}
          {!isNoA && oa.action_type === 'final' && oa.response_status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
              onClick={() => onAfcp(oa)}
              disabled={updatingId === oa.id}
            >
              AFCP 2.0
            </Button>
          )}
          {!isNoA && (oa.action_type === 'final' || oa.action_type === 'advisory') && oa.response_status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-purple-700 border-purple-300 hover:bg-purple-50"
              onClick={() => onRce(oa)}
              disabled={updatingId === oa.id}
            >
              File RCE
            </Button>
          )}
          {!isNoA && oa.action_type === 'final' && oa.response_status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
              onClick={() => onAppeal(oa)}
              disabled={updatingId === oa.id}
            >
              File Appeal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== OfficeActionSection ====================

export function OfficeActionSection({
  applicationId,
  officeActions,
  events = [],
  onRefresh,
}: OfficeActionSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOA, setEditingOA] = useState<OfficeAction | null>(null)
  const [filter, setFilter] = useState<ResponseStatusFilter>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [interviewExaminer, setInterviewExaminer] = useState('')
  const [filingOA, setFilingOA] = useState<OfficeAction | null>(null)
  const [afcpOA, setAfcpOA] = useState<OfficeAction | null>(null)
  const [rceOpen, setRceOpen] = useState(false)
  const [rceOA, setRceOA] = useState<OfficeAction | null>(null)
  const [noaOA, setNoaOA] = useState<OfficeAction | null>(null)
  const [appealOA, setAppealOA] = useState<OfficeAction | null>(null)

  const rceNumber = events.filter(e => e.event_type === 'rce_filed').length + 1

  function handleAddNew() {
    setEditingOA(null)
    setDialogOpen(true)
  }

  function handleEdit(oa: OfficeAction) {
    setEditingOA(oa)
    setDialogOpen(true)
  }

  async function handleStatusChange(oa: OfficeAction, newStatus: string) {
    setUpdatingId(oa.id)
    try {
      const response = await prosecutionApi.updateOfficeAction(oa.id, {
        response_status: newStatus as OfficeAction['response_status'],
      })
      if (response.success) {
        onRefresh()
      } else {
        toast.error(response.error ?? 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOAs = filter !== 'all'
    ? officeActions.filter(oa => oa.response_status === filter)
    : officeActions

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={v => setFilter(v as ResponseStatusFilter)}
          >
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const latest = officeActions[officeActions.length - 1]
              setInterviewExaminer(latest?.examiner_name ?? '')
              setScheduleOpen(true)
            }}
          >
            Schedule Interview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const latest = officeActions[officeActions.length - 1]
              setInterviewExaminer(latest?.examiner_name ?? '')
              setRecordOpen(true)
            }}
          >
            Record Interview
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Office Action
          </Button>
        </div>
      </div>

      {/* Office action cards */}
      {filteredOAs.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {filter !== 'all'
            ? `No office actions with status "${RESPONSE_STATUS_LABELS[filter] ?? filter}".`
            : 'No office actions recorded for this application.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOAs.map(oa => (
            <OfficeActionCard
              key={oa.id}
              oa={oa}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onFileResponse={oa => setFilingOA(oa)}
              onAfcp={oa => setAfcpOA(oa)}
              onRce={oa => { setRceOA(oa); setRceOpen(true) }}
              onNoA={oa => setNoaOA(oa)}
              onAppeal={oa => setAppealOA(oa)}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}

      <AddOfficeActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicationId={applicationId}
        officeAction={editingOA}
        onSaved={() => {
          setDialogOpen(false)
          onRefresh()
        }}
      />

      <ScheduleInterviewDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        applicationId={applicationId}
        examinerName={interviewExaminer}
        onSaved={onRefresh}
      />

      <RecordInterviewDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        applicationId={applicationId}
        examinerName={interviewExaminer}
        onSaved={onRefresh}
      />

      {filingOA && (
        <FiledResponseDialog
          open={!!filingOA}
          onOpenChange={open => { if (!open) setFilingOA(null) }}
          officeAction={filingOA}
          applicationId={applicationId}
          onSaved={() => { setFilingOA(null); onRefresh() }}
        />
      )}

      {afcpOA && (
        <AfcpDialog
          open={!!afcpOA}
          onOpenChange={open => { if (!open) setAfcpOA(null) }}
          applicationId={applicationId}
          officeAction={afcpOA}
          onSaved={() => { setAfcpOA(null); onRefresh() }}
        />
      )}

      {rceOA && (
        <RceDialog
          open={rceOpen}
          onOpenChange={open => { if (!open) { setRceOpen(false); setRceOA(null) } }}
          applicationId={applicationId}
          rceNumber={rceNumber}
          onSaved={() => { setRceOpen(false); setRceOA(null); onRefresh() }}
        />
      )}

      {noaOA && (
        <NoticeOfAllowanceDialog
          open={!!noaOA}
          onOpenChange={open => { if (!open) setNoaOA(null) }}
          applicationId={applicationId}
          officeAction={noaOA}
          onSaved={() => { setNoaOA(null); onRefresh() }}
        />
      )}

      {appealOA && (
        <FileAppealDialog
          open={!!appealOA}
          onOpenChange={open => { if (!open) setAppealOA(null) }}
          applicationId={applicationId}
          officeAction={appealOA}
          onSaved={() => { setAppealOA(null); onRefresh() }}
        />
      )}
    </div>
  )
}

export default OfficeActionSection
