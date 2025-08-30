

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { sendEmail } from "./index";

const db = admin.firestore();

/**
 * Firestore trigger that sends an invitation email when a new email is added
 * to the preApprovedEmails list in app settings.
 * @param {Change<QueryDocumentSnapshot>} change The change object from the trigger.
 * @return {Promise<void>} A promise that resolves when the function completes.
 */
export const sendInvitation = onDocumentUpdated("app-settings/global", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
        console.log("No data found in event.");
        return null;
    }

    const beforeEmails = new Set((beforeData.preApprovedEmails || []).map((item: any) => item.email));
    const afterEmailsObjects = afterData.preApprovedEmails || [];

    if (afterEmailsObjects.length <= beforeEmails.size) {
        console.log("No new emails were added. Exiting function.");
        return null;
    }

    const newEmailObjects = afterEmailsObjects.filter((item: any) => !beforeEmails.has(item.email));
    
    if (newEmailObjects.length === 0) {
        return null;
    }

    console.log(`Found ${newEmailObjects.length} new emails to invite.`);

    for (const item of newEmailObjects) {
        let inviterName = "An administrator";
        try {
            // We can't guarantee the workspace of the inviter, but we can fetch their name.
            // A more robust solution might store the inviter's workspaceId with the invitation.
            const userDoc = await db.collection('users').doc(item.invitedBy).get();
            if (userDoc.exists) {
                inviterName = userDoc.data()?.displayName || inviterName;
            }
        } catch (error) {
            console.error(`Failed to fetch inviter's name for userId: ${item.invitedBy}`, error);
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
            await sendEmail([item.email], subject, htmlBody);
            console.log(`Invitation email sent successfully to ${item.email}.`);
        } catch (error) {
            console.error(`Error sending invitation email to ${item.email}:`, error);
        }
    }
    
    return null;
});
