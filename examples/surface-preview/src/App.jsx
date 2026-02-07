import { useState, useEffect, useRef, useCallback } from "react";

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function inR(r, x, y) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

const PAGES = [
  { id: "intro", title: "Introduction", group: "Getting Started", content: { heading: "Introduction", lead: "A design philosophy for contextual information layers. Surfaces bring information to where the user's attention already is — no navigation required.", sections: [{ title: "The problem", body: "The web is stuck in a document-era mental model. Pages link to pages link to pages. Users click through navigation hierarchies to find information that should have been available where they started. Game interfaces solved this decades ago with tooltips, contextual overlays, and progressive disclosure on hover." }, { title: "The approach", body: "Surfaces are contextual information layers that attach to any element. They handle positioning, collision detection, safe zones, animation choreography, recursive nesting, and device adaptation — so you write one line of markup and get a complete interactive overlay." }] } },
  { id: "install", title: "Installation", group: "Getting Started", content: { heading: "Installation", lead: "Add Surface to your project in under a minute.", code: "npm install @surface/core", sections: [{ title: "Quick start", body: "Import the stylesheet and initialize. Surface auto-discovers all data-surface attributes on the page and sets up hover, focus, and touch handlers automatically." }, { title: "Zero config", body: "No initialization code required for basic usage. Add a data-surface attribute to any element and the tooltip appears on hover. Positioning, flipping, safe zones, and animations are handled automatically." }] } },
  { id: "tooltips", title: "Tooltips", group: "Components", content: { heading: "Tooltips", lead: "The simplest surface. Plain text, non-interactive, appears on hover.", code: '<button data-surface="Save progress">\n  Save\n</button>', sections: [{ title: "Placement", body: "Tooltips prefer the top position but automatically flip to bottom, left, or right when there isn't enough space. The flip happens before the tooltip becomes visible so the user never sees it jump." }, { title: "Hover intent", body: "A 150ms delay prevents tooltips from flickering when the cursor passes over a trigger without stopping. The delay is skipped when moving between adjacent triggers to keep the experience fluid." }] } },
  { id: "previews", title: "Previews", group: "Components", content: { heading: "Previews", lead: "Live miniature renderings of target content. The user sees what they'll get before committing to a click.", sections: [{ title: "The scale trick", body: "Previews render your actual components at full size inside a container, then CSS-scale the container down. Fonts, spacing, borders — everything looks correct, just miniaturized. You don't design preview-specific layouts." }, { title: "Content strategies", body: "Four approaches: declared templates for hand-crafted previews, component rendering for design system elements, DOM cloning for live state capture, and async loading for external content with skeleton states and caching." }, { title: "Cropping", body: "Previews fade at the right and bottom edges, showing the top-left corner where the most important content lives. The fade signals continuation without showing everything." }] } },
  { id: "nesting", title: "Recursive Nesting", group: "Components", content: { heading: "Recursive Nesting", lead: "A surface can contain triggers for other surfaces. Unlimited depth, automatic parent detection, chain-aware dismissal.", sections: [{ title: "The tree", body: "Every active surface is a node in a tree. Parent-child relationships are inferred from DOM containment — you never declare them. When you hover a trigger inside a surface, that surface becomes the parent. The child opens, and the parent stays open for as long as any descendant is active." }, { title: "Hover chains", body: "The cursor can move freely between any trigger, surface, or safe zone in the chain. A single mousemove listener on the document hit-tests against all active surfaces. If the cursor is inside any part of the chain, the entire chain persists." }] } },
  { id: "positioning", title: "Positioning Engine", group: "Architecture", content: { heading: "Positioning Engine", lead: "The foundation. Pure geometry that resolves placement, handles viewport collision, and manages repositioning.", sections: [{ title: "Resolution", body: "The engine measures available space in all four directions, tries the preferred placement, falls back to the opposite side, then picks the side with the most room. Alignment along the cross-axis shifts to prevent viewport overflow." }, { title: "Observation", body: "ResizeObserver on both trigger and surface. Scroll listeners on all ancestor scroll containers. IntersectionObserver for viewport exit. MutationObserver for content changes. All repositioning is batched via requestAnimationFrame." }] } },
  { id: "motion", title: "Motion Grammar", group: "Architecture", content: { heading: "Motion Grammar", lead: "Every animation communicates spatial relationships. Nothing moves without purpose.", sections: [{ title: "Directional entry", body: "A surface placed above the trigger slides down from above. One placed to the right slides in from the left. The animation tells you where the surface came from. Dismissal reverses the entrance, slightly faster." }, { title: "Duration scaling", body: "Duration is proportional to travel distance. A small tooltip close to the trigger animates in 100ms. A large panel offset from the trigger takes 250ms. This follows Material 3 Expressive principles — motion should feel physically plausible." }] } },
  { id: "safezones", title: "Safe Zones", group: "Architecture", content: { heading: "Safe Zones", lead: "The invisible bridge between trigger and surface that prevents premature dismissal.", sections: [{ title: "The polygon", body: "A convex hull connecting the corners of both the trigger and surface rects, with configurable padding. The cursor can travel anywhere inside this polygon without triggering dismissal. Hit testing uses ray casting." }, { title: "Nested zones", body: "Each depth level has its own safe zone. The cursor is valid if it's inside any safe zone in the chain. This means you can move from a parent surface to a child trigger across empty space, and neither surface closes." }] } },
];

const GROUPS = [...new Set(PAGES.map(p => p.group))];
const C = { accent: "#111162", pr: "140,174,244", primary: "#8caef4", sl: "#f4f6f9", text: "#1a1a2e", tl: "#444466", tm: "#8888a4", bg: "#f0ece6" };

function PageContent({ page, preview }) {
  const c = page.content;
  if (preview) return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5, lineHeight: 1.2 }}>{c.heading}</div>
      <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.55, marginBottom: 10 }}>{c.lead}</div>
      {c.code && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#1e1e30", color: "#a5b4fc", fontSize: 12, fontFamily: "monospace", marginBottom: 10, whiteSpace: "pre" }}>{c.code}</div>}
      {c.sections?.slice(0, 2).map((s, i) => (
        <div key={i} style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 1 }}>{s.title}</div>
          <div style={{ fontSize: 12, color: C.tm, lineHeight: 1.5 }}>{s.body.slice(0, 130)}...</div>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{page.group}</div>
        <h1 style={{ fontSize: 30, fontWeight: 750, color: C.text, margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{c.heading}</h1>
        <p style={{ fontSize: 16.5, color: C.tl, lineHeight: 1.65, marginTop: 14, maxWidth: 560 }}>{c.lead}</p>
      </div>
      {c.code && <div style={{ padding: "16px 20px", borderRadius: 10, background: "#1e1e30", color: "#a5b4fc", fontSize: 14, fontFamily: "monospace", marginBottom: 36, whiteSpace: "pre", lineHeight: 1.6 }}>{c.code}</div>}
      {c.sections?.map((s, i) => (
        <div key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 650, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>{s.title}</h2>
          <p style={{ fontSize: 15, color: C.tl, lineHeight: 1.7, margin: 0, maxWidth: 560 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function SurfacePreview({ page, triggerEl, visible, elRef, initialMouseX, onClickPreview, contentWidth }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const [contentKey, setContentKey] = useState(page?.id);
  const [fading, setFading] = useState(false);
  const prevId = useRef(null);
  const first = useRef(true);

  const targetX = useRef(0);
  const targetBaseY = useRef(0);
  const curX = useRef(-9999);
  const curY = useRef(-9999);
  const velX = useRef(0);
  const velY = useRef(0);
  const raf = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const navRightRef = useRef(0);
  const limitRef = useRef(0);

  const W = 340, H = 230, M = 10;
  // Render content at exact same width as main area so text wraps identically
  const innerW = contentWidth || 780;
  const scale = W / innerW;

  useEffect(() => {
    if (!visible) return;
    mousePos.current.x = initialMouseX || mousePos.current.x;
    const onMove = (e) => { mousePos.current.x = e.clientX; mousePos.current.y = e.clientY; };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [visible, initialMouseX]);

  useEffect(() => {
    if (!triggerEl?.getBoundingClientRect || !visible) return;
    const tR = triggerEl.getBoundingClientRect();
    const navEl = triggerEl.closest("nav");
    const navRight = navEl ? navEl.getBoundingClientRect().right : tR.right;
    navRightRef.current = navRight;
    limitRef.current = navRight + 60;

    const vh = window.innerHeight;
    const y = clamp(tR.top + tR.height / 2 - H / 2, M, vh - H - M);
    targetBaseY.current = y;

    if (first.current) {
      const cx = mousePos.current.x || initialMouseX || tR.right;
      const initX = cx + 5;
      curX.current = initX;
      curY.current = y;
      velX.current = 0;
      velY.current = 0;
      if (ref.current) {
        ref.current.style.left = initX + "px";
        ref.current.style.top = y + "px";
      }
      first.current = false;
    }
  }, [triggerEl, visible, page?.id]);

  useEffect(() => {
    if (!visible) {
      first.current = true;
      velX.current = 0;
      velY.current = 0;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) { first.current = true; return; }
    let on = true;
    const tick = () => {
      if (!on) return;
      const cx = mousePos.current.x;
      const idealX = cx + 40;
      const navR = navRightRef.current;
      const limit = limitRef.current;
      let tx;
      if (idealX <= navR) { tx = idealX; }
      else {
        const overshoot = idealX - navR;
        const range = limit - navR;
        const dampened = range * (overshoot / (overshoot + range));
        tx = navR + dampened;
      }
      targetX.current = tx;

      const freedom = clamp((cx - navR) / 150, 0, 1);
      const vh = window.innerHeight;
      const baseY = targetBaseY.current;
      let targetY = baseY;
      if (freedom > 0) {
        const cursorY = clamp(mousePos.current.y - H / 2, M, vh - H - M);
        targetY = baseY + (cursorY - baseY) * freedom * 0.04;
      }

      const dx = targetX.current - curX.current;
      velX.current = (velX.current + dx * 0.12) * 0.6;
      if (Math.sign(velX.current) !== Math.sign(dx) && Math.abs(dx) < 2) velX.current = 0;
      curX.current += velX.current;

      const dy = targetY - curY.current;
      velY.current = (velY.current + dy * 0.065) * 0.68;
      curY.current += velY.current;

      if (ref.current) {
        ref.current.style.left = curX.current + "px";
        ref.current.style.top = curY.current + "px";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { on = false; cancelAnimationFrame(raf.current); };
  }, [visible]);

  useEffect(() => {
    if (!page) return;
    if (prevId.current !== null && prevId.current !== page.id) {
      setFading(true);
      const t = setTimeout(() => { setContentKey(page.id); setFading(false); }, 80);
      return () => clearTimeout(t);
    } else setContentKey(page.id);
    prevId.current = page.id;
  }, [page?.id]);

  useEffect(() => { if (elRef) elRef.current = ref.current; });
  useEffect(() => {
    if (visible && !entered) requestAnimationFrame(() => setEntered(true));
    if (!visible) { const t = setTimeout(() => setEntered(false), 150); return () => clearTimeout(t); }
  }, [visible]);

  const show = visible && entered;
  const dp = PAGES.find(p => p.id === contentKey) || page;

  return (
    <div ref={ref} onClick={() => { if (show && dp) onClickPreview(dp.id, ref.current); }}
      style={{
        position: "fixed", left: -9999, top: -9999, zIndex: 9999, width: W,
        borderRadius: 14, background: "white", overflow: "hidden",
        boxShadow: show ? "0 24px 64px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)" : "none",
        opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.95)",
        transition: "opacity 150ms ease, transform 180ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms ease",
        pointerEvents: show ? "auto" : "none", willChange: "left, top",
        cursor: show ? "pointer" : "default",
      }}>
      <div style={{ height: H, overflow: "hidden", position: "relative" }}>
        <div key={contentKey} style={{
          width: innerW, transform: `scale(${scale})`, transformOrigin: "top left",
          pointerEvents: "none", userSelect: "none", overflow: "hidden",
          opacity: fading ? 0 : 0.68, transition: "opacity 80ms ease",
        }}>
          <div style={{ padding: "40px 48px" }}>
            <div style={{ maxWidth: 600 }}>
              {dp && <PageContent page={dp} />}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 40, background: "linear-gradient(to right, transparent, white)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to bottom, transparent, white)", pointerEvents: "none", zIndex: 1 }} />
      </div>
    </div>
  );
}

// ── Expand overlay: spring-animated morph from preview rect to content rect ──
function ExpandOverlay({ from, to, page, onDone, contentWidth }) {
  const ref = useRef(null);
  const innerRef = useRef(null);
  const fadeRRef = useRef(null);
  const fadeBRef = useRef(null);
  const startTime = useRef(null);
  const raf = useRef(null);

  const PREVIEW_W = 340;
  const INNER_W = contentWidth || Math.round(PREVIEW_W / 0.54);
  const PREVIEW_SCALE = PREVIEW_W / INNER_W;

  useEffect(() => {
    if (!from || !to || !ref.current) return;
    const el = ref.current;
    const inner = innerRef.current;
    const fadeR = fadeRRef.current;
    const fadeB = fadeBRef.current;
    const dur = 2000;
    let on = true;

    const ease = (t) => 1 - Math.exp(-6 * t) * (1 + 6 * t * 0.15);
    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = (now) => {
      if (!on) return;
      if (!startTime.current) startTime.current = now;
      const elapsed = now - startTime.current;
      const rawT = Math.min(elapsed / dur, 1);
      const t = ease(rawT);

      const curL = lerp(from.left, to.left, t);
      const curT = lerp(from.top, to.top, t);
      const curW = lerp(from.width, to.width, t);
      const curH = lerp(from.height, to.height, t);
      const curR = lerp(14, 0, t);

      // Content scale: starts at preview scale, ends at 1
      const curScale = lerp(PREVIEW_SCALE, 1, t);
      // Content opacity: starts at preview dimness, ends full
      const curContentO = lerp(0.68, 1, t);
      // Fade overlays dissolve
      const fadeO = lerp(1, 0, Math.min(rawT * 2.5, 1));

      const shadowO = lerp(0.11, 0, Math.max((rawT - 0.7) / 0.3, 0));
      const borderO = lerp(0.04, 0, Math.max((rawT - 0.8) / 0.2, 0));

      el.style.left = curL + "px";
      el.style.top = curT + "px";
      el.style.width = curW + "px";
      el.style.height = curH + "px";
      el.style.borderRadius = curR + "px";
      el.style.boxShadow = `0 ${lerp(24,0,t)}px ${lerp(64,0,t)}px rgba(0,0,0,${shadowO}), 0 0 0 1px rgba(0,0,0,${borderO})`;

      if (inner) {
        inner.style.transform = `scale(${curScale})`;
        inner.style.opacity = curContentO;
      }
      if (fadeR) fadeR.style.opacity = fadeO;
      if (fadeB) fadeB.style.opacity = fadeO;

      if (rawT < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => { on = false; cancelAnimationFrame(raf.current); };
  }, [from, to, onDone]);

  return (
    <div ref={ref} style={{
      position: "fixed", zIndex: 10000, overflow: "hidden",
      background: "white",
      left: from.left, top: from.top, width: from.width, height: from.height,
      borderRadius: 14,
      boxShadow: "0 24px 64px rgba(0,0,0,0.11), 0 0 0 1px rgba(0,0,0,0.04)",
      pointerEvents: "none",
    }}>
      <div ref={innerRef} style={{
        width: INNER_W, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left",
        opacity: 0.68, pointerEvents: "none", userSelect: "none",
      }}>
        <div style={{ padding: "40px 48px", maxWidth: 600 }}>
          <PageContent page={page} />
        </div>
      </div>
      <div ref={fadeRRef} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 40, background: "linear-gradient(to right, transparent, white)", pointerEvents: "none", zIndex: 1 }} />
      <div ref={fadeBRef} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to bottom, transparent, white)", pointerEvents: "none", zIndex: 1 }} />
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("intro");
  const [hovId, setHovId] = useState(null);
  const [vis, setVis] = useState(false);
  const trigEl = useRef(null);
  const initialMouseX = useRef(0);
  const surfEl = useRef(null);
  const enT = useRef(null), exT = useRef(null);
  const [anim, setAnim] = useState(false);
  const [dispActive, setDispActive] = useState("intro");
  const mainRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(null);

  useEffect(() => {
    if (!mainRef.current) return;
    const measure = () => {
      setContentWidth(mainRef.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(mainRef.current);
    return () => ro.disconnect();
  }, []);

  const [expandData, setExpandData] = useState(null);

  const onEnter = useCallback((id, el, e) => {
    clearTimeout(exT.current);
    trigEl.current = el;
    initialMouseX.current = e.clientX;
    setHovId(id);
    if (!vis) enT.current = setTimeout(() => setVis(true), 160);
  }, [vis]);

  const onLeave = useCallback(() => {
    clearTimeout(enT.current);
    exT.current = setTimeout(() => setVis(false), 100);
  }, []);

  const nav = useCallback((id) => {
    if (id === active) return;
    setAnim(true);
    setTimeout(() => { setActive(id); setDispActive(id); setTimeout(() => setAnim(false), 20); }, 130);
  }, [active]);

  const onClickPreview = useCallback((id, previewEl) => {
    if (!previewEl || !mainRef.current) { nav(id); return; }
    const from = previewEl.getBoundingClientRect();
    const to = mainRef.current.getBoundingClientRect();

    // Immediately hide preview and swap sidebar active state
    setVis(false);
    setHovId(null);
    setActive(id);

    setExpandData({
      from: { left: from.left, top: from.top, width: from.width, height: from.height },
      to: { left: to.left, top: to.top, width: to.width, height: to.height },
      pageId: id,
    });
  }, [nav]);

  const onExpandDone = useCallback(() => {
    setDispActive(expandData?.pageId);
    setExpandData(null);
  }, [expandData]);

  useEffect(() => {
    if (!vis || hovId === null) return;
    const onMove = (e) => {
      const tE = trigEl.current, sE = surfEl.current;
      if (!tE?.getBoundingClientRect) return;
      const x = e.clientX, y = e.clientY;
      const navEl = tE.closest("nav");
      const navR = navEl?.getBoundingClientRect();
      const tR = tE.getBoundingClientRect();
      if (navR && inR(navR, x, y)) { clearTimeout(exT.current); return; }
      const corridorTop = tR.top - 20;
      const corridorBottom = tR.bottom + 20;
      const corridorLeft = navR ? navR.right : tR.right;
      const corridorRight = sE ? sE.getBoundingClientRect().right + 10 : window.innerWidth;
      if (x >= corridorLeft && x <= corridorRight && y >= corridorTop && y <= corridorBottom) { clearTimeout(exT.current); return; }
      if (sE) {
        const sR = sE.getBoundingClientRect();
        if (x >= sR.left - 20 && x <= sR.right + 10 && y >= sR.top - 10 && y <= sR.bottom + 10) { clearTimeout(exT.current); return; }
      }
      clearTimeout(exT.current);
      setVis(false);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [vis, hovId]);

  const hovPage = PAGES.find(p => p.id === hovId);
  const activePage = PAGES.find(p => p.id === dispActive);
  const expandPage = expandData ? PAGES.find(p => p.id === expandData.pageId) : null;

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh",
      background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 20px", WebkitFontSmoothing: "antialiased",
    }}>
      <div data-card style={{
        display: "flex", width: "100%", maxWidth: 1020, height: "min(620px, calc(100vh - 64px))",
        background: "white", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.07)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", inset: -5, borderRadius: 25, pointerEvents: "none", border: `5px solid rgba(${C.pr}, 0.10)` }} />
        <nav style={{
          width: 240, flexShrink: 0, padding: "32px 20px 32px 28px",
          borderRight: "1px solid rgba(0,0,0,0.06)", background: C.sl,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Surface</div>
            <div style={{ fontSize: 12, color: C.tm, marginTop: 2 }}>Documentation</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {GROUPS.map(group => (
              <div key={group}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.tm, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {PAGES.filter(p => p.group === group).map(page => {
                    const isActive = active === page.id;
                    const isHov = hovId === page.id;
                    return (
                      <div key={page.id}
                        onClick={() => nav(page.id)}
                        onMouseEnter={e => onEnter(page.id, e.currentTarget, e)}
                        onMouseLeave={onLeave}
                        style={{
                          padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5,
                          fontWeight: isActive ? 560 : 400,
                          color: isActive ? C.accent : isHov ? C.text : C.tl,
                          background: isActive ? "white" : "transparent",
                          boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                          transition: "all 0.12s ease",
                        }}
                      >{page.title}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <main ref={mainRef} style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div style={{
            padding: "40px 48px",
            opacity: anim ? 0 : 1,
            transform: anim ? "translateY(5px)" : "translateY(0)",
            transition: anim ? "opacity 130ms ease, transform 130ms ease" : "none",
          }}>
            <div style={{ maxWidth: 600 }}>
              {activePage && <PageContent page={activePage} />}
            </div>
          </div>
        </main>
      </div>

      <SurfacePreview page={hovPage} triggerEl={trigEl.current} visible={vis} elRef={surfEl} initialMouseX={initialMouseX.current} onClickPreview={onClickPreview} contentWidth={contentWidth} />

      {expandData && expandPage && (
        <ExpandOverlay
          from={expandData.from}
          to={expandData.to}
          page={expandPage}
          onDone={onExpandDone}
          contentWidth={contentWidth}
        />
      )}

      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        padding: "8px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500,
        color: C.tm, background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      }}>
        Hover sidebar links to preview · Click preview to expand
      </div>
    </div>
  );
}
