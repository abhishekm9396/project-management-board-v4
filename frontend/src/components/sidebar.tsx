import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import { useWorkspace, WORKSPACE_CONFIG } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Columns,
  ClipboardList,
  Users,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  LayoutDashboard,
  Clock,
  Target,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeView: string;
  onViewChange: (view: "dashboard" | "kanban" | "sprint") => void;
}

export function Sidebar({ open, onOpenChange, activeView, onViewChange }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedWorkspace, setSelectedWorkspace } = useWorkspace();

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      action: () => onViewChange("dashboard"),
    },
    {
      id: "kanban",
      label: "Kanban Board",
      icon: Columns,
      action: () => onViewChange("kanban"),
    },
    {
      id: "sprint",
      label: "Agile Sprint Board",
      icon: Target,
      action: () => onViewChange("sprint"),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      action: () => {}, // Can be extended later
    },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-50 md:z-auto",
          "bg-card border-r border-border w-64 flex-shrink-0 flex flex-col h-full",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground">Project Manager</h1>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
                {user.role}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="p-4 border-b border-border">
          <div className="space-y-2">
            <Label htmlFor="workspace-select" className="text-xs font-medium text-muted-foreground flex items-center">
              <Building2 className="w-3 h-3 mr-1" />
              Workspace
            </Label>
            <Select
              value={selectedWorkspace}
              onValueChange={setSelectedWorkspace}
            >
              <SelectTrigger className="h-8 text-sm" id="workspace-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T&D">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3 h-3" />
                    <span>T&D - Shantnu</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMS">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3 h-3" />
                    <span>ADMS - Pranav</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Team Lead: {WORKSPACE_CONFIG[selectedWorkspace as keyof typeof WORKSPACE_CONFIG]?.teamLead}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={item.action}
              data-testid={`button-nav-${item.id}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
              {item.id === "notifications" && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Button>
          ))}

          {/* Additional Navigation Items */}
          {(user.role === "Admin" || user.role === "Team Lead") && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              data-testid="button-nav-team"
            >
              <Users className="w-4 h-4 mr-3" />
              Team Management
            </Button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}