/**
 * seeds/symptomCategories.js
 * 
 * Default symptom categories for tracking WHY customers buy.
 * Run with: node seeds/symptomCategories.js
 */

import mongoose from 'mongoose';
import SymptomCategory from '../models/SymptomCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultSymptoms = [
  {
    name: 'fever',
    displayName: 'Fever',
    icon: '🌡️',
    description: 'Elevated body temperature',
    commonMedicineCategories: ['Antipyretic', 'Analgesic'],
    sortOrder: 1,
  },
  {
    name: 'cold',
    displayName: 'Cold & Flu',
    icon: '🤧',
    description: 'Common cold, runny nose, congestion',
    commonMedicineCategories: ['Antihistamine', 'Decongestant', 'Analgesic'],
    sortOrder: 2,
  },
  {
    name: 'cough',
    displayName: 'Cough',
    icon: '😷',
    description: 'Dry or wet cough',
    commonMedicineCategories: ['Antitussive', 'Expectorant', 'Mucolytic'],
    sortOrder: 3,
  },
  {
    name: 'headache',
    displayName: 'Headache',
    icon: '🤕',
    description: 'Head pain, migraine',
    commonMedicineCategories: ['Analgesic', 'NSAID'],
    sortOrder: 4,
  },
  {
    name: 'body_ache',
    displayName: 'Body Ache',
    icon: '💪',
    description: 'Muscle pain, joint pain',
    commonMedicineCategories: ['Analgesic', 'NSAID', 'Muscle Relaxant'],
    sortOrder: 5,
  },
  {
    name: 'stomach',
    displayName: 'Stomach Issues',
    icon: '🤢',
    description: 'Acidity, indigestion, nausea',
    commonMedicineCategories: ['Antacid', 'PPI', 'Antiemetic'],
    sortOrder: 6,
  },
  {
    name: 'diarrhea',
    displayName: 'Diarrhea',
    icon: '🚽',
    description: 'Loose motions, dehydration',
    commonMedicineCategories: ['Antidiarrheal', 'ORS', 'Probiotic'],
    sortOrder: 7,
  },
  {
    name: 'constipation',
    displayName: 'Constipation',
    icon: '🚫',
    description: 'Difficulty in bowel movement',
    commonMedicineCategories: ['Laxative', 'Fiber'],
    sortOrder: 8,
  },
  {
    name: 'allergy',
    displayName: 'Allergy',
    icon: '🤧',
    description: 'Skin rash, itching, allergic reaction',
    commonMedicineCategories: ['Antihistamine', 'Corticosteroid'],
    sortOrder: 9,
  },
  {
    name: 'infection',
    displayName: 'Infection',
    icon: '🦠',
    description: 'Bacterial or viral infection',
    commonMedicineCategories: ['Antibiotic', 'Antiviral', 'Antifungal'],
    sortOrder: 10,
  },
  {
    name: 'diabetes',
    displayName: 'Diabetes',
    icon: '💉',
    description: 'Blood sugar management',
    commonMedicineCategories: ['Antidiabetic', 'Insulin'],
    sortOrder: 11,
  },
  {
    name: 'bp_heart',
    displayName: 'BP / Heart',
    icon: '❤️',
    description: 'Blood pressure, heart conditions',
    commonMedicineCategories: ['Antihypertensive', 'Cardiac'],
    sortOrder: 12,
  },
  {
    name: 'skin',
    displayName: 'Skin Issues',
    icon: '✋',
    description: 'Skin conditions, wounds',
    commonMedicineCategories: ['Topical', 'Antiseptic', 'Antifungal'],
    sortOrder: 13,
  },
  {
    name: 'eye',
    displayName: 'Eye Problems',
    icon: '👁️',
    description: 'Eye infection, dryness',
    commonMedicineCategories: ['Eye Drops', 'Ophthalmic'],
    sortOrder: 14,
  },
  {
    name: 'ear',
    displayName: 'Ear Problems',
    icon: '👂',
    description: 'Ear infection, pain',
    commonMedicineCategories: ['Ear Drops', 'Antibiotic'],
    sortOrder: 15,
  },
  {
    name: 'vitamins',
    displayName: 'Vitamins & Supplements',
    icon: '💊',
    description: 'General health supplements',
    commonMedicineCategories: ['Vitamin', 'Mineral', 'Supplement'],
    sortOrder: 16,
  },
  {
    name: 'wellness',
    displayName: 'General Wellness',
    icon: '🏃',
    description: 'Preventive care, immunity',
    commonMedicineCategories: ['Immunity Booster', 'Tonic'],
    sortOrder: 17,
  },
  {
    name: 'other',
    displayName: 'Other',
    icon: '📋',
    description: 'Other conditions',
    commonMedicineCategories: [],
    sortOrder: 99,
  },
];

async function seedSymptomCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing symptoms
    await SymptomCategory.deleteMany({});
    console.log('Cleared existing symptom categories');

    // Insert new symptoms
    const result = await SymptomCategory.insertMany(defaultSymptoms);
    console.log(`Inserted ${result.length} symptom categories`);

    console.log('\n✅ Symptom categories seeded successfully!');
    console.log('\nCategories:');
    result.forEach(s => console.log(`  ${s.icon} ${s.displayName}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding symptom categories:', error);
    process.exit(1);
  }
}

seedSymptomCategories();
