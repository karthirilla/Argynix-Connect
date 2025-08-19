
'use server'

import { smartExport as smartExportFlow, type SmartExportInput, type SmartExportOutput } from '@/ai/flows/smart-export'
import { smartDataExport as smartDataExportFlow, type SmartDataExportInput, type SmartDataExportOutput } from '@/ai/flows/smart-data-export';

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

export async function getSmartDataExportSuggestion(
  input: SmartDataExportInput
): Promise<{ success: boolean; data?: SmartDataExportOutput; error?: string }> {
  try {
    const result = await smartDataExportFlow(input)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error in smartDataExport flow:', error);
    return { success: false, error: error.message || 'Failed to get AI suggestions. Please try again.' }
  }
}
