"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSendInvitation = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-functions/v2/firestore");
const user_management_js_1 = require("./user-management.js");
/**
 * Firestore trigger that sends an invitation email when a new email is added
 * to the pre-approved-emails collection for a specific workspace.
 */
exports.handleSendInvitation = (0, firestore_2.onDocumentCreated)('pre-approved-emails/{docId}', async (event) => {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const newInvitation = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
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
    let inviterName = "An administrator";
    try {
        const userDoc = await db.collection('users').doc(invitedBy).get();
        if (userDoc.exists) {
            inviterName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) || inviterName;
        }
    }
    catch (error) {
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
        await (0, user_management_js_1.sendEmail)([email], subject, htmlBody);
        console.log(`Invitation email sent successfully to ${email}.`);
    }
    catch (error) {
        console.error(`Error sending invitation email to ${email}:`, error);
    }
    return null;
});
//# sourceMappingURL=send-invitation.js.map