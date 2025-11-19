import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SidebarItem {
  id: string
  label: string
  icon: string
  badge?: number
}

interface ScannerSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export const ScannerSidebar = ({ activeSection, onSectionChange }: ScannerSidebarProps) => {
  const sections: SidebarItem[] = [
    { id: 'scan', label: 'Scan Document', icon: 'file-plus' },
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'history', label: 'History', icon: 'clock' },
    { id: 'saved', label: 'Saved Docs', icon: 'inbox' },
  ]
  
  return (
    <div className="w-64 border-r bg-card h-full flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="shield" className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Contract Scanner</h2>
            <p className="text-xs text-muted-foreground">AI-Powered Analysis</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${
                activeSection === section.id ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon name={section.icon as any} className="h-4 w-4" />
              {section.label}
              {section.badge && (
                <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {section.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        {/* Settings/Help Section */}
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Icon name="settings" className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Icon name="info" className="h-4 w-4" />
            Help
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
