import {initializeApp} from 'firebase/app'
import {getDatabase} from 'firebase/database'
const e=import.meta.env
export const ok=!!e.VITE_FIREBASE_DATABASE_URL
export const db=ok?getDatabase(initializeApp({apiKey:e.VITE_FIREBASE_API_KEY,authDomain:e.VITE_FIREBASE_AUTH_DOMAIN,databaseURL:e.VITE_FIREBASE_DATABASE_URL,projectId:e.VITE_FIREBASE_PROJECT_ID,appId:e.VITE_FIREBASE_APP_ID})):null
