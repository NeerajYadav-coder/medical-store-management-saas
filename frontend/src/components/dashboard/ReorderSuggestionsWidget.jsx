import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, AlertTriangle, Package, Check, X, Info } from 'lucide-react';
import { reorderApi } from '@api/reorder.api';
import Button from '@components/common/Button';
import { cn } from '@/utils/cn';

const SuggestionRow = ({ suggestion, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const urgencyColors = {
    critical: 'text-system-red bg-system-red/10 border-system-red/20',
    high: 'text-system-orange bg-system-orange/10 border-system-orange/20',
    medium: 'text-system-yellow bg-system-yellow/10 border-system-yellow/20',
    low: 'text-label-secondary bg-secondary-background border-separator-apple/20'
  };

  const confidenceColors = {
    high: 'text-system-green',
    medium: 'text-system-yellow',
    low: 'text-system-orange'
  };

  const handleAction = (action) => {
    onAction(suggestion._id, action, dismissReason);
  };

  return (
    <div className="border-b border-separator-apple/10 last:border-0">
      <div 
        className={cn(
          "p-4 cursor-pointer hover:bg-secondary-background/50 transition-apple-micro flex items-center justify-between",
          expanded && "bg-secondary-background/30"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border tracking-wide", urgencyColors[suggestion.urgency])}>
              {suggestion.urgency}
            </span>
            <h4 className="text-apple-headline font-semibold text-label-primary truncate">
              {suggestion.medicineId?.name || 'Unknown Medicine'}
            </h4>
            {suggestion.medicineId?.schedule && ['H', 'H1', 'X'].includes(suggestion.medicineId.schedule) && (
              <span className="text-[10px] font-bold text-system-red border border-system-red/30 px-1 rounded">Rx</span>
            )}
          </div>
          <p className="text-apple-footnote text-label-secondary truncate">
            Stock: <span className="font-semibold text-label-primary">{suggestion.currentStock}</span> • 
            Remaining: <span className="font-semibold text-label-primary">{suggestion.daysOfStockRemaining} days</span> • 
            Reorder: <span className="font-semibold text-system-blue">{suggestion.suggestedReorderQty}</span>
          </p>
        </div>
        <div className="flex items-center text-label-tertiary">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-secondary-background/30 border-t border-separator-apple/5">
          <div className="mb-4">
            <h5 className="text-apple-footnote font-semibold text-label-primary mb-1 flex items-center gap-1">
              <Info className="h-4 w-4 text-system-blue" />
              Forecast Reasoning
            </h5>
            <p className="text-apple-subheadline text-label-secondary leading-relaxed bg-system-background p-3 rounded-lg border border-separator-apple/10">
              {suggestion.reasoning}
            </p>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-apple-footnote">
              <span className="text-label-secondary">Confidence: </span>
              <span className={cn("font-semibold capitalize", confidenceColors[suggestion.confidence])}>
                {suggestion.confidence}
              </span>
            </div>
            <div className="text-apple-footnote text-label-secondary">
              Generated: {new Date(suggestion.generatedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); handleAction('create-po'); }}
              leftIcon={<Package className="h-4 w-4" />}
            >
              Create Purchase Order
            </Button>
            
            <div className="flex gap-2 flex-1">
              <select 
                className="input flex-1 text-apple-subheadline"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select dismiss reason...</option>
                <option value="Already ordered">Already ordered</option>
                <option value="Discontinuing item">Discontinuing item</option>
                <option value="Seasonal, not restocking">Seasonal, not restocking</option>
                <option value="Other">Other</option>
              </select>
              <Button
                variant="outline"
                className="text-system-red hover:bg-system-red/10 border-system-red/30"
                onClick={(e) => { e.stopPropagation(); handleAction('dismiss'); }}
                disabled={!dismissReason}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ReorderSuggestionsWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: () => reorderApi.getSuggestions('pending', 'critical,high,medium')
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, dismissReason }) => reorderApi.actionSuggestion(id, { action, dismissReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reorder-suggestions']);
    }
  });

  const suggestions = data?.data || [];

  const handleAction = (id, action, dismissReason) => {
    actionMutation.mutate({ id, action, dismissReason });
  };

  if (isLoading) {
    return (
      <div className="card p-6 border border-separator-apple/10 shadow-soft animate-pulse">
        <div className="h-6 w-48 bg-secondary-background rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-secondary-background rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show widget if there are no suggestions
  }

  return (
    <div className="card border border-separator-apple/10 shadow-soft overflow-hidden">
      <div className="p-5 bg-system-background border-b border-separator-apple/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-system-orange" />
          <h3 className="text-apple-headline font-semibold text-label-primary tracking-tight">
            Smart Reorder Suggestions
          </h3>
        </div>
        <span className="bg-system-orange/10 text-system-orange text-apple-footnote font-bold px-2 py-0.5 rounded-full">
          {suggestions.length} Items
        </span>
      </div>
      <div className="divide-y divide-separator-apple/10 max-h-[500px] overflow-y-auto">
        {suggestions.map((suggestion) => (
          <SuggestionRow 
            key={suggestion._id} 
            suggestion={suggestion} 
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}
