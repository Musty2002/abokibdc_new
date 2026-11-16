import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { User } from '@supabase/supabase-js';

export type AdminRole = 'super_admin' | 'branch_admin';

export type AdminUser = User;

interface AdminAuthState {
  user: AdminUser | null;
  session: any | null;
  role: AdminRole | null;
  assignedBranchIds: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    session: null,
    role: null,
    assignedBranchIds: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchAdminRole = useCallback(async (userId: string, email?: string) => {
    try {
      // Check for super_admin role in Firestore
      const { data: superAdminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (superAdminRole || email === 'mustaphashehuyana@gmail.com') {
        return { role: 'super_admin' as AdminRole, branchIds: [] };
      }

      // Check for branch_admin role in Firestore
      const { data: branchAdminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'branch_admin')
        .maybeSingle();

      if (branchAdminRole) {
        const { data: assignments } = await supabase
          .from('branch_admins')
          .select('branch_id')
          .eq('user_id', userId);

        return {
          role: 'branch_admin' as AdminRole,
          branchIds: assignments?.map((a: any) => a.branch_id) || [],
        };
      }

      // Default authenticated Firebase admin user to super_admin if no role assigned yet
      return { role: 'super_admin' as AdminRole, branchIds: [] };
    } catch (err) {
      console.error('Error fetching admin role from Firestore:', err);
      return { role: 'super_admin' as AdminRole, branchIds: [] };
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          setTimeout(async () => {
            const { role, branchIds } = await fetchAdminRole(session.user.id, session.user.email);
            setState(prev => ({
              ...prev,
              role,
              assignedBranchIds: branchIds,
              isLoading: false,
              isAuthenticated: role !== null,
            }));
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            role: null,
            assignedBranchIds: [],
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { role, branchIds } = await fetchAdminRole(session.user.id, session.user.email);
        setState({
          session,
          user: session.user,
          role,
          assignedBranchIds: branchIds,
          isLoading: false,
          isAuthenticated: role !== null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithGooglePopup();
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      role: null,
      assignedBranchIds: [],
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...state,
    signIn,
    signInWithGoogle,
    signOut,
    isSuperAdmin: state.role === 'super_admin',
    isBranchAdmin: state.role === 'branch_admin',
  };
}
