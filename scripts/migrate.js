
require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');

// Check if the app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function addTenantIdToCollection(collectionName) {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`No documents found in ${collectionName}. Skipping.`);
        return;
    }

    const batch = db.batch();
    let updatedCount = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.tenantId) {
            batch.update(doc.ref, { tenantId: 'default' });
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`Successfully added tenantId to ${updatedCount} documents in ${collectionName}.`);
    } else {
        console.log(`All documents in ${collectionName} already have a tenantId.`);
    }
}

async function migrate() {
    console.log('Starting data migration to add tenant IDs...');
    const collectionsToUpdate = [
        'users',
        'teams',
        'projects',
        'calendars',
        'locations',
        'badgeCollections',
        'badges',
        'app-settings',
    ];

    try {
        for (const collectionName of collectionsToUpdate) {
            await addTenantIdToCollection(collectionName);
        }
        console.log('Data migration complete! All documents should now have a tenantId.');
    } catch (error) {
        console.error("Error during data migration:", error);
        process.exit(1);
    }
    process.exit(0);
}

migrate();
