import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user, userRole, logout } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  const links = [
    {
      href: `/dashboard/${userRole}`,
      label: 'Dashboard',
    },
    {
      href: userRole === 'supplier' ? '/invoices' : '/offers',
      label: userRole === 'supplier' ? 'Invoices' : 'Offers',
    },
    {
      href: '/reports',
      label: 'Reports',
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto px-6 py-3 max-w-7xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-10">
            <span className="text-2xl font-bold text-primary">DynaDiscount</span>
            <div className="hidden sm:flex gap-6">
              {links.map(({ href, label }) => (
                <Link key={href} href={href}>
                  <a
                    className={cn(
                      'text-sm font-medium pb-2 border-b-2 transition-colors',
                      location === href
                        ? 'text-primary border-primary'
                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {label}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize">
              {userRole}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-9 w-9 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-gray-500">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
