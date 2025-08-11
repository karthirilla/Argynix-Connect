
'use server'

import { smartExport as smartExportFlow, type SmartExportInput, type SmartExportOutput } from '@/ai/flows/smart-export'

export async function getSmartExportSuggestion(
  input: SmartExportInput
): Promise<{ success: boolean; data?: SmartExportOutput; error?: string }> {
  try {
    const result = await smartExportFlow(input)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error in smartExport flow:', error)
    return { success: false, error: 'Failed to get smart suggestions. Please try again.' }
  }
}
