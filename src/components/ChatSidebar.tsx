import { Moon, Plus, Sun, Trash } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  Sidebar as SidebarPrimitive,
} from "~/components/ui/sidebar";
import { useTheme } from "./ThemeProvider";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/lib/dexie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export const ChatSidebar = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Create dialog
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // Delete confirm dialog
  const [confirmDelete, setConfirmDelete] =
    useState<{ id: string; title: string } | null>(null);

  // Local search
  const [query, setQuery] = useState("");

  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const threads = useLiveQuery(() => db.getAllThreads(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!threads) return undefined; // loading
    if (!q) return threads;
    return threads.filter((t) =>
      (t.title || "Untitled").toLowerCase().includes(q)
    );
  }, [threads, query]);

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // ----- Create thread -----
  const handleCreateThread = async () => {
    const title = textInput.trim();
    if (!title) return;
    const threadId = await db.createThread(title);
    setDialogIsOpen(false);
    setTextInput("");
    navigate(`/thread/${threadId}`);
  };

  const onSubmitCreate = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    await handleCreateThread();
  };

  // ----- Delete thread with confirm -----
  const askDeleteThread = (thread: { id: string; title: string }) => {
    setConfirmDelete({ id: thread.id, title: thread.title || "Untitled" });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    await db.deleteThread(id);
    if (activeChat === id) {
      setActiveChat(null);
      navigate("/");
    }
    setConfirmDelete(null);
  };

  useLayoutEffect(() => {
    setActiveChat(location.pathname.split("/")[2]);
  }, [location.pathname]);

  // ---------- Row (Recent Chat) ----------
  const ChatRow = ({
    thread,
    isActive,
  }: {
    thread: { id: string; title?: string; updatedAt?: number; createdAt?: number };
    isActive: boolean;
  }) => {
    const title = thread.title?.trim() || "Untitled";
    const initial = title[0]?.toUpperCase() || "•";
    const ts = thread.updatedAt || thread.createdAt;
    const pretty = ts ? new Date(ts).toLocaleDateString() : "";

    return (
      <li className="px-2">
        <div
          className={[
            "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
            isActive
              ? "bg-muted/40 border-primary/30 ring-1 ring-primary/30"
              : "bg-muted/20 border-transparent hover:bg-muted/40 hover:border-border",
          ].join(" ")}
        >
          {/* accent bar left when active */}
          {isActive && (
            <span
              className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary"
              aria-hidden
            />
          )}

          {/* Avatar initial */}
          <div
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-semibold text-sm",
              isActive ? "bg-primary/15 text-primary" : "bg-muted text-foreground/70",
            ].join(" ")}
          >
            {initial}
          </div>

          {/* Title (clickable) */}
          <Link
            to={`/thread/${thread.id}`}
            className="min-w-0 flex-1"
            onClick={() => setActiveChat(thread.id)}
          >
            <div className="flex items-center gap-2">
              <span
                className={[
                  "truncate text-sm",
                  isActive ? "font-semibold" : "font-medium",
                ].join(" ")}
                title={title}
              >
                {title}
              </span>
              {pretty && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {pretty}
                </span>
              )}
            </div>
          </Link>

          {/* Delete (only on hover) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete chat"
            onClick={() => askDeleteThread({ id: thread.id, title })}
            className="rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/15 transition-opacity"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </li>
    );
  };

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <DialogContent>
          <form onSubmit={onSubmitCreate}>
            <DialogHeader className="mb-3">
              <DialogTitle>Create new chat</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="chat-title">Chat Title</Label>
              <Input
                id="chat-title"
                placeholder="Your new chat title"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={(e) => {
                  if (isComposing) return;
                  if (e.key === "Enter" && !textInput.trim()) e.preventDefault();
                }}
              />
              <p className="text-xs text-muted-foreground">Press Enter to create.</p>
            </div>

            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setDialogIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!textInput.trim()}>
                Create Chat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            “{confirmDelete?.title}” will be permanently removed. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <SidebarPrimitive className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {/* Header */}
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold tracking-wide text-sm text-muted-foreground/80">
              CHATS
            </div>
            <Button
              onClick={() => setDialogIsOpen(true)}
              variant="ghost"
              className="h-9 rounded-xl px-3 ring-1 ring-border hover:ring-primary/40 hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="mt-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="h-9 rounded-xl bg-muted/40 focus-visible:ring-0"
            />
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Recent Chats
              </SidebarGroupLabel>

              <div className="mt-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {/* Loading skeleton */}
                {filtered === undefined && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="mx-2 mb-2 h-9 rounded-xl bg-muted/40 animate-pulse"
                      />
                    ))}
                  </>
                )}

                {/* Empty state */}
                {filtered && filtered.length === 0 && (
                  <div className="px-3 py-8 text-sm text-muted-foreground">
                    No chats found.
                  </div>
                )}

                {/* Items */}
                {filtered && filtered.length > 0 && (
                  <ul className="space-y-2">
                    {filtered.map((t) => (
                      <ChatRow
                        key={t.id}
                        thread={t}
                        isActive={activeChat === t.id}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="px-3 py-3">
          <Button
            onClick={handleToggleTheme}
            variant="ghost"
            className="w-full justify-start rounded-xl hover:bg-muted/50"
          >
            <Sun className="h-[1.05rem] w-[1.05rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.05rem] w-[1.05rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-2">Toggle Theme</span>
          </Button>
        </SidebarFooter>
      </SidebarPrimitive>
    </>
  );
};
