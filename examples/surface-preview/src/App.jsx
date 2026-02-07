import { useState, useEffect, useRef, useCallback } from "react";

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function inR(r, x, y) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

const PAGES = [
  { id: "intro", title: "The Goblin Field Guide", group: "Overview", content: { heading: "The Goblin Field Guide", lead: "A comprehensive reference for understanding goblin culture, biology, and civilization. From their ancient subterranean origins to modern surface relations.", sections: [{ title: "Why study goblins?", body: "Goblins are among the most misunderstood creatures in the known world. Far from the mindless monsters of popular fiction, they possess rich cultural traditions, surprisingly advanced engineering capabilities, and a complex social structure that has endured for millennia. This guide covers their social structures, battlefield tactics, and unique relationship with mushrooms and tunnel networks." }, { title: "A word of caution", body: "Goblins are extremely sensitive to written documentation about them. They can smell parchment from 40 meters away and tend to consider any unauthorized field research as a declaration of war. If you are reading this in goblin territory, we recommend doing so very quietly." }, { title: "Quick reference", body: "Average height: 0.9–1.2m. Lifespan: 60–80 years. Diet: omnivorous with mushroom bias. Languages: Gob'zhar (primary), Common (trade). Temperament: curious, territorial, grudge-holding. Estimated population: 2.3 million." }] } },
  { id: "history", title: "History", group: "Overview", content: { heading: "History of Goblins", lead: "From prehistoric burrow-dwellers to modern engineers — a civilization shaped by darkness, fungus, and stubborn ingenuity.", sections: [{ title: "The Age of Burrows (Prehistory – 3000 BE)", body: "The earliest evidence of goblin civilization comes from the Riddleback Caverns. Subterranean living in natural cave systems expanded into purpose-built burrow networks. Bone tools, primitive traps, and the first attempts at underground agriculture mark this era. Remarkably, some of these ancient traps remain active to this day." }, { title: "The Fungal Enlightenment (3000 – 1500 BE)", body: "The domestication of the Great Cavern Mushroom transformed goblin society. The transition from nomadic foraging to settled fungikulture enabled the first goblin cities, including the Skagrot metropolis housing over 50,000 goblins — complete with multi-level warrens, mushroom farms, sewage systems, and libraries carved from living rock." }, { title: "The Age of Tunnels (800 BE – 400 CE)", body: "The greatest engineering achievement in goblin history: the Great Tunnel Network, begun in 612 BE and eventually spanning over 40,000 kilometers across three continents. This era also saw the formalization of written language, the establishment of the Tinker Guilds, and the invention of the goblin pressure clock." }, { title: "Modern Era (400 CE – Present)", body: "Increased contact with surface-dwelling races has led to complex trade relationships. The Treaty of Copperdeep (1847 CE) established the first formal diplomatic relations. The founding of the Goblin Technical Institute in 1923 CE marked goblins' growing influence on surface-world engineering." }] } },
  { id: "types", title: "Types of Goblins", group: "Overview", content: { heading: "Types of Goblins", lead: "Five major subspecies have adapted to radically different environments, each developing unique physical traits and cultural practices.", sections: [{ title: "Cave Goblins (Goblinus subterraneus)", body: "The most common subspecies at 60% of the total population. Pale green to grey skin, excellent darkvision, reflective eyes, and webbed fingers. Average height 1.0m. Builders of the Great Tunnel Network and masters of underground architecture with an intuitive understanding of load-bearing structures." }, { title: "Forest Goblins (Goblinus silvaticus)", body: "Diverged from cave goblins roughly 4,000 years ago. Darker green skin with brown patches provides natural camouflage. Exceptional climbers who build elaborate treehouse communities connected by rope bridges and ziplines. The world's foremost experts on non-magical poisons." }, { title: "Bog Goblins (Goblinus paludis)", body: "Wetland dwellers with blue-green slimy skin and partial amphibious capability — they can hold their breath for up to 20 minutes. The smallest communities but the most philosophical disposition. They practice meditation, build on stilts, and cultivate rare aquatic mushrooms found nowhere else." }, { title: "Mountain Goblins (Goblinus alpinus)", body: "The hardiest subspecies with dark grey to charcoal skin and stocky, dense builds. Resistant to cold and thin air. Renowned miners and gemcutters whose precision work is sought after across the known world." }, { title: "Desert Goblins (Goblinus aridus)", body: "The rarest subspecies with sandy yellow to orange skin. The smallest of all goblins at 0.85m average height, but possessing extraordinary water conservation abilities. Nomadic underground dwellers who have domesticated giant sand beetles for riding." }] } },
  { id: "society", title: "Society", group: "Society & Culture", content: { heading: "Goblin Society", lead: "A complex, layered civilization governed by social obligations, clan loyalties, and an intricate web of unwritten rules that outsiders rarely comprehend.", sections: [{ title: "Clan structure", body: "The clan is the primary social unit — typically 50 to 300 members bound by blood, marriage, or formal adoption. Clan identity supersedes all other affiliations. Governance is meritocratic: leaders earn their position through demonstrated competence, not inheritance. Major decisions require consensus among a council of elders." }, { title: "Core values", body: "In order of importance: loyalty to clan, resourcefulness, persistence, fairness in trade, and respect for craft. These values permeate every aspect of goblin life, from how disputes are settled to how meals are served. A goblin who violates these principles faces social consequences far worse than any legal punishment." }, { title: "The Grudge-Ledger", body: "Every clan maintains a meticulous record of debts, favors, insults, and their resolutions. A 'clean ledger' represents exceptional honor, while a 'heavy ledger' means reduced standing. These records span generations — a debt owed to your great-grandmother is still a debt owed to your clan." }] } },
  { id: "hierarchy", title: "Social Hierarchy", group: "Society & Culture", content: { heading: "Social Hierarchy", lead: "Goblin society is stratified but permeable. Status is earned through skill and contribution, never inherited.", sections: [{ title: "The Greybeard", body: "The eldest active clan member serves as primary decision-maker, mediator, history keeper, and grudge-ledger keeper. They represent the clan in inter-clan affairs and, by tradition, take the first bite of every communal meal — originally a practical measure to test for poison, now a mark of honor." }, { title: "Council of Notables", body: "Five to twelve experienced goblins who advise the Greybeard: typically a master engineer, head forager, war-captain, chief healer, lead trader, and craft specialists. Major decisions require a two-thirds majority vote. The Council can overrule the Greybeard on matters of clan survival." }, { title: "Crafters and Specialists", body: "The skilled middle class — engineers, fungimancers, healers, scribes, and artisans. Each discipline is governed by its own guild with standards for training and advancement. Master-level crafters hold significant social influence, sometimes rivaling Council members." }, { title: "Younglings", body: "Goblins under the age of twelve have no formal social standing but are universally protected. Harming a youngling — of any clan, even an enemy's — is punishable by permanent exile, the most severe sentence in goblin law." }] } },
  { id: "customs", title: "Customs & Traditions", group: "Society & Culture", content: { heading: "Customs & Traditions", lead: "Rituals that mark the passage of time, the milestones of life, and the rhythms of underground existence.", sections: [{ title: "The Naming Ceremony", body: "At birth, a goblin receives a temporary 'milk-name.' At age three, the true name is bestowed: the Greybeard recites the full clan lineage, parents propose a name honoring a deceased ancestor or notable achievement, the Council votes, and the name is inscribed in the clan register. Names are typically two-part — personal plus clan — with an earned 'deed-name' added later." }, { title: "The Deepwalk", body: "The coming-of-age ritual at age sixteen. A young goblin must navigate solo through an unfamiliar tunnel system chosen by the Council. The route's difficulty varies by intended craft. Success rate on first attempt is 80%. Failure carries no shame and the walk can be retried, but the experience is transformative regardless of outcome." }, { title: "Seasonal Festivals", body: "The Spore Festival (spring) celebrates mushroom propagation with planting competitions and the Spore Dance. The Long Dark (winter solstice) is a day of complete darkness — all lights extinguished for meditation and elder storytelling, ending when the youngest clan member rekindles the lamps. Hammerfest (autumn) showcases engineering with invention demonstrations and competitive events including speed-forging and trap-building." }] } },
  { id: "language", title: "Language", group: "Society & Culture", content: { heading: "Language & Communication", lead: "From the guttural cadences of Gob'zhar to tap-codes echoing through miles of stone — goblins have developed communication systems as complex as their tunnels.", sections: [{ title: "Gob'zhar: The Goblin Tongue", body: "The primary language of goblinkind is guttural and rapid, with a vast underground vocabulary: 14 words for different types of darkness, 23 for varieties of mushroom, but almost none for sky or weather. Tonal elements change meaning — 'grak' can mean stone, stubborn, or grandmother depending on pitch. Notably, there is no future tense. The past includes distinctions between 'witnessed,' 'told to me,' and 'found in records.'" }, { title: "Tunnel Signals", body: "Non-verbal systems for underground communication. Tap-code: wall taps audible through rock (single for 'I'm here,' triple-rapid for 'come here,' continuous for 'danger—avoid'). Light signals using glowjars: steady for safe passage, flickering for caution, rapid flash for emergency. Scent markers using mushroom extracts for boundaries, safe water, and trail marking." }, { title: "Trade Common", body: "The surface-dweller variant is rich with mining and engineering metaphors, avoids future-tense constructions, and is peppered with the phrase 'fair trade?' as a conversational filler. Goblins famously struggle with the 'th' sound, rendering it as 'z' or 'd' — a source of endless amusement to them and frustration to language instructors." }] } },
  { id: "combat", title: "Combat & Warfare", group: "Combat", content: { heading: "Combat & Warfare", lead: "Goblins are not naturally warlike — they would rather tinker, farm, or cook. But when defending their territories, they are formidable opponents who turn terrain itself into a weapon.", sections: [{ title: "Doctrine", body: "Three characteristics define goblin warfare: Avoidance (traps, wards, and reputation do the fighting before anyone shows up), Asymmetry (never fight on the enemy's terms — use terrain, traps, and ambushes), and Efficiency (minimum casualties and resources expended for maximum effect). A well-prepared goblin warren has never been successfully invaded." }, { title: "Military organization", body: "Clan-based war-bands scale with clan size: 8–12 fighters for clans under 50, up to 30–60 for larger clans of 150–300. Inter-clan alliances are common through formal treaties. The largest recorded goblin force — 8,000 fighters from 47 clans — assembled during the Border War of 1612 CE." }, { title: "Psychological warfare", body: "Drums from multiple directions create confusion about numbers and position. Distant echoing laughter unnerves invaders. Items left in supposedly secure locations suggest the defenses have already been breached. And 'The Silence' — the sudden cessation of all harassment after days of constant pressure — is reportedly the most terrifying tactic of all." }] } },
  { id: "weapons", title: "Weapons & Armor", group: "Combat", content: { heading: "Weapons & Armor", lead: "Designed for tunnel fighting: compact, multi-purpose, and devastatingly effective in confined spaces.", sections: [{ title: "Melee weapons", body: "The Grak-blade is a 40cm short, heavy-backed blade made from grak-tin alloy — lighter than steel with a curved slashing tip. The Tunnel Pick serves dual purpose as tool and weapon with a pointed pick on one side and flat hammer on the other. The Barb-staff is a 1.5m staff with retractable barbs at both ends, switchable between spear and staff configuration via a wrist mechanism." }, { title: "Ranged weapons", body: "Slings are cheap, silent, and devastatingly effective in tunnels at 30 meters. Forest goblins favor blowguns with poisoned darts ranging from paralytic to lethal. Mountain goblins developed compact crossbows that can be cocked and fired one-handed, with barbed bolts designed to be difficult to remove." }, { title: "Armor philosophy", body: "Mobility over protection, always. A typical kit: leather cuirass with grak-tin plates over vitals, forearm wraps, and a simple skull cap that preserves the ears' spatial awareness. No leg armor — speed matters more than coverage. Specialist variants include padded trap-layer suits, scent-masked scout leather, and the shield-shell: a dome worn on the back." }, { title: "Traps", body: "The primary goblin weapon. A well-trapped tunnel can stop a force ten times the defenders' size. Types include pitfalls with or without spikes, triggered rockfalls, spring-loaded net traps, and non-lethal alarm traps. The classic goblin trap — a pressure-plate triggered rock drop — has remained effective for three thousand years because it never fails." }] } },
  { id: "tactics", title: "Battle Tactics", group: "Combat", content: { heading: "Battle Tactics", lead: "Four principles: control the environment, strike and vanish, make them pay for every step, know when to abandon.", sections: [{ title: "Common formations", body: "The Funnel: tunnel defense with progressively narrower passages that thin the enemy formation. The Carousel: rotating attack groups strike from different directions in harassment cycles. The False Retreat: appearing to flee while drawing pursuers into prepared kill zones. The Deep Siege: digging beneath fortifications to emerge inside — a tactic that has ended more sieges than any battering ram." }, { title: "Environmental control", body: "Goblins fight in prepared killing zones with pre-positioned traps, collapsible tunnel sections, and environmental hazards. They use darkness, smoke, and scent to disorient. They never fight in open fields. If forced to the surface, they dig in immediately, creating field fortifications in hours that would take surface armies days." }, { title: "Rules of engagement", body: "Even in war, goblins observe rules: no targeting younglings of any clan, surrender is accepted and prisoners ransomed, healers are immune from attack, water sources are protected, and the parley flag — a white mushroom on a stick — is always respected. Violation of these rules transforms a territorial dispute into a generational grudge." }] } },
  { id: "magic", title: "Goblin Magic", group: "Craft & Knowledge", content: { heading: "Goblin Magic", lead: "Grak'thuum — 'the stubbornness of things.' Goblin magic doesn't force change. It negotiates with the resistance objects have to being altered.", sections: [{ title: "Theoretical foundations", body: "Three laws govern all goblin magic: nothing changes without agreement, smaller changes are easier than large ones, and every agreement has a price. This makes goblin magic slow (hours of preparation), reliable (effects rarely fail), material-dependent (specific components required), and remarkably persistent — enchantments can last centuries." }, { title: "Schools of magic", body: "Wardcraft protects tunnels and possessions. Fungimancy — unique to goblins — enables magical cultivation of fungi, bioluminescent lighting systems, and the Fungal Telegraph for underground message transmission. Tinkermancy merges magic with engineering: self-winding clockwork, light-producing metal lamps, and the famous Goblin Calculator (which requires you to argue with it). Gloomweaving, practiced by bog goblins, manipulates shadow and darkness." }, { title: "Limitations", body: "Goblin magic cannot affect living creatures directly, cannot create something from nothing, cannot work quickly under pressure (there are no goblin battle-mages), and cannot be learned by non-goblins. Only about 1 in 200 goblins have magical aptitude, but magical products — ward-stones, fungimancy lighting, tinkermancy devices — are ubiquitous in daily life." }] } },
  { id: "cuisine", title: "Cuisine & Foraging", group: "Craft & Knowledge", content: { heading: "Cuisine & Foraging", lead: "Over 300 cultivated mushroom varieties form the foundation of a culinary tradition that is equal parts science, art, and survival strategy.", sections: [{ title: "The Mushroom Pantry", body: "Key varieties include Pale Cap (the staple, ground into bread flour), Ember Shroom (a spice so hot it causes temporary blindness), Glowbell (bioluminescent garnish that doubles as table lighting), Deeproot Truffle (worth more than gold by weight), Stonecap (takes three days to grind into flour), and Dreamdrift (fermented into mildly hallucinogenic alcohol)." }, { title: "Signature dishes", body: "Skagrot Stew is the national dish — slow-cooked for six hours with pale caps, cave crickets, stonecap thickener, ember shroom heat, and glowbell garnish. Regional variations cause genuine inter-clan disputes. Crunchbread, a flatbread made from stonecap flour mixed with ground beetle carapace, keeps for months. Bogwater Tea — moss and fungi steeped in carbonated spring water — is one of the few goblin foods that surface-dwellers actually enjoy." }, { title: "Foraging ethics", body: "The Rule of Thirds: never harvest more than one-third of any mushroom colony. The Rotation Calendar enforces three-year harvest cycles. Spore Debt requires scattering spores to replace each harvested mushroom. These sustainable practices have maintained fungal ecosystems for thousands of years." }, { title: "Dining etiquette", body: "The eldest eats first (originally a poison test, now an honor). Meals are communal from a shared central pot. Complimenting the cook is mandatory. Requesting a recipe is deeply insulting. Belching after a meal is the highest compliment. Leaving food uneaten is unacceptable." }] } },
  { id: "engineering", title: "Engineering", group: "Craft & Knowledge", content: { heading: "Goblin Engineering", lead: "Three guiding principles: if it works, it's not stupid. Waste nothing. Build for the next thousand years.", sections: [{ title: "The Tinker Guilds", body: "A network of professional organizations controlling training, standards, and knowledge distribution. Ranks progress from Fumbler (years 1–3) through Fiddler (4–8), Tinkerer (9+), Grand Cog (master), to Gearmother or Gearfather (guild leader). Achieving full Tinkerer rank requires producing a masterwork — a device of original design that the guild judges worthy of preservation." }, { title: "Notable achievements", body: "The Great Tunnel Network spans 40,000 kilometers across three continents with ventilation systems, drainage, acoustic design, and self-maintaining structural wards. The Copperdeep Clock has kept perfect time for over 600 years without external power — human engineers cannot explain the mechanism. Pressure Lifts use water pressure and counterweights to silently raise multi-ton loads through hundreds of meters of vertical shaft." }, { title: "Common devices", body: "Drip-clocks for timekeeping, clicksprings for mechanical fire-starting, tunnelbores with rotating drill heads, glowjars providing indefinite bioluminescent light, chatterpipes for acoustic communication over kilometers, and springlocks for mechanical security. Every device follows the same philosophy: simple, repairable, and built to outlast its maker." }, { title: "Why it works", body: "Patience and iteration. Goblins prototype extensively before committing to construction. They maintain comprehensive archives of both failures and successes spanning centuries. And they assess materials through an intuitive process of tapping, smelling, and licking that no surface-world materials scientist has been able to replicate." }] } },
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
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Goblin Field Guide</div>
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
