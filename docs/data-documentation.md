

# AgileFlow: Data Documentation

This document provides a detailed breakdown of the data structures, entities, and their relationships within the AgileFlow application. It serves as a technical reference for understanding how data flows through the system and interacts with internal and external services.

## Data Fetching Strategy: Scalable On-Demand Model

AgileFlow employs a highly scalable, on-demand data-fetching strategy that is optimized for a NoSQL database environment and a context-aware user experience. This approach ensures the application remains fast and responsive, regardless of the amount of data in the system.

1.  **Minimal Initial Load**: When the application starts, it loads only the absolute minimum data required for the user to operate:
    *   The current `User` object, which contains their profile, preferences, and a list of Team IDs they belong to (`memberOfTeamIds`).
    *   The global `AppSettings` object, which defines the application's page structure and navigation.
    *   All other data (Projects, Teams, Calendars, Events, Tasks) is **not** loaded at startup.

2.  **Context-Aware, On-Demand Fetching**: Data is fetched by components precisely when and where it is needed, driven by user navigation.
    *   **Project & Team Data**: When you navigate to a specific project or team's management page (e.g., `/dashboard/project/project-id-123`), the component uses the ID from the URL to fetch the data for *only that specific entity*.
    *   **Events & Tasks**: High-volume data like events and tasks are fetched on-demand. The Calendar fetches events for the visible date range, and the Tasks page fetches tasks when it loads. A project's "Events" tab fetches only the events within that project's sub-collection.

3.  **Benefits of this Approach**:
    *   **Scalability**: The initial load time is constant and extremely fast, regardless of whether there are 10 or 10,000 projects in the system.
    *   **Performance**: Memory usage is kept to a minimum by only holding the data relevant to the current view.
    *   **NoSQL Optimization**: This model aligns perfectly with NoSQL best practices, which favor fetching specific documents by ID over performing large, complex queries.

## Multi-Tenant Architecture

AgileFlow is designed as a multi-tenant application, where each company or organization (a "tenant") operates within its own completely isolated Firebase project. This ensures the highest level of data privacy, security, and scalability.

### Tenant Identification & Configuration

1.  **Tenant ID**: Each tenant is identified by a unique ID, which typically corresponds to a subdomain (e.g., `tenant-a.agileflow.app`).
2.  **Dynamic Configuration**: The application uses a dynamic lookup mechanism (simulated in `/src/lib/firebase.ts`) to fetch the specific Firebase configuration for the tenant making a request.
3.  **Data Isolation**: Because each tenant has a unique `projectId`, all their data—including Firestore documents, Storage files, and authenticated users—resides in a separate, dedicated Google Cloud project. There is no possibility of data crossover between tenants.

### Tenant Onboarding & Provisioning

**Important Security Note:** The process of creating a new tenant and configuring their Firebase project is a privileged, administrative action. **A UI should NOT be created for tenants to enter their own Firebase details**, as this would be a significant security risk.

The correct, secure workflow is as follows:
1.  **Admin Provisioning**: When a new tenant signs up, a system administrator for AgileFlow uses secure, backend scripts (e.g., Google Cloud SDK) to programmatically create a new, dedicated Firebase project for that tenant.
2.  **Secure Key Management**: The configuration keys for this new project are then securely added to the application's central tenant configuration store (currently simulated in `firebase.ts`, but would be a secure database in production).
3.  **Tenant Access**: The tenant is then given their unique subdomain (e.g., `new-company.agileflow.app`) to access their isolated environment. They never handle API keys directly.

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
| `roles?: string[]` | **Internal.** An array of `badgeId`s assigned to the user. |
| `directReports?: string[]` | **Internal.** An array of `userId`s for users who report directly to this user. This is currently informational. |
| `memberOfTeamIds?: string[]` | **Internal.** An array of `teamId`s for all teams the user is a member of. This is a crucial de-normalization for efficient permission checking. |
| `theme?: 'light' \| 'dark'` | **Internal.** A UI preference for the app's color scheme. |
| `primaryColor?: string` | **Internal.** A user-selected hex color code that overrides the default primary color of their chosen theme. |
| `defaultCalendarView?: 'month' \| 'week' \| 'day' \| 'production-schedule'` | **Internal.** A UI preference for the default calendar layout. |
| `easyBooking?: boolean` | **Internal.** A UI preference for enabling quick event creation from the calendar. |
| `timeFormat?: '12h' \| '24h'` | **Internal.** A UI preference for displaying time in 12-hour or 24-hour time format. |
| `linkedTeamIds?: string[]` | **Internal.** An array of `teamId`s for shared teams that the user has chosen to display on their management board. |
| `linkedBadgeCollectionIds?: string[]` | **Internal.** An array of `collectionId`s for shared Badge Collections that the user has chosen to display on their management board. |
| `linkedCalendarIds?: string[]` | **Internal.** An array of `calendarId`s for shared calendars that the user has chosen to display on their management board. |
| `dragActivationKey?: 'alt' \| 'ctrl' \| 'meta' \| 'shift'` | **Internal.** A user-selected modifier key that must be held down to initiate drag-and-drop operations on complex components. |
| `createdAt: Date` | **Internal.** The timestamp when the user's account was first created in the system. |
| `approvedBy?: string` | **Internal.** The `userId` of the administrator who approved the user's account from the 'Viewer' state. |


### Simplified Ownership of Created Items

When a user creates a new shareable item (like a **Team** or **BadgeCollection**), ownership is assigned directly to that user. This simplified model ensures that every item has a single, clear owner responsible for its management. The `getOwnershipContext` function in `/src/lib/permissions.ts` contains the logic for this rule.

---

## Project Entity
**Firestore Collection**: `/projects/{projectId}`

The `Project` is a top-level container for organizing work. It holds its own sub-collections for `Events` and `Tasks`.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the project. |
| `name: string` | The display name of the project. |
| `owner: { type: 'user', id: string }` | An object that defines which `User` owns the project. |
| `isShared: boolean` | A flag to determine if the project is visible to other users. |
| `icon: string` | The Google Symbol name for the project's icon. |
| `color: string` | The hex color for the project's icon. |

---

## Event Entity
**Firestore Sub-Collection**: `/projects/{projectId}/events/{eventId}`

Events are always associated with a parent `Project`.

| Data Point | Description |
| :--- | :--- |
| `eventId: string` | **Internal.** A unique identifier for the event. |
| `title: string` | The name of the event. |
| `projectId: string` | **Crucial.** The ID of the parent project. |
| `calendarId: string` | The ID of the calendar used for color-coding and default settings. |
| `googleEventId?: string` | **External (Google Calendar).** The ID for the corresponding event in Google Calendar, used for synchronization. |
| `startTime: Date` | The start date and time of the event. |
| `endTime: Date` | The end date and time of the event. |
| `location?: string` | The physical or virtual location of the event. |
| `attendees: Attendee[]` | An array of `Attendee` objects representing invited guests. |
| `roleAssignments?: Record<string, string \| null>` | A map of requested badge names to the `userId` of the person assigned to that role. |
| `priority: string` | The `badgeId` of the badge used to signify the event's priority. |
| `description?: string` | A detailed description of the event. |
| `attachments: Attachment[]` | A list of files or links attached to the event. |
| `createdBy: string` | The `userId` of the user who created the event. |
| `createdAt: Date` | The timestamp when the event was created. |
| `lastUpdated: Date` | The timestamp when the event was last modified. |

---

## Task Entity
**Firestore Sub-Collection**: `/projects/{projectId}/tasks/{taskId}`

Tasks are always associated with a parent `Project`.

| Data Point | Description |
| :--- | :--- |
| `taskId: string` | **Internal.** A unique identifier for the task. |
| `title: string` | The name of the task. |
| `projectId: string` | **Crucial.** The ID of the parent project. |
| `googleTaskId?: string` | **External (Google Tasks).** The ID for the corresponding task in Google Tasks, used for synchronization. |
| `description?: string` | A detailed description of the task. |
| `assignedTo: User[]` | An array of `User` objects assigned to the task. |
| `dueDate: Date` | The date the task is due. |
| `status: 'not_started' \| 'in_progress' \| ...` | The current status of the task. |
| `badges?: Record<string, string>` | A map where the key is a `badgeCollectionId` and the value is the `badgeId` of the selected badge from that collection. |
| `createdBy: string` | The `userId` of the user who created the task. |
| `createdAt: Date` | The timestamp when the task was created. |
| `lastUpdated: Date` | The timestamp when the task was last modified. |

---
## Shared Calendar Entity
**Firestore Collection**: `/calendars/{calendarId}`

This entity represents an internal AgileFlow calendar. These are managed on a dynamically configured page by an administrator (e.g., a page with a "Calendars" tab).

### SharedCalendar Data

| Data Point | Description & Link to Services |
| :--- | :--- |
| `id: string` | **Internal.** A unique identifier for the AgileFlow calendar. |
| `name: string` | **Internal.** The display name for the calendar within the application. |
| `icon: string` | **Internal.** The Google Symbol name for the calendar's icon. |
| `color: string` | **Internal.** The hex color code used for this calendar's events in the UI. |
| `owner: { type: 'user', id: string }` | An object that defines which `User` owns the calendar. Ownership dictates who can edit the calendar's properties. |
| `googleCalendarId?: string` | **External (Google Calendar).** The unique ID of the Google Calendar that this internal calendar is linked to. This is currently set manually but will be populated automatically by the future calendar linking flow. |
| `isShared?: boolean` | **Internal.** If `true`, this calendar will be visible to other users in the application for discovery and linking. |
| `defaultEventTitle?: string` | **Internal.** A placeholder string for the title of new events created on this calendar. |
| `roleAssignmentsLabel?: string` | **Internal.** A custom label for the "Role Assignments" section in the event details view. |

---

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
| `owner: { type: 'user', id: string }` | An object that defines which `User` owns the team. Ownership dictates who can edit the team's properties. |
| `isShared?: boolean` | **Internal.** If `true`, this team will be visible to other teams in the application for discovery and linking. |
| `members: string[]` | An array of `userId`s for all members of the team. |
| `teamAdmins?: string[]` | A subset of `members` who have administrative privileges for this team (e.g., can add/remove members). |
| `teamAdminsLabel?: string` | A custom label for the Team Admins list on the Team Members tab. |
| `membersLabel?: string` | A custom label for the Members list on the Team Members tab. |
| `userBadgesLabel?: string` | A custom label for the "Team Badges" section on the Team Members tab. |
| `activeBadgeCollections?: string[]` | An array of `collectionId`s. Badges from these collections become available for assignment to members of this team. This is a local setting for the team. |
| `pinnedLocations?: string[]` | An array of location names pinned to this team's schedule. |
| `checkLocations?: string[]` | A subset of pinnedLocations designated for daily checks. |
| `locationAliases?: { [key:string]: string }` | A map of canonical location names to custom display aliases. |
| `workstations?: string[]` | A list of bookable workstations or machines owned by this team. |
| `locationCheckManagers?: string[]` | An array of `userId`s who can manage check locations for this team. |
| `eventTemplates?: EventTemplate[]` | An array of reusable templates for common events. |

---

## Badge & BadgeCollection Entities

### BadgeCollection Entity Data
**Firestore Collection**: `/badgeCollections/{collectionId}`

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the collection. |
| `owner: { type: 'user', id: string }` | **Crucial.** An object that defines which `User` owns the collection. Ownership dictates who can edit the collection's properties. |
| `isShared?: boolean` | **Internal.** If `true`, this collection and its badges will be visible to all other users in the application for discovery and linking. |
| `name: string` | The name of the collection (e.g., "Video Production Roles"). |
| `icon: string` | The Google Symbol name for the collection's icon. |
| `color: string` | The hex color for the collection's icon. |
| `badgeIds: string[]` | An array of `badgeId`s belonging to this collection. This can include a mix of owned and linked badges. |
| `applications?: BadgeApplication[]` | Defines where badges from this collection can be applied (e.g., 'Team Members', 'Events'). For linked collections, this is a local override; changing it does not affect the original shared collection. |
| `viewMode: 'compact' \| 'grid' \| 'list'` | **Internal.** A UI preference for how to display the badges within this collection. |
| `description?: string` | An optional description for the collection. |


### Badge Entity Data
**Firestore Collection**: `/badges/{badgeId}`

This represents a specific, functional role or skill.

| Data Point | Description |
| :--- | :--- |
| `id: string` | A unique identifier for the badge. |
| `owner: { type: 'user', id: string }` | **Crucial.** An object that defines which `User` owns the badge. Ownership dictates who can edit the badge's properties. |
| `ownerCollectionId: string` | The `collectionId` of the badge's original, "source-of-truth" collection where it was created. |
| `name: string` | The display name for the badge (e.g., "Camera", "Audio"). |
| `icon: string` | The Google Symbol name for the badge's icon. |
| `color: string` | The hex color code for the badge's icon and outline. |
| `description?: string` | An optional description shown in tooltips. |
