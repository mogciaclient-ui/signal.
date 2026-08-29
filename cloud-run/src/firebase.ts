import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!storageBucket) {
  throw new Error("FIREBASE_STORAGE_BUCKET is required");
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: applicationDefault(),
    storageBucket,
  });
export const auth = getAuth(app);
export const db = getFirestore(app);
export const bucket = getStorage(app).bucket();
