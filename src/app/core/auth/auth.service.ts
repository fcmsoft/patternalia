import { Injectable, signal, computed } from '@angular/core';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignUpInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
  fetchUserAttributes,
} from 'aws-amplify/auth';

export interface AuthUser {
  userId: string;
  username: string;
  nickname?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<AuthUser | null>(null);
  private readonly _loading = signal(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  async initialize(): Promise<void> {
    try {
      const { userId, username } = await getCurrentUser();
      const userData = await fetchUserAttributes();
      this._currentUser.set({ userId, username, nickname: userData.nickname });
      console.log('User session restored:', username);
    } catch {
      this._currentUser.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  async login(input: SignInInput): Promise<void> {
    const { isSignedIn } = await signIn(input);
    if (isSignedIn) {
      const { userId, username } = await getCurrentUser();
      const userData = await fetchUserAttributes();
      this._currentUser.set({ userId, username, nickname: userData.nickname });
      console.log('User logged in:', username);
    }
  }

  async register(input: SignUpInput): Promise<void> {
    await signUp(input);
  }

  async confirmRegistration(input: ConfirmSignUpInput): Promise<void> {
    await confirmSignUp(input);
  }

  async logout(): Promise<void> {
    await signOut();
    this._currentUser.set(null);
  }

  async forgotPassword(input: ResetPasswordInput): Promise<void> {
    await resetPassword(input);
  }

  async confirmForgotPassword(input: ConfirmResetPasswordInput): Promise<void> {
    await confirmResetPassword(input);
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { tokens } = await fetchAuthSession();
      return tokens?.accessToken?.toString() ?? null;
    } catch {
      return null;
    }
  }
}
