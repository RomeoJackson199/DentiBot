import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  Stethoscope,
  Calendar,
  CreditCard,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Bot,
  Menu,
  X
} from "lucide-react";

export type PatientSection = 'home' | 'assistant' | 'care' | 'appointments' | 'payments' | 'settings';

interface PatientAppShellProps {
  activeSection: PatientSection;
  onChangeSection: (section: PatientSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<PatientSection, boolean>>;
}

const NAV_ITEMS: Array<{ id: PatientSection; label: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'home', label: 'Home', icon: HomeIcon, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'assistant', label: 'Assistant', icon: Bot, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'care', label: 'Care', icon: Stethoscope, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30' },
];

export const PatientAppShell: React.FC<PatientAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const isActive = (id: PatientSection) => activeSection === id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Desktop left sidebar */}
      <div className="hidden md:flex h-screen">
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="border-r border-border bg-card/95 backdrop-blur-sm flex flex-col shadow-sm"
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">P</span>
                  </div>
                  <span className="font-semibold text-lg">Patient Portal</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-primary/10"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            <TooltipProvider>
              {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                const showDot = badges[item.id];
                
                const navButton = (
                  <motion.div
                    key={item.id}
                    initial={false}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start relative group transition-all duration-200",
                        active ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm" : "hover:bg-muted/50",
                        sidebarCollapsed && "justify-center"
                      )}
                      onClick={() => onChangeSection(item.id)}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        active ? item.color : "group-hover:" + item.color.split(' ')[1]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {!sidebarCollapsed && (
                        <span className="ml-3 font-medium">{item.label}</span>
                      )}
                      {showDot && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-destructive"
                        />
                      )}
                      {!sidebarCollapsed && active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                        />
                      )}
                    </Button>
                  </motion.div>
                );

                return sidebarCollapsed ? (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center space-x-2">
                      <span>{item.label}</span>
                      {showDot && <span className="h-2 w-2 rounded-full bg-destructive" />}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  navButton
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border">
            <div className={cn(
              "px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground",
              sidebarCollapsed && "px-2 text-center"
            )}>
              {sidebarCollapsed ? "v2.0" : "Portal Version 2.0"}
            </div>
          </div>
        </motion.div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile layout with enhanced bottom nav */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="font-semibold">Patient Portal</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 20 }}
                className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="space-y-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.id);
                      const showDot = badges[item.id];
                      
                      return (
                        <Button
                          key={item.id}
                          variant={active ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start relative",
                            active && "bg-primary/10 text-primary"
                          )}
                          onClick={() => {
                            onChangeSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <div className={cn("p-2 rounded-lg", item.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="ml-3 font-medium">{item.label}</span>
                          {showDot && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </Button>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="pb-20">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
        
        {/* Enhanced Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border z-50 safe-area-inset-bottom">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50" />
            <div className="relative grid grid-cols-6 gap-1 px-2 py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                const showDot = badges[item.id];
                
                return (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeSection(item.id)}
                      className={cn(
                        "h-16 flex flex-col items-center justify-center rounded-xl relative w-full",
                        active ? "text-primary bg-primary/10" : "text-muted-foreground"
                      )}
                    >
                      <motion.div
                        animate={active ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                      </motion.div>
                      <span className="text-[10px] font-medium">{item.label}</span>
                      {showDot && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"
                        />
                      )}
                      {active && (
                        <motion.div
                          layoutId="activeMobileTab"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};