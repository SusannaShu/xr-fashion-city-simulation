import { auth } from './config';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

export class AuthService {
  private static currentUser: User | null = null;
  private static authInitialized = false;
  private static authInitPromise: Promise<void>;

  static {
    // Initialize auth state listener
    this.authInitPromise = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(
        auth,
        user => {
          this.currentUser = user;
          if (!this.authInitialized) {
            this.authInitialized = true;
            resolve();
          }
        },
        error => {
          console.error('Auth state change error:', error);
          if (!this.authInitialized) {
            this.authInitialized = true;
            resolve(); // Resolve anyway to prevent hanging
          }
        }
      );
    });
  }

  static async ensureAuth(): Promise<User> {
    try {
      // Wait for auth to initialize
      await this.authInitPromise;

      // If already signed in, return current user
      if (this.currentUser) {
        return this.currentUser;
      }

      // Sign in anonymously
      const { user } = await signInAnonymously(auth);
      return user;
    } catch (error) {
      console.error('Error in ensureAuth:', error);

      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        const errorCode = (error as any).code;
        switch (errorCode) {
          case 'auth/configuration-not-found':
            throw new Error(
              'Firebase Authentication is not properly configured. Please enable Anonymous Authentication in the Firebase Console.'
            );
          case 'auth/operation-not-allowed':
            throw new Error(
              'Anonymous Authentication is not enabled. Please enable it in the Firebase Console.'
            );
          case 'auth/network-request-failed':
            throw new Error(
              'Network error. Please check your internet connection.'
            );
          default:
            throw error;
        }
      }

      throw error;
    }
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}
