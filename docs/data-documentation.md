# AgileFlow: Data Documentation

This document provides a detailed breakdown of the data structures, entities, and their relationships within the AgileFlow application. It serves as a technical reference for understanding how data flows through the system and interacts with internal and external services.

## User Entity

The `User` is the central entity in the AgileFlow application. A user's identity, roles, and preferences dictate their experience and permissions throughout the system.

### User Profile Data

This table details the information stored directly within each `User` object.

| Data Point | Description & Link to Services |
| :--- | :--- |
| `userId: string` | **Internal.** A unique identifier for each user. This is the primary key used to link a user to all other parts of the system. |
| `displayName: string` | **Google Service.** The user's full name. This is part of the basic profile information obtained during a standard "Sign in with Google" action and **does not require separate permissions**. |
| `email: string` | **Internal / Google Service.** The user's email address. This is the primary field used for login. The "Sign in with Google" button uses **Firebase Authentication** with the **Google Auth Provider** to verify this email. |
| `title?: string` | **Google Service.** The user's professional title. This is designed to be populated from the user's **Google Account profile** (from their organization details) **after the user grants the necessary permissions**. |
| `avatarUrl?: string` | **Google Service.** A URL to the user's profile picture. This is part of the basic profile information obtained during a standard "Sign in with Google" action and **does not require separate permissions**. |
| `phone?: string` | **Google Service.** The user's contact phone number. This is designed to be populated from the user's **Google Account profile** **after the user grants the necessary permissions**. |
| `location?: string` | **Google Service.** The user's primary work location. This is designed to be populated from the user's **Google Account profile** (from their address information) **after the user grants the necessary permissions**. |
| `googleCalendarLinked: boolean` | **Google Service.** A flag that is set to `true` only after the user successfully completes an OAuth consent flow via **Firebase Authentication** to grant the app permission to access their Google Calendar. |
| `roles?: string[]` | **Internal.** An array of role names assigned to the user, critical for determining permissions. See the **User Roles & Permissions** section below for a detailed breakdown. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `theme?: 'light' \| 'dark' \| ...` | **Internal.** A UI preference for the app's color scheme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### User Roles & Permissions

The `roles` array on the `User` object is a flat list of strings that dictates a user's permissions and capabilities. While it's a simple array, the roles within it fall into two distinct categories based on how they are used in the application:

1.  **System-Level Roles**
    *   **Description**: These are high-privilege roles that grant broad, application-wide permissions. They are checked directly in the code to control access to entire pages or administrative features.
    *   **Examples**: `Admin`, `Service Delivery Manager`.
    *   **Management**: These roles are not defined in any settings UI. They are assigned to users by an administrator, and their meaning is determined by the application's internal logic.

2.  **Team-Specific Roles**
    *   **Description**: These roles are defined within a specific `Team` and are used for contextual assignments, such as assigning a user to a specific function for an event (e.g., "Camera Operator"). They have associated metadata like an icon and color for display purposes.
    *   **Examples**: `Camera`, `Audio`, `Video Director`, `Post-Production`.
    *   **Management**: These roles are created and managed by Team Managers on the `Team Management` page.

### Associated Data & Relationships

This section describes how a `User`'s actions connect them to other data entities and external services.

| Action / Context | Component & Connection to Services |
| :--- | :--- |
| **Login** | The `LoginForm`'s "Sign in with Google" button triggers **Firebase Authentication**. This service handles the entire OAuth flow with Google, authenticating the user and providing the app with a secure token and basic profile information. |
| **Event Creation & Google Meet** | In the `EventForm`, the "Meet link" option calls the `createMeetLink` Genkit AI flow. In a production system, this flow would make an authenticated call to the **Google Calendar API** to create an event and generate a Google Meet URL. The prototype currently simulates this. |
| **Linking Google Calendar** | In `UserManagement`, clicking to connect a calendar initiates the `linkGoogleCalendar` function. This uses **Firebase Authentication** to specifically request the `calendar.readonly` scope from Google, which is required to read a user's calendar data. |
| **Team Membership** | A user is associated with a `Team` via the `members`, `managers`, and `locationCheckManagers` arrays within the `Team` object. |
| **Event Association** | A user is linked to an `Event` as its `createdBy`, as an `attendee`, or through `roleAssignments`. |
| **Task Association** | A user is linked to a `Task` as its `createdBy` or through the `assignedTo` array. |
| **Notification Source** | A user is the source of notifications generated by their actions (e.g., "Alice Johnson mentioned you..."). Admins receive system-level notifications like access requests. |
```