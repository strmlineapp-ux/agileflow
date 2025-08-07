'use server';

/**
 * @fileOverview A flow to generate initial AppSettings content using GenAI.
 *
 * - generateInitialAppSettings - A function that generates initial AppSettings content.
 * - GenerateInitialAppSettingsInput - The input type for the generateInitialAppSettings function.
 * - GenerateInitialAppSettingsOutput - The return type for the generateInitialAppSettings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialAppSettingsInputSchema = z.object({
  prompt: z.string().describe('A prompt to guide the generation of initial AppSettings content.'),
});
export type GenerateInitialAppSettingsInput = z.infer<typeof GenerateInitialAppSettingsInputSchema>;

const GenerateInitialAppSettingsOutputSchema = z.object({
  appSettingsContent: z.string().describe('The generated initial AppSettings content.'),
});
export type GenerateInitialAppSettingsOutput = z.infer<typeof GenerateInitialAppSettingsOutputSchema>;

export async function generateInitialAppSettings(input: GenerateInitialAppSettingsInput): Promise<GenerateInitialAppSettingsOutput> {
  return generateInitialAppSettingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialAppSettingsPrompt',
  input: {schema: GenerateInitialAppSettingsInputSchema},
  output: {schema: GenerateInitialAppSettingsOutputSchema},
  prompt: `You are an expert in generating initial AppSettings content for the AgileFlow application.

  Based on the following prompt, generate initial AppSettings content:
  {{prompt}}
  `,
});

const generateInitialAppSettingsFlow = ai.defineFlow(
  {
    name: 'generateInitialAppSettingsFlow',
    inputSchema: GenerateInitialAppSettingsInputSchema,
    outputSchema: GenerateInitialAppSettingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
