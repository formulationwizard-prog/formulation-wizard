// ============================================================
// SUPPLIER QUALIFICATION TRACKER
// ------------------------------------------------------------
// Helpers for computing expiration status + human-readable labels
// across the set of supplier documents every QA team has to track.
// ============================================================

import type { SupplierDocType, SupplierQualification } from '../types';

export const DOC_TYPE_LABELS: Record<SupplierDocType, string> = {
  'locg':           'Letter of Continuing Guarantee',
  'allergen':       'Allergen Statement',
  'sqf':            'SQF Certification',
  'brc':            'BRC / BRCGS Certification',
  'fssc22000':      'FSSC 22000 Certification',
  'kosher':         'Kosher Certificate',
  'halal':          'Halal Certificate',
  'organic':        'USDA Organic Certificate',
  'non-gmo':        'Non-GMO Project Verified',
  'haccp-plan':     'HACCP Plan on File',
  'coa-process':    'COA Issuance Process',
  'insurance':      'Product Liability Insurance',
  'bioengineered':  'Bioengineered Food Disclosure',
  'fda-reg':        'FDA Facility Registration',
};

export const DOC_TYPE_ICONS: Record<SupplierDocType, string> = {
  'locg':           '📄',
  'allergen':       '⚠️',
  'sqf':            '✅',
  'brc':            '✅',
  'fssc22000':      '✅',
  'kosher':         '✡',
  'halal':          '☪',
  'organic':        '🌱',
  'non-gmo':        '🧬',
  'haccp-plan':     '🛡️',
  'coa-process':    '🧪',
  'insurance':      '💼',
  'bioengineered':  '🔬',
  'fda-reg':        '🏛️',
};

export type QualificationStatus = 'current' | 'expiring' | 'expired';

/**
 * Determine the status of a qualification based on its expiration date.
 * - 'current'  : > 60 days to expiration
 * - 'expiring' : 0–60 days to expiration (requires renewal action)
 * - 'expired'  : past expiration date
 */
export function getQualificationStatus(q: SupplierQualification, now: number = Date.now()): {
  status: QualificationStatus;
  daysUntilExpiration: number;
  label: string;
  color: string;
} {
  const exp = new Date(q.expirationDate).getTime();
  const days = Math.floor((exp - now) / 86400000);
  if (days < 0) {
    return {
      status: 'expired',
      daysUntilExpiration: days,
      label: `Expired ${Math.abs(days)} day${days === -1 ? '' : 's'} ago`,
      color: 'rose',
    };
  }
  if (days <= 60) {
    return {
      status: 'expiring',
      daysUntilExpiration: days,
      label: `Expires in ${days} day${days === 1 ? '' : 's'}`,
      color: 'amber',
    };
  }
  return {
    status: 'current',
    daysUntilExpiration: days,
    label: `Valid ${days} more days`,
    color: 'emerald',
  };
}

/** localStorage key for persisted qualifications. */
export const SUPPLIER_QUALS_STORAGE_KEY = 'fw-supplier-qualifications-v1';

/** Load qualifications from localStorage. */
export function loadQualifications(): SupplierQualification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SUPPLIER_QUALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist qualifications to localStorage. */
export function saveQualifications(quals: SupplierQualification[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SUPPLIER_QUALS_STORAGE_KEY, JSON.stringify(quals));
  } catch {
    // ignore — quota full or blocked
  }
}

/**
 * Aggregate qualification status across the set — used for the Dashboard
 * "Needs Attention" panel.
 */
export function summarizeQualifications(quals: SupplierQualification[], now: number = Date.now()): {
  total: number;
  current: number;
  expiring: number;
  expired: number;
  expiringList: SupplierQualification[];
  expiredList: SupplierQualification[];
} {
  let current = 0;
  let expiring = 0;
  let expired = 0;
  const expiringList: SupplierQualification[] = [];
  const expiredList: SupplierQualification[] = [];
  for (const q of quals) {
    const s = getQualificationStatus(q, now).status;
    if (s === 'current') current++;
    else if (s === 'expiring') { expiring++; expiringList.push(q); }
    else { expired++; expiredList.push(q); }
  }
  return {
    total: quals.length,
    current,
    expiring,
    expired,
    expiringList: expiringList.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()),
    expiredList,
  };
}
