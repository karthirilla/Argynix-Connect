'use server';
/**
 * @fileOverview An AI-powered tool that suggests relevant fields and optimal export formats for data export.
 *
 * - smartExport - A function that handles the smart export process.
 * - SmartExportInput - The input type for the smartExport function.
 * - SmartExportOutput - The return type for the smartExport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartExportInputSchema = z.object({
  thingsBoardInstance: z.string().describe('The URL of the ThingsBoard instance.'),
  dashboardType: z.string().describe('The type of dashboard (e.g., sensor data, energy consumption).'),
});
export type SmartExportInput = z.infer<typeof SmartExportInputSchema>;

const SmartExportOutputSchema = z.object({
  suggestedFields: z.array(z.string()).describe('Suggested relevant fields for data export.'),
  optimalFormat: z.enum(['CSV', 'JSON']).describe('The optimal format for data export.'),
  reasoning: z.string().describe('Explanation of why those fields and format are suggested.')
});
export type SmartExportOutput = z.infer<typeof SmartExportOutputSchema>;

export async function smartExport(input: SmartExportInput): Promise<SmartExportOutput> {
  return smartExportFlow(input);
}

const smartExportPrompt = ai.definePrompt({
  name: 'smartExportPrompt',
  input: {schema: SmartExportInputSchema},
  output: {schema: SmartExportOutputSchema},
  prompt: `You are an expert data analyst specializing in ThingsBoard data.

  Based on the connected ThingsBoard instance ({{{thingsBoardInstance}}}) and the type of dashboard ({{{dashboardType}}}), suggest the most relevant fields for data export and the optimal export format (CSV or JSON).

  Return your answer as JSON that follows the schema.

  Explain your reasoning for the choices you made.`,  
});

const smartExportFlow = ai.defineFlow(
  {
    name: 'smartExportFlow',
    inputSchema: SmartExportInputSchema,
    outputSchema: SmartExportOutputSchema,
  },
  async input => {
    const {output} = await smartExportPrompt(input);
    return output!;
  }
);
