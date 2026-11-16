import { User } from '@supabase/supabase-js';
import { Menu, LogOut, User as UserIcon, Globe, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminRole } from '@/hooks/useAdminAuth';

interface AdminHeaderProps {
  user: User | null;
  role: AdminRole | null;
  onMenuClick: () => void;
  onSignOut: () => void;
}

export function AdminHeader({ user, role, onMenuClick, onSignOut }: AdminHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </Button>

      <div className="hidden lg:flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          Aboki Central Admin Portal
        </h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md font-medium">
          Syncs Website & Mobile App Live
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/website')}
          className="h-8 text-xs font-semibold flex items-center gap-1.5"
        >
          <Globe className="h-3.5 w-3.5 text-red-600" />
          <span className="hidden sm:inline">View Website</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app')}
          className="h-8 text-xs font-semibold flex items-center gap-1.5"
        >
          <Smartphone className="h-3.5 w-3.5 text-red-600" />
          <span className="hidden sm:inline">View Mobile App</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-red-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700">
                {user?.email?.split('@')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.email}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {role?.replace('_', ' ')}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
