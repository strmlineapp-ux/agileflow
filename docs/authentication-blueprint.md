# AgileFlow: Authentication Blueprint

This document provides a clear, non-technical overview of how user authentication is handled within the AgileFlow application.

---

## 1. Authentication Flow: The Sign-In Journey

The application uses Google Sign-In as its sole method of authentication, providing a secure and streamlined experience. Here is a step-by-step breakdown of what happens when a user signs in:

**Step 1: The User Clicks "Sign in with Google"**
On the login screen, the user initiates the process by clicking the "Sign in with Google" button.

**Step 2: The Google Sign-In Window**
The application immediately opens a secure pop-up window managed by Google. The user enters their Google account credentials (email and password) directly into Google's interface. **Crucially, the AgileFlow application never sees or handles the user's password.**

**Step 3: Firebase Authentication Verifies Identity**
Once the user successfully signs in with Google, Google's servers send a secure token back to the application. This token is passed to **Firebase Authentication**, a specialized Google service for managing user identities. Firebase verifies this token to confirm the user is who they say they are. This service acts as the application's secure gatekeeper.

**Step 4: Checking for an Existing User**
Firebase Authentication now recognizes the user and assigns them a unique, permanent User ID (UID). The application then uses this UID to check the **Firestore Database**, which is where application-specific data is stored.

*   **If it's a returning user:** The system finds their existing profile document in the `/users` collection in Firestore and loads their specific data and preferences (like their professional title, assigned roles, and theme choice).
*   **If it's a new user:** The system does not find an existing profile. It proceeds to create one.

**Step 5: Creating a New User Profile (First-Time Sign-In Only)**
For a new user, the application creates a new document in the `/users` collection in Firestore. It populates this new profile with:
*   Basic information from their Google account (Full Name, Email, Profile Picture).
*   A set of default application settings (e.g., a standard 'light' theme, a default calendar view).

**Step 6: Loading the Application**
With the user's identity confirmed by Firebase Authentication and their profile data loaded from Firestore, the application is now fully loaded and customized for that specific user. The user's session is securely managed by Firebase, keeping them logged in until they explicitly sign out.

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
| `accountType` | Defines the user's access level. Currently defaults to 'Full'. |
| `googleCalendarLinked` | A `true` or `false` flag indicating if the user has successfully linked their Google Calendar. |
| `title` | The user's professional title (e.g., "Video Editor"), displayed under their name. |
| `roles` | A list of Badge IDs assigned to the user, defining their skills or responsibilities. |
| `memberOfTeamIds` | A list of Team IDs the user belongs to. This is crucial for controlling access to team-specific pages. |
| `theme` | A UI preference for the app's color scheme (`light` or `dark`). |
| `primaryColor` | A user-selected color that overrides the theme's default accent color. |
| `defaultCalendarView` | The user's preferred view (Month, Week, Day, etc.) that the calendar will load by default. |
| `easyBooking` | A `true` or `false` flag for enabling the "click-to-create-event" feature on the calendar. |
| `timeFormat` | A UI preference for displaying time in 12-hour or 24-hour format. |
| `linked...Ids` | Lists of IDs for shared Teams, Badge Collections, or Calendars that the user has chosen to link to their personal management boards. |
| `dragActivationKey` | The keyboard key (`Shift`, `Alt`, etc.) the user must hold down to perform drag-and-drop actions. |

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
| `isAdmin` | **Application:** Defaults to `false` for all new users. |
| `accountType` | **Application:** Defaults to `Full`. |
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

---

## 4. Security and Best Practices

This new authentication system is significantly more secure and robust than the previous mock-data system for several key reasons:

*   **No Password Handling:** The most critical improvement is that our application **never handles or stores user passwords**. The entire sign-in process is delegated to Google and Firebase, which are built to handle this securely.
*   **Trusted Identity Provider:** By using Google Sign-In, we are leveraging a globally trusted identity provider. Users can sign in with an account they already know and trust.
*   **Secure Session Management:** Firebase's `onAuthStateChanged` listener securely manages the user's session. It uses industry-standard tokens, which are automatically refreshed and secured, protecting against unauthorized access.
*   **Centralized Authentication Logic:** All authentication logic is now centralized within the `user-context.tsx` file and uses the official Firebase SDK. This reduces complexity and eliminates the risk of inconsistent or insecure implementations elsewhere in the app.
*   **Single Source of Truth:** Using Firebase Auth as the single source of truth for a user's identity prevents the creation of duplicate accounts, which was a key issue with the previous system.