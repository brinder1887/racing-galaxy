import { useState, useEffect, useRef } from "react";
import { loadState, saveState, subscribeState } from "./firebase.js";

const RANKS = [
  { name: "Cadet", rp: 0, color: "#1E3799", emoji: "🧑‍🚀" },
  { name: "Astronaut", rp: 10, color: "#4FA8E0", emoji: "👨‍🚀" },
  { name: "Explorer", rp: 25, color: "#2ECC71", emoji: "🛰️" },
  { name: "Commander", rp: 50, color: "#FF9F43", emoji: "🚀" },
  { name: "Galaxy Hero", rp: 100, color: "#FF4757", emoji: "🏆" },
];

const MISSION_TYPES = [
  { id: "quick", label: "Quick Fuel", sub: "Easy peasy!", fuel: 1, rp: 0, color: "#4FA8E0" },
  { id: "mission", label: "Mission Fuel", sub: "Today's big job", fuel: 2, rp: 0, color: "#2ECC71" },
  { id: "boost", label: "Boost Fuel", sub: "Extra rocket power", fuel: 3, rp: 1, color: "#FF9F43" },
];

const DEFAULT_TASKS = [
  { id: "t1", name: "Brush your teeth", type: "quick", emoji: "🪥" },
  { id: "t2", name: "Take a shower", type: "quick", emoji: "🚿" },
  { id: "t3", name: "Tidy up your room", type: "quick", emoji: "🧸" },
  { id: "t4", name: "Read for 20 minutes", type: "mission", emoji: "📚" },
  { id: "t4b", name: "Write for 20 minutes", type: "mission", emoji: "✍️" },
  { id: "t5", name: "Help with chores", type: "mission", emoji: "🧹" },
  { id: "t6", name: "Do something kind", type: "boost", emoji: "💖" },
  { id: "t7", name: "Active play 20+ min (indoor OK!)", type: "boost", emoji: "🤸" },
  { id: "t8", name: "Learn something new 15 min", type: "boost", emoji: "🧠" },
];

const REWARDS = [
  { id: "r1a", name: "Mission Control walkie-talkie", fuel: 5, emoji: "📻", color: "#FF9F43", desc: "You get real walkie-talkies! You direct Dad through an errand like a real mission commander." },
  { id: "r1b", name: "Pit Crew car wash together", fuel: 5, emoji: "🧼", color: "#FF9F43", desc: "Team up with Dad to wash and check the real car together — tools included!" },
  { id: "r1c", name: "Parking lot driving time", fuel: 5, emoji: "🚗", color: "#FF9F43", desc: "A real driving turn in a safe parking lot, hands on the wheel!" },
  { id: "r2", name: "Baskin Robbins scoop", fuel: 15, emoji: "🍦", color: "#FF4757", desc: "Pick your favorite flavor scoop at Baskin Robbins!" },
  { id: "r4", name: "Indoor play area visit", fuel: 25, emoji: "🛝", color: "#2ECC71", desc: "A trip to your favorite indoor play area — climb, slide, and jump!" },
  { id: "r7", name: "Toy worth QAR 25", fuel: 25, emoji: "🧩", color: "#4FA8E0", desc: "Pick any toy you love worth up to QAR 25!" },
  { id: "r8", name: "Toy worth QAR 50", fuel: 50, emoji: "🎁", color: "#4FA8E0", desc: "Pick any toy you love worth up to QAR 50!" },
];

const MILESTONES = [
  { id: "m2", name: "Car Show or Movie Night", rp: 75, emoji: "🎬", desc: "Celebrate your progress with a car show visit or a movie night pick — your choice!" },
  { id: "m1", name: "Go-Karting Session", rp: 100, emoji: "🏎️", desc: "Race real go-karts at the track — full speed ahead! The ultimate Galaxy Hero prize." },
];

const BANK_REWARD = { name: "VIP Go-Kart Day", fuel: 100, emoji: "🎉" };
const SHIELD_COST = 2;
const DAILY_BONUS_THRESHOLD = 5;
const DAILY_BONUS_RP = 1;

const BADGES = [
  { id: "b1", name: "First Launch", desc: "Finish 1 mission", emoji: "🚀", target: 1, get: (s) => s.totalCompleted, color: "#4FA8E0" },
  { id: "b2", name: "Week Warrior", desc: "7 day streak", emoji: "🔥", target: 7, get: (s) => s.streak, color: "#FF4757" },
  { id: "b3", name: "Fuel Saver", desc: "Save 50 Fuel", emoji: "🔐", target: 50, get: (s) => s.totalFuelBanked, color: "#FF9F43" },
  { id: "b4", name: "Commander", desc: "Reach Commander", emoji: "🌟", target: 50, get: (s) => s.rp, color: "#FF9F43" },
  { id: "b5", name: "Galaxy Hero", desc: "Top rank!", emoji: "🏆", target: 100, get: (s) => s.rp, color: "#FF4757" },
  { id: "b6", name: "Pit Crew Pro", desc: "Redeem 5 prizes", emoji: "🔧", target: 5, get: (s) => s.totalRedeemed, color: "#2ECC71" },
];

function rankFor(rp) {
  let current = RANKS[0];
  for (const r of RANKS) if (rp >= r.rp) current = r;
  const idx = RANKS.indexOf(current);
  const next = RANKS[idx + 1] || null;
  return { current, next };
}

function todayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekKey(d) {
  const date = new Date(d);
  const first = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - first) / 86400000);
  const week = Math.ceil((days + first.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

export default function RacingGalaxy() {
  const [view, setView] = useState("kid");
  const [loaded, setLoaded] = useState(false);
  const [fuel, setFuel] = useState(0);
  const [rp, setRp] = useState(0);
  const [fuelBank, setFuelBank] = useState(0);
  const [totalFuelBanked, setTotalFuelBanked] = useState(0);
  const [shields, setShields] = useState(1);
  const [lastFreeShieldWeek, setLastFreeShieldWeek] = useState(null);
  const [streak, setStreak] = useState(0);
  const [lastCompleteDate, setLastCompleteDate] = useState(null);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [tasks] = useState(DEFAULT_TASKS);
  const [doneToday, setDoneToday] = useState({});
  const [pending, setPending] = useState({});
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [bankMode, setBankMode] = useState(false);
  const [infoOpen, setInfoOpen] = useState(null);
  const [claimedMilestones, setClaimedMilestones] = useState({});
  const [bonusClaimedDate, setBonusClaimedDate] = useState(null);

  const applyRemote = (s) => {
    setFuel(s.fuel || 0);
    setRp(s.rp || 0);
    setFuelBank(s.fuelBank || 0);
    setTotalFuelBanked(s.totalFuelBanked || 0);
    setStreak(s.streak || 0);
    setLastCompleteDate(s.lastCompleteDate || null);
    setTotalCompleted(s.totalCompleted || 0);
    setTotalRedeemed(s.totalRedeemed || 0);
    setDoneToday(s.today === todayKey() ? s.doneToday || {} : {});
    setPending(s.today === todayKey() ? s.pending || {} : {});
    setHistory(s.history || []);
    setClaimedMilestones(s.claimedMilestones || {});
    setBonusClaimedDate(s.bonusClaimedDate || null);
    setShields(s.shields ?? 1);
    setLastFreeShieldWeek(s.lastFreeShieldWeek || null);
  };

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const s = (await loadState()) || {};
      applyRemote(s);

      // Grant this week's free shield exactly once, on first load, not on every sync.
      const currentWeek = weekKey(new Date());
      if (s.lastFreeShieldWeek !== currentWeek) {
        setShields((s.shields ?? 0) + 1);
        setLastFreeShieldWeek(currentWeek);
      }
      setLoaded(true);

      // Live sync: whenever the other device writes, this device updates instantly.
      unsub = subscribeState((remote) => applyRemote(remote));
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveState({
      fuel, rp, fuelBank, totalFuelBanked, shields, lastFreeShieldWeek, streak, lastCompleteDate,
      totalCompleted, totalRedeemed, doneToday, pending, history, claimedMilestones, bonusClaimedDate, today: todayKey(),
    }).catch(() => {});
  }, [fuel, rp, fuelBank, totalFuelBanked, shields, lastFreeShieldWeek, streak, lastCompleteDate, totalCompleted, totalRedeemed, doneToday, pending, history, claimedMilestones, bonusClaimedDate, loaded]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const markDone = (task) => {
    if (doneToday[task.id] || pending[task.id]) return;
    setPending((p) => ({ ...p, [task.id]: true }));
    showToast(`🛰️ "${task.name}" sent to Mission Control!`);
  };

  const approve = (task) => {
    const mt = MISSION_TYPES.find((m) => m.id === task.type);
    setFuel((f) => f + mt.fuel);
    setRp((r) => r + mt.rp);
    setPending((p) => {
      const n = { ...p };
      delete n[task.id];
      return n;
    });
    const newDoneToday = { ...doneToday, [task.id]: true };
    setDoneToday(newDoneToday);
    setTotalCompleted((c) => c + 1);
    const today = todayKey();
    if (lastCompleteDate !== today) {
      setStreak((s) => s + 1);
      setLastCompleteDate(today);
    }
    setHistory((h) => [{ name: task.name, fuel: mt.fuel, rp: mt.rp, date: today }, ...h].slice(0, 30));

    // Bonus RP for completing several missions in one day, regardless of type —
    // this rewards a full day of consistency without needing a big physical task.
    const completedCount = Object.keys(newDoneToday).length;
    if (completedCount >= DAILY_BONUS_THRESHOLD && bonusClaimedDate !== today) {
      setRp((r) => r + DAILY_BONUS_RP);
      setBonusClaimedDate(today);
      setTimeout(() => showToast(`🎊 5 missions done! Bonus +${DAILY_BONUS_RP} Rocket Point!`), 500);
    }
  };

  const reject = (task) => {
    setPending((p) => {
      const n = { ...p };
      delete n[task.id];
      return n;
    });
  };

  const redeem = (reward) => {
    if (fuel < reward.fuel) return;
    setFuel((f) => f - reward.fuel);
    setTotalRedeemed((c) => c + 1);
    showToast(`${reward.emoji} Woohoo! You got: ${reward.name}!`);
  };

  const toggleBank = () => {
    if (!bankMode && fuel > 0) {
      setFuelBank((b) => b + fuel);
      setTotalFuelBanked((t) => t + fuel);
      setFuel(0);
      showToast("🔐 Fuel locked safely in your Vault!");
    }
    setBankMode((b) => !b);
  };

  const redeemBank = () => {
    if (fuelBank < BANK_REWARD.fuel) return;
    setFuelBank((b) => b - BANK_REWARD.fuel);
    setTotalRedeemed((c) => c + 1);
    showToast(`${BANK_REWARD.emoji} JACKPOT! ${BANK_REWARD.name} unlocked!`);
  };

  const buyShield = () => {
    if (fuel < SHIELD_COST || shields > 0) return;
    setFuel((f) => f - SHIELD_COST);
    setShields((s) => s + 1);
    showToast("🛡️ Shield ready! Your streak is safe.");
  };

  const claimMilestone = (m) => {
    if (rp < m.rp || claimedMilestones[m.id]) return;
    setClaimedMilestones((c) => ({ ...c, [m.id]: true }));
    showToast(`${m.emoji} MILESTONE UNLOCKED: ${m.name}!`);
  };

  const { current, next } = rankFor(rp);
  const rpIntoRank = rp - current.rp;
  const rpForNext = next ? next.rp - current.rp : 1;
  const rpPct = next ? Math.min(100, (rpIntoRank / rpForNext) * 100) : 100;

  const badgeState = { totalCompleted, streak, totalFuelBanked, rp, totalRedeemed };

  if (!loaded) return null;

  return (
    <div style={{
      fontFamily: "'Baloo 2', 'Fredoka', 'Comic Sans MS', sans-serif",
      backgroundColor: "#05060f",
      minHeight: "600px",
      color: "#2D1B4E",
      padding: "18px 14px 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Fredoka:wght@400;600&display=swap');
        @keyframes popIn { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes wiggle { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes shine { 0%{box-shadow:0 0 0px 0px currentColor} 50%{box-shadow:0 0 14px 3px currentColor} 100%{box-shadow:0 0 0px 0px currentColor} }
        .mission-card:active { transform: scale(0.96) rotate(-1deg); }
        .badge-unlocked { animation: shine 2.5s ease-in-out infinite; }
        .toast-pop { animation: popIn .35s cubic-bezier(.34,1.56,.64,1); }
        .wiggle-hover:hover { animation: wiggle .3s ease-in-out; }
        .space-photo {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('https://www.nasa.gov/wp-content/uploads/2023/03/15396342336_aab94b6c7f_k.jpg');
          background-size: cover; background-position: center;
        }
        .space-overlay {
          position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(180deg, rgba(5,6,20,0.35) 0%, rgba(5,6,20,0.55) 60%, rgba(5,6,20,0.75) 100%);
        }
      `}</style>

      <div className="space-photo" />
      <div className="space-overlay" />

      <div style={{ position: "relative", maxWidth: 480, margin: "0 auto", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", textShadow: "2px 3px 0 #2D1B4E", lineHeight: 1.2 }}>
            🚀 Ivaan's Racing Galaxy 🏎️
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", opacity: 0.9, marginTop: 2 }}>
            Zoom through missions, blast to the stars!
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", background: "#fff", borderRadius: 999, padding: 4, border: "3px solid #2D1B4E", boxShadow: "3px 3px 0 #2D1B4E" }}>
            <button onClick={() => setView("kid")} style={{
              border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Baloo 2', sans-serif",
              background: view === "kid" ? "#FF9F43" : "transparent", color: view === "kid" ? "#fff" : "#2D1B4E",
            }}>🧒 Kid</button>
            <button onClick={() => setView("parent")} style={{
              border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Baloo 2', sans-serif",
              background: view === "parent" ? "#6C5CE7" : "transparent", color: view === "parent" ? "#fff" : "#2D1B4E",
            }}>🧑‍💼 Parent</button>
          </div>
        </div>

        {view === "kid" && (
          <>
            <ComicCard color={current.color} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="wiggle-hover" style={{
                  width: 56, height: 56, borderRadius: 18, background: current.color, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 30, border: "3px solid #2D1B4E",
                }}>{current.emoji}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>You're a {current.name}!</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6C5CE7" }}>⭐ {rp} Rocket Points</div>
                </div>
              </div>
              {next && (
                <>
                  <div style={{ height: 14, background: "#F0F0F5", borderRadius: 999, overflow: "hidden", marginTop: 12, border: "2px solid #2D1B4E" }}>
                    <div style={{ height: "100%", width: `${rpPct}%`, background: current.color, borderRadius: 999, transition: "width .5s" }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{rpForNext - rpIntoRank} more RP to become {next.emoji} {next.name}!</div>
                </>
              )}
              {!next && <div style={{ fontSize: 13, fontWeight: 700, color: "#FF4757", marginTop: 8 }}>🎉 TOP RANK REACHED! You're a true Galaxy Hero!</div>}
            </ComicCard>

            <ComicCard color="#FF4757" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="wiggle-hover" style={{
                  width: 52, height: 52, borderRadius: 16, background: "#FFE8E8", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 28, border: "3px solid #2D1B4E",
                }}>🔥</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{streak} day{streak === 1 ? "" : "s"} on fire!</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#8B7BAE" }}>Keep the streak blazing 🔥</div>
                </div>
                <div style={{ display: "flex", gap: 3, fontSize: 18 }}>
                  {shields > 0 ? Array.from({ length: Math.min(shields, 4) }).map((_, i) => <span key={i}>🛡️</span>) : <span style={{ fontSize: 11, fontWeight: 600 }}>No shields</span>}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8B7BAE" }}>
                  {shields > 0 ? "✅ You already have a shield ready!" : "🎁 1 free shield every week!"}
                </div>
                <button onClick={buyShield} disabled={fuel < SHIELD_COST || shields > 0} style={{
                  background: (fuel < SHIELD_COST || shields > 0) ? "#E8E8F0" : "#2ECC71", color: (fuel < SHIELD_COST || shields > 0) ? "#A0A0B8" : "#fff",
                  border: "2px solid #2D1B4E", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                  cursor: (fuel < SHIELD_COST || shields > 0) ? "default" : "pointer", fontFamily: "'Baloo 2', sans-serif",
                }}>
                  🛡️ Get Shield ({SHIELD_COST} 🔥)
                </button>
              </div>
            </ComicCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <StatBubble emoji="🔥" label="Fuel" value={fuel} color="#FF9F43" />
              <StatBubble emoji="🔐" label="Fuel Vault" value={fuelBank} color="#00B8B0" />
            </div>

            <SectionTitle emoji="🎯">Today's Missions</SectionTitle>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "1px 1px 0 #2D1B4E",
              marginTop: -6, marginBottom: 10,
            }}>
              {bonusClaimedDate === todayKey()
                ? "🎊 Bonus Rocket Point claimed for today!"
                : `🎯 ${Math.min(Object.keys(doneToday).length, DAILY_BONUS_THRESHOLD)}/${DAILY_BONUS_THRESHOLD} missions — finish ${DAILY_BONUS_THRESHOLD} for a bonus Rocket Point!`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {tasks.map((t) => {
                const mt = MISSION_TYPES.find((m) => m.id === t.type);
                const isDone = doneToday[t.id];
                const isPending = pending[t.id];
                return (
                  <button key={t.id} onClick={() => markDone(t)} className="mission-card" disabled={isDone || isPending} style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    background: isDone ? "#EAFBEF" : "#fff", border: "3px solid #2D1B4E", borderRadius: 16, padding: "10px 14px",
                    cursor: isDone || isPending ? "default" : "pointer", boxShadow: "3px 3px 0 #2D1B4E",
                    fontFamily: "'Baloo 2', sans-serif",
                  }}>
                    <div style={{ fontSize: 28 }}>{t.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: mt.color }}>{mt.label} · {mt.sub}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {isDone ? <span style={{ fontSize: 22 }}>✅</span> : isPending ? <span style={{ fontSize: 20 }}>🛰️</span> :
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#FF9F43" }}>+{mt.fuel}🔥</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            <ComicCard color="#00B8B0" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style
