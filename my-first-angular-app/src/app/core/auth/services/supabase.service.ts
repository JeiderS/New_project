import { Injectable, signal } from '@angular/core';
import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../../../environments/environments';
import { Profile } from '@core/interfaces/Profile.interface';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  user = signal<Profile | null>(null);
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user;
  }

async loadUser() {
  const { data, error } = await this.supabase.auth.getUser();

  if (error || !data.user) {
    this.user.set(null);
    return;
  }

  const { data: profile, error: profileError } = await this.getProfile(data.user.id);

  if (profileError) {
    this.user.set(null);
    return;
  }

  this.user.set(profile);
}

  getUserName() {
    const userData = this.user(); 
    return userData?.username;
  }

  getProfile(userId: string) {
    return this.supabase
      .from('profiles')
      .select(`id, full_name, username`)
      .eq('id', userId)
      .single();
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signInWithPassword(email: string, pass: string) {
    return this.supabase.auth.signInWithPassword({ email: email, password: pass });
  }

  signUp(email: string, pass: string, fullName: string) {
    return this.supabase.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return this.supabase.from('profiles').upsert(update);
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file);
  }
}
