/**
 * SymptomSelector - Quick symptom selection for billing
 * Tracks WHY customers are buying medicines
 */

import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import symptomApi from '../../api/symptom.api';

// Default symptoms (used before API loads)
const defaultSymptoms = [
  { _id: 'fever', name: 'fever', displayName: 'Fever', icon: '🌡️' },
  { _id: 'cold', name: 'cold', displayName: 'Cold', icon: '🤧' },
  { _id: 'cough', name: 'cough', displayName: 'Cough', icon: '😷' },
  { _id: 'headache', name: 'headache', displayName: 'Headache', icon: '🤕' },
  { _id: 'body_ache', name: 'body_ache', displayName: 'Body Ache', icon: '💪' },
  { _id: 'stomach', name: 'stomach', displayName: 'Stomach', icon: '🤢' },
  { _id: 'allergy', name: 'allergy', displayName: 'Allergy', icon: '🤧' },
  { _id: 'other', name: 'other', displayName: 'Other', icon: '📋' },
];

export default function SymptomSelector({ 
  selected = [], 
  onChange, 
  maxSelections = 3,
  className = '',
  inputRef,
  onAfterSelect,
  onBeforeSelect
}) {
  const [symptoms, setSymptoms] = useState(defaultSymptoms);
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    loadSymptoms();
  }, []);

  useEffect(() => {
    if (!selected || selected.length === 0) {
      setFocusedIndex(-1);
    }
  }, [selected]);

  const loadSymptoms = async () => {
    try {
      const response = await symptomApi.getAll();
      if (response?.length > 0) {
        setSymptoms(response);
      }
    } catch (error) {
      console.log('Using default symptoms');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom) => {
    const isSelected = selected.some(s => s.symptomId === symptom._id);
    
    if (isSelected) {
      // Remove
      onChange(selected.filter(s => s.symptomId !== symptom._id));
    } else if (selected.length < maxSelections) {
      // Add
      onChange([...selected, { 
        symptomId: symptom._id, 
        symptomName: symptom.displayName 
      }]);
    }
  };

  const isSelected = (symptomId) => selected.some(s => s.symptomId === symptomId);

  return (
    <div 
      className={cn('space-y-2 outline-none rounded-xl focus:ring-4 focus:ring-system-blue/10 p-1 -m-1', className)}
      ref={inputRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFocusedIndex(p => Math.min(p + 1, Math.min(symptoms.length, 8) - 1));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFocusedIndex(p => Math.max(p - 1, 0));
        } else if (e.key === 'ArrowDown' || e.key === 'Escape') {
          e.preventDefault();
          onAfterSelect?.();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          onBeforeSelect?.();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (symptoms[focusedIndex]) {
            toggleSymptom(symptoms[focusedIndex]);
          }
        }
      }}
    >
      <div className="flex items-center justify-between">
        <label className="text-apple-subheadline font-semibold text-label-primary">
          Why buying? <span className="text-label-tertiary font-normal">(optional)</span>
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-apple-caption-1 text-label-secondary hover:text-label-primary transition-apple-micro cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {symptoms.slice(0, 8).map((symptom, idx) => (
          <button
            key={symptom._id}
            type="button"
            onClick={() => toggleSymptom(symptom)}
            disabled={!isSelected(symptom._id) && selected.length >= maxSelections}
            className={cn(
              'px-3 py-1.5 rounded-full text-apple-caption-1 font-semibold transition-apple-micro active-apple-press',
              'border flex items-center gap-1.5 cursor-pointer',
              isSelected(symptom._id)
                ? 'bg-system-blue/10 border-system-blue/20 text-system-blue font-bold shadow-sm'
                : 'bg-secondary-background border-separator-apple/10 text-label-secondary hover:bg-secondary-background/85',
              !isSelected(symptom._id) && selected.length >= maxSelections && 'opacity-30 cursor-not-allowed',
              idx === focusedIndex ? 'ring-2 ring-system-blue ring-offset-1' : ''
            )}
          >
            <span>{symptom.icon}</span>
            <span>{symptom.displayName}</span>
          </button>
        ))}
      </div>
      
      {selected.length > 0 && (
        <p className="text-apple-caption-1 text-label-secondary mt-1">
          Selected: {selected.map(s => s.symptomName).join(', ')}
        </p>
      )}
    </div>
  );
}
