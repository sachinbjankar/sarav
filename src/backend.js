// Firebase config भरलेले असल्यास खरा backend, नाहीतर डेमो (फक्त या फोन/ब्राउझरमध्ये).
import { firebaseConfig } from './config.js';

export const backend = firebaseConfig.apiKey
  ? (await import('./backend-firebase.js')).backend
  : (await import('./backend-mock.js')).backend;
