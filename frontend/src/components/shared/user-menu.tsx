import { Link, useNavigate } from "react-router-dom";
import { Download, LogOut, Pencil, Share2, UserRound } from "lucide-react";
import { toast } from "sonner";

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
import { usePwaInstall } from "@/lib/use-pwa-install";

async function sharePage() {
  const shareData = { title: "Pack with Me", url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // user cancelled — no-op
    }
    return;
  }
  await navigator.clipboard.writeText(shareData.url);
  toast.success("Link copied to clipboard");
}

/** Consolidated account menu: profile access, account/community profile editing, PWA install,
 * share, and logout, all reachable from a single avatar button in the top nav. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { installed, isIOS, canInstall, promptInstall } = usePwaInstall();

  if (!user) return null;

  const initials = (user.name ?? user.mobile.slice(-2) ?? "?").slice(0, 2).toUpperCase();

  function handleLogout() {
    logout();
    navigate("/wa-login", { replace: true });
  }

  function handleInstall() {
    if (canInstall) {
      promptInstall();
      return;
    }
    if (isIOS) {
      toast.info('Tap Share, then "Add to Home Screen" to install.');
    }
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
          <p className="text-muted-foreground truncate text-xs">+{user.mobile}</p>
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
        {!installed && (
          <DropdownMenuItem onSelect={handleInstall} disabled={!canInstall && !isIOS}>
            <Download className="size-4" />
            Install app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={sharePage}>
          <Share2 className="size-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
