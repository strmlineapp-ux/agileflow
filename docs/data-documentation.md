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
| `roles?: string[]` | **Internal.** An array of role name strings. This is a flat list that includes both System-Level roles (e.g., "Service Admin") and team-specific Badges (e.g., "Camera"). The application determines the role's meaning and properties by looking it up in `AppSettings` or the relevant `Team` object. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `theme?: 'light' \| 'dark' \| ...` | **Internal.** A UI preference for the app's color scheme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### Roles & Badges

The application uses a combination of the `isAdmin` flag and the `roles` array to dictate a user's permissions and capabilities. There are two main categories:

1.  **System-Level Roles**
    *   **Description**: These are high-privilege roles that grant broad, application-wide permissions. They are checked directly in the code to control access to entire pages or administrative features.
    *   **Types**:
        *   **Admin**: The highest-level role, controlled by the `isAdmin` boolean flag on the `User` object. It grants universal access.
        *   **Custom Admin Roles** (e.g., "Service Admin"): These roles are defined as `CustomAdminRole` objects within `AppSettings`. They allow for a granular hierarchy of permissions between the main `Admin` and standard users.
    *   **Management**: The `Admin` status is managed on the **Admin Management** page. Custom Admin Roles are also created, ordered, and assigned to users on this page. Assigning a user to one of these roles adds the role's `name` to the user's `roles` array.

2.  **Badges (Team-Specific)**
    *   **Description**: These are functional roles (now called "Badges") defined within a specific `Team` and are used for contextual assignments, such as assigning a "Camera Operator" to a specific event. They are grouped into **Badge Collections**.
    *   **Properties**: Each `Badge` has an associated `name`, `icon`, and `color` for display purposes.
    *   **Management**: These are created and managed by Team Admins on the specific `Team Management` page for each team, under the "Badges" tab. Assigning a badge to a user adds the badge's `name` to their `user.roles` array.

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
| `linkGroups: Record<string, LinkGroup>` | **Internal.** A dictionary that stores the shared properties (icon and color) for linked `CustomAdminRole` entities. The key is the `linkGroupId`. |
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
| `linkGroupId?: string` | **Internal.** An identifier used to group multiple `CustomAdminRole` entities at the same hierarchical level. If present, it points to a key in `AppSettings.linkGroups`. |
| `teamAdmins?: string[]` | **Internal.** An array of `userId`s for users who have been designated as a "Team Admin" for this specific role level. This is managed on the Admin Management page. |

## Team Entity

The `Team` entity groups users together and defines a set of team-specific configurations, most notably their functional **Badges**.

### Team Data

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the team. |
| `name: string` | The display name of the team. |
| `icon: string` | The Google Symbol name for the team's icon. |
| `members: string[]` | An array of `userId`s for all members of the team. |
| `teamAdmins: string[]` | A subset of `members` who have administrative privileges for this team. |
| `badgeCollections: BadgeCollection[]` | An array of collections, which group the team's functional **Badges**. For now, there is one collection per team: "Skills". |

### BadgeCollection Entity
A sub-entity of `Team`, this groups related Badges together.

| Data Point | Description |
| :--- | :--- |
| `name: string` | The name of the collection (e.g., "Skills"). |
| `badges: Badge[]` | An array of `Badge` objects belonging to this collection. |

### Badge Entity
This represents a specific, functional role or skill within a team.

| Data Point | Description |
| :--- | :--- |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
