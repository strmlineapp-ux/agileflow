

# AgileFlow: Data Documentation

This document provides a detailed breakdown of the data structures, entities, and their relationships within the AgileFlow application. The data architecture is designed for a **Firestore (NoSQL) database environment**, which influences how data is structured and related. It serves as a technical reference for understanding how data flows through the system and interacts with internal and external services.

## User Entity
**Firestore Collection**: `/users/{userId}`

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
| `theme?: 'light' \| 'dark'` | **Internal.** A UI preference for the app's color scheme. |
| `primaryColor?: string` | **Internal.** A user-selected hex color code that overrides the default primary color of their chosen theme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### Dynamic Access Control for Pages & Tabs

Access to every page and tab in the application is controlled by a dynamic ruleset. This allows for granular permission management without changing the application's code.

**How It Works:**

1.  **The `access` Object**: Every `AppPage` and `AppTab` object can have an optional `access` property. If this property is not defined or all of its arrays are empty, the item is considered **public** and is visible to all logged-in users.

2.  **The `hasAccess` Function**: A central function, `hasAccess`, located in `/src/lib/permissions.ts`, evaluates these rules for the currently logged-in user.

3.  **The Rules**: Access is granted if **any** of the following conditions are met:
    *   The user is a system administrator (`user.isAdmin === true`).
    *   The user's ID is explicitly listed in the item's `access.users` array.
    *   The user is a member of any team whose ID is in the item's `access.teams` array.
    *   The user has a role (from an `AdminGroup`) that is listed in the item's `access.adminGroups` array.

**Example Configurations (`mock-data.ts`):**

```typescript
// Example of a page restricted to a team
{
  id: 'page-tasks',
  name: 'Tasks',
  // ... other properties
  access: {
    users: [],
    teams: ['live-events'], // ONLY members of the "Live Events" team can see this
    adminGroups: []
  }
}

// Example of a restricted tab
{
  id: 'tab-calendars',
  name: 'Manage Calendars',
  // ... other properties
  access: {
    users: [], // No specific users
    teams: [], // Not restricted by team
    adminGroups: ['Service Delivery'], // ONLY users with the "Service Delivery" role can see this
  }
}
```

**Independent Permissions:**

It is important to note that access to a page **does not** automatically grant access to its associated tabs. The `hasAccess` function is run independently for the page and for each of its tabs. This allows you to have a page visible to a wide audience, but with certain tabs on that page restricted to a smaller group.

### Implicit Ownership of Created Items

When a user creates a new shareable item (like a **Team** or **Badge Collection**), the application automatically assigns ownership based on how the user gained access to the creation page. This creates a clear and logical hierarchy for who manages these items.

**Ownership Hierarchy:**

1.  **Admin Group (Highest Priority)**: If the user's access to the page is granted through an `AdminGroup`, the new item will be owned by that group. This is true even if the user also has access via a team or direct user assignment.
2.  **Team**: If the user's access is *not* from an Admin Group but *is* from their membership in a `Team`, the new item will be owned by that team.
3.  **User (Default)**: If the user's access is only granted via their specific `userId` (or if they are an admin creating an item on a public page), the new item will be owned by them personally.

The `getOwnershipContext` function in `/src/lib/permissions.ts` contains the logic for this rule. This system ensures that items created in a team context belong to the team, and items created in a global administrative context belong to the relevant admin group.

## Shared Calendar Entity
**Firestore Collection**: `/calendars/{calendarId}`

This entity represents an internal AgileFlow calendar. It acts as a logical container for events within the application and can be linked to a real, external Google Calendar for future synchronization. These are managed on the **Service Delivery** page.

| Data Point | Description & Link to Services |
| :--- | :--- |
| `id: string` | **Internal.** A unique identifier for the AgileFlow calendar. |
| `name: string` | **Internal.** The display name for the calendar within the application. |
| `icon: string` | **Internal.** The Google Symbol name for the calendar's icon. |
| `color: string` | **Internal.** The hex color code used for this calendar's events in the UI. |
| `googleCalendarId?: string` | **External (Google Calendar).** The unique ID of the Google Calendar that this internal calendar is linked to. This ID can be found in the settings of a shared Google Calendar and typically looks like an email address (e.g., `your-calendar-id@group.calendar.google.com`). This is the key for enabling event synchronization. |
| `managers?: string[]` | **Internal.** An array of `userId`s for users who can manage this calendar's events and settings. |
| `defaultEventTitle?: string` | **Internal.** A placeholder string for the title of new events created on this calendar. |
| `roleAssignmentsLabel?: string` | **Internal.** A custom label for the "Role Assignments" section in the event details view. |


## Application-Wide Settings
**Firestore Document**: `/app-settings/global` (A singleton document)

This entity, `AppSettings`, holds global configuration data that allows for customization of the application's terminology and appearance without altering the core codebase. These settings are managed on the **Admin Management** and **Service Delivery** pages.

### AppSettings Data

| Data Point | Description |
| :--- | :--- |
| `adminGroups: AdminGroup[]` | An array of objects defining custom administrative groups. This allows admins to create a hierarchy between the system `Admin` and standard users. Each group has a name, icon, and color, which are editable on the Admin Management page. |
| `pages: AppPage[]` | **The core of the dynamic navigation.** This is an array of objects defining every page in the application. The order of pages in this array directly corresponds to their order in the sidebar navigation. The order is managed on the **Admin Management** page using the "Draggable Card Management" UI pattern. Each page object includes its name, icon, URL path, access control rules, and a list of associated `tab.id`s that should be rendered on it. |
| `tabs: AppTab[]` | **The core of the dynamic content.** This is an array of objects defining all reusable content tabs. Each object includes the tab's name, icon, a `componentKey` that maps it to a React component, and its own `access` rules. |
| `globalBadges: Badge[]` | An array of globally-defined badges. These are typically owned by an **Admin Group** and are managed on the **Service Delivery > Badges** tab. |
| `calendarManagementLabel?: string` | An alias for the "Manage Calendars" tab on the Service Delivery page. |
| `teamManagementLabel?: string` | An alias for the "Team Management" tab on the Service Delivery page. |
| `strategyLabel?: string` | An alias for the "Strategy" tab on the Service Delivery page. |

### AppTab Entity
A sub-entity of `AppSettings`, `AppTab` defines a single, reusable content block.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the tab. |
| `name: string` | The display name for the tab. |
| `icon: string` | The Google Symbol name for the tab's icon. |
| `color: string` | The hex color for the tab's icon. |
| `description?: string` | An optional description for the tab, often used for tooltips. |
| `componentKey: string` | A key that maps this tab to a specific React component to render its content. |
| `access?: AccessControl` | **Optional.** An object containing arrays of `userId`s, `teamId`s, and `adminGroup` names that can view this tab. If omitted, access is considered public or inherited from the page. |

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
**Firestore Collection**: `/teams/{teamId}`

The `Team` entity groups users together and defines a set of team-specific configurations, most notably their functional **Badges**.

### Team Data

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the team. |
| `name: string` | The display name of the team. |
| `icon: string` | The Google Symbol name for the team's icon. |
| `color: string` | The hex color for the team's icon. |
| `owner: { type: 'team', id: string } \| { type: 'admin_group', name: string } \| { type: 'user', id: string }` | An object that defines who owns the team. Ownership dictates who can edit the team's properties. |
| `isShared?: boolean` | **Internal.** If `true`, this team will be visible to other teams in the application for discovery and linking. |
| `members: string[]` | An array of `userId`s for all members of the team. |
| `teamAdmins?: string[]` | A subset of `members` who have administrative privileges for this team. |
| `teamAdminsLabel?: string` | A custom label for the Team Admins list on the Team Members tab. |
| `membersLabel?: string` | A custom label for the Members list on the Team Members tab. |
| `allBadges: Badge[]` | The single source of truth for all `Badge` objects **owned** by this team. |
| `badgeCollections: BadgeCollection[]` | An array of `BadgeCollection` objects. This includes collections *owned* by the team, and *links* to collections owned by other teams. |
| `userBadgesLabel?: string` | A custom label for the "Team Badges" section on the Team Members tab. |

### BadgeCollection Entity
A sub-entity of `Team`, this groups related Badges together. It can be owned by the team or shared with others.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the collection. |
| `owner: { type: 'team', id: string } \| { type: 'admin_group', name: string } \| { type: 'user', id: string }` | An object that defines who owns the collection. This can be a team, an administrative group, or an individual user. Ownership dictates who can edit the collection's properties and the original badges within it. |
| `isShared?: boolean` | **Internal.** If `true`, this collection and its badges will be visible to all other teams in the application for discovery and linking. |
| `name: string` | The name of the collection (e.g., "Skills"). |
| `icon: string` | The Google Symbol name for the collection's icon. |
| `color: string` | The hex color for the collection's icon. |
| `badgeIds: string[]` | An array of `badgeId`s belonging to this collection. This can include badges owned by this team or linked from other shared collections. |
| `applications?: BadgeApplication[]` | Defines where badges from this collection can be applied (e.g., 'Team Members', 'Events'). For linked collections, this is a local override; changing it does not affect the original shared collection. |
| `viewMode: 'assorted' \| 'detailed' \| 'list'` | **Internal.** A UI preference for how to display the badges within this collection. |
| `description?: string` | An optional description for the collection. |


### Badge Entity
This represents a specific, functional role or skill. The single source of truth for a badge is stored in either the `allBadges` array of its owner's `Team` object, or in the `globalBadges` array in `AppSettings` if owned by an Admin Group.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the badge. |
| `ownerCollectionId: string` | The `collectionId` of the badge's original, "source-of-truth" collection. |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
| `description?: string` | An optional description shown in tooltips. |


