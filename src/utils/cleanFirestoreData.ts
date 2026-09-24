/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Recursively cleans an object or array to remove any `undefined` values,
 * which Firestore rejects with 'Unsupported field value: undefined'.
 */
export function cleanFirestoreData<T>(obj: T): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item));
  }
  
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = cleanFirestoreData(value);
    }
  }
  return result;
}
