

# AgileFlow: Data Documentation

This document provides a detailed breakdown of the data structures, entities, and their relationships within the AgileFlow application. It serves as a technical reference for understanding how data flows through the system and interacts with internal and external services.

## Multi-Tenant Architecture

AgileFlow is designed as a multi-tenant application, where each company or organization (a "tenant") operates within its own completely isolated Firebase project. This ensures the highest level of data privacy, security, and scalability.

### Tenant Identification & Configuration

1.  **Tenant ID**: Each tenant is identified by a unique ID, which typically corresponds to a subdomain (e.g., `tenant-a.agileflow.app`).
2.  **Dynamic Configuration**: The application uses a dynamic lookup mechanism (simulated in `/src/lib/firebase.ts`) to fetch the specific Firebase configuration for the tenant making a request.
3.  **Data Isolation**: Because each tenant has a unique `projectId`, all their data—including Firestore documents, Storage files, and authenticated users—resides in a separate, dedicated Google Cloud project. There is no possibility of data crossover between tenants.

### Tenant Onboarding & Provisioning

**Important Security Note:** The process of creating a new tenant and configuring their Firebase project is a privileged, administrative action. **A UI should NOT be created for tenants to enter their own Firebase details**, as this would be a significant security risk.

The correct, secure workflow is as follows:
1.  **Admin Provisioning**: When a new tenant signs up, a system administrator for AgileFlow uses secure, backend scripts (e.g., Google Cloud SDK) to create a new, dedicated Firebase project for that tenant.
2.  **Secure Key Management**: The configuration keys for this new project are then securely added to the application's central tenant configuration store (currently simulated in `firebase.ts`, but would be a secure database in production).
3.  **Tenant Access**: The tenant is then given their unique subdomain (e.g., `new-company.agileflow.app`) to access their isolated environment. They never handle API keys directly.

#### Implementation & Development Strategy

It's recommended to **postpone the implementation of a tenant management UI and the automated provisioning script** for a later development stage. This approach allows the team to focus on building the core application features that deliver immediate value to the first users. The current architecture, with a simulated tenant lookup in `firebase.ts`, provides a robust foundation for development and can be easily transitioned to a fully automated system when the application is ready to scale.

When the time is right, the automated script would use the Google Cloud SDK to programmatically create and configure new Firebase projects, and a secure internal admin panel would be built to manage the tenant configurations in the master database.

### Tenant Parameters & Independence

Each tenant's configuration consists of a standard set of Firebase project keys. It is essential that each tenant has its own unique set of these keys, as they point to their independent cloud resources.

| Parameter | Purpose & Importance for Isolation |
| :--- | :--- |
| `apiKey` | **API Key.** Authorizes requests to Firebase services for this specific project. |
| `authDomain` | **Authentication Domain.** The dedicated domain for Firebase Authentication actions (e.g., `tenant-a.firebaseapp.com`). |
| `projectId` | **Project ID.** The globally unique identifier for the tenant's Google Cloud project. **This is the most critical key for ensuring database and resource isolation.** |
| `storageBucket` | **Cloud Storage Bucket.** The unique bucket for storing files like user uploads or images. |
| `messagingSenderId` | **Sender ID.** Used for Firebase Cloud Messaging (push notifications). |
| `appId` | **App ID.** A unique identifier for the specific Firebase web app instance within the tenant's project. |

#### Database Location and Scaling
A major advantage of this architecture is that because each tenant has their own project, they have full control over their Firestore database:
*   **Location Independence**: Each tenant can choose the physical region (e.g., `us-central`, `europe-west`) for their database. This is crucial for performance and data residency compliance (like GDPR).
*   **Independent Scaling & Billing**: Each tenant is on their own billing plan with Google Cloud. They can independently scale their database usage up or down and are responsible for their own costs, without impacting any other tenant.

**Important Architectural Note:** Application pages are configured within the `AppSettings` object and are not hardcoded entities. Any references to them in documentation are purely as examples of how a dynamic page can be constructed. The codebase should not treat these pages as special or distinct from any other page an administrator might create.

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
| `location?: string` | **Google Service.** The user's primary work location. This is designed to be populated from the user's **Google Account profile** (from their address information) **after the user grants the necessary permissions**. |
| `googleCalendarLinked: boolean` | **Google Service.** A flag that is set to `true` only after the user successfully completes an OAuth consent flow via **Firebase Authentication** to grant the app permission to access their Google Calendar. |
| `roles?: string[]` | **Internal.** An array of strings that includes the names of any `Badge`s the user has been assigned. The application determines the name's meaning and properties by looking it up in the relevant `Team` object. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `theme?: 'light' \| 'dark'` | **Internal.** A UI preference for the app's color scheme. |
| `primaryColor?: string` | **Internal.** A user-selected hex color code that overrides the default primary color of their chosen theme. |
| `defaultCalendarView?: 'month' \| 'week' \| ...` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour format. |
| `linkedTeamIds?: string[]` | **Internal.** An array of `teamId`s for shared teams that the user has chosen to display on their management board. |
| `linkedCollectionIds?: string[]` | **Internal.** An array of `collectionId`s for shared Badge Collections that the user has chosen to display on their management board. |

### Dynamic Access Control for Pages & Tabs

Access to every page and content tab in the application is controlled by a dynamic ruleset. The logic for this is primarily handled in `/src/lib/permissions.ts` and the page renderer at `/src/app/dashboard/[...page]/page.tsx`.

**How It Works:**

1.  **Page Access**: Access to a page is determined by the `access` object on its `AppPage` configuration. A user can view a page if they are a system admin, if the page has no access rules (making it public), or if their `userId` or `Team` membership is listed in the corresponding access array.

2.  **Tab Visibility**: A page's content is composed of one or more `AppTab`s. If a page has zero associated tabs, it is considered unconfigured and will **not** appear in the sidebar navigation, making it inaccessible. A page must have at least one tab to be rendered.

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

This entity represents an internal AgileFlow calendar. It acts as a logical container for events within the application and can be linked to a real, external Google Calendar for future synchronization. These are managed on a dynamically configured page by an administrator (e.g., a page with a "Calendars" tab).

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

This entity, `AppSettings`, holds global configuration data that allows for customization of the application's terminology and appearance without altering the core codebase. These settings are managed on the **Admin Management** page.

### AppSettings Data

| Data Point | Description |
| :--- | :--- |
| `pages: AppPage[]` | **The core of the dynamic navigation.** This is an array of objects defining every page in the application. The order of pages in this array directly corresponds to their order in the sidebar navigation. The order is managed on the **Admin Management** page using the "Draggable Card Management" UI pattern. Each page object includes its name, icon, URL path, access control rules, and a list of associated `tab.id`s that should be rendered on it. |
| `tabs: AppTab[]` | **The core of the dynamic content.** This is an array of objects defining all reusable content tabs. The order of tabs in this array defines their default order in popovers (like "Manage Tabs") and can be reordered by an admin on the "Tabs" management page. Each object includes the tab's name, icon, and a `componentKey` that maps it to a React component. |
| `globalBadges: Badge[]` | An array of globally-defined badges. These are typically owned by a system process and are managed on the **Badge Management** page of any team. |
| `calendarManagementLabel?: string` | An alias for the "Manage Calendars" tab on a dynamically created management page. |
| `teamManagementLabel?: string` | An alias for the "Team Management" tab on a dynamically created management page. |

### AppPage Entity
A sub-entity of `AppSettings`, `AppPage` defines a single entry in the application's navigation.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the page. |
| `name: string` | The display name for the page. |
| `icon: string` | The Google Symbol name for the page's icon. |
| `color: string` | The hex color for the page's icon. |
| `path: string` | The base URL path for the page (e.g., `/dashboard/projects` or `/dashboard/teams`). |
| `isDynamic: boolean` | If `false`, `path` is a fixed URL. If `true`, the `path` acts as a template, and the system will append an entity ID (e.g., a team ID) to create unique URLs like `/dashboard/teams/team-id-1`. |
| `associatedTabs: string[]` | An array of `AppTab` IDs that define the content to be rendered on this page. A page must have at least one tab to be visible. |
| `access: { users: string[], teams: string[] }` | An object containing arrays of `userId`s and `teamId`s who can access this page. |

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

The `Team` entity is a functional unit that groups users together for collaboration and permission management.

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
| `linkedCollectionIds?: string[]` | An array of `collectionId`s for shared Badge Collections that this team has chosen to use. |
| `activeBadgeCollections?: string[]` | A subset of `badgeCollections` and `linkedCollectionIds` that are currently active for this team. |
| `pinnedLocations?: string[]` | An array of location names pinned to this team's schedule. |
| `checkLocations?: string[]` | A subset of pinnedLocations designated for daily checks. |
| `locationAliases?: { [key:string]: string }` | A map of canonical location names to custom display aliases. |
| `workstations?: string[]` | A list of bookable workstations or machines owned by this team. |
| `locationCheckManagers?: string[]` | An array of `userId`s who can manage check locations for this team. |
| `eventTemplates?: EventTemplate[]` | An array of reusable templates for common events. |


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
This represents a specific, functional role or skill. The single source of truth for a badge is stored in the `allBadges` array of its owner's `Team` object.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the badge. |
| `ownerCollectionId: string` | The `collectionId` of the badge's original, "source-of-truth" collection. |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
| `description?: string` | An optional description shown in tooltips. |

