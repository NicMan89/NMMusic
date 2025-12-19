import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

export class AuthService {
  constructor(auth) {
    this.auth = auth;
  }

  /**
   * Login con email e password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('âœ… Login successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error('âŒ Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registrazione nuovo utente
   */
  async register(email, password, displayName) {
    try {
      // Crea utente
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Aggiorna profilo con nome
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }

      console.log('âœ… Registration successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error('âŒ Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await signOut(this.auth);
      console.log('âœ… Logout successful');
    } catch (error) {
      console.error('âŒ Logout error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Ottieni utente corrente
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Gestione errori Firebase Auth
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Utente non trovato',
      'auth/wrong-password': 'Password errata',
      'auth/email-already-in-use': 'Email giÃ  in uso',
      'auth/invalid-email': 'Email non valida',
      'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
      'auth/too-many-requests': 'Troppi tentativi. Riprova piÃ¹ tardi',
      'auth/network-request-failed': 'Errore di connessione',
      'auth/user-disabled': 'Account disabilitato',
      'auth/operation-not-allowed': 'Operazione non permessa'
    };

    const message = errorMessages[error.code] || 'Errore di autenticazione';
    return new Error(message);
  }
}
