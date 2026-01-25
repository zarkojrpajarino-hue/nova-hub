/**
 * OBV Form - Refactored into modular components
 *
 * This file now serves as a thin wrapper around the new modular architecture:
 * - OBVFormContainer: Main orchestrator (handles step flow, state management)
 * - OBVStep1Type: Type selection (exploracion, validacion, venta)
 * - OBVStep2Project: Project selection
 * - OBVStep3BasicInfo: Basic information (title, description, date)
 * - OBVStep4Lead: Lead management (new, existing, or none)
 * - OBVStep5SaleDetails: Sale details and participants (only for venta type)
 * - OBVStep6Evidence: Evidence upload and summary
 * - useOBVFormLogic: Custom hook with all business logic
 *
 * Original file: 761 lines → Refactored to 7 small components
 */

import { OBVFormContainer } from './obv-form/OBVFormContainer';

export function OBVForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  return <OBVFormContainer onCancel={onCancel} onSuccess={onSuccess} />;
}
