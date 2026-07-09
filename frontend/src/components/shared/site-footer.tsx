import { toast } from "sonner";

const INSTIFY_URL = "https://www.instify.in";

/** Small credit line on the dashboard — the last screen users land on after login. */
export function SiteFooter() {
  function handleInstifyClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      const win = window.open(INSTIFY_URL, "_blank", "noopener,noreferrer");
      if (!win) throw new Error("popup blocked");
    } catch {
      toast.error("Couldn't open the link. Please visit instify.in directly.");
    }
  }

  return (
    <footer className="mt-4 flex justify-center pb-2 text-center">
      <p className="text-muted-foreground/70 text-xs">
        ©{" "}
        <a
          href={INSTIFY_URL}
          onClick={handleInstifyClick}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-block px-0.5 py-1.5 underline decoration-dotted underline-offset-2 transition-colors"
        >
          Instify
        </a>
      </p>
    </footer>
  );
}
