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
| `roles?: string[]` | **Internal.** An array of strings that includes the names of any `AdminGroup`s the user belongs to and any `Badge`s they have been assigned. The application determines the name's meaning and properties by looking it up in `AppSettings` or the relevant `Team` object. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `theme?: 'light' \| 'dark' \| ...` | **Internal.** A UI preference for the app's color scheme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### Roles & Badges

The application uses a combination of the `isAdmin` flag and the `roles` array to dictate a user's permissions and capabilities. There are two main categories:

1.  **Admin Groups & Roles**
    *   **Description**: These are high-privilege groups that grant broad, application-wide permissions. They are checked directly in the code to control access to entire pages or administrative features.
    *   **Types**:
        *   **Admin**: The highest-level role, controlled by the `isAdmin` boolean flag on the `User` object. It grants universal access.
        *   **Admin Groups** (e.g., "Service Admin"): These groups are defined as `AdminGroup` objects within `AppSettings`. They allow for a granular hierarchy of permissions between the main `Admin` and standard users.
    *   **Management**: The `Admin` status is managed on the **Admin Management** page. Custom Admin Groups are also created, ordered, and assigned to users on this page. Assigning a user to one of these groups adds the group's `name` to the user's `roles` array.

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
| **Access to Pages** (e.g., `/admin`) | **Storage:** Page access is now entirely dynamic and is configured within each `AppPage` object inside `AppSettings.pages`. Each page has an `access` object containing arrays of `userId`s, `teamId`s, and `adminGroup` names that are allowed to view it.<br>**Usage:** A central permission checker (`hasAccess`) evaluates these rules against the current user's properties (`userId`, team memberships, `roles` array). This determines if a page is rendered in the sidebar and if a user can access its URL directly. An empty `access` object makes a page public to all logged-in users. |
| **Interaction Permissions** (e.g., editing an event, managing a team) | **Storage:** This is also **not stored directly**. Permissions are derived by combining user roles with the context of a specific data item.<br>**Usage:** The application uses helper functions (like `canManageEventOnCalendar`) that check if a user's `userId` is in a `Team`'s `teamAdmins` list or if the user has a system-level role like `Admin`. This determines whether UI elements like "Edit" buttons are displayed. |

## Application-Wide Settings

This entity, `AppSettings`, holds global configuration data that allows for customization of the application's terminology and appearance without altering the core codebase. These settings are managed on the **Admin Management** and **Service Delivery** pages.

### AppSettings Data

| Data Point | Description |
| :--- | :--- |
| `adminGroups: AdminGroup[]` | An array of objects defining custom administrative groups. This allows admins to create a hierarchy between the system `Admin` and standard users. Each group has a name, icon, and color, which are editable on the Admin Management page. |
| `pages: AppPage[]` | **The core of the dynamic navigation.** This is an array of objects defining every page in the application. Each object includes the page's name, icon, URL path, access control rules, and a list of associated `tab.id`s that should be rendered on it. |
| `tabs: AppTab[]` | **The core of the dynamic content.** This is an array of objects defining all reusable content tabs. Each object includes the tab's name, icon, and a `componentKey` that maps it to a specific React component to render its content. |
| `calendarManagementLabel?: string` | An alias for the "Manage Calendars" tab on the Service Delivery page. |
| `teamManagementLabel?: string` | An alias for the "Team Management" tab on the Service Delivery page. |

### AdminGroup Entity
A sub-entity of `AppSettings`, `AdminGroup` defines a single, dynamic administrative level.

| Data Point | Description |
| :--- | :--- |
| `id: string` | **Internal.** A unique identifier for the custom group. |
| `name: string` | **Internal.** The display name for the group (e.g., "Service Admin", "Service Admin+"). This is editable inline on the Admin Management page. |
| `icon: string` | **Internal.** The Google Symbol name for the icon associated with the group. |
| `color: string` | **Internal.** The hex color code for the icon's badge. |
| `groupAdmins?: string[]` | **Internal.** An array of `userId`s for users who have been designated as an "Admin" for this specific group, granting them elevated permissions for pages associated with this group. |

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
| `allBadges: Badge[]` | The single source of truth for all `Badge` objects **owned** by this team. |
| `badgeCollections: BadgeCollection[]` | An array of collections, which group the team's badges. |
| `sharedTeamIds?: string[]` | An array of `teamId`s for other teams that this team shares resources with. |
| `sharedCollectionIds?: string[]` | An array of `collectionId`s for Badge Collections that are shared *into* this team from another team. |

### BadgeCollection Entity
A sub-entity of `Team`, this groups related Badges together. It can be owned by the team or shared from another.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the collection. |
| `ownerTeamId: string` | The `teamId` of the team that owns the source of truth for this collection. |
| `name: string` | The name of the collection (e.g., "Skills"). |
| `icon: string` | The Google Symbol name for the collection's icon. |
| `color: string` | The hex color for the collection's icon. |
| `badgeIds: string[]` | An array of `badgeId`s belonging to this collection. This can include badges owned by this team or linked from other shared collections. |
| `applications?: BadgeApplication[]` | Defines where badges from this collection can be applied (e.g., 'users', 'events'). |

### Badge Entity
This represents a specific, functional role or skill within a team. The single source of truth for a badge is stored in the `allBadges` array of its owner's `Team` object.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the badge. |
| `ownerCollectionId: string` | The `collectionId` of the badge's original, "source-of-truth" collection. |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
| `description?: string` | An optional description shown in tooltips. |
