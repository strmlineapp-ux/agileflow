

import * as functions from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { sendEmail } from "./index";

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

    const beforeEmails = new Set(beforeData.preApprovedEmails || []);
    const afterEmails = new Set(afterData.preApprovedEmails || []);

    if (afterEmails.size <= beforeEmails.size) {
        console.log("No new emails were added. Exiting function.");
        return null;
    }

    const newEmails = Array.from(afterEmails).filter(email => !beforeEmails.has(email));
    
    if (newEmails.length === 0) {
        return null;
    }

    console.log(`Found ${newEmails.length} new emails to invite.`);

    const subject = "You're invited to join AgileFlow!";
    const htmlBody = `
      <p>You have been invited to join your team on AgileFlow.</p>
      <p>Please click the link below to sign up and get started:</p>
      <p><a href="https://your-agileflow-app.com/login">Sign Up for AgileFlow</a></p>
      <p>If you have any questions, please contact your workspace administrator.</p>
    `;

    try {
        await sendEmail(newEmails, subject, htmlBody);
        console.log("Invitation emails sent successfully.");
    } catch (error) {
        console.error("Error sending invitation emails:", error);
    }
    
    return null;
});
