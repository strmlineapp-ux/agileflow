# AgileFlow User Manual

Welcome to AgileFlow, your team's central hub for managing tasks, scheduling events, and coordinating production workflows. This guide will walk you through the key features of the app.

## 1. Getting Started

### 1.1 Requesting Access
To begin using AgileFlow, you must first request access from an administrator.
1.  Navigate to the main page and click the "Sign up" link.
2.  Enter your email address and click "Request Access".
3.  An administrator will review your request and grant you access.

### 1.2 Signing In
Once your access has been approved, you can sign in:
1.  Navigate to the login page.
2.  Enter your email and password.
3.  You will be taken to your default calendar view.

## 2. Navigating the App

The main navigation is located in the sidebar on the left, providing quick, icon-based access to all sections of the app. Hover over an icon to see its name.

- **Main Navigation**: Access to core features like the Calendar, Overview, Tasks, and Notifications.
- **Team Management**: If you have permission to manage a team, a link to that team's management page will appear here.
- **Admin Pages**: If you are an Admin, you will see links to the Admin and Service Delivery pages.
- **User Profile**: At the bottom of the sidebar, you can access your profile, user preferences, and the "View as" feature (for Admins).

## 3. Dashboard Overview

The **Overview** page gives you a high-level summary of team activity, including cards for Active Tasks, Tasks Due Soon, and Completed Tasks. You can also see a list of your most recent tasks.

## 4. Calendar

The calendar is a powerful tool for visualizing and managing your team's schedule.

### 4.1 Creating Events
- Click the **(+)** icon in the header to open the new event form.
- Fill in the details, including title, date, time, location, and priority.
- You can add attachments, request specific roles for the event, and invite guests.
- **Easy Booking**: In your user preferences, you can enable "Easy Booking," which allows you to click on any empty time slot in the Day, Week, or Production Schedule views to quickly open the new event form with the time pre-filled.

### 4.2 Calendar Views & Controls
- **View Tabs**: Switch between four different views:
    - **Month**: A traditional monthly overview.
    - **Week**: A 7-day timeline view.
    - **Day**: A detailed hourly view for a single day. Can be switched between a horizontal (standard) or vertical (reversed) axis.
    - **Production Schedule**: A specialized view showing events organized by location for an entire week.
- **Controls**: Use the controls at the top to navigate between dates, jump to "Today," and adjust the view (e.g., zoom in/out).
- **Lunch Break**: A subtle diagonal pattern between 12:00 and 14:30 serves as a visual reminder to keep time free for a lunch break.

### 4.3 Production Schedule View
This is the most detailed view, designed for production planning.
- **Daily Checks**: Users with the "Manage Checks" permission can add, remove, and assign users to daily check locations that appear as pills at the top of each day.
- **User Statuses**: Managers can assign absence statuses (e.g., PTO, Sick) to users by clicking the `account_circle_off` icon. These appear as color-coded pills on the right side of each day's header.

## 5. Tasks

The **Tasks** page helps you stay on top of your work.
- **Tabs**: Switch between "My Tasks" (tasks assigned to you) and "All Tasks".
- **Grouping**: Tasks are automatically grouped by their current status (e.g., In Progress, Awaiting Review).
- **New Task**: Click the "New Task" button to create a new task.

## 6. Notifications

The **Notifications** page keeps you informed.
- **Unread Count**: A badge on the sidebar shows the number of unread notifications.
- **Access Requests**: Administrators can approve or reject new user access requests directly from the notification list.

## 7. Settings & Preferences

Access your preferences by clicking your avatar in the bottom-left corner of the sidebar and selecting **"Account Settings"**. This page allows you to customize your experience and manage your profile.

- **Change Colour Scheme**: Choose between `light` and `dark` themes. You can also select a custom primary color to override the theme's default.
- **Set Default Calendar View**: Select which calendar view you want to see when you log in.
- **Set Time Format**: Choose between 12-hour and 24-hour time display.
- **Enable Easy Booking**: Toggle the quick-create event feature.
- **Edit Contact Info**: Click the arrow on your user row to expand it. You can edit your own phone number.
- **Link Google Calendar**: To connect your Google Calendar, click the grey status dot on your avatar. A tooltip will confirm the action. A simulated Google sign-in will appear and, once complete, will enable features like creating Google Meet links for your events.

## 8. Management Pages (Admin & Manager Roles)

### 8.1 Admin (`/dashboard/admin`)
This is the central control panel for configuring the application itself.
- **Admin Management**: Manage system administrators by dragging and dropping users between the "Admins" and "Users" lists. You can also delete a user from the system on this tab.
- **Pages**: Configure the application's navigation. Create new pages, define their URL path, and control who has access to them (by user or team). You can intuitively reorder pages by dragging and dropping them in the grid. Key system pages are pinned and cannot be moved. You can also instantly duplicate any page by dragging it onto the "Add New Page" (+) button.
- **Tabs**: Manage the reusable content blocks (tabs) in a simple list view. Use the search bar to find a specific tab to edit.

### 8.2 Service Delivery Management (`/dashboard/service-delivery`)
This is the central hub for global application settings.
- **Manage Calendars**: Create, edit, or delete shared calendars. Deleting a calendar is a high-impact action and must be done from the dropdown menu on its card.
- **Manage Teams**: This tab provides a powerful, dynamic interface for managing user groups (called "Teams"). Just like Badge Collections, Teams can be owned, shared with other groups, linked, and copied. You can drag and drop your owned teams to a shared panel to make them available to others, or drag a shared team onto your board to link it.

### 8.3 Team Management (`/dashboard/teams/[teamId]`)
This page is for managing the specifics of an individual team.
- **Team Members**: View all members of the team. Team Admins are now listed in a dedicated column on the left for clarity, while all other members are in a responsive grid on the right. You can now also click on the "Team Admins" and "Members" titles to rename them for your team.
- **Badge Management**: Create and manage your team's badge collections. To share a collection, simply drag its card to the "Shared Collections" panel. To link a collection from another team, drag it from the shared panel onto your main board. You can also drag individual users from a shared team or individual badges from a shared collection.
- **Pinned Locations**: Pin locations to the team's Production Schedule. You can also designate locations as "check locations."
- **Workstations**: Manage a list of bookable workstations or machines for the team.
- **Event Templates**: Create reusable templates for common events. You can edit a template's name by clicking on it directly. Click the edit icon on the template card to manage its requested roles.
- **Location Check Managers**: Assign users who are allowed to manage the daily check assignments for this team's locations.

### 8.4 View As Another User (Admin Only)
Administrators can view the application from another user's perspective.
1.  Click your avatar in the bottom-left corner of the sidebar.
2.  Select "View as" from the dropdown menu.
3.  Choose a user from the list.
4.  A banner will appear at the top of the screen indicating whose view you are using. To return to your own view, repeat the process and select "Return to your view".
