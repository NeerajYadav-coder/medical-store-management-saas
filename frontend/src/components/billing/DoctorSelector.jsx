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
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: 'General', phone: '' });
  const dropdownRef = useRef(null);

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
      searchDoctors();
    } else if (isOpen) {
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Prescribed by <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      {/* Selected Doctor Display */}
      {selected ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-brand-200 bg-brand-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.doctorName}</p>
              <p className="text-xs text-brand-600">Doctor Prescribed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-brand-100"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor or type name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
              'text-sm placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'border-gray-200 dark:border-gray-700'
            )}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-64 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : showAddForm ? (
            /* Add New Doctor Form */
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add New Doctor</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Doctor name *"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                autoFocus
              />
              <input
                type="text"
                placeholder="Specialization"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddDoctor}
                disabled={!newDoctor.name.trim()}
                className="w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                Add Doctor
              </button>
            </div>
          ) : (
            <>
              {/* Doctor List */}
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <button
                    key={doctor._id}
                    type="button"
                    onClick={() => selectDoctor(doctor)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:bg-gray-950 flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doctor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {doctor.specialization || 'General'} • {doctor.totalPrescriptions || 0} prescriptions
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
                className="w-full px-3 py-2.5 text-left hover:bg-brand-50 flex items-center gap-2 text-brand-600 border-t border-gray-100 dark:border-gray-800"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">
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
