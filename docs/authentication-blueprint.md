# AgileFlow: Authentication Blueprint

This document provides a clear, non-technical overview of how user authentication is handled within the AgileFlow application, incorporating a robust, administrator-controlled access model.

---

## 1. Authentication & Onboarding Flow

The application uses Google Sign-In as its sole method of authentication. Access is strictly controlled by administrators to ensure workspace security. A user can gain access in one of three ways:

*   **Method A: First User Auto-Approval (Bootstrap Flow)**
*   **Method B: Administrator Invitation (Recommended)**
*   **Method C: User-Initiated Access Request**

---

### Method A: First User Auto-Approval (Bootstrap Flow)

This method ensures the very first person to sign into a new, empty AgileFlow instance automatically becomes the system administrator.

**Step 1: New User Signs In to an Empty System**
A new user navigates to the application URL and is the first person ever to click "Sign in with Google."

**Step 2: System Detects No Existing Users**
Firebase authenticates the user. The application then checks the `/users` collection in Firestore and finds that it is empty.

**Step 3: Admin Profile Creation & Full Access Granted**
Because this is the first user, the system creates their profile with two special properties:
*   `isAdmin` is set to `true`.
*   `accountType` is set to `'Full'`.
The user is immediately granted full administrative access to the entire application.

---

### Method B: Administrator Invitation (Recommended Flow)

This is the most secure and user-friendly method for adding new team members once an administrator exists.

**Step 1: Admin Sends an Invitation**
An existing administrator uses a dedicated "Invite User" form within the application to enter the email address of the new user. This action securely adds the email to an "invited" list in the database.

**Step 2: User Receives an Email**
The application sends a welcome email to the new user with a link to the AgileFlow login page.

**Step 3: User Clicks "Sign in with Google"**
The new user clicks the link and uses the "Sign in with Google" button. They complete the secure sign-in process directly with Google.

**Step 4: System Verifies Invitation**
Firebase Authentication confirms the user's identity and returns their verified email address to the application. The system checks this email against the "invited" list.

**Step 5: Profile Creation & Access Granted**
Upon finding a match, the system creates a new user profile in the Firestore `/users` collection, populating it with their Google account details (Name, Email, Profile Picture) and granting them full access immediately.

---

### Method C: User-Initiated Access Request (Reactive Flow)

This flow handles "walk-up" attempts, where a user who has not been invited tries to access the application.

**Step 1: New User Signs In**
A new, uninvited user navigates to the application URL and clicks "Sign in with Google."

**Step 2: System Creates a "Pending" Profile**
Firebase authenticates the user. The application checks Firestore, finds no existing user, and creates a new user document. **Crucially, it sets the `accountType` to `'Viewer'`, which restricts all access.**

**Step 3: Administrator Notification**
*   **In-App:** A notification appears in the administrator's notification list, stating that a new user has requested access.
*   **Via Email (Recommended Backend):** A **Cloud Function** (a backend process) is automatically triggered. This function sends an email to all system administrators, alerting them of the new request and providing a direct link to the approval page.

**Step 4: Administrator Action**
The administrator reviews the request in the in-app notification list. They have two options:
*   **Approve:** The administrator clicks "Approve." The system updates the user's `accountType` in Firestore from `'Viewer'` to `'Full'`.
*   **Reject:** The administrator clicks "Reject." The system deletes the user's document from Firestore and revokes their authentication token.

**Step 5: Access Granted or Denied**
The user will be granted full access the next time they refresh the application (if approved) or will be unable to log in (if rejected).

---

## 2. Data Storage: The User Profile

All information related to a user's application experience is stored in a dedicated `/users` collection within the Firestore database. Each user has a single document, identified by their unique Firebase ID.

| Data Point | Purpose in the Application |
| :--- | :--- |
| `userId` | The unique, non-changing ID that links the user's login identity to their profile. |
| `displayName` | The user's full name, displayed throughout the application (e.g., in team lists, event assignments). |
| `email` | The user's email address, used for identification and notifications. |
| `avatarUrl` | A direct link to the user's profile picture, shown in the sidebar, team lists, and user menus. |
| `isAdmin` | A simple `true` or `false` flag that determines if the user has access to administrative pages and features. |
| `accountType` | Defines the user's access level. `Viewer` is a pending state. `Full` has access. |
| `googleCalendarLinked` | A `true` or `false` flag indicating if the user has successfully linked their Google Calendar. |
| `title` | The user's professional title (e.g., "Video Editor"), displayed under their name. |
| `roles` | A list of Badge IDs assigned to the user, defining their skills or responsibilities. |
| `memberOfTeamIds` | A list of Team IDs the user belongs to. This is crucial for controlling access to team-specific pages. |
| `theme` | A UI preference for the app's color scheme (`light` or `dark`). |
| `primaryColor` | A user-selected color that overrides the theme's default accent color. |
| `defaultCalendarView`| The user's preferred view (Month, Week, Day, etc.) that the calendar will load by default. |
| `easyBooking` | A `true` or `false` flag for enabling the "click-to-create-event" feature on the calendar. |
| `timeFormat` | A UI preference for displaying time in 12-hour or 24-hour format. |
| `linked...Ids` | Lists of IDs for shared Teams, Badge Collections, or Calendars that the user has chosen to link to their personal management boards. |
| `dragActivationKey`| The keyboard key (`Shift`, `Alt`, etc.) the user must hold down to perform drag-and-drop actions. |
| `createdAt` | The timestamp of when the user's account was first created in the system. |
| `approvedBy` | The `userId` of the administrator who approved the user's account request, or 'system' for the first user. |

---

## 3. Data Origin: Google vs. Application Defaults

When a new user signs in for the first time, their profile is created from a mix of data from Google and default values set by the application.

| Data Point | Origin |
| :--- | :--- |
| `userId` | **Google:** The unique ID from Firebase Authentication. |
| `displayName` | **Google:** The user's full name from their Google profile. |
| `email` | **Google:** The user's primary email address from their Google profile. |
| `avatarUrl` | **Google:** The URL of their Google profile picture. |
| --- | --- |
| `isAdmin` | **Application:** Defaults to `true` if the user is the first one in the database, otherwise `false`. |
| `accountType` | **Application:** Defaults to `Viewer` for user-initiated requests, `Full` for invited users, or `Full` for the first user. |
| `googleCalendarLinked`| **Application:** Defaults to `true` upon first Google Sign-in. |
| `title` | **Application:** This is empty by default and must be set by an admin or the user. |
| `roles` | **Application:** This is empty by default. Roles are assigned within the app. |
| `memberOfTeamIds` | **Application:** This is empty by default. Users are added to teams within the app. |
| `theme` | **Application:** Defaults to `light`. |
| `primaryColor` | **Application:** Is not set by default. |
| `defaultCalendarView`| **Application:** Defaults to `day`. |
| `easyBooking` | **Application:** Is not set by default. |
| `timeFormat` | **Application:** Is not set by default. |
| `linked...Ids` | **Application:** All are empty by default. |
| `dragActivationKey`| **Application:** Defaults to `shift`. |
| `createdAt` | **Application:** Set to the current timestamp on creation. |
| `approvedBy` | **Application:** Set to 'system' for the first user, or the admin's `userId` upon approval. |

---

## 4. Security and Best Practices

This authentication system is significantly more secure and robust than the previous mock-data system for several key reasons:

*   **No Password Handling:** The most critical improvement is that our application **never handles or stores user passwords**. The entire sign-in process is delegated to Google and Firebase, which are built to handle this securely.
*   **Trusted Identity Provider:** By using Google Sign-In, we are leveraging a globally trusted identity provider. Users can sign in with an account they already know and trust.
*   **Centralized, Controlled Access**: The approval workflow ensures that only authorized individuals can access the workspace, preventing unauthorized sign-ups.
*   **Secure Session Management:** Firebase's `onAuthStateChanged` listener securely manages the user's session. It uses industry-standard tokens, which are automatically refreshed and secured, protecting against unauthorized access.
*   **Centralized Authentication Logic:** All authentication logic is now centralized within the `user-context.tsx` file and uses the official Firebase SDK. This reduces complexity and eliminates the risk of inconsistent or insecure implementations elsewhere in the app.
*   **Single Source of Truth:** Using Firebase Auth as the single source of truth for a user's identity prevents the creation of duplicate accounts, which was a key issue with the previous system.
