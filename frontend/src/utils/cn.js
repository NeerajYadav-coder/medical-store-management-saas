/**
 * utils/cn.js
 * 
 * RESPONSIBILITY:
 * - Merge Tailwind CSS classes
 * - Handle conditional classes
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind conflict resolution
 * @param  {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default cn
