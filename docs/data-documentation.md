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
| `isAdmin: boolean` | **Internal.** A dedicated flag to indicate if a user has administrative privileges, granting them access to all settings and management pages. |
| `accountType: 'Full' \| 'Viewer'` | **Internal.** Defines the user's access level. `Viewer` accounts have limited, read-only access and are not required to link a Google Account. `Full` accounts have broader permissions and are typically linked to external services. A user who has not linked their Google Calendar is automatically considered a `Viewer`. |
| `title?: string` | **Google Service.** The user's professional title. This is designed to be populated from the user's **Google Account profile** (from their organization details) **after the user grants the necessary permissions**. |
| `avatarUrl?: string` | **Google Service.** A URL to the user's profile picture. This is part of the basic profile information obtained during a standard "Sign in with Google" action and **does not require separate permissions**. |
| `phone?: string` | **Google Service.** The user's contact phone number. This is designed to be populated from the user's **Google Account profile** **after the user grants the necessary permissions**. |
| `location?: string` | **Google Service.** The user's primary work location. This is designed to be populated from the user's **Google Account profile** (from their address information) **after the user grants the necessary permissions**. |
| `googleCalendarLinked: boolean` | **Google Service.** A flag that is set to `true` only after the user successfully completes an OAuth consent flow via **Firebase Authentication** to grant the app permission to access their Google Calendar. |
| `roles?: string[]` | **Internal.** An array of team-specific role names assigned to the user (e.g., `Camera`, `Audio`). This is critical for contextual assignments. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `theme?: 'light' \| 'dark' \| ...` | **Internal.** A UI preference for the app's color scheme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### User Roles & Permissions

The application uses a combination of the `isAdmin` flag and the `roles` array to dictate a user's permissions and capabilities:

1.  **System-Level Roles**
    *   **Description**: These are high-privilege roles that grant broad, application-wide permissions. They are checked directly in the code to control access to entire pages or administrative features.
    *   **Examples**: `Admin` (via the `isAdmin` flag), `Service Admin`.
    *   **Management**: The `Admin` status is managed on the Admin page. Other system-level roles are assigned to users by an administrator, and their meaning is determined by the application's internal logic.

2.  **Team-Specific Roles**
    *   **Description**: These roles are defined within a specific `Team` and are used for contextual assignments, such as assigning a user to a specific function for an event (e.g., "Camera Operator"). They have associated metadata like an icon and color for display purposes.
    *   **Examples**: `Camera`, `Audio`, `Video Director`, `Post-Production`.
    *   **Management**: These roles are created and managed by Team Admins on the `Team Management` page.

### Associated Data & Relationships

This section describes how a `User`'s actions connect them to other data entities and external services.

| Action / Context | Component & Connection to Services |
| :--- | :--- |
| **Login** | The `LoginForm`'s "Sign in with Google" button triggers **Firebase Authentication**. This service handles the entire OAuth flow with Google, authenticating the user and providing a secure token and basic profile information. |
| **Event Creation & Google Meet** | In the `EventForm`, the "Meet link" option calls the `createMeetLink` Genkit AI flow. In a production system, this flow would make an authenticated call to the **Google Calendar API** to create an event and generate a Google Meet URL. The prototype currently simulates this. |
| **Linking Google Calendar** | In `UserManagement`, clicking to connect a calendar initiates the `linkGoogleCalendar` function. This uses **Firebase Authentication** to specifically request the `calendar.readonly` scope from Google, which is required to read a user's calendar data. |
| **Team Membership** | A user is associated with a `Team` via the `members`, `teamAdmins`, and `locationCheckManagers` arrays within the `Team` object. |
| **Event Association** | A user is linked to an `Event` as its `createdBy`, as an `attendee`, or through `roleAssignments`. |
| **Task Association** | A user is linked to a `Task` as its `createdBy` or through the `assignedTo` array. |
| **Notification Source** | A user is the source of notifications generated by their actions (e.g., "Alice Johnson mentioned you..."). Admins receive system-level notifications like access requests. |

### Implicit Permissions & Contextual Data

Not all user capabilities are stored directly as a field on the `User` object. Many permissions and statuses are determined contextually or are managed in other parts of the application's state.

| Capability | Where Data is Stored & How It's Used |
| :--- | :--- |
| **Absence Statuses** (e.g., `PTO`, `Sick`) | **Storage:** This data is **not stored on the `User` object**. It is managed in the `userStatusAssignments` state within the `UserContext`, which is a dictionary keyed by date (`YYYY-MM-DD`).<br>**Usage:** The `ProductionScheduleView` allows authorized managers to assign these statuses to users for specific days. The calendar then uses this data to visually indicate a user's availability. |
| **Access to Pages** (e.g., `/admin`) | **Storage:** This is **not stored directly as data**. Access control is handled directly in the UI components.<br>**Usage:** Components like the `Sidebar` and the page layouts contain logic that checks the current user's `isAdmin` flag or `roles` array (e.g., `user.isAdmin`). If the required role is not present, the link or the entire page is not rendered. |
| **Interaction Permissions** (e.g., editing an event, managing a team) | **Storage:** This is also **not stored directly**. Permissions are derived by combining user roles with the context of a specific data item.<br>**Usage:** The application uses helper functions (like `canManageEventOnCalendar`) that check if a user's `userId` is in a `Team`'s `teamAdmins` list or if the user has a system-level role like `Admin`. This determines whether UI elements like "Edit" buttons are displayed. |

## Application-Wide Settings

This entity, `AppSettings`, holds global configuration data that allows for customization of the application's terminology and appearance without altering the core codebase. These settings are managed on the **Admin Management** and **Service Delivery** pages.

### AppSettings Data

| Data Point | Description & Link to Services |
| :--- | :--- |
| `customAdminRoles: CustomAdminRole[]` | **Internal.** An array of objects defining custom administrative roles. This allows admins to create a hierarchy of roles between the system `Admin` and standard users. Each role has a name, icon, and color, which are editable on the Admin Management page. |
| `calendarManagementLabel?: string` | **Internal.** An alias for the "Calendar Management" tab on the Service Delivery page. |
| `teamManagementLabel?: string` | **Internal.** An alias for the "Team Management" tab on the Service Delivery page. |
| `strategyLabel?: string` | **Internal.** An alias for the "Strategy" tab on the Service Delivery page. |

### CustomAdminRole Entity
A sub-entity of `AppSettings`, `CustomAdminRole` defines a single, dynamic administrative level.

| Data Point | Description |
| :--- | :--- |
| `id: string` | **Internal.** A unique identifier for the custom role. |
| `name: string` | **Internal.** The display name for the role (e.g., "Service Admin", "Service Admin+"). This is editable inline on the Admin Management page. |
| `icon: string` | **Internal.** The Google Symbol name for the icon associated with the role. |
| `color: string` | **Internal.** The hex color code for the icon's badge. |
```