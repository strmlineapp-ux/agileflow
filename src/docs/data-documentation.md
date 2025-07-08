

# AgileFlow: Data Documentation

## Core Mission & Architectural Goals

This app's core mission is to create a concise, robust NoSQL database that takes full advantage of Firebase Studio and Firestore services. The architecture is explicitly designed to be optimized for future analytics, forecasting, and insights, even though these features are not yet implemented.

A primary goal is to work in consonance with Google Calendar. The application will manage calendars, events, tasks, and other Google Calendar related elements (with appropriate user permissions) and will add, create, and edit associated data for them.

User interaction is driven by a dynamic system of pages and tabs, governed by a simplified, context-aware permission system. The user interface defines how users will fetch, add, edit, or delete data from these Google Calendar elements, or create templates and rules for this associated data.

---

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
| `isAdmin: boolean` | **Internal.** A dedicated flag to indicate if a user has administrative privileges, granting them access to all settings and management pages. When a user is deleted, their owned teams are transferred to the next Team Admin or member. |
| `accountType: 'Full' \| 'Viewer'` | **Internal.** Defines the user's access level. `Viewer` accounts have limited, read-only access and are not required to link a Google Account. `Full` accounts have broader permissions and are typically linked to external services. A user who has not linked their Google Calendar is automatically considered a `Viewer`. |
| `title?: string` | **Google Service.** The user's professional title. This is designed to be populated from the user's **Google Account profile** (from their organization details) **after the user grants the necessary permissions**. |
| `avatarUrl?: string` | **Google Service.** A URL to the user's profile picture. This is part of the basic profile information obtained during a standard "Sign in with Google" action and **does not require separate permissions**. |
| `phone?: string` | **Google Service.** The user's contact phone number. This is designed to be populated from the user's **Google Account profile** **after the user grants the necessary permissions**. |
| `location?: string` | **Google Service.** The user's primary work location. This is designed to be populated from the user's **Google Account profile** (from their address information) **after the user grants the necessary permissions**. |
| `googleCalendarLinked: boolean` | **Google Service.** A flag that is set to `true` only after the user successfully completes an OAuth consent flow via **Firebase Authentication** to grant the app permission to access their Google Calendar. |
| `roles?: string[]` | **Internal.** An array of strings that includes the names of any `Badge`s a user has been assigned. The application determines the name's meaning and properties by looking it up in the relevant `Team` object. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `linkedTeamIds?: string[]` | **Internal.** An array of `teamId`s for teams that the user has linked to their board from the shared panel. This brings the team into their management scope without making them a member. |
| `theme?: 'light' \| 'dark'` | **Internal.** A UI preference for the app's color scheme. |
| `primaryColor?: string` | **Internal.** A user-selected hex color code that overrides the default primary color of their chosen theme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |

### Dynamic Access Control for Pages & Tabs

Access to every page and content tab in the application is controlled by a dynamic ruleset. The logic for this is primarily handled in `/src/lib/permissions.ts` and the page renderer at `/src/app/dashboard/[...page]/page.tsx`.

**How It Works:**

1.  **Page Access**: Access to a page is determined by the `access` object on its `AppPage` configuration. A user can view a page if they are a system admin, if the page has no rules (making it public), or if their `userId` or `Team` membership is listed in the corresponding access array.

2.  **Tab Access**: A tab's visibility is determined by its parent page. If you can see the page, you can see all of its tabs.

**Example Configurations (`mock-data.ts`):**

```typescript
// Example of a page restricted by team
{
  id: 'page-tasks',
  // ... other properties
  access: {
    users: [],
    teams: ['live-events'], // ONLY members of the "Live Events" team can see this
  }
}
```

### Simplified Ownership of Created Items

When a user creates a new shareable item (like a **Team** or **Badge Collection**), ownership is assigned directly to that user. This simplified model ensures that every item has a single, clear owner responsible for its management. The `getOwnershipContext` function in `/src/lib/permissions.ts` contains the logic for this rule.

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

This entity, `AppSettings`, holds global configuration data that allows for customization of the application's terminology and appearance without altering the core codebase. These settings are managed on the **Admin** and **Service Delivery** pages.

### AppSettings Data

| Data Point | Description |
| :--- | :--- |
| `pages: AppPage[]` | **The core of the dynamic navigation.** This is an array of objects defining every page in the application. The order of pages in this array directly corresponds to their order in the sidebar navigation. The order is managed on the **Admin** page using the "Draggable Card Management" UI pattern. Each page object includes its name, icon, URL path, access control rules, and a list of associated `tab.id`s that should be rendered on it. |
| `tabs: AppTab[]` | **The core of the dynamic content.** This is an array of objects defining all reusable content tabs. Each object includes the tab's name, icon, and a `componentKey` that maps it to a React component. |
| `globalBadges: Badge[]` | An array of globally-defined badges. These are managed on the **Service Delivery > Badges** tab. |
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


## Team Entity
**Firestore Collection**: `/teams/{teamId}`

The `Team` entity is a functional unit that groups users together for collaboration.

### Team Data

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the team. |
| `name: string` | The display name of the team. |
| `icon: string` | The Google Symbol name for the team's icon. |
| `color: string` | The hex color for the team's icon. |
| `owner: { type: 'user', id: string }` | An object that defines who owns the team. Ownership dictates who can edit the team's properties. |
| `isShared?: boolean` | **Internal.** If `true`, this team will be visible to other teams in the application for discovery and linking. |
| `members: string[]` | An array of `userId`s for all members of the team. |
| `teamAdmins?: string[]` | A subset of `members` who have administrative privileges for this team (e.g., can add/remove members). |
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
| `owner: { type: 'user', id: string }` | An object that defines who owns the collection. Ownership dictates who can edit the collection's properties and the original badges within it. |
| `isShared?: boolean` | **Internal.** If `true`, this collection and its badges will be visible to all other teams in the application for discovery and linking. |
| `name: string` | The name of the collection (e.g., "Skills"). |
| `icon: string` | The Google Symbol name for the collection's icon. |
| `color: string` | The hex color for the collection's icon. |
| `badgeIds: string[]` | An array of `badgeId`s belonging to this collection. This can include badges owned by this team or linked from other shared collections. |
| `applications?: BadgeApplication[]` | Defines where badges from this collection can be applied (e.g., 'Team Members', 'Events'). For linked collections, this is a local override; changing it does not affect the original shared collection. |
| `viewMode: 'assorted' \| 'detailed' \| 'list'` | **Internal.** A UI preference for how to display the badges within this collection. |
| `description?: string` | An optional description for the collection. |


### Badge Entity
This represents a specific, functional role or skill. The single source of truth for a badge is stored in either the `allBadges` array of its owner's `Team` object, or in the `globalBadges` array in `AppSettings` if it is a global badge.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the badge. |
| `ownerCollectionId: string` | The `collectionId` of the badge's original, "source-of-truth" collection. |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
| `description?: string` | An optional description shown in tooltips. |




    