import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendEmail } from './user-management.js';

const db = admin.firestore();

/**
 * Firestore trigger that sends an invitation email when a new email is added
 * to the pre-approved-emails collection for a specific workspace.
 */
export const sendInvitation = onDocumentCreated('pre-approved-emails/{docId}', async (event) => {
  const newInvitation = event.data?.data();

  if (!newInvitation) {
    console.log('No data found in event.');
    return null;
  }

  const { email, invitedBy, workspaceId } = newInvitation;

  if (!email || !invitedBy || !workspaceId) {
    console.log('Missing required fields in invitation document.');
    return null;
  }

  console.log(`New invitation found for ${email} in workspace ${workspaceId}.`);

  let inviterName = 'An administrator';
  try {
    const userDoc = await db.collection('users').doc(invitedBy).get();
    if (userDoc.exists) {
      inviterName = userDoc.data()?.displayName || inviterName;
    }
  } catch (error) {
    console.error(`Failed to fetch inviter's name for userId: ${invitedBy}`, error);
  }

  const subject = `You're invited by ${inviterName} to join AgileFlow!`;
  const htmlBody = `
      <p>Hi there,</p>
      <p>${inviterName} has invited you to join your team on AgileFlow.</p>
      <p>Please click the link below to sign up and get started:</p>
      <p><a href="https://agileflow-mlf18.web.app/login">Sign Up for AgileFlow</a></p>
      <p>If you have any questions, please contact your workspace administrator.</p>
    `;

  try {
    await sendEmail([email], subject, htmlBody);
    console.log(`Invitation email sent successfully to ${email}.`);
  } catch (error) {
    console.error(`Error sending invitation email to ${email}:`, error);
  }

  return null;
});
