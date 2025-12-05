import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SidebarItem {
  id: string
  label: string
  icon: string
  badge?: number
}

interface ScannerSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const ScannerSidebar = ({ 
  activeSection, 
  onSectionChange,
  isCollapsed = false,
  onToggleCollapse
}: ScannerSidebarProps) => {
  const sections: SidebarItem[] = [
    { id: 'scan', label: 'Analyse Document', icon: 'file-plus' },
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'history', label: 'History', icon: 'clock' },
    { id: 'saved', label: 'Saved Docs', icon: 'inbox' },
  ]
  
  return (
    <div 
      className={cn(
        "border-r bg-card h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Toggle Button */}
      {onToggleCollapse && (
        <div className={cn(
          "flex items-center border-b h-[73px]",
          isCollapsed ? "justify-center px-2" : "justify-end px-4"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            <Icon 
              name={isCollapsed ? "panel-left" : "panel-left-close"} 
              className="h-4 w-4" 
            />
          </Button>
        </div>
      )}
      
      {/* Navigation */}
      <ScrollArea className={cn(
        "flex-1 pb-6",
        isCollapsed ? "px-2 pt-4" : "px-4 pt-6",
        !onToggleCollapse && "pt-24"
      )}>
        <div className="space-y-1.5">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className={cn(
                "w-full gap-3 transition-all",
                isCollapsed ? "justify-center px-2" : "justify-start",
                activeSection === section.id && 'bg-primary/10 text-primary'
              )}
              onClick={() => onSectionChange(section.id)}
              title={isCollapsed ? section.label : undefined}
            >
              <Icon name={section.icon as any} className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  {section.label}
                  {section.badge && (
                    <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                      {section.badge}
                    </span>
                  )}
                </>
              )}
            </Button>
          ))}
        </div>
        
        {!isCollapsed && <Separator className="my-6" />}
        
        {/* Settings/Help Section */}
        <div className={cn("space-y-1.5", isCollapsed && "mt-4")}>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full gap-3",
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Icon name="settings" className="h-4 w-4 shrink-0" />
            {!isCollapsed && "Settings"}
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full gap-3",
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            title={isCollapsed ? "Help" : undefined}
          >
            <Icon name="info" className="h-4 w-4 shrink-0" />
            {!isCollapsed && "Help"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
