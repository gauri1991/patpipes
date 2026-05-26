'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, MapPin, Building2, ExternalLink, Loader2 } from 'lucide-react'
import { attorneyApi } from '@/services/attorneyApi'

interface AttorneyPopoverProps {
  firstName: string
  lastName: string
  email?: string
}

export function AttorneyPopover({ firstName, lastName, email }: AttorneyPopoverProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attorney, setAttorney] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [fetched, setFetched] = useState(false)

  const fullName = `${firstName} ${lastName}`.trim()

  const fetchAttorney = useCallback(async () => {
    if (fetched) return
    setLoading(true)
    setNotFound(false)
    try {
      const response = await attorneyApi.getAttorneys({ search: fullName, limit: 5 })
      if (response.success && response.data) {
        const results = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results ?? []
        const lower = fullName.toLowerCase()
        const match =
          results.find((a: any) => a.full_name?.toLowerCase() === lower) ??
          results.find((a: any) =>
            `${a.first_name} ${a.last_name}`.toLowerCase() === lower
          ) ??
          results[0] ?? null
        if (match) {
          setAttorney(match)
        } else {
          setNotFound(true)
        }
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [fullName, fetched])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !fetched) fetchAttorney()
  }

  const initials = attorney
    ? `${(attorney.first_name || '')[0] ?? ''}${(attorney.last_name || '')[0] ?? ''}`.toUpperCase()
    : `${(firstName || '')[0] ?? ''}${(lastName || '')[0] ?? ''}`.toUpperCase()

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
          aria-label={`View attorney profile for ${fullName}`}
        >
          {fullName || email}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && notFound && (
          <div className="p-4 text-center space-y-1">
            <Avatar className="h-10 w-10 mx-auto">
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium mt-2">{fullName}</p>
            {email && <p className="text-xs text-muted-foreground">{email}</p>}
            <p className="text-xs text-muted-foreground mt-1">Not found in attorney network</p>
          </div>
        )}

        {!loading && attorney && (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{attorney.full_name}</p>
                  {attorney.source === 'uspto_roster' && (
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                {attorney.title && (
                  <p className="text-xs text-muted-foreground truncate">{attorney.title}</p>
                )}
                {attorney.registration_number && (
                  <p className="text-xs text-muted-foreground">Reg. No. {attorney.registration_number}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {attorney.law_firm_name && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{attorney.law_firm_name}</span>
                </div>
              )}
              {(attorney.city || attorney.state || attorney.country) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{[attorney.city, attorney.state, attorney.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {attorney.practitioner_type && (
                <Badge variant="secondary" className="text-xs">
                  {attorney.practitioner_type === 'ATTORNEY'
                    ? 'Patent Attorney'
                    : attorney.practitioner_type === 'AGENT'
                    ? 'Patent Agent'
                    : attorney.practitioner_type}
                </Badge>
              )}
              {attorney.source === 'uspto_roster' && (
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" /> USPTO Verified
                </Badge>
              )}
            </div>

            <Link
              href={`/dashboard/attorney/${attorney.id}`}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              View Full Profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
