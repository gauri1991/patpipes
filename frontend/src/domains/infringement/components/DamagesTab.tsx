'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  RefreshCw,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { infringementApi, DamagesAnalysis } from '@/services/infringementApi';
import { formatCurrency, damagesTheoryLabels } from '@/domains/infringement/utils';
import { toast } from 'sonner';

interface DamagesTabProps {
  caseId: string;
  caseName: string;
}

export function DamagesTab({ caseId, caseName }: DamagesTabProps) {
  const [damages, setDamages] = useState<DamagesAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const loadDamages = async () => {
      setLoading(true);
      try {
        const response = await infringementApi.getOrCreateDamagesAnalysis(caseId);
        if (response.success && response.data) {
          setDamages(response.data.damages_analysis);
        }
      } catch (error) {
        console.error('Error loading damages:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDamages();
  }, [caseId]);

  const handleUpdateField = (field: keyof DamagesAnalysis, value: any) => {
    setDamages((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!damages) return;
    setSaving(true);
    try {
      const response = await infringementApi.updateDamagesAnalysis(damages.id, damages);
      if (response.success && response.data) {
        setDamages(response.data);
        toast.success('Damages analysis saved');
      }
    } catch (error) {
      console.error('Error saving damages:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    if (!damages) return;
    setCalculating(true);
    try {
      // Save first, then calculate
      await infringementApi.updateDamagesAnalysis(damages.id, damages);
      const response = await infringementApi.calculateDamages(damages.id);
      if (response.success && response.data) {
        setDamages(response.data);
        toast.success('Damages calculated');
      }
    } catch (error) {
      console.error('Error calculating damages:', error);
      toast.error('Failed to calculate damages');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
        <p className="text-muted-foreground">Loading damages analysis...</p>
      </div>
    );
  }

  if (!damages) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Analysis</h3>
        <p className="text-muted-foreground">There was an issue loading the damages analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Damages Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Estimate potential damages for this infringement case
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" onClick={handleCalculate} disabled={calculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
            Calculate
          </Button>
        </div>
      </div>

      {/* Theory Selection */}
      <div>
        <h4 className="font-semibold mb-3">Damages Theory</h4>
        <div className="grid gap-3 md:grid-cols-3">
          {(['lost_profits', 'reasonable_royalty', 'hybrid'] as const).map((theory) => (
            <div
              key={theory}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                damages.damages_theory === theory
                  ? 'bg-blue-50 border-blue-500'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleUpdateField('damages_theory', theory)}
            >
              <p className="font-medium text-sm">{damagesTheoryLabels[theory]}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {theory === 'lost_profits' && 'Calculate based on profits lost due to infringement'}
                {theory === 'reasonable_royalty' && 'Calculate based on fair market royalty rate'}
                {theory === 'hybrid' && 'Combine lost profits and reasonable royalty'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Market Data */}
      <div>
        <h4 className="font-semibold mb-3">Market Data</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Market Size ($)</Label>
            <Input
              type="number"
              value={damages.market_size || ''}
              onChange={(e) => handleUpdateField('market_size', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Total market size"
            />
          </div>
          <div className="space-y-2">
            <Label>Accused Product Revenue ($)</Label>
            <Input
              type="number"
              value={damages.accused_product_revenue || ''}
              onChange={(e) => handleUpdateField('accused_product_revenue', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Revenue from accused product"
            />
          </div>
          <div className="space-y-2">
            <Label>Units Sold</Label>
            <Input
              type="number"
              value={damages.accused_product_units || ''}
              onChange={(e) => handleUpdateField('accused_product_units', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Number of units"
            />
          </div>
          <div className="space-y-2">
            <Label>Profit Margin (%)</Label>
            <Input
              type="number"
              value={damages.profit_margin_percent || ''}
              onChange={(e) => handleUpdateField('profit_margin_percent', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Profit margin percentage"
            />
          </div>
        </div>
      </div>

      {/* Lost Profits */}
      {(damages.damages_theory === 'lost_profits' || damages.damages_theory === 'hybrid') && (
        <div>
          <h4 className="font-semibold mb-3">Lost Profits Calculation</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lost Profits Amount ($)</Label>
              <Input
                type="number"
                value={damages.lost_profits_amount || ''}
                onChange={(e) => handleUpdateField('lost_profits_amount', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Calculated lost profits"
              />
            </div>
            <div className="space-y-2">
              <Label>But-For Analysis</Label>
              <Textarea
                value={damages.but_for_analysis || ''}
                onChange={(e) => handleUpdateField('but_for_analysis', e.target.value)}
                placeholder="What would have happened without infringement?"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reasonable Royalty */}
      {(damages.damages_theory === 'reasonable_royalty' || damages.damages_theory === 'hybrid') && (
        <div>
          <h4 className="font-semibold mb-3">Reasonable Royalty Calculation</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Royalty Base ($)</Label>
              <Input
                type="number"
                value={damages.royalty_base || ''}
                onChange={(e) => handleUpdateField('royalty_base', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Base amount for royalty"
              />
            </div>
            <div className="space-y-2">
              <Label>Royalty Rate (%)</Label>
              <Input
                type="number"
                value={damages.royalty_rate_percent || ''}
                onChange={(e) => handleUpdateField('royalty_rate_percent', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Royalty rate percentage"
              />
            </div>
          </div>
        </div>
      )}

      {/* Willfulness */}
      <div>
        <h4 className="font-semibold mb-3">Willfulness Enhancement</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={damages.is_willful}
                onChange={(e) => handleUpdateField('is_willful', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Willful Infringement</span>
            </label>
            {damages.is_willful && (
              <div className="flex items-center gap-2">
                <Label>Multiplier:</Label>
                <Select
                  value={damages.willfulness_multiplier?.toString() || '1'}
                  onValueChange={(v) => handleUpdateField('willfulness_multiplier', parseFloat(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="2.5">2.5x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {damages.is_willful && (
            <div className="space-y-2">
              <Label>Willfulness Justification</Label>
              <Textarea
                value={damages.willfulness_justification || ''}
                onChange={(e) => handleUpdateField('willfulness_justification', e.target.value)}
                placeholder="Explain why this is willful infringement..."
                rows={2}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Estimated Damages</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Base Damages</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(damages.calculated_damages?.base_damages || damages.estimated_damages_low || null)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Multiplier</p>
                <p className="text-2xl font-bold text-purple-600">
                  {damages.calculated_damages?.multiplier || damages.willfulness_multiplier || 1}x
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Damages</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(damages.calculated_damages?.total_damages || damages.estimated_damages_high || null)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assumptions */}
      <div className="space-y-2">
        <Label>Assumptions & Notes</Label>
        <Textarea
          value={damages.assumptions || ''}
          onChange={(e) => handleUpdateField('assumptions', e.target.value)}
          placeholder="Document any assumptions made in this calculation..."
          rows={3}
        />
      </div>
    </div>
  );
}
