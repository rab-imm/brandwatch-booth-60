import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Link } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-brand-primary font-pact-display">UAE Legal Research</Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/features" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/use-cases" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link to="/about" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              
              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Resources
                  <Icon name="chevron-down" size={12} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border">
                  <DropdownMenuItem asChild>
                    <Link to="/resources#blog">Blog</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#help">Help Center</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#docs">API Docs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#status">Status Page</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              See Demo
            </Button>
            <Button variant="premium" size="sm">
              Try Free Queries
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}