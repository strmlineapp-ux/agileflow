# AgileFlow: Backup and Restore Guide

This guide provides the standard developer process for creating a complete backup of your application's codebase using Git and a remote repository service like GitHub. This ensures you always have a safe, restorable version of your project.

## Why Use Version Control?

Using a version control system like Git is a critical best practice for any software project. It allows you to:
- **Track Changes**: See the history of every change made to every file.
- **Create Backups**: Store a complete copy of your codebase on a remote server.
- **Branch and Experiment**: Create isolated "branches" to work on new features without affecting your main, stable codebase.
- **Collaborate**: Work with other developers on the same project seamlessly.

## One-Time Setup: Creating Your Backup Repository

These steps will guide you through creating your first backup on GitHub. You only need to do this once.

### Step 1: Install Git

If you don't have Git installed on your local machine, you'll need to download it from the [official Git website](https://git-scm.com/downloads).

### Step 2: Create a GitHub Account & Repository

1.  Sign up for a free account at [GitHub.com](https://github.com/).
2.  Once logged in, create a new repository by clicking the "+" icon in the top-right corner and selecting "New repository".
3.  Give your repository a name (e.g., `agileflow-app-backup`).
4.  You can choose to make it "Public" or "Private". For a project backup, "Private" is recommended.
5.  **Do not** initialize the repository with a README, .gitignore, or license file. We will add the files from your existing project.
6.  Click "Create repository".

GitHub will now show you a page with commands. You will use the URL from the "…or push an existing repository from the command line" section. It will look something like this: `https://github.com/your-username/your-repository-name.git`.

### Step 3: Initialize Git in Your Project

1.  Open a terminal or command prompt on your computer.
2.  Navigate to the root directory of your AgileFlow project.
3.  Run the following commands one by one:

```bash
# Initialize a new Git repository in your project folder
git init

# Add all the files in your project to be tracked by Git
git add .

# Create the first "commit" - a snapshot of your project's current state
git commit -m "Initial project commit"

# Link your local project to the remote repository you created on GitHub
# Replace the URL with the one from your GitHub repository page
git remote add origin https://github.com/your-username/your-repository-name.git

# Push (upload) your committed code to GitHub
git push -u origin master
```

Your entire project is now safely backed up on GitHub.

## Ongoing Backups: Saving Your Changes

As you make changes to your application, you should periodically save them to your backup repository.

1.  Open a terminal in your project directory.
2.  Run the following commands:

```bash
# Stage all new changes for the next commit
git add .

# Create a new commit with a descriptive message about the changes you made
git commit -m "feat: Added new calendar view" 
# Or "fix: Corrected login redirect loop"

# Push your new commit to GitHub
git push
```

## Restoring From a Backup

If you ever need to restore your project to a previous state or move it to a new machine, you simply need to "clone" it from GitHub.

1.  Navigate to your repository on GitHub.com.
2.  Click the green "<> Code" button.
3.  Copy the HTTPS URL.
4.  Open a terminal and navigate to the folder where you want to place the restored project.
5.  Run the following command:

```bash
# Replace the URL with the one you copied
git clone https://github.com/your-username/your-repository-name.git
```

This will create a new folder containing a complete, working copy of your project from the last time you pushed your changes.
