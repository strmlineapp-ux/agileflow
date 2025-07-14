'use server';
/**
 * @fileOverview A flow for creating a Google Docs meeting notes file.
 *
 * - createMeetingNotes - A function that handles the Google Docs link creation.
 * - CreateMeetingNotesInput - The input type for the createMeetingNotes function.
 * - CreateMeetingNotesOutput - The return type for the createMeetingNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateMeetingNotesInputSchema = z.object({
  title: z.string().describe('The title of the event for the meeting notes.'),
});
export type CreateMeetingNotesInput = z.infer<typeof CreateMeetingNotesInputSchema>;

const CreateMeetingNotesOutputSchema = z.object({
  notesLink: z
    .string()
    .url()
    .describe('The generated Google Docs URL.'),
  notesTitle: z.string().describe('The title of the generated Google Doc.'),
});
export type CreateMeetingNotesOutput = z.infer<typeof CreateMeetingNotesOutputSchema>;


export async function createMeetingNotes(
  input: CreateMeetingNotesInput
): Promise<CreateMeetingNotesOutput> {
  return await createMeetingNotesFlow(input);
}


const createMeetingNotesFlow = ai.defineFlow(
  {
    name: 'createMeetingNotesFlow',
    inputSchema: CreateMeetingNotesInputSchema,
    outputSchema: CreateMeetingNotesOutputSchema,
  },
  async (input) => {
    // In a real-world scenario, this is where you would make an authenticated
    // call to the Google Drive/Docs API to create a new document.
    // For this prototype, we will return a mock link.
    console.log(`Generating meeting notes for event: ${input.title}`);

    // This is a placeholder link.
    const mockDocLink = `https://docs.google.com/document/d/mock-${Math.random()
      .toString(36)
      .substring(2, 12)}`;
      
    const notesTitle = `Meeting Notes: ${input.title}`;

    return {
      notesLink: mockDocLink,
      notesTitle: notesTitle,
    };
  }
);
