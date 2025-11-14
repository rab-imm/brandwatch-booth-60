import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icon } from "@/components/ui/Icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface CompanySidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  companyName: string
  isManager?: boolean
  isAdmin?: boolean
  creditsUsed?: number
  creditsTotal?: number
}

interface SidebarSection {
  id: string
  title: string
  icon: string
  badge?: string
  requiresManager?: boolean
  requiresAdmin?: boolean
}

interface SidebarGroup {
  title: string
  sections: SidebarSection[]
  defaultOpen?: boolean
}

export function CompanySidebar({
  activeSection,
  onSectionChange,
  companyName,
  isManager = false,
  isAdmin = false,
  creditsUsed = 0,
  creditsTotal = 0,
}: CompanySidebarProps) {
  const { state } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  
  const collapsed = state === "collapsed"

  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Main",
      sections: [
        { id: "dashboard", title: "Dashboard", icon: "layout-dashboard" },
        { id: "chat", title: "Legal Assistant", icon: "message-circle" },
        { id: "letters", title: "Documents", icon: "file-text" },
        { id: "templates", title: "My Templates", icon: "book-open" },
        { id: "ocr", title: "Contract Scanner", icon: "scan" },
      ],
      defaultOpen: true,
    },
    {
      title: "Team",
      sections: [
        { id: "team", title: "Team Overview", icon: "users", requiresManager: true },
        { id: "requests", title: "Requests", icon: "inbox", requiresManager: true },
        { id: "members", title: "Team Members", icon: "user-plus", requiresAdmin: true },
        { id: "conversations", title: "Team Chats", icon: "messages", requiresAdmin: true },
      ],
    },
    {
      title: "Management",
      sections: [
        { id: "analytics", title: "Analytics", icon: "bar-chart", requiresAdmin: true },
        { id: "settings", title: "Settings", icon: "settings", requiresAdmin: true },
      ],
    },
  ]

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Main: true,
    Team: isManager || isAdmin,
    Management: isAdmin,
  })

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }))
  }

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId)
  }

  const shouldShowSection = (section: SidebarSection) => {
    if (section.requiresAdmin) return isAdmin
    if (section.requiresManager) return isManager || isAdmin
    return true
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        {!collapsed && (
          <div className="p-4">
            <h2 className="text-lg font-semibold truncate">{companyName}</h2>
            <p className="text-xs text-muted-foreground">Company Dashboard</p>
          </div>
        )}
        {collapsed && (
          <div className="p-4 flex justify-center">
            <Icon name="building" className="h-6 w-6" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {sidebarGroups.map((group) => {
          const visibleSections = group.sections.filter(shouldShowSection)
          if (visibleSections.length === 0) return null

          return (
            <Collapsible
              key={group.title}
              open={openGroups[group.title]}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup>
                {!collapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors">
                      <span>{group.title}</span>
                      <Icon
                        name="chevron-right"
                        className={`ml-auto h-4 w-4 transition-transform ${
                          openGroups[group.title] ? "rotate-90" : ""
                        }`}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleSections.map((section) => {
                        const isActive = activeSection === section.id
                        
                        return (
                          <SidebarMenuItem key={section.id}>
                            <SidebarMenuButton
                              onClick={() => handleSectionClick(section.id)}
                              isActive={isActive}
                              tooltip={collapsed ? section.title : undefined}
                            >
                              <Icon name={section.icon} className="h-4 w-4" />
                              {!collapsed && <span>{section.title}</span>}
                              {!collapsed && section.badge && (
                                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {section.badge}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      {!collapsed && creditsTotal > 0 && (
        <div className="border-t bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="coins" className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Company Credits</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium tabular-nums">{creditsUsed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unused</span>
              <span className="font-semibold tabular-nums text-primary">
                {(creditsTotal - creditsUsed).toLocaleString()}
              </span>
            </div>
          </div>

          {(() => {
            const usagePercent = (creditsUsed / creditsTotal) * 100
            const progressColor = 
              usagePercent >= 90 ? "bg-destructive" : 
              usagePercent >= 70 ? "bg-yellow-500" : 
              "bg-green-500"
            
            return (
              <div className="space-y-1">
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{usagePercent.toFixed(1)}% used</span>
                  <span className="font-medium tabular-nums text-muted-foreground">
                    Total: {creditsTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <SidebarFooter className="border-t p-4">
        {!collapsed ? (
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <Icon name="home" className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <Icon name="home" className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
