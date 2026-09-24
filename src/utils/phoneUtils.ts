/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RestoClient } from '../types';

/**
 * Normalizes phone numbers to their canonical digit sequence.
 * Handles Mexican prefixes (+52, 52, 521) to ensure the 10-digit mobile
 * number acts as the consistent unique key for client history & VIP tiering.
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Mexican mobile numbers:
  // e.g. +52 1 56 2166 8171 -> 5215621668171 (13 digits) -> 5621668171
  if (digits.length === 13 && digits.startsWith('521')) {
    return digits.slice(3);
  }
  // e.g. +52 56 2166 8171 -> 525621668171 (12 digits) -> 5621668171
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits.slice(2);
  }
  // Standard 10-digit national number or longer international ending with 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Categorizes loyalty tier based strictly on the accumulated order count
 * associated with the customer's phone number constant.
 */
export function calculateClientTier(orderCount: number): RestoClient['tier'] {
  if (orderCount >= 10) return 'estrella'; // 🥇 Estrella / VIP (10+)
  if (orderCount >= 6) return 'honor';     // 🥈 Comensal de Honor (6-10)
  if (orderCount >= 3) return 'frecuente'; // 🥉 Cliente Frecuente (3-5)
  return 'nuevo';                          // Cliente Nuevo (1-2)
}
