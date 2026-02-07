import { useState, useEffect, useRef, useCallback } from "react";

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function inR(r, x, y) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

const PAGES = [
  // ── Field Guide ──
  {
    id: "intro", title: "Introduction", group: "Field Guide",
    content: {
      heading: "The Goblin Field Guide",
      lead: "The most comprehensive reference on goblinkind ever assembled. Compiled from decades of fieldwork by the Royal Cryptozoological Society, firsthand observations, recovered goblin manuscripts, and only a moderate number of poisoned darts to the neck.",
      sections: [
        { title: "Why study goblins?", body: "Goblins are among the most misunderstood creatures in the known world. Often dismissed as mere pests, they possess a rich culture, a surprisingly advanced understanding of mechanical engineering, and a culinary tradition that — while not for the faint of stomach — is genuinely innovative." },
        { title: "A word of caution", body: "If you are reading this in the field, please be aware that goblins can smell parchment from up to forty meters away. They consider the act of writing about them without permission to be a declaration of war. The Society accepts no liability for any consequences arising from the use of this guide in goblin-adjacent territories." },
        { title: "How to use this guide", body: "Navigate using the sidebar to explore different aspects of goblin civilization. Each section is designed to be read independently, so feel free to jump to whatever topic interests you most — or whatever topic is most immediately relevant to your survival." },
      ],
    },
  },
  {
    id: "history", title: "History", group: "Field Guide",
    content: {
      heading: "History of Goblins",
      lead: "From prehistoric burrow-dwellers to modern diplomats — twelve thousand years of goblin civilization, condensed for the surface-dwelling reader.",
      sections: [
        { title: "The Age of Burrows", body: "The earliest evidence of goblin civilization dates back roughly twelve thousand years, found in the Riddleback Caverns. Crude wall carvings depict small figures with pointed ears engaged in what archaeologists believe is either a religious ceremony or a very aggressive game of keep-away. Goblins relied on sharpened bone tools and an impressive array of improvised traps." },
        { title: "The Fungal Enlightenment", body: "The pivotal moment in goblin history was the domestication of the Great Cavern Mushroom. This allowed goblins to transition from nomadic scavenging to settled fungikulture. With reliable food came population growth, and with population growth came the first true goblin cities — including Skagrot, which housed over fifty thousand goblins at its peak." },
        { title: "The Surface Wars", body: "As populations expanded, clans competed for surface resources. This period saw the first organized goblin armies and the development of goblin metallurgy — initially bronze, then grak-tin, which is lighter than steel but has an unfortunate tendency to turn green. Seven centuries of territorial disputes, alliances, betrayals, and elaborate ambushes." },
        { title: "The Age of Tunnels", body: "Following the Surface Wars, goblins entered unprecedented engineering achievement. The Great Tunnel Network — connecting major settlements across three continents — was begun in 612 BE and is still being expanded today. This era also saw the formalization of goblin written language and the establishment of the Tinker Guilds." },
      ],
    },
  },
  {
    id: "types", title: "Types of Goblins", group: "Field Guide",
    content: {
      heading: "Types of Goblins",
      lead: "Thousands of years of adaptation to different environments have produced several distinct subspecies, classified under the Ashwick-Bramble taxonomy.",
      code: "Cave Goblin    (G. subterraneus)  — 60% of population\nForest Goblin  (G. silvaticus)   — surface-adapted\nBog Goblin     (G. paludis)      — semi-amphibious\nMountain Goblin (G. alpinus)     — high-altitude\nDesert Goblin  (G. aridus)       — rarest subspecies",
      sections: [
        { title: "Cave Goblins", body: "The most common subspecies. Pale green to grey skin, excellent darkvision, and an instinctive understanding of load-bearing structures. They are the builders of the Great Tunnel Network and keepers of the oldest goblin traditions. Distinctive features include large reflective eyes and slightly webbed fingers from generations of cave-pool fishing." },
        { title: "Forest Goblins", body: "Darker green with mottled brown patches, slightly taller, exceptional climbers. They live in elaborate treehouse communities connected by rope bridges and ziplines. They are the world's foremost experts on non-magical poisons, a fact that makes negotiations with them notably tense." },
        { title: "Bog Goblins", body: "Blue-green skin with a slightly slimy texture, partially amphibious. The only goblin subspecies known to practice meditation. 'Talking to a bog goblin is like talking to a very small, very green philosopher who might also stab you.' — Dr. Hamish Cray" },
        { title: "Mountain & Desert Goblins", body: "Mountain goblins are the hardiest subspecies — dark grey skin, stocky builds, resistant to cold and thin air. Renowned miners and gemcutters. Desert goblins are the rarest, with sandy yellow skin and extraordinary water conservation biology. They are the only goblins to domesticate animals — specifically, the giant sand beetle." },
      ],
    },
  },

  // ── Society ──
  {
    id: "society", title: "Overview", group: "Society",
    content: {
      heading: "Goblin Society",
      lead: "Complex, layered, and — to outsiders — frequently baffling. What appears chaotic on the surface is governed by an intricate web of social obligations, clan loyalties, and unwritten rules.",
      sections: [
        { title: "Clan-based identity", body: "Goblin communities are organized around the clan — an extended family unit numbering between fifty and three hundred individuals. A goblin's clan is their primary social unit, more important than settlement, profession, or personal preference. Clans occupy specific territories and are largely self-governing." },
        { title: "Meritocratic leadership", body: "Leaders earn their position through demonstrated competence, not inheritance. Major decisions require consensus among clan elders. Goblins keep meticulous records of debts, favors, and grudges — some dating back centuries." },
        { title: "Core values", body: "The core values, roughly in order of importance: loyalty to clan, resourcefulness (solving problems with what you have is more respected than having the best tools), persistence (giving up is shameful; failing after genuine effort is not), fairness in trade, and respect for craft." },
      ],
    },
  },
  {
    id: "hierarchy", title: "Social Hierarchy", group: "Society",
    content: {
      heading: "Social Hierarchy",
      lead: "Meritocratic with a strong emphasis on age and experience. Leadership is neither hereditary nor permanent — leaders serve at the pleasure of their community.",
      sections: [
        { title: "The Greybeard", body: "The eldest active clan member serves as primary decision-maker, mediator, and keeper of clan history. Despite the name, this role is not gender-specific. Responsibilities include final authority on disputes, keeping the clan's oral history and grudge-ledger, and being the first to taste communal meals — a safety role, not just an honor." },
        { title: "Council of Notables", body: "A group of 5-12 experienced goblins who advise the Greybeard. Membership is earned through recognized expertise: a master engineer, senior forager, war-captain, healer, trader with external contacts. A two-thirds majority is required for major decisions like territory disputes or war declarations." },
        { title: "The Grudge-Ledger", body: "Every clan maintains a meticulous record of debts, favors, insults, and their resolutions. It is both a legal document and a social scoreboard. Entries can date back generations. A goblin with a 'clean ledger' is considered exceptionally honorable. 'Among goblins, memory is justice. They don't forget, and they don't forgive — but they do negotiate.'" },
      ],
    },
  },
  {
    id: "customs", title: "Customs & Traditions", group: "Society",
    content: {
      heading: "Customs & Traditions",
      lead: "Goblin customs are numerous, specific, and often incomprehensible to outsiders. From naming ceremonies to seasonal festivals, ritual structures every phase of goblin life.",
      sections: [
        { title: "The Naming Ceremony", body: "Younglings receive a temporary 'milk-name' at birth. At age three, a formal ceremony is held where the Greybeard recites the clan's lineage, parents propose a name (usually honoring a deceased relative), and the Council votes to accept. Names have two parts — personal and clan — with some goblins earning a third 'deed-name' through exceptional accomplishment." },
        { title: "The Deepwalk", body: "A coming-of-age ritual at sixteen. The young goblin must navigate alone through an unfamiliar tunnel section. Future engineers face structural hazards, foragers must identify specific fungi, warriors must detect and disarm three traps. About 80% pass on their first try." },
        { title: "Seasonal Festivals", body: "The Spore Festival celebrates mushroom propagation with communal planting and the undignified 'Spore Dance.' The Long Dark commemorates the Age of Burrows — all lights extinguished, elders tell stories, grudges are declared or resolved. Hammerfest celebrates engineering with speed-forging, trap-building, and the 'Rube' contest for the most unnecessarily complex device." },
      ],
    },
  },
  {
    id: "language", title: "Language", group: "Society",
    content: {
      heading: "Language & Communication",
      lead: "Goblins communicate through spoken language, written script, and non-verbal signals — a rich system reflecting thousands of years of underground living.",
      code: "Thek-ga     \"I see you\"         (Hello)\nNok-thek    \"Into the dark\"     (Goodbye)\nGrak-zul    \"Stone-debt\"        (Thank you)\nNik-nik     \"Sharp-sharp\"       (Warning)\nBrol-thuum  \"Good stubbornness\" (Well done)\nKezzit      \"Sky-touched\"       (Outsider)",
      sections: [
        { title: "Gob'zhar", body: "The primary goblin tongue. Guttural and rapid, with fourteen words for 'darkness' and twenty-three for 'mushroom' but few words for sky or weather. Tonal elements mean the same syllable at different pitches has different meanings — 'grak' means 'stone' at low pitch, 'stubborn' at mid pitch, and 'grandmother' at high pitch. Goblins find the overlap hilarious." },
        { title: "No future tense", body: "Gob'zhar has a rich past tense with separate forms for 'witnessed,' 'told to me,' and 'found in records' — but no true future tense. Future events are expressed as intentions or possibilities, never certainties. Linguists believe this reflects the cultural attitude that promises about the future are inherently unreliable." },
        { title: "Tunnel signals", body: "In deep tunnels where sound echoes unpredictably, goblins use tap-code on stone walls (single tap: 'I am here,' continuous tapping: 'danger'), light signals with glowjars (steady: safe, flickering: caution, rapid: emergency), and scent markers from mushroom extracts for territorial boundaries and trail markers." },
      ],
    },
  },

  // ── Combat ──
  {
    id: "combat", title: "Warfare Overview", group: "Combat",
    content: {
      heading: "Combat & Warfare",
      lead: "Goblins are not, by nature, a warlike people. They would much rather be tinkering or arguing about stew recipes. But thousands of years of defending their territories have made them formidable fighters.",
      sections: [
        { title: "Avoidance", body: "The best fight is the one that never happens. Goblins invest heavily in deterrence — traps, wards, reputation — to avoid combat entirely. Their defensive infrastructure is so thorough that most potential aggressors reconsider after encountering the first trap network." },
        { title: "Asymmetry", body: "When fighting is unavoidable, goblins never fight fair. They use terrain, traps, ambushes, and superior knowledge of their environment to negate the size and strength advantages of their opponents. Open-field battle is avoided if any alternative exists." },
        { title: "Efficiency", body: "Goblin military doctrine prizes achieving objectives with minimum casualties and resource expenditure. A battle that achieves its goal but wastes lives is considered a failure. Goblins will abandon territory to preserve lives — settlements can be rebuilt; clan members cannot be replaced." },
      ],
    },
  },
  {
    id: "weapons", title: "Weapons & Armor", group: "Combat",
    content: {
      heading: "Weapons & Armor",
      lead: "Practical, efficient, and designed for fighters who are smaller than most of their opponents. Every goblin weapon doubles as a tool.",
      sections: [
        { title: "The Grak-blade", body: "The standard goblin sidearm. A short, heavy-backed blade roughly 40cm long, designed for close-quarters tunnel fighting. Single-edged with a curved tip optimized for slashing in confined spaces. Made from grak-tin alloy — lighter than steel, holds a decent edge. The green patina that develops over time is considered a sign of a well-used weapon." },
        { title: "Ranged weapons", body: "Slings are the weapon of choice — cheap, silent, devastating at close range in tunnels. Forest goblins favor blowguns delivering poisoned darts with near-total silence. Mountain goblins developed a compact crossbow that fires one-handed, with barbed bolts that are extremely difficult to remove — a deliberate design choice." },
        { title: "Armor philosophy", body: "Goblin armor prioritizes mobility over protection. A goblin in heavy plate is one who can't run, climb, or squeeze through escape tunnels. Standard kit is a hardened leather cuirass with grak-tin plates at vital points, arm wraps, and a skull cap with ear slits — goblin ears are important for spatial awareness in the dark. No leg armor. Mobility is too important." },
        { title: "Traps", body: "In many ways the goblin's primary weapon. A well-trapped tunnel can stop a force many times the defending clan's size. Pitfalls, triggered rockfalls, spring-loaded nets, alarm devices, and the classic: a pressure plate connected to a mechanism that drops a large rock on your head. 'Never be the first through a goblin doorway. Never be the second either.'" },
      ],
    },
  },
  {
    id: "tactics", title: "Battle Tactics", group: "Combat",
    content: {
      heading: "Battle Tactics",
      lead: "Refined over millennia of fighting opponents who are almost always bigger, stronger, and more numerous. A sophisticated approach that frustrates conventional military thinkers.",
      code: "The Funnel (tunnel defense):\n  Wide entrance → Trap zone 1\n    → Narrowing passage (ranged fire)\n      → Trap zone 2\n        → Choke point (3 defenders hold)\n          → Escape route (collapse if needed)",
      sections: [
        { title: "Strike and vanish", body: "Goblin forces rarely hold ground against superior forces. They attack from ambush, inflict casualties, and withdraw before the enemy can respond. They use escape tunnels too small for larger species, rotate fresh fighters to maintain constant pressure, and fight in shifts — a war-band can maintain harassment operations indefinitely." },
        { title: "The False Retreat", body: "A goblin classic. Fighters appear to flee in panic, drawing pursuers into a prepared trap zone. The 'retreating' goblins know exactly where the traps are and run between them. The pursuers do not. 'We've fallen for the false retreat four times this campaign. We know it's a trick. We fall for it anyway.' — Captain Aldric Voss" },
        { title: "Psychological warfare", body: "Rhythmic drumming from multiple directions, continuing for hours, stopping suddenly, starting again when you're almost asleep. Distant echoing laughter in the dark. Leaving small gifts in places the enemy thought were secure — a polished stone, a mushroom, a note. The message: 'We were here. We chose not to kill you. This time.'" },
      ],
    },
  },

  // ── Disciplines ──
  {
    id: "magic", title: "Goblin Magic", group: "Disciplines",
    content: {
      heading: "Goblin Magic",
      lead: "Rooted in Grak'thuum — 'the stubbornness of things.' Where other traditions draw from ley lines or divine sources, goblin magic negotiates with the natural resistance of objects to change.",
      code: "The Three Laws of Grak'thuum:\n  1. Nothing changes without agreement\n  2. The smaller the change, the easier the agreement\n  3. Every agreement has a price",
      sections: [
        { title: "How it works", body: "Goblin magical theory holds that all objects have a natural tendency to resist change. A rock wants to stay a rock. Goblin mages don't override this resistance — they negotiate with it. This makes goblin magic slow (spells require hours of preparation), reliable (effects rarely misfire), material-dependent, and persistent (enchantments can last centuries)." },
        { title: "Wardcraft & Fungimancy", body: "Wardcraft places protective enchantments on locations and objects — tunnel stability wards, alarm wards, preservation wards, and the infamous 'embarrassment ward' that causes intruders to trip repeatedly. Fungimancy is unique to goblins: accelerating mushroom growth, creating bioluminescent lighting, and the Fungal Telegraph — magically enhanced mycelium connecting goblin cities." },
        { title: "Tinkermancy", body: "The intersection of engineering and magic. Tinkermancers create devices that shouldn't work according to conventional physics but do anyway because the goblin was too stubborn to accept that they couldn't. Achievements include self-winding clockwork with no energy source, lamps that 'convince' metal to glow, and the Goblin Calculator — which performs complex mathematics but only if you argue with it first." },
      ],
    },
  },
  {
    id: "cuisine", title: "Cuisine & Foraging", group: "Disciplines",
    content: {
      heading: "Cuisine & Foraging",
      lead: "An acquired taste — and most non-goblins never acquire it. Built around fungi, supplemented by insects and cave fish, goblin cooking is inventive, nutritious, and deeply alarming to the uninitiated.",
      sections: [
        { title: "The Mushroom Pantry", body: "Goblins cultivate over three hundred mushroom varieties. Pale Cap is the staple (bland but filling). Ember Shroom is an extremely hot spice (handle with gloves). Glowbell serves as garnish and lighting. Deeproot Truffle is worth more than gold by weight. And Dreamdrift is fermented into a mildly hallucinogenic alcohol." },
        { title: "Skagrot Stew", body: "The national dish of goblinkind. Every clan has their own recipe, and arguments about the 'correct' version have caused at least three documented wars. The basic recipe involves soaking dried pale caps overnight, sauteing cave crickets in rendered beetle fat, adding chopped stonecap and ember shroom flakes, simmering for six hours in a stone pot. 'It tastes like a forest floor gained sentience and decided to be delicious.'" },
        { title: "Foraging practices", body: "Goblin foragers follow strict sustainable harvesting rules: the Rule of Thirds (never harvest more than a third of any wild colony), the Rotation Calendar (different zones harvested on a three-year cycle), and the Spore Debt (for every mushroom harvested, scatter spores of cultivated varieties). These practices have kept goblin territories ecologically stable for thousands of years." },
        { title: "Dining etiquette", body: "Meals are communal. The eldest eats first (to confirm the food isn't poisoned). Food is served in a central pot; everyone shares. Complimenting the cook is mandatory. Asking for the recipe is a major insult — recipes are clan secrets. Belching after the meal is a compliment. Leaving food uneaten is unacceptable." },
      ],
    },
  },
  {
    id: "engineering", title: "Engineering", group: "Disciplines",
    content: {
      heading: "Goblin Engineering",
      lead: "The one field where goblins have earned universal respect — however grudging. Goblin-built mechanisms routinely outperform surface-world equivalents using a fraction of the materials.",
      code: "Guild Ranks:\n  Fumbler      → Apprentice (years 1-3)\n  Fiddler      → Journeyman (years 4-8)\n  Tinkerer     → Full engineer (years 9+)\n  Grand Cog    → Master (peer election)\n  Gearmother   → Guild leader (one per region)",
      sections: [
        { title: "Core principles", body: "Three principles every apprentice learns on day one: 'If it works, it's not stupid' — every bent pipe and asymmetric gear serves a purpose. 'Waste nothing' — a single ingot might be distributed across dozens of components. 'Build for the next thousand years' — the oldest functioning goblin mechanisms are over three thousand years old." },
        { title: "The Great Tunnel Network", body: "Spanning three continents and totaling 40,000 kilometers, the largest engineering project in the world. Features ventilation systems maintaining breathable air throughout, drainage preventing flooding, acoustic design allowing whispered conversation to carry for kilometers, and self-maintaining structural wards created in collaboration with goblin mages." },
        { title: "Why it works", body: "The secret is patience and iteration. Where surface engineers design on paper and build once, goblin engineers prototype relentlessly — dozens of physical prototypes before construction begins. They maintain extensive archives of failed designs, studied as carefully as successful ones. 'I watched a goblin engineer fix a device I'd struggled with for weeks. She hit it twice with a hammer, bent a pipe, and walked away. It worked perfectly. I have two advanced degrees.'" },
      ],
    },
  },
];

const GROUPS = [...new Set(PAGES.map(p => p.group))];

// Goblin-themed color scheme: earthy greens, cave stone, torchlight warmth
const C = {
  accent: "#1b3d2f",     // Deep forest/cave green
  pr: "91,140,90",        // Mossy green RGB
  primary: "#5b8c5a",     // Mossy green
  sl: "#f3efe8",          // Parchment sidebar
  text: "#1a1c1a",        // Near-black
  tl: "#3d4a3d",          // Dark green-grey
  tm: "#7a8a7a",          // Medium green-grey
  bg: "#e4ddd2",          // Warm parchment / cave stone
};

function PageContent({ page, preview }) {
  const c = page.content;
  if (preview) return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5, lineHeight: 1.2 }}>{c.heading}</div>
      <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.55, marginBottom: 10 }}>{c.lead}</div>
      {c.code && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#1e2a1e", color: "#a5c4a0", fontSize: 12, fontFamily: "monospace", marginBottom: 10, whiteSpace: "pre" }}>{c.code}</div>}
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
      {c.code && <div style={{ padding: "16px 20px", borderRadius: 10, background: "#1e2a1e", color: "#a5c4a0", fontSize: 14, fontFamily: "monospace", marginBottom: 36, whiteSpace: "pre", lineHeight: 1.6 }}>{c.code}</div>}
      {c.sections?.map((s, i) => (
        <div key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 650, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>{s.title}</h2>
          <p style={{ fontSize: 15, color: C.tl, lineHeight: 1.7, margin: 0, maxWidth: 560 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

// ── Surface preview: spring-physics popup that follows cursor ──
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

      const curScale = lerp(PREVIEW_SCALE, 1, t);
      const curContentO = lerp(0.68, 1, t);
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
        display: "flex", width: "100%", maxWidth: 1020, height: "min(680px, calc(100vh - 64px))",
        background: "white", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.07)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", inset: -5, borderRadius: 25, pointerEvents: "none", border: `5px solid rgba(${C.pr}, 0.10)` }} />
        <nav style={{
          width: 240, flexShrink: 0, padding: "32px 20px 32px 28px",
          borderRight: "1px solid rgba(0,0,0,0.06)", background: C.sl,
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Goblin Field Guide</div>
            <div style={{ fontSize: 12, color: C.tm, marginTop: 2 }}>Royal Cryptozoological Society</div>
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
