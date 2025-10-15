import { useState } from "react"
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
  useSidebar
} from "@/components/ui/sidebar"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

interface AdminSection {
  id: string
  title: string
  icon: string
  badge?: string
}

interface AdminGroup {
  title: string
  sections: AdminSection[]
  defaultOpen?: boolean
}

const adminGroups: AdminGroup[] = [
  {
    title: "Overview & Analytics",
    defaultOpen: true,
    sections: [
      { id: "overview", title: "Overview", icon: "layout-dashboard" },
      { id: "analytics", title: "Analytics", icon: "bar-chart" },
      { id: "advanced-analytics", title: "Advanced", icon: "trending-up" },
      { id: "realtime", title: "Real-time", icon: "activity" },
    ]
  },
  {
    title: "Content Management", 
    sections: [
      { id: "documents", title: "Documents", icon: "file-text" },
      { id: "templates", title: "Templates", icon: "file-plus" },
      { id: "upload", title: "Upload", icon: "upload" },
      { id: "ocr", title: "OCR Scanner", icon: "scan" },
      { id: "ocr-management", title: "OCR Management", icon: "database" },
      { id: "workflow", title: "Workflow", icon: "workflow" },
    ]
  },
  {
    title: "User Management",
    sections: [
      { id: "users", title: "Users", icon: "users" },
      { id: "bulk-operations", title: "Bulk Operations", icon: "layers" },
      { id: "impersonation", title: "Impersonation", icon: "user-check" },
      { id: "create-company-admin", title: "Create Company Admin", icon: "user-plus" },
      { id: "companies", title: "Companies", icon: "building" },
    ]
  },
  {
    title: "Billing & Revenue",
    sections: [
      { id: "subscriptions", title: "Subscriptions", icon: "credit-card" },
      { id: "revenue", title: "Revenue Analytics", icon: "dollar-sign" },
      { id: "billing", title: "Billing Overview", icon: "receipt" },
      { id: "billing-analytics", title: "Billing Analytics", icon: "trending-up" },
      { id: "payment-failures", title: "Payment Failures", icon: "alert-triangle" },
      { id: "trials", title: "Trial Management", icon: "clock" },
      { id: "retention", title: "Retention", icon: "users" },
    ]
  },
  {
    title: "System & Security",
    sections: [
      { id: "requests", title: "Lawyer Requests", icon: "alert-circle" },
      { id: "notifications", title: "Notifications", icon: "bell" },
      { id: "settings", title: "Settings", icon: "settings" },
      { id: "webhooks", title: "Webhooks", icon: "webhook" },
      { id: "audit", title: "Audit Logs", icon: "eye" },
      { id: "security", title: "Security", icon: "shield" },
      { id: "custom-reports", title: "Custom Reports", icon: "file-text" },
    ]
  }
]

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { state } = useSidebar()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    adminGroups.forEach(group => {
      // Keep group open if it contains the active section or is marked as defaultOpen
      const containsActive = group.sections.some(section => section.id === activeSection)
      initialState[group.title] = containsActive || group.defaultOpen || false
    })
    return initialState
  })

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon name="shield-check" className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Super Admin</span>
              <span className="truncate text-xs text-muted-foreground">Platform Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {adminGroups.map((group) => (
          <SidebarGroup key={group.title}>
            {!isCollapsed && (
              <SidebarGroupLabel asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => toggleGroup(group.title)}
                >
                  {group.title}
                  <Icon 
                    name="chevron-right" 
                    className={`h-3 w-3 transition-transform ${
                      openGroups[group.title] ? 'rotate-90' : ''
                    }`} 
                  />
                </Button>
              </SidebarGroupLabel>
            )}
            
            {(isCollapsed || openGroups[group.title]) && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.sections.map((section) => (
                    <SidebarMenuItem key={section.id}>
                      <SidebarMenuButton
                        isActive={activeSection === section.id}
                        onClick={() => onSectionChange(section.id)}
                        tooltip={isCollapsed ? section.title : undefined}
                      >
                        <Icon name={section.icon} className="h-4 w-4" />
                        {!isCollapsed && <span>{section.title}</span>}
                        {section.badge && !isCollapsed && (
                          <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            {section.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
