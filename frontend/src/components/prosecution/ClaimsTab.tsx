'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Plus, Pencil, Check, X } from 'lucide-react'
import { prosecutionApi, Claim } from '@/services/prosecutionApi'
import { toast } from 'sonner'

interface ClaimsTabProps {
  applicationId: string
}

const CLAIM_TYPE_LABELS: Record<string, string> = {
  independent: 'Independent',
  dependent: 'Dependent',
  multiple_dependent: 'Multiple Dep.',
}

const CLAIM_TYPE_COLORS: Record<string, string> = {
  independent: 'bg-blue-100 text-blue-800',
  dependent: 'bg-gray-100 text-gray-700',
  multiple_dependent: 'bg-purple-100 text-purple-700',
}

interface NewClaimForm {
  claim_number: string
  claim_type: 'independent' | 'dependent' | 'multiple_dependent'
  claim_text: string
  depends_on: string
}

const INITIAL_NEW: NewClaimForm = {
  claim_number: '',
  claim_type: 'independent',
  claim_text: '',
  depends_on: '',
}

// ==================== ClaimRow ====================

interface ClaimRowProps {
  claim: Claim
  onUpdate: (id: string, data: Partial<Claim>) => Promise<void>
  updating: boolean
}

function ClaimRow({ claim, onUpdate, updating }: ClaimRowProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(claim.claim_text)
  const [savingText, setSavingText] = useState(false)

  async function saveText() {
    if (editText === claim.claim_text) {
      setEditing(false)
      return
    }
    setSavingText(true)
    await onUpdate(claim.id, { claim_text: editText, is_amended: true })
    setSavingText(false)
    setEditing(false)
  }

  function cancelEdit() {
    setEditText(claim.claim_text)
    setEditing(false)
  }

  return (
    <Card className={claim.is_cancelled ? 'opacity-50' : undefined}>
      <CardContent className="p-4 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold tabular-nums w-6 shrink-0">{claim.claim_number}.</span>
            <Badge className={`text-xs ${CLAIM_TYPE_COLORS[claim.claim_type] ?? 'bg-gray-100 text-gray-700'}`}>
              {CLAIM_TYPE_LABELS[claim.claim_type] ?? claim.claim_type}
            </Badge>
            {claim.depends_on?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                depends on: {claim.depends_on.join(', ')}
              </span>
            )}
            {claim.is_amended && !claim.is_cancelled && (
              <Badge className="text-xs bg-amber-100 text-amber-800">Amended</Badge>
            )}
            {claim.is_cancelled && (
              <Badge className="text-xs bg-red-100 text-red-800 line-through">Cancelled</Badge>
            )}
          </div>

          {/* Actions */}
          {!claim.is_cancelled && (
            <div className="flex items-center gap-2 shrink-0">
              {!editing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setEditText(claim.claim_text); setEditing(true) }}
                  disabled={updating}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {claim.is_amended ? 'Re-amend' : 'Amend'}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onUpdate(claim.id, { is_cancelled: !claim.is_cancelled })}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel Claim'}
              </Button>
            </div>
          )}
          {claim.is_cancelled && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onUpdate(claim.id, { is_cancelled: false })}
              disabled={updating}
            >
              Restore
            </Button>
          )}
        </div>

        {/* Claim text */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={6}
              className="text-sm font-mono leading-relaxed"
              disabled={savingText}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={saveText} disabled={savingText}>
                {savingText ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                Save Amendment
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={savingText}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed font-mono ${claim.is_cancelled ? 'line-through text-muted-foreground' : ''}`}>
            {claim.claim_text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== ClaimsTab ====================

export function ClaimsTab({ applicationId }: ClaimsTabProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState<NewClaimForm>(INITIAL_NEW)
  const [addingSaving, setAddingSaving] = useState(false)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const res = await prosecutionApi.getClaims({ application: applicationId })
      if (res.success && res.data) {
        const raw = res.data as any
        const data: Claim[] = Array.isArray(raw) ? raw : (raw.results ?? [raw])
        setClaims(data.sort((a, b) => a.claim_number - b.claim_number))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  async function handleUpdate(id: string, data: Partial<Claim>) {
    setUpdatingId(id)
    try {
      const res = await prosecutionApi.updateClaim(id, data)
      if (res.success && res.data) {
        setClaims(prev =>
          prev.map(c => c.id === id ? { ...c, ...res.data! } : c)
        )
      } else {
        toast.error(res.error ?? 'Failed to update claim')
      }
    } catch {
      toast.error('Failed to update claim')
    } finally {
      setUpdatingId(null)
    }
  }

  function setNewField<K extends keyof NewClaimForm>(key: K, value: NewClaimForm[K]) {
    setNewForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleAddClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.claim_text.trim()) {
      toast.error('Claim text is required')
      return
    }
    const claimNumber = parseInt(newForm.claim_number)
    if (!claimNumber || claimNumber < 1) {
      toast.error('Valid claim number is required')
      return
    }
    setAddingSaving(true)
    try {
      const res = await prosecutionApi.createClaim({
        application: applicationId,
        claim_number: claimNumber,
        claim_type: newForm.claim_type,
        claim_text: newForm.claim_text.trim(),
        depends_on: newForm.depends_on
          ? newForm.depends_on.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        is_cancelled: false,
        is_amended: false,
      })
      if (res.success && res.data) {
        setClaims(prev =>
          [...prev, res.data!].sort((a, b) => a.claim_number - b.claim_number)
        )
        setNewForm(INITIAL_NEW)
        setShowAddForm(false)
        toast.success('Claim added')
      } else {
        toast.error(res.error ?? 'Failed to add claim')
      }
    } catch {
      toast.error('Failed to add claim')
    } finally {
      setAddingSaving(false)
    }
  }

  const activeClaims = claims.filter(c => !c.is_cancelled)
  const cancelledClaims = claims.filter(c => c.is_cancelled)
  const amendedCount = activeClaims.filter(c => c.is_amended).length

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{claims.length} claim{claims.length !== 1 ? 's' : ''}</span>
          {amendedCount > 0 && <span className="text-amber-700">{amendedCount} amended</span>}
          {cancelledClaims.length > 0 && <span className="text-red-600">{cancelledClaims.length} cancelled</span>}
        </div>
        <Button
          size="sm"
          onClick={() => { setShowAddForm(v => !v); setNewForm(INITIAL_NEW) }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Claim
        </Button>
      </div>

      {/* Add claim form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <form onSubmit={handleAddClaim} className="space-y-3">
              <p className="text-sm font-medium">New Claim</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Claim Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newForm.claim_number}
                    onChange={e => setNewField('claim_number', e.target.value)}
                    placeholder={String((claims[claims.length - 1]?.claim_number ?? 0) + 1)}
                    disabled={addingSaving}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={newForm.claim_type}
                    onValueChange={v => setNewField('claim_type', v as NewClaimForm['claim_type'])}
                    disabled={addingSaving}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="dependent">Dependent</SelectItem>
                      <SelectItem value="multiple_dependent">Multiple Dependent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newForm.claim_type !== 'independent' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Depends On (claim #s)</Label>
                    <Input
                      value={newForm.depends_on}
                      onChange={e => setNewField('depends_on', e.target.value)}
                      placeholder="e.g. 1, 3"
                      disabled={addingSaving}
                      className="h-8"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Claim Text <span className="text-red-500">*</span></Label>
                <Textarea
                  value={newForm.claim_text}
                  onChange={e => setNewField('claim_text', e.target.value)}
                  placeholder="A method comprising…"
                  rows={5}
                  disabled={addingSaving}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={addingSaving}>
                  {addingSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Add Claim
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={addingSaving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Claims list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No claims recorded for this application.{' '}
            <button className="underline text-primary" onClick={() => setShowAddForm(true)}>
              Add the first claim.
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeClaims.map(claim => (
            <ClaimRow
              key={claim.id}
              claim={claim}
              onUpdate={handleUpdate}
              updating={updatingId === claim.id}
            />
          ))}
          {cancelledClaims.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                Cancelled Claims
              </p>
              <div className="space-y-3">
                {cancelledClaims.map(claim => (
                  <ClaimRow
                    key={claim.id}
                    claim={claim}
                    onUpdate={handleUpdate}
                    updating={updatingId === claim.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
