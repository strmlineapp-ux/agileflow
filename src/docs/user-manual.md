

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
- **Team Management**: If you are a manager of a team, a link to that team's management page will appear here.
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
- **Edit Contact Info**: Click the arrow on your user row to expand it. You can edit your own contact phone number.
- **Link Google Calendar**: To connect your Google Calendar, click the grey status dot on your avatar. A tooltip will confirm the action. A simulated Google sign-in will appear and, once complete, will enable features like creating Google Meet links for your events.

## 8. Management Pages (Admin & Manager Roles)

### 8.1 Admin Management (`/dashboard/admin`)
This is the central control panel for configuring the application itself.
- **Admin Groups**: Create and manage high-level administrative groups. To assign users, you can either click the `add_circle` button on a group's card, or simply drag a user card and drop it into another group to add them. Dropping a user onto the 'Admins' card will promote them to a full Admin while keeping their existing group memberships. You can also instantly duplicate any group and its members by dragging the group card onto the "Add New Group" (+) button.
- **Pages**: Configure the application's navigation. Create new pages, define their URL path, and control who has access to them (by user, team, or admin group). You can intuitively reorder pages by dragging and dropping them in the grid. Key system pages like "Admin Management" are pinned and cannot be moved. You can also instantly duplicate any page by dragging it onto the "Add New Page" (+) button.
- **Tabs**: Manage the reusable content blocks (tabs) that can be assigned to different pages. Edit their names, icons, and descriptions.

### 8.2 Service Delivery Management (`/dashboard/service-delivery`)
This is the central hub for global application settings.
- **Manage Calendars**: Create, edit, or delete shared calendars using our intuitive card-based system. You can reorder calendars by dragging and dropping them, or instantly duplicate any calendar by dragging it onto the "Add New Calendar" (+) button.
- **Manage Teams**: Create new teams, edit existing team details, and manage members. To add a user to a team, you can either click the `add_circle` icon on the team's card or simply drag a user from one team card and drop them onto another. Dropping a user on the delete icon of a team card will remove them from that team.

### 8.3 Team Management (`/dashboard/teams/[teamId]`)
This page is for managing the specifics of an individual team.
- **Team Members**: View all members of the team. If you have permission, you can assign and unassign badges to users by clicking on them. Badges are now conveniently grouped by their parent collection. You can also click the "Team Badges" label to customize it for your team.
- **Badge Management**: Create and manage your team's badge collections in an intuitive, card-based grid.
  - **Sharing**: To make a collection of badges available to all other teams, click the `change_circle` icon on its card.
  - **Using Shared Collections**: Click the `chevron_left` icon in the header to open the Shared Collections panel. From here, you can drag a shared collection onto your main board to link it to your team. You can also drag individual badges from a shared collection and drop them into one of your own collections to create a link to that specific badge.
  - **Unlinking a Collection**: To remove a linked collection from your team, simply click the delete icon on its card. This will not delete the original.
  - **Duplication**: You can duplicate an entire collection (and all its owned badges) by dragging it onto the "Add New Collection" button.
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
