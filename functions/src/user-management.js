
import * as functions from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();
// Configure the email transport
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'strm.line.app@gmail.com', // TODO: Configure this with your email
        pass: '12345', // TODO: Configure this with your app password
    },
});
/**
 * Helper function to get all administrator emails from Firestore for a specific workspace.
 * @param {string} workspaceId The ID of the workspace.
 * @return {Promise<string[]>} A promise that resolves to an array of admin emails.
 */
async function getAdminEmails(workspaceId) {
    const adminsRef = db.collection('users').where('isAdmin', '==', true).where('workspaceId', '==', workspaceId);
    const snapshot = await adminsRef.get();
    const adminEmails = [];
    snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.email) {
            adminEmails.push(user.email);
        }
    });
    return adminEmails;
}
/**
 * Sends an email using Nodemailer.
 * @param {string[]} to The list of recipient email addresses.
 * @param {string} subject The email subject.
 * @param {string} htmlBody The HTML body of the email.
 * @return {Promise<void>} A promise that resolves when the email is sent.
 */
export async function sendEmail(to, subject, htmlBody) {
    const mailOptions = {
        from: 'Strm_ Notifications <noreply@firebase.com>',
        to: to.join(','),
        subject: subject,
        html: htmlBody,
    };
    try {
        await mailTransport.sendMail(mailOptions);
        functions.logger.log('Email sent successfully to:', to.join(','));
    }
    catch (error) {
        functions.logger.error('There was an error while sending the email:', error);
    }
}
/**
 * Firestore trigger that sends an email to admins when a new user signs up.
 */
export const onNewUserCreated = onDocumentCreated('users/{userId}', async (event) => {
    const newUser = event.data?.data();
    // If user is 'Full' (pre-approved or first user), no notification needed.
    if (!newUser || newUser.accountType !== 'Viewer' || !newUser.workspaceId) {
        console.log('User does not require approval or has no workspaceId. Exiting function.');
        return null;
    }
    const newUserName = newUser.displayName || 'A new user';
    const newUserEmail = newUser.email || 'No email provided';
    const workspaceId = newUser.workspaceId;
    console.log(`New user "${newUserName}" requires approval for workspace "${workspaceId}".`);
    const adminEmails = await getAdminEmails(workspaceId);
    if (adminEmails.length === 0) {
        console.log('No administrators found to notify for this workspace. Exiting function.');
        return null;
    }
    const subject = `Strm_: New User Awaiting Approval - ${newUserName}`;
    const htmlBody = `
      <p>A new user has signed up and is awaiting your approval:</p>
      <ul>
          <li><strong>Name:</strong> ${newUserName}</li>
          <li><strong>Email:</strong> ${newUserEmail}</li>
      </ul>
      <p>Please log in to the Strm_ admin dashboard ` +
        `to approve or reject this user.</p>
      <p><a href="https://strm-mlf18.web.app/dashboard/notifications">` +
        `View Pending Users</a></p>
    `;
    try {
        await sendEmail(adminEmails, subject, htmlBody);
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
    return null;
});
