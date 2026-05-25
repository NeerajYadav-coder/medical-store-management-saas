/**
 * SymptomSelector - Quick symptom selection for billing
 * Tracks WHY customers are buying medicines
 */

import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import symptomApi from '../../api/symptom.api';

export default function SymptomSelector({ 
  selected = [], 
  onChange, 
  maxSelections = 3,
  className = '' 
}) {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    try {
      const response = await symptomApi.getAll();
      if (response?.length > 0) {
        setSymptoms(response);
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
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
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Why buying? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {symptoms.slice(0, 8).map((symptom) => (
          <button
            key={symptom._id}
            type="button"
            onClick={() => toggleSymptom(symptom)}
            disabled={!isSelected(symptom._id) && selected.length >= maxSelections}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              'border flex items-center gap-1.5',
              isSelected(symptom._id)
                ? 'bg-brand-100 border-brand-300 text-brand-700'
                : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800',
              !isSelected(symptom._id) && selected.length >= maxSelections && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{symptom.icon}</span>
            <span>{symptom.displayName}</span>
          </button>
        ))}
      </div>
      
      {selected.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {selected.map(s => s.symptomName).join(', ')}
        </p>
      )}
    </div>
  );
}
