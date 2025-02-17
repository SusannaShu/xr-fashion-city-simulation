declare module 'firebase-config' {
  export function initializeApp(): void;
  export function getStorage(): any;
  export function getFirestore(): any;
  export function getAnalytics(): any;
}
