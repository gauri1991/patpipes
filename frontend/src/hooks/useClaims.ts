/**
 * Claims management hook for patent applications
 * Handles CRUD operations for individual claims
 */

import { useState, useCallback } from 'react';
import { prosecutionApi } from '@/lib/api/prosecution';
import { Claim } from '@/types/prosecution';

interface UseClaimsOptions {
  applicationId: string;
  onClaimsChange?: (claims: Claim[]) => void;
  onError?: (error: Error) => void;
}

export function useClaims({ applicationId, onClaimsChange, onError }: UseClaimsOptions) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load claims from backend
  const loadClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      const claimsResponse: any = await prosecutionApi.getClaims(applicationId);

      // Handle paginated response - extract results array
      const claimsData = Array.isArray(claimsResponse)
        ? claimsResponse
        : claimsResponse.results || [];
      
      setClaims(claimsData);
      onClaimsChange?.(claimsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load claims');
      onError?.(err);
      console.error('Failed to load claims:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]); // Remove onClaimsChange and onError from dependencies

  // Add a new claim
  const addClaim = useCallback(async (claimData: {
    claim_number: number;
    claim_type: 'independent' | 'dependent' | 'multiple_dependent';
    claim_text: string;
    depends_on?: string[];
  }) => {
    try {
      setIsSaving(true);
      const newClaim = await prosecutionApi.createClaim({
        application: applicationId,
        ...claimData
      });
      
      const updatedClaims = [...claims, newClaim].sort((a, b) => a.claim_number - b.claim_number);
      setClaims(updatedClaims);
      onClaimsChange?.(updatedClaims);
      
      return newClaim;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add claim');
      onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, claims, onClaimsChange, onError]);

  // Update an existing claim
  const updateClaim = useCallback(async (claimId: string, updates: Partial<Claim>) => {
    try {
      setIsSaving(true);
      const updatedClaim = await prosecutionApi.updateClaim(claimId, updates);
      
      const updatedClaims = claims.map(claim => 
        claim.id === claimId ? updatedClaim : claim
      );
      setClaims(updatedClaims);
      onClaimsChange?.(updatedClaims);
      
      return updatedClaim;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update claim');
      onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [claims, onClaimsChange, onError]);

  // Delete a claim
  const deleteClaim = useCallback(async (claimId: string) => {
    try {
      setIsSaving(true);
      await prosecutionApi.deleteClaim(claimId);
      
      const updatedClaims = claims.filter(claim => claim.id !== claimId);
      setClaims(updatedClaims);
      onClaimsChange?.(updatedClaims);
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete claim');
      onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [claims, onClaimsChange, onError]);

  // Reorder claims (update claim numbers)
  const reorderClaims = useCallback(async (reorderedClaims: Claim[]) => {
    try {
      setIsSaving(true);
      
      // Update claim numbers based on new order
      const updates = reorderedClaims.map(async (claim, index) => {
        const newClaimNumber = index + 1;
        if (claim.claim_number !== newClaimNumber) {
          return await prosecutionApi.updateClaim(claim.id, {
            claim_number: newClaimNumber
          });
        }
        return claim;
      });

      const updatedClaims = await Promise.all(updates);
      setClaims(updatedClaims);
      onClaimsChange?.(updatedClaims);
      
      return updatedClaims;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder claims');
      onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [onClaimsChange, onError]);

  // Generate claims text for display in the document
  const getClaimsText = useCallback(() => {
    return claims
      .sort((a, b) => a.claim_number - b.claim_number)
      .map(claim => `${claim.claim_number}. ${claim.claim_text}`)
      .join('\n\n');
  }, [claims]);

  // Parse claims text and update claims
  const updateClaimsFromText = useCallback(async (claimsText: string) => {
    try {
      setIsSaving(true);
      
      // Parse the claims text into individual claims
      const claimLines = claimsText.split(/\n\s*\n/).filter(line => line.trim());
      const parsedClaims: Array<{
        claim_number: number;
        claim_text: string;
        claim_type: 'independent' | 'dependent' | 'multiple_dependent';
      }> = [];

      claimLines.forEach(line => {
        const trimmed = line.trim();
        const match = trimmed.match(/^(\d+)\.\s*([\s\S]+)/);
        
        if (match) {
          const claimNumber = parseInt(match[1]);
          const claimText = match[2].trim();
          
          // Determine claim type based on text content
          const isDependent = /claim\s+\d+/i.test(claimText) || 
                             /according\s+to\s+claim/i.test(claimText) ||
                             /as\s+defined\s+in\s+claim/i.test(claimText);
          
          parsedClaims.push({
            claim_number: claimNumber,
            claim_text: claimText,
            claim_type: isDependent ? 'dependent' : 'independent'
          });
        }
      });

      // Delete existing claims and create new ones
      await Promise.all(claims.map(claim => prosecutionApi.deleteClaim(claim.id)));
      
      const newClaims = await Promise.all(
        parsedClaims.map(claimData => 
          prosecutionApi.createClaim({
            application: applicationId,
            ...claimData
          })
        )
      );

      setClaims(newClaims);
      onClaimsChange?.(newClaims);
      
      return newClaims;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update claims from text');
      onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, claims, onClaimsChange, onError]);

  return {
    claims,
    isLoading,
    isSaving,
    loadClaims,
    addClaim,
    updateClaim,
    deleteClaim,
    reorderClaims,
    getClaimsText,
    updateClaimsFromText
  };
}