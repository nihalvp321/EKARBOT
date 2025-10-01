import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  UserCheck, 
  Activity, 
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CRMSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ currentView, onViewChange }) => {
  const [open, setOpen] = useState(true);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'activities', label: 'Activities', icon: Activity }
  ];

  return (
    <div className="w-64 bg-background border-r border-border h-full flex flex-col">
      <div className="p-2 border-b border-border">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted"
        >
          <span className="flex items-center gap-2 text-foreground">
            <Settings className="h-4 w-4" />
            CRM Data
          </span>
          <span className="text-muted-foreground">{open ? '▾' : '▸'}</span>
        </button>
      </div>

      <nav className="flex-1 p-2">
        {open && (
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      currentView === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

    </div>
  );
};

export default CRMSidebar;