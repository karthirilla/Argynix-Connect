'use server';
/**
 * @fileOverview An AI-powered tool that suggests relevant fields and optimal export formats for device data export.
 *
 * - smartDataExport - A function that handles the smart export suggestion process.
 * - SmartDataExportInput - The input type for the smartDataExport function.
 * - SmartDataExportOutput - The return type for the smartDataExport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartDataExportInputSchema = z.object({
  deviceType: z.string().describe('The type of the device (e.g., "power meter", "thermostat").'),
  availableKeys: z.array(z.string()).describe('The list of all available telemetry keys for this device.'),
});
export type SmartDataExportInput = z.infer<typeof SmartDataExportInputSchema>;

const SmartDataExportOutputSchema = z.object({
  suggestedFields: z.array(z.string()).describe('Suggested relevant fields for data export from the available keys.'),
  optimalFormat: z.enum(['CSV', 'JSON', 'PDF']).describe('The optimal format for data export.'),
  reasoning: z.string().describe('A brief explanation of why these fields and format are suggested.')
});
export type SmartDataExportOutput = z.infer<typeof SmartDataExportOutputSchema>;

export async function smartDataExport(input: SmartDataExportInput): Promise<SmartDataExportOutput> {
  return smartDataExportFlow(input);
}

const smartDataExportPrompt = ai.definePrompt({
  name: 'smartDataExportPrompt',
  input: {schema: SmartDataExportInputSchema},
  output: {schema: SmartDataExportOutputSchema},
  prompt: `You are an expert IoT data analyst.
  
  A user wants to export data for a device of type '{{{deviceType}}}'.
  
  The following telemetry keys are available for this device:
  {{#each availableKeys}}
  - {{{this}}}
  {{/each}}

  Based on the device type, analyze the available keys and perform the following tasks:
  1.  Identify and select the most relevant and important keys for a typical analysis of this kind of device. Your selection MUST be a subset of the available keys. If no keys seem relevant, return an empty array.
  2.  Determine the most suitable export format (CSV, JSON, or PDF). CSV is best for tabular data analysis, JSON for structured/nested data, and PDF for reporting.
  3.  Provide a concise, one-sentence reason for your choices.

  Return your answer as a single JSON object that strictly follows the output schema.
  `,  
});

const smartDataExportFlow = ai.defineFlow(
  {
    name: 'smartDataExportFlow',
    inputSchema: SmartDataExportInputSchema,
    outputSchema: SmartDataExportOutputSchema,
  },
  async input => {
    const {output} = await smartDataExportPrompt(input);
    return output!;
  }
);
