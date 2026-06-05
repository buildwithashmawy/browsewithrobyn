"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { ChatPanel } from "@/components/ChatPanel";
import { BrowserPanel } from "@/components/BrowserPanel";
import { Icon } from "@/components/Icon";
import { RobynIntro } from "@/components/RobynIntro";
import { useTheme } from "@/hooks/useTheme";
import { useSession } from "@/hooks/useSession";
import { useModels } from "@/hooks/useModels";
import { useSessionsList } from "@/hooks/useSessionsList";
import { SessionSidebar } from "@/components/SessionSidebar";
import { deriveView } from "@/lib/deriveView";
import { pickDefaultModel } from "@/lib/curatedModels";

export default function Home() {
  const { theme, toggle } = useTheme();
  const { models, loading: modelsLoading } = useModels();
  const [model, setModel] = useState("");
  const [userPicked, setUserPicked] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "browser">("chat");

  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("robyn-onboarded") !== "1") setShowIntro(true);
    } catch {
      /* ignore */
    }
  }, []);
  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    try {
      localStorage.setItem("robyn-onboarded", "1");
    } catch {
      /* ignore */
    }
  }, []);

  // default the picker once models load (unless the user already chose one)
  useEffect(() => {
    if (!userPicked && models.length) {
      setModel((m) => m || pickDefaultModel(models));
    }
  }, [models, userPicked]);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // allow viewing/resuming a specific session via ?s=<id>
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) setSessionId(s);
  }, []);

  const { session, steps, frame, messages } = useSession(sessionId);
  const createSession = useMutation(api.sessions.create);
  const addMessage = useMutation(api.messages.add);
  const sessions = useSessionsList();

  const setActiveSession = useCallback((id: string | null) => {
    setSessionId(id);
    window.history.replaceState(null, "", id ? `/?s=${id}` : "/");
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    // overlay mode (≤1024): always start closed so it doesn't cover the app on load
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
      return;
    }
    try {
      const v = localStorage.getItem("robyn-sidebar");
      setSidebarOpen(v === null ? true : v === "1");
    } catch {
      setSidebarOpen(true);
    }
  }, []);
  const setSidebar = useCallback((v: boolean) => {
    setSidebarOpen(v);
    try {
      localStorage.setItem("robyn-sidebar", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const view = deriveView(session, steps);

  // session ids we've already issued a start for this page-load (resets on refresh),
  // so the recovery effect below doesn't double-fire alongside onSend.
  const startedRef = useRef<Set<string>>(new Set());
  const [agentError, setAgentError] = useState<string | null>(null);

  const startAgent = useCallback(async (id: string) => {
    startedRef.current.add(id);
    // pass our browser panel's aspect ratio so the agent captures a matching feed
    const vp = document.querySelector(".viewport")?.getBoundingClientRect();
    const aspect = vp && vp.height > 0 ? vp.width / vp.height : undefined;
    try {
      const r = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, aspect }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setAgentError(data.error || "Couldn't reach Robyn's agent. Start it with: pnpm --filter agent dev");
      } else {
        setAgentError(null);
      }
    } catch {
      setAgentError("Couldn't reach Robyn's agent. Start it with: pnpm --filter agent dev");
    }
  }, []);

  // Recover stuck tasks: if the active session is still "idle" (shown as "Queued")
  // and we haven't kicked it this page-load, (re)issue start. The agent dedupes via
  // isRunning, so a task that's actually running won't be double-started. This is
  // what makes a refresh resume a task whose original start was lost.
  const sessionStatus = session?.status;
  useEffect(() => {
    if (!sessionId || !sessionStatus) return;
    if (sessionStatus === "idle") {
      if (!startedRef.current.has(sessionId)) void startAgent(sessionId);
    } else {
      setAgentError(null);
    }
  }, [sessionId, sessionStatus, startAgent]);

  const onSend = useCallback(
    async (text: string) => {
      if (sessionId) {
        // continue the active session as a conversation (answer/continue)
        await addMessage({ sessionId: sessionId as Id<"sessions">, role: "user", text });
        void startAgent(sessionId);
        return;
      }
      // no active session → start a new task
      const chosen = model || pickDefaultModel(models);
      const id = await createSession({ prompt: text, model: chosen });
      setActiveSession(id);
      void startAgent(id);
    },
    [sessionId, addMessage, createSession, model, models, setActiveSession, startAgent],
  );

  const onStop = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch("/api/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const onReplay = useCallback(() => setActiveSession(null), [setActiveSession]);

  const onRetry = useCallback(() => {
    if (sessionId) void startAgent(sessionId);
  }, [sessionId, startAgent]);

  const showResultCard =
    view.phase === "done" && session?.status === "done" && !!session?.result;

  return (
    <>
    <div className="app has-sidebar" data-mobile={mobileView}>
      <SessionSidebar
        open={sidebarOpen}
        sessions={sessions}
        activeId={sessionId}
        onSelect={setActiveSession}
        onNew={() => setActiveSession(null)}
        onCollapse={() => setSidebar(false)}
      />
      <ChatPanel
        phase={view.phase}
        session={session}
        steps={steps}
        messages={messages}
        agentStatus={view.agentStatus}
        charState={view.charState}
        density="expanded"
        pillStyle="minimal"
        theme={theme}
        onToggleTheme={toggle}
        models={models}
        modelsLoading={modelsLoading}
        selectedModel={model}
        onSelectModel={(id) => {
          setUserPicked(true);
          setModel(id);
        }}
        onSend={onSend}
        onStop={onStop}
        onRetry={onRetry}
        running={view.running}
        notice={agentError}
        onToggleSidebar={() => setSidebar(!sidebarOpen)}
      />
      <BrowserPanel
        frame={frame}
        result={session?.result}
        showResult={showResultCard}
        onReplay={onReplay}
        running={view.running}
      />
      <nav className="mobile-nav">
        <button data-active={mobileView === "chat"} onClick={() => setMobileView("chat")}>
          <Icon name="chat" size={17} />
          Chat
        </button>
        <button data-active={mobileView === "browser"} onClick={() => setMobileView("browser")}>
          <Icon name="window" size={17} />
          Live view
        </button>
      </nav>
    </div>
    {showIntro ? <RobynIntro onDone={dismissIntro} /> : null}
    </>
  );
}
