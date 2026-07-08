/**
 * DoctorSelector - Quick doctor selection/creation for billing
 * Tracks prescription referrals for ROI analysis
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Stethoscope, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import doctorApi from '../../api/doctor.api';

export default function DoctorSelector({ 
  selected = null, 
  onChange,
  onAfterSelect,
  onBeforeSelect,
  inputRef,
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: 'General', phone: '' });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const doctorItemRefs = useRef([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search doctors
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setFocusedIndex(0);
      searchDoctors();
    } else if (isOpen) {
      setFocusedIndex(0);
      loadTopDoctors();
    }
  }, [searchQuery, isOpen]);

  const loadTopDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getTopDoctors(10);
      setDoctors(response || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.search(searchQuery);
      setDoctors(response || []);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectDoctor = (doctor) => {
    onChange({
      doctorId: doctor._id,
      doctorName: doctor.name,
    });
    setIsOpen(false);
    setSearchQuery('');
    setTimeout(() => onAfterSelect?.(), 50);
  };

  const openAddForm = () => {
    setNewDoctor({
      name: searchQuery,
      specialization: 'General',
      phone: '',
    });
    setShowAddForm(true);
  };

  const clearSelection = () => {
    onChange(null);
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) return;
    
    try {
      setLoading(true);
      const response = await doctorApi.create(newDoctor);
      selectDoctor(response);
      setNewDoctor({ name: '', specialization: 'General', phone: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <label className="block text-apple-subheadline font-semibold text-label-primary mb-1">
        Prescribed by <span className="text-label-tertiary font-normal">(optional)</span>
      </label>

      {/* Selected Doctor Display */}
      {selected ? (
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-system-blue/20 bg-system-blue/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-system-blue/20 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-system-blue" />
            </div>
            <div>
              <p className="text-apple-subheadline font-bold text-label-primary">{selected.doctorName}</p>
              <p className="text-apple-caption-2 text-system-blue font-bold uppercase tracking-wider">Doctor Prescribed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-system-blue/20 text-system-blue transition-apple-micro active-apple-press"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-label-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search doctor or type name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(0); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); setIsOpen(false); return; }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (doctors.length > 0 && doctors[focusedIndex]) {
                  selectDoctor(doctors[focusedIndex]);
                } else if (searchQuery.trim().length > 0 && !loading) {
                  openAddForm();
                }
                return;
              }
              if (!isOpen || doctors.length === 0) {
                if (e.key === 'ArrowDown' && searchQuery === '') {
                  e.preventDefault();
                  onAfterSelect?.();
                } else if (e.key === 'ArrowUp' && searchQuery === '') {
                  e.preventDefault();
                  onBeforeSelect?.();
                }
                return;
              }
              if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.min(focusedIndex + 1, doctors.length - 1); setFocusedIndex(n); doctorItemRefs.current[n]?.scrollIntoView({ block: 'nearest' }); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); const p = Math.max(focusedIndex - 1, 0); setFocusedIndex(p); doctorItemRefs.current[p]?.scrollIntoView({ block: 'nearest' }); }
            }}
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-xl border bg-secondary-background text-label-primary',
              'text-apple-subheadline placeholder:text-label-tertiary',
              'focus:outline-none focus:ring-4 focus:ring-system-blue/10 focus:border-system-blue',
              'border-separator-apple/10 transition-apple-micro'
            )}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selected && (
        <div className="absolute z-50 mt-1.5 w-full bg-secondary-background rounded-2xl border border-separator-apple/10 shadow-elevated max-h-64 overflow-auto divide-y divide-separator-apple/10">
          {loading ? (
            <div className="p-4 text-center text-apple-subheadline text-label-tertiary">
              Loading...
            </div>
          ) : showAddForm ? (
            /* Add New Doctor Form — keyboard driven */
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-apple-headline font-bold text-label-primary">Add New Doctor</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-label-secondary hover:text-label-primary transition-apple-micro cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Doctor name *"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddDoctor(); }
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
                className="w-full px-3 py-2 text-apple-subheadline border-2 border-system-blue/40 bg-secondary-background text-label-primary rounded-xl focus:ring-4 focus:ring-system-blue/10 focus:outline-none transition-apple-micro"
                autoFocus
              />
              <input
                type="text"
                placeholder="Specialization (optional)"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddDoctor(); }
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
                className="w-full px-3 py-2 text-apple-subheadline border border-separator-apple/10 bg-secondary-background text-label-primary rounded-xl focus:border-system-blue focus:outline-none transition-apple-micro"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddDoctor(); }
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
                className="w-full px-3 py-2 text-apple-subheadline border border-separator-apple/10 bg-secondary-background text-label-primary rounded-xl focus:border-system-blue focus:outline-none transition-apple-micro font-mono"
              />
              <p className="text-[10px] text-label-secondary">Enter to save doctor & select</p>
              <button
                type="button"
                onClick={handleAddDoctor}
                disabled={!newDoctor.name.trim() || loading}
                className="w-full py-2.5 bg-system-blue text-white text-apple-subheadline font-semibold rounded-xl hover:bg-system-blue/90 disabled:opacity-50 transition-apple-micro active-apple-press cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save & Select ↵'}
              </button>
            </div>
          ) : (
            <>
              {/* Doctor List */}
              {doctors.length > 0 ? (
                doctors.map((doctor, didx) => (
                  <button
                    key={doctor._id}
                    ref={el => doctorItemRefs.current[didx] = el}
                    type="button"
                    onClick={() => selectDoctor(doctor)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left flex items-center gap-3 transition-apple-micro cursor-pointer",
                      didx === focusedIndex ? "bg-system-blue/10" : "hover:bg-secondary-background/60"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-secondary-background border border-separator-apple/10 flex items-center justify-center text-label-secondary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-apple-subheadline font-semibold text-label-primary truncate">
                        {doctor.name}
                      </p>
                      <p className="text-apple-caption-2 text-label-secondary truncate mt-0.5">
                        {doctor.specialization || 'General'} • {doctor.totalPrescriptions || 0} prescriptions
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-apple-subheadline text-label-tertiary">
                  {searchQuery ? 'No doctors found' : 'Start typing to search'}
                </div>
              )}

              {/* Add New Button */}
              <button
                type="button"
                onClick={() => {
                  setNewDoctor({ ...newDoctor, name: searchQuery });
                  setShowAddForm(true);
                }}
                className="w-full px-3 py-3 text-left hover:bg-system-blue/10 flex items-center gap-2 text-system-blue border-t border-separator-apple/10 transition-apple-micro cursor-pointer font-semibold text-apple-subheadline"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {searchQuery ? `Add "${searchQuery}" as new doctor` : 'Add new doctor'}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
