// Label-display helpers shared between the workspace (app/workspace/page.tsx)
// and the extracted SupplementFactsPanel (components/SupplementFactsPanel.tsx).

/**
 * Strip catalog QA tokens (Tier-A/B, PENDING TIER VERIFICATION) from a display
 * name at render time. Path-A fix for duplicate-SKU QA tokens bleeding onto
 * consumer-facing / printable outputs; Path B (resolving the underlying catalog
 * pairs) is queued per [[project_catalog_duplicate_sku_audit_ticket]]. Moved out
 * of page.tsx so the SFP panel can render through one shared path.
 */
export function stripCatalogQaTokens(name: string): string {
  return name
    .replace(/,\s*Tier-[AB],\s*PENDING TIER VERIFICATION/g, '')
    .replace(/,\s*PENDING TIER VERIFICATION/g, '')
    .replace(/,\s*Tier-[AB]/g, '')
    .trim();
}
