
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getFirebaseAppForTenant } from "../src/lib/firebase";
import { type User } from '../src/types';

async function deduplicateUsers() {
  try {
    const app = getFirebaseAppForTenant('default');
    const db = getFirestore(app);
    const batch = writeBatch(db);
    const usersRef = collection(db, "users");

    console.log("Starting user deduplication process...");

    // 1. Fetch all users
    const querySnapshot = await getDocs(usersRef);
    const allUsers = querySnapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as User));
    
    console.log(`Found ${allUsers.length} total user documents.`);

    // 2. Group users by email
    const usersByEmail: Record<string, User[]> = {};
    for (const user of allUsers) {
      if (!usersByEmail[user.email]) {
        usersByEmail[user.email] = [];
      }
      usersByEmail[user.email].push(user);
    }

    // 3. Find duplicates and mark for deletion
    let duplicatesFound = 0;
    for (const email in usersByEmail) {
      const usersGroup = usersByEmail[email];
      if (usersGroup.length > 1) {
        console.log(`Found ${usersGroup.length} documents for email: ${email}`);
        // Sort to have a consistent "first" user to keep. Let's keep the one with the shortest userId as a simple deterministic rule.
        usersGroup.sort((a, b) => a.userId.localeCompare(b.userId));
        
        const userToKeep = usersGroup.shift(); // Keep the first one
        console.log(`  Keeping user: ${userToKeep?.displayName} (${userToKeep?.userId})`);

        // Mark the rest for deletion
        for (const userToDelete of usersGroup) {
          console.log(`  Marking for deletion: ${userToDelete.displayName} (${userToDelete.userId})`);
          const userRefToDelete = doc(db, "users", userToDelete.userId);
          batch.delete(userRefToDelete);
          duplicatesFound++;
        }
      }
    }

    if (duplicatesFound === 0) {
        console.log("No duplicate users found. Your database is clean!");
        return;
    }

    // 4. Commit the batch deletion
    console.log(`Found ${duplicatesFound} duplicate(s) to remove. Committing deletion...`);
    await batch.commit();
    console.log("Successfully removed duplicate users from Firestore!");

  } catch (error) {
    console.error("Error during user deduplication:", error);
  }
}

deduplicateUsers();
