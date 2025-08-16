// Import the necessary libraries
import * as admin from "firebase-admin";
import {google} from "googleapis";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {QueryDocumentSnapshot} from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

/**
 * The private key and client email from your downloaded JSON file.
 * This is formatted to adhere to the max-len rule.
 */
const SERVICE_ACCOUNT_KEY = {
  type: "service_account",
  project_id: "agileflow-mlf18",
  private_key_id: "86497d211e88b849659532bbb1653b58060699a5",
  private_key: `-----BEGIN PRIVATE KEY-----\n` +
    `MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7IWKbX/4YFSxL\n` +
    `9Tp4ZL4BTKtBG0kUtjZngamlAOuvAtyCDDUI/aSWkJ9C8+0xp8uBj0SOTAI/8OKH\n` +
    `cF41GDXq77ikCo9KN9sLsO2JFzDL2GzvUT3nBW/MVeWop1K32cU5TyJyEBBPTwqh\n` +
    `XFriC0J1myIlAIjTNdS0D0EdWjHY1WDWg9sBQJ8BM+Ma6PCqEeZgMsm+tRSW1HxH\n` +
    `1oq0ZOIx0M8DPdi9uEB+8ylYM4EYnv2ciHCbr8MFlbdYfk15Ex0tBhsBhU7ekxVj\n` +
    `DkfTK4j8ctx3IdEfaXgTbqVZymspRbG59n4SaszBrjjXKZsYB3rIIxN5q7VS4Yzz\n` +
    `+K0EtSLBAgMBAAECggEADgHZnVcGAHQ8RrrGW8rxsIv2QTc7RRA/GggaBFqBac4h\n` +
    `ZqAmi6Pd0THl4/d5jKcaW/o3B94/aF0d/cSe3qNPbOSxCeFq+KOd8z31B9cbLVUH\n` +
    `0XGfvDZbWByhZlqQ/edQhKHMaqSSbfdVDL9Ko8MzQDWirImh1EqCH5DJP1rYIpp0\n` +
    `gRcfwMl1oS6WqawaL/SBtheju3brtPMT0QHXuV34vcSrSCJWz8BBD9fbRryshWN5\n` +
    `O94HtCdH5XR8yhpR9CIBpksm7/ms5reIMQuwEo0Mf8IK8etdrP8n0vExA5EaF89P\n` +
    `1vGRbiEPmzLSC+Lt1HJCdqLuvQAzE5VLF6gfYXUSmQKBgQDfk5mbd9hWvJPNJeHe\n` +
    `tktIpv3Kdrd35IrFmK9QJmLBvFI1LCzpRkhK0UoD7zFvWNwgSZBt6mBgBDIz/ojl\n` +
    `DWhtQ88UjylBPYN1fQRPsyaoQg1ld3v/dHO83+PBlGUYpmEE9OfJrnfHD52bk9OH\n` +
    `tUHAuKf1r3Tz5XRbLqdnCeJFCQKBgQDWRLPDHowoRXLr1jYq+n22JbvGKnPXX0eH\n` +
    `DETglwNXSU4XphjnKhiDkHRV0DuLTeF6SrQJLhkoTEzBEzP+i9Pstd5lgGXiLX6M\n` +
    `b6GHIdHTRJfTaDx/itX1v2/IK9rfq3ctK68dZwWsMPg2KSkEB8bSJIsBt8UNsbD5\n` +
    `Ox7SUhRV+QKBgC5OnfQrgG2GpX5KKFw+mZ00qUA0EpAMkAmZNEZ/jNjfro9A1RSD\n` +
    `8Bk++/uQoUaUuxMc6YM6ljeM5vEJ+USn4EcxUkTJ2hufKAk/mZMAYjNbavbnJpGk\n` +
    `hwxJuxyvJblTTKkAKLoHHtvmChjdJ2TmT/YgyPkEHE8f6VexdA7NZ0YxAoGAa53N\n` +
    `+64YDxHyimjog+WTxixlhz5DOGTuc/HBllvCndB/nHkcAN6vuUSQaZlQjsLrAJUM\n` +
    `n5+7mvXXhxGyB6MLKdSegrRed58J9FcM9eYSkN3es5ui5xxAIlGoPw1nvPdNwC40\n` +
    `obvgqX9e6zT5GMEfJuSbvJ0kJ6CbllIPROtcs2ECgYEAttD9pS1eG3D93KTFN34s\n` +
    `OkRpNNiyajDeWigiRgTs8BzMwbncUnYSI5h7HbfxubzsAUTjyKG2YOYJDA61RTPK\n` +
    `jux0PpO4JuYVSXhUyFUJBTGfo8tuFBrX2/5RiKSPI9spYjsCpwAKzis1vuwBLHZF\n` +
    `CHKVOFlp2zUtRQpKKDUAyT4=\n` +
    `-----END PRIVATE KEY-----`,
  client_email: "strmline-email-sender@agileflow-mlf18.iam.gserviceaccount.com",
  client_id: "117112573584632465012",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/strmline-email-sender%40agileflow-mlf18.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

/**
 * Helper function to get all administrator emails from Firestore.
 * @return {Promise<string[]>} A promise that resolves to an array of admin emails.
 */
async function getAdminEmails(): Promise<string[]> {
  const adminsRef = db.collection("users").where("isAdmin", "==", true);
  const snapshot = await adminsRef.get();
  const adminEmails: string[] = [];
  snapshot.forEach((doc) => {
    const user = doc.data() as { email: string };
    if (user.email) {
      adminEmails.push(user.email);
    }
  });
  return adminEmails;
}

/**
 * Sends an email using the Gmail API.
 * @param {string[]} adminEmails The list of admin email addresses.
 * @param {string} subject The email subject.
 * @param {string} htmlBody The HTML body of the email.
 * @return {Promise<void>} A promise that resolves when the email is sent.
 */
async function sendGmail(
  adminEmails: string[],
  subject: string,
  htmlBody: string,
) {
  const jwtClient = new google.auth.JWT(
    SERVICE_ACCOUNT_KEY.client_email,
    SERVICE_ACCOUNT_KEY.private_key,
    ["https://www.googleapis.com/auth/gmail.send"],
    SERVICE_ACCOUNT_KEY.client_email,
  );

  await jwtClient.authorize();

  const gmail = google.gmail({version: "v1", auth: jwtClient});

  const raw = Buffer.from(
    `From: AgileFlow Notifications <${SERVICE_ACCOUNT_KEY.client_email}>\r\n` +
    `To: ${adminEmails.join(",")}\r\n` +
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=\r\n` +
    "Content-Type: text/html; charset=utf-8\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    `${htmlBody}`,
  ).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me", // Refers to the service account
    requestBody: {
      raw: raw,
    },
  });
  console.log("Email sent successfully.");
}

/**
 * Firestore trigger that sends an email to admins when a new user signs up.
 * @param {QueryDocumentSnapshot} snapshot The snapshot of the document that triggered the function.
 * @return {Promise<void>} A promise that resolves when the function is complete.
 */
export const onNewUserCreated = onDocumentCreated(
  "users/{userId}", async (event) => {
    const newUser = event.data?.data();
    if (!newUser || newUser.accountType !== "Pending") {
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
      await sendGmail(adminEmails, subject, htmlBody);
    } catch (error) {
      console.error("Error sending email:", error);
    }

    return null;
  });