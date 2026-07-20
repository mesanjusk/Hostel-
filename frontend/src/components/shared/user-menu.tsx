import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Pencil, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";

/** Consolidated account menu: profile access, account/community profile editing, and logout,
 * all reachable from a single avatar button in the top nav. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = (user.name ?? user.mobile?.slice(-2) ?? "?").slice(0, 2).toUpperCase();

  function handleLogout() {
    logout();
    navigate("/wa-login", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          <Avatar className="size-8">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name ?? "Profile"} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name ?? "Student"}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user.mobile ? `+${user.mobile}` : "Not linked yet"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile#edit">
            <Pencil className="size-4" />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile#community">
            <Pencil className="size-4" />
            Edit community profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* An anonymous account has no credential to log back in with — offer to link a
            mobile number instead of a logout that would just orphan everything saved so far. */}
        {user.mobile ? (
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link to="/wa-login">
              <LogIn className="size-4" />
              Link mobile number
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
