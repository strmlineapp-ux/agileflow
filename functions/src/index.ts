
// Import the necessary libraries
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

// Configure the email transport
// using the default SMTP transport and a GMail account.
// For this to work, you need to have configured
// an App Password for your GMail account.
// See https://support.google.com/accounts/answer/185833
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "strm.line.app@gmail.com", // TODO: Configure this with your email
    pass: "12345", // TODO: Configure this with your app password
  },
});

/**
 * Helper function to get all administrator emails from Firestore.
 * @return {Promise<string[]>}
 * // A promise that resolves to an array of admin emails.
 */
async function getAdminEmails(): Promise<string[]> {
  const adminsRef = db.collection("users").where("isAdmin", "==", true);
  const snapshot = await adminsRef.get();
  const adminEmails: string[] = [];
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
async function sendEmail(to: string[], subject: string, htmlBody: string): Promise<void> {
  const mailOptions = {
    from: "AgileFlow Notifications <noreply@firebase.com>",
    to: to.join(","),
    subject: subject,
    html: htmlBody,
  };
  try {
    await mailTransport.sendMail(mailOptions);
    functions.logger.log("Email sent successfully to:", to.join(","));
  } catch (error) {
    functions.logger.error("There was an error while sending the email:", error);
  }
}

/**
 * Firestore trigger that sends an email
 *  to admins when a new user signs up.
 * @param {QueryDocumentSnapshot}
 *  snapshot The document that triggered the function.
 * @return {Promise<void>} A promise that resolves when the function completes.
 */
export const onNewUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  const newUser = event.data?.data();

  if (!newUser || newUser.accountType !== "Viewer") {
    console.log("User does not require approval. Exiting function.");
    return null;
  }
  
  const newUserName = newUser.displayName || "A new user";
  const newUserEmail = newUser.email || "No email provided";

  console.log(`New user "${newUserName}" requires approval.`);

  const adminEmails = await getAdminEmails();

  if (adminEmails.length === 0) {
    console.log("No administrators found to notify. Exiting function.");
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
  } catch (error) {
    console.error("Error sending email:", error);
  }
  
  return null;
});
