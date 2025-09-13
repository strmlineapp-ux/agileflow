"use strict";
'use server';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewUserCreated = void 0;
exports.sendEmail = sendEmail;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const nodemailer = __importStar(require("nodemailer"));
const functions = __importStar(require("firebase-functions"));
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
    const db = (0, firestore_2.getFirestore)();
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
async function sendEmail(to, subject, htmlBody) {
    const mailOptions = {
        from: 'AgileFlow Notifications <noreply@firebase.com>',
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
exports.handleNewUserCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    var _a;
    const newUser = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
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
    const subject = `AgileFlow: New User Awaiting Approval - ${newUserName}`;
    const htmlBody = `
      <p>A new user has signed up and is awaiting your approval:</p>
      <ul>
          <li><strong>Name:</strong> ${newUserName}</li>
          <li><strong>Email:</strong> ${newUserEmail}</li>
      </ul>
      <p>Please log in to the AgileFlow admin dashboard ` +
        `to approve or reject this user.</p>
      <p><a href="https://your-agileflow-app.com/dashboard/notifications">` +
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
//# sourceMappingURL=user-management.js.map