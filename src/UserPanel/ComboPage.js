import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./ComboPage.css";
import Button3D from "./shared/Button3D";
import api from "../api";
import socket from "../socket";
import { useToast } from "../components/Usetoast";
import closeIcon from "../assets/icons/close.png";
import cartIcon from "../assets/icons/cart.png";

/* ─── Animations ──────────────────────────────────────────── */
const pageVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
};

const overlayAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};

const modalAnim = {
  hidden: { scale: 0.92, y: 16, opacity: 0 },
  show: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { scale: 0.94, y: 10, opacity: 0, transition: { duration: 0.2 } }
};

const sheetAnim = {
  hidden: { y: 60, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  exit: { y: 40, opacity: 0, transition: { duration: 0.2 } }
};

const checkSpring = { type: "spring", stiffness: 300, damping: 18 };

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } }
};

const listRow = {
  hidden: { opacity: 0, x: 14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
};

// Fixed 3-image diagonal cascade — active image centered and full
// size, with the upcoming dish sitting above-right and the previous
// dish below-left, both noticeably large (not just faint background
// layers). Offsets/scale below are lifted directly from the approved
// reference layout.
const REEL_SLOTS = [
  { x: -150, y: 300, scale: 0.4, rotate: 0, blur: 8, zIndex: 1 },   // previous (below-left)
  { x: 0, y: 0, scale: 0.8, rotate: 0, blur: 0, zIndex: 3 },            // active (front, centered)
  { x: 400, y: -100, scale: 0.5, rotate: 0, blur: 6, zIndex: 2 }     // next (above-right)
];
const REEL_SPRING = { type: "spring", stiffness: 90, damping: 22, mass: 1.2 };
/* Faster crossfade for the name/price/description block specifically —
   snappier than the image reel's swipe so text feels immediate. */
const REEL_DETAILS_SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.7 };

/* Circular motion between slots — the three resting spots above
   happen to sit on a common circle, so instead of tweening straight
   between them, each transition is sampled along that circle's arc
   (a real curved/circular path) rather than a straight line. */
const circumcircleOf = (A, B, C) => {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const cx = ((A.x ** 2 + A.y ** 2) * (B.y - C.y) + (B.x ** 2 + B.y ** 2) * (C.y - A.y) + (C.x ** 2 + C.y ** 2) * (A.y - B.y)) / d;
  const cy = ((A.x ** 2 + A.y ** 2) * (C.x - B.x) + (B.x ** 2 + B.y ** 2) * (A.x - C.x) + (C.x ** 2 + C.y ** 2) * (B.x - A.x)) / d;
  return { cx, cy, r: Math.hypot(A.x - cx, A.y - cy) };
};

const REEL_CIRCLE = circumcircleOf(REEL_SLOTS[0], REEL_SLOTS[1], REEL_SLOTS[2]);
const angleOfSlot = (p) => Math.atan2(p.y - REEL_CIRCLE.cy, p.x - REEL_CIRCLE.cx) * (180 / Math.PI);
const posOnCircle = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: REEL_CIRCLE.cx + REEL_CIRCLE.r * Math.cos(rad), y: REEL_CIRCLE.cy + REEL_CIRCLE.r * Math.sin(rad) };
};

let REEL_ANGLE_PREV = angleOfSlot(REEL_SLOTS[0]);
let REEL_ANGLE_ACTIVE = angleOfSlot(REEL_SLOTS[1]);
let REEL_ANGLE_NEXT = angleOfSlot(REEL_SLOTS[2]);
while (REEL_ANGLE_ACTIVE < REEL_ANGLE_PREV) REEL_ANGLE_ACTIVE += 360;
while (REEL_ANGLE_NEXT < REEL_ANGLE_ACTIVE) REEL_ANGLE_NEXT += 360;

// The two off-display wrappers keep going around the SAME circle,
// one step further out each side — so they sit outside the visible
// display but still on the circular path, ready to sweep smoothly
// into view instead of just fading in from a fixed, unrelated spot.
const REEL_ANGLE_FAR_PREV = REEL_ANGLE_PREV - (REEL_ANGLE_ACTIVE - REEL_ANGLE_PREV);
const REEL_ANGLE_FAR_NEXT = REEL_ANGLE_NEXT + (REEL_ANGLE_NEXT - REEL_ANGLE_ACTIVE);
const REEL_FAR_PREV_POS = posOnCircle(REEL_ANGLE_FAR_PREV);
const REEL_FAR_NEXT_POS = posOnCircle(REEL_ANGLE_FAR_NEXT);

// All 5 wrapper roles, in circle order: far-prev, prev, active, next,
// far-next. Only the middle 3 are ever opaque/interactive; the outer
// two exist purely so their dish is pre-loaded and already sitting in
// its correct circular spot the moment it needs to sweep into view.
const REEL_SLOTS_5 = [
  { x: REEL_FAR_PREV_POS.x, y: REEL_FAR_PREV_POS.y, scale: REEL_SLOTS[0].scale * 0.75, rotate: 0, blur: REEL_SLOTS[0].blur + 4, zIndex: 0, opacity: 0 },
  { ...REEL_SLOTS[0], opacity: 1 },
  { ...REEL_SLOTS[1], opacity: 1 },
  { ...REEL_SLOTS[2], opacity: 1 },
  { x: REEL_FAR_NEXT_POS.x, y: REEL_FAR_NEXT_POS.y, scale: REEL_SLOTS[2].scale * 0.75, rotate: 0, blur: REEL_SLOTS[2].blur + 4, zIndex: 0, opacity: 0 }
];
const REEL_ANGLES_5 = [REEL_ANGLE_FAR_PREV, REEL_ANGLE_PREV, REEL_ANGLE_ACTIVE, REEL_ANGLE_NEXT, REEL_ANGLE_FAR_NEXT];

const ARC_STEPS = 32;
const arcPath = (fromDeg, toDeg) => {
  const x = [], y = [];
  for (let i = 0; i <= ARC_STEPS; i++) {
    const deg = fromDeg + (toDeg - fromDeg) * (i / ARC_STEPS);
    const rad = (deg * Math.PI) / 180;
    x.push(REEL_CIRCLE.cx + REEL_CIRCLE.r * Math.cos(rad));
    y.push(REEL_CIRCLE.cy + REEL_CIRCLE.r * Math.sin(rad));
  }
  return { x, y };
};

// A hand-off happens between every adjacent pair of the 5 circle
// positions (not just the visible 3) — e.g. on "next", the item
// sitting off-display in the far-next spot sweeps in to become the
// new next dish. Built once as curved paths along REEL_CIRCLE.
const REEL_ARCS = {};
for (let i = 0; i < REEL_ANGLES_5.length - 1; i++) {
  REEL_ARCS[`${i + 1}-${i}`] = arcPath(REEL_ANGLES_5[i + 1], REEL_ANGLES_5[i]);
  REEL_ARCS[`${i}-${i + 1}`] = arcPath(REEL_ANGLES_5[i], REEL_ANGLES_5[i + 1]);
}
const REEL_ARC_TWEEN = { duration: 0.55, ease: [0.65, 0, 0.35, 1] };

/* ─── Helpers ─────────────────────────────────────────────── */
const getOfferHint = (starter, main, rules = []) => {
  if (starter && !main) {
    const rule = rules.find(r => r.condition.starter === starter.name);
    if (rule) return { message: `Add "${rule.condition.main}" to unlock ${rule.label}`, targetType: "main", targetName: rule.condition.main };
  }
  if (!starter && main) {
    const rule = rules.find(r => r.condition.main === main.name);
    if (rule) return { message: `Add "${rule.condition.starter}" to unlock ${rule.label}`, targetType: "starter", targetName: rule.condition.starter };
  }
  return null;
};

/* Starter and Main repeating the same protein (e.g. both "Chicken")
   feels repetitive, so once both are picked, check for a shared
   keyword and — if a different starter using something else is
   available — suggest swapping to it instead. */
const REPEATED_PROTEIN_KEYWORDS = ["chicken", "mutton", "paneer", "fish", "prawn", "beef", "pork", "egg"];

const getVarietyHint = (starter, main, allStarterItems = []) => {
  if (!starter || !main) return null;
  const starterName = starter.name.toLowerCase();
  const mainName = main.name.toLowerCase();
  const sharedProtein = REPEATED_PROTEIN_KEYWORDS.find(p => starterName.includes(p) && mainName.includes(p));
  if (!sharedProtein) return null;

  const alt = allStarterItems.find(i => i.name !== starter.name && !i.name.toLowerCase().includes(sharedProtein));
  if (!alt) return null;

  const label = sharedProtein.charAt(0).toUpperCase() + sharedProtein.slice(1);
  return {
    message: `Your Main is also ${label} — swap Starter for "${alt.name}" instead?`,
    targetName: alt.name,
    item: alt
  };
};

const SLOT_LABELS = { starter: "Starter", main: "Main", drink: "Drink" };

/* ─── Grouping geometry (compact progress strip) ─────────────
   Starter docks straight up (90°) from the base, main course
   docks at 45° from the starter, beverage docks at 135° from
   the main — same angles as the approved prototype, just drawn
   small now since the reel below does the heavy lifting.
──────────────────────────────────────────────────────────── */
/* Angle used to bias which side new dish images sweep in from,
   kept per phase for the swipeable reel's ambient motion. */
const ANGLES = { starter: 90, main: 45, drink: 135 };

/* Fixed slot lookup for the reel — see REEL_SLOTS above. */
const reelSlotTransform = (slot) => REEL_SLOTS_5[slot];

const GroupNode = ({ item, type, onClick }) => (
  <motion.button
    className={`combo-group-node combo-group-node--${type}`}
    layout
    initial={{ opacity: 0, scale: 0.5, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 220, damping: 26 }}
    onClick={onClick}
    aria-label={`Change ${item.name}`}
  >
    <motion.img
      layoutId={`combo-fly-${type}`}
      src={item.image}
      alt={item.name}
      draggable={false}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
    />
  </motion.button>
);

/* ─── FoodList-style swipeable reel for the active phase ─────── */
const ComboReel = ({ items, angle, type, onSelect }) => {
  const [renderIndex, setRenderIndex] = useState(0);
  const [direction, setDirection] = useState(null); // 'next' | 'prev' | null
  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);

  useEffect(() => { setRenderIndex(0); setDirection(null); }, [items]);

  if (!items.length) {
    return <div className="combo-reel-empty">Nothing here yet — check back soon.</div>;
  }

  // 5 slots total: [farPrev, prev, active, next, farNext]. Only the
  // middle 3 (prev/active/next) are ever visible — farPrev/farNext
  // stay in the DOM purely so their dish's image is already loaded
  // by the time it swipes into view, avoiding a pop-in flash.
  const n = items.length;
  const visible = [
    items[(renderIndex - 2 + n * 2) % n],
    items[(renderIndex - 1 + n) % n],
    items[renderIndex],
    items[(renderIndex + 1) % n],
    items[(renderIndex + 2) % n]
  ];

  const goNext = () => {
    setDirection("next");
    setRenderIndex(i => (i + 1) % items.length);
  };
  const goPrev = () => {
    setDirection("prev");
    setRenderIndex(i => (i - 1 + items.length) % items.length);
  };
  const active = visible[2];

  return (
    <div
      className="combo-reel"
      onPointerDown={(e) => {
        if (e.target.closest("button")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        startX.current = e.clientX;
        startY.current = e.clientY;
        isPointerDown.current = true;
      }}
      onPointerUp={(e) => {
        if (!isPointerDown.current) return;
        isPointerDown.current = false;
        const dy = startY.current - e.clientY;
        const dx = Math.abs(startX.current - e.clientX);
        if (dx > Math.abs(dy)) return;
        // dy > 0 means the pointer's Y position decreased, i.e. the
        // finger moved toward the TOP of the screen — a swipe up.
        // Swipe up → previous dish. Swipe down → next dish.
        if (dy > 40) goPrev();
        else if (dy < -40) goNext();
      }}
      onPointerCancel={() => { isPointerDown.current = false; }}
    >
      <div className="combo-reel-details">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={REEL_DETAILS_SPRING}
            style={{ height: "150px" }}
          >
            <h2 className="combo-reel-name">{active.name}</h2>
            <div className="combo-reel-price">₹{active.price ?? active.basePrice ?? 0}</div>
            {active.description && <p className="combo-reel-desc">{active.description}</p>}
          </motion.div>
        </AnimatePresence>

        <Button3D className="btn-3d red" style={{ marginTop: 22, width: "fit-content" }} onClick={() => onSelect(active)}>
          Select »
        </Button3D>
      </div>

      <div className={`combo-reel-images combo-reel-images--${type}`}>
        {visible.map((item, slot) => {
          // slot maps 1:1 onto the 5 circle roles: 0=far-prev,
          // 1=prev, 2=active, 3=next, 4=far-next. The two edges stay
          // fully off-display (opacity 0, non-interactive) but sit
          // in their real circular position, so when an item's role
          // shifts into view it sweeps in along the arc instead of
          // just fading in from nowhere.
          const t = reelSlotTransform(slot);
          const isActive = slot === 2;
          const isEdge = slot === 0 || slot === 4;

          // Which arc this slot is sweeping along right now — every
          // adjacent pair of the 5 circle roles hands off on each
          // nav action, including the two off-display ones.
          const arcKey =
            direction === "next" ? (slot < 4 ? `${slot + 1}-${slot}` : null)
              : direction === "prev" ? (slot > 0 ? `${slot - 1}-${slot}` : null)
                : null;
          const arc = arcKey ? REEL_ARCS[arcKey] : null;

          return (
            <motion.div
              key={item.id}
              className={`combo-reel-image-wrapper${isEdge ? " combo-reel-image-wrapper--hidden" : ""}`}
              aria-hidden={isEdge ? "true" : undefined}
              initial={{ x: t.x, y: t.y, rotate: t.rotate, scale: t.scale * 0.9, opacity: 0 }}
              animate={{
                x: arc ? arc.x : t.x,
                y: arc ? arc.y : t.y,
                rotate: t.rotate,
                scale: t.scale,
                zIndex: t.zIndex,
                opacity: t.opacity
              }}
              transition={arc ? REEL_ARC_TWEEN : REEL_SPRING}
              onAnimationComplete={() => {
                if (isActive && direction) setDirection(null);
              }}
            >
              <motion.img
                src={item.image}
                alt={item.name}
                className="combo-reel-image"
                layoutId={isActive ? `combo-fly-${type}` : undefined}
                animate={{ filter: `blur(${t.blur}px)` }}
                transition={REEL_SPRING}
                draggable={false}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="combo-reel-nav">
        <Button3D className="btn-3d white" onClick={goPrev} aria-label="Previous dish">▲</Button3D>
        <Button3D className="btn-3d white" onClick={goNext} aria-label="Next dish">▼</Button3D>
      </div>
    </div>
  );
};

/* ─── Cart / "My Combo" list content (clone of "My Order") ──── */
const MyComboContent = ({
  selectedItems,
  quantity,
  setQuantity,
  appliedOffer,
  originalTotal,
  discountedPrice,
  savings,
  isComboComplete,
  onDelete
}) => (
  <div className="combo-cart-content">
    <motion.div className="combo-cart-list" variants={listStagger} initial="hidden" animate="show">
      <AnimatePresence initial={false}>
        {Object.keys(SLOT_LABELS).map(key => {
          const item = selectedItems[key];
          const label = SLOT_LABELS[key];
          return (
            <motion.div
              key={key}
              layout
              variants={listRow}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: -14, transition: { duration: 0.18 } }}
              className={`combo-cart-row ${item ? "filled" : "empty"}`}
            >
              <div className="combo-cart-row-text">
                <span className="combo-cart-row-label">{label}</span>
                <span className="combo-cart-row-name">{item ? item.name : "Not selected"}</span>
              </div>
              {item ? (
                <div className="combo-cart-row-right">
                  <span className="combo-cart-row-price">₹{item.price ?? item.basePrice ?? 0}</span>
                  <Button3D
                    as={motion.button}
                    className="btn-3d white"
                    onClick={() => onDelete(key)}
                    aria-label={`Remove ${label}`}
                    whileTap={{ scale: 0.8 }}
                    frontClassName="close-padding"
                  >
                    <img style={{ width: "14px", height: "14px" }} src={closeIcon} alt="Remove" />
                  </Button3D>
                </div>
              ) : (
                <span className="combo-cart-row-empty">—</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>

    {isComboComplete && (
      <>
        <div className="combo-cart-qty">
          <span>Quantity</span>
          <div className="stepper-ctrl">
            <button
              as={motion.button}
              className="stepper-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity === 1}
              aria-label="Decrease quantity"
              whileTap={{ scale: 0.85 }}
            >
              −
            </button>
            <span className="stepper-val">{quantity}</span>
            <button
              as={motion.button}
              className="stepper-btn"
              onClick={() => setQuantity(q => q + 1)}
              aria-label="Increase quantity"
              whileTap={{ scale: 0.85 }}
            >
              +
            </button>
          </div>
        </div>

        <div className="combo-cart-divider" />

        <div className="combo-cart-totals">
          <div className="combo-cart-total-row">
            <span>Subtotal</span>
            <span>₹{originalTotal}</span>
          </div>
          {appliedOffer && (
            <div className="combo-cart-total-row muted">
              <span>{appliedOffer.label}</span>
              <span>−₹{savings}</span>
            </div>
          )}
          <div className="combo-cart-total-row final">
            <span>Total</span>
            <span>₹{discountedPrice}</span>
          </div>
        </div>
      </>
    )}
  </div>
);

/* ─── Receipt-style confirmation (clone of "Order Successful") ─ */
const AddedConfirmation = ({ comboTitle, discountedPrice, onDone }) => (
  <motion.div
    className="combo-receipt"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
  >
    <motion.div
      className="combo-receipt-check"
      initial={{ scale: 0, rotate: -35 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ ...checkSpring, delay: 0.08 }}
    >
      ✓
    </motion.div>
    <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25 }}>
      Added to Bag!
    </motion.h3>
    <motion.p
      className="combo-receipt-sub"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.26, duration: 0.25 }}
    >
      Your combo is waiting in your bag
    </motion.p>

    <div className="combo-cart-divider" />

    <div className="combo-receipt-row">
      <span>{comboTitle}</span>
      <span>₹{discountedPrice}</span>
    </div>

    <Button3D
      as={motion.button}
      className="btn-3d green combo-receipt-done"
      onClick={onDone}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.25 }}
      style={{ width: "100%" }}
    >
      Done
    </Button3D>
  </motion.div>
);

/* ─── Main Component ──────────────────────────────────────── */
const ComboPage = ({ foodData, addToBag, updateBagItem, handleBack, handleHome, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = location.state?.fromBag;
  const editQuantity = location.state?.quantity;
  const editIndex = location.state?.bagIndex;

  /* ── Offer rules (fetched from db, kept live via socket) ── */
  const [comboOfferRules, setComboOfferRules] = useState([]);
  useEffect(() => {
    const fetchComboOfferRules = () => {
      api.get("/combo_offers")
        .then(res => setComboOfferRules(res.data || []))
        .catch(() => setComboOfferRules([]));
    };
    fetchComboOfferRules();
    const handler = ({ resource }) => {
      if (resource === "combo_offers") fetchComboOfferRules();
    };
    socket.on("data-change", handler);
    return () => socket.off("data-change", handler);
  }, []);

  /* ── Data ── */
  const combo = useMemo(() => (Array.isArray(foodData?.combo) ? foodData.combo : []), [foodData]);

  const startersSection = useMemo(() => combo.find(c => c.type === "starters") || { groups: [] }, [combo]);
  const mainSection = useMemo(() => combo.find(c => c.type === "mainCourse") || { groups: [] }, [combo]);
  const beveragesSection = useMemo(() => combo.find(c => c.type === "beverages") || { groups: [] }, [combo]);

  /* ── State ── */
  const [activeStarterGroup, setActiveStarterGroup] = useState(() => startersSection.groups?.[0]?.id || null);
  const [activeMainGroup, setActiveMainGroup] = useState(null);
  const [activeDrinkGroup, setActiveDrinkGroup] = useState(null);
  const [offerHint, setOfferHint] = useState(null);
  const [varietyHint, setVarietyHint] = useState(null);
  const [showAddFavConfirm, setShowAddFavConfirm] = useState(false);
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(() => (isEditMode && editQuantity) ? editQuantity : 1);

  const [selectedItems, setSelectedItems] = useState(() => {
    if (location.state?.comboItems) return location.state.comboItems;
    return { starter: null, main: null, drink: null };
  });

  /* ── Find item by name ── */
  const findComboItemByName = useCallback((type, name) => {
    const section = type === "starter" ? startersSection : type === "main" ? mainSection : beveragesSection;
    for (const group of (section.groups || [])) {
      const found = (group.items || []).find(i => i.name === name);
      if (found) return found;
    }
    return null;
  }, [startersSection, mainSection, beveragesSection]);

  useEffect(() => {
    const offer = location.state?.comboOffer;
    if (!offer?.condition) return;

    const { starter: starterName, main: mainName } = offer.condition;
    let resolved = { starter: null, main: null, drink: null };

    if (starterName) {
      const item = findComboItemByName("starter", starterName);
      if (item) resolved.starter = item;
    }
    if (mainName) {
      const item = findComboItemByName("main", mainName);
      if (item) resolved.main = item;
    }

    if (resolved.starter || resolved.main) {
      setSelectedItems(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findComboItemByName]);

  const appliedOffer = useMemo(() => {
    const sName = selectedItems.starter?.name;
    const mName = selectedItems.main?.name;
    if (!sName || !mName) return null;
    return comboOfferRules.find(r => r.condition.starter === sName && r.condition.main === mName) || null;
  }, [selectedItems.starter?.name, selectedItems.main?.name, comboOfferRules]);

  useEffect(() => {
    const hint = getOfferHint(selectedItems.starter, selectedItems.main, comboOfferRules);
    setOfferHint(hint);
  }, [selectedItems.starter?.name, selectedItems.main?.name, comboOfferRules]);

  const allStarterItems = useMemo(() => (
    (startersSection.groups || []).flatMap(g => g.items || [])
  ), [startersSection]);

  useEffect(() => {
    const hint = getVarietyHint(selectedItems.starter, selectedItems.main, allStarterItems);
    setVarietyHint(hint);
  }, [selectedItems.starter?.name, selectedItems.main?.name, allStarterItems]);

  const perComboBasePrice = useMemo(() => (
    Object.values(selectedItems).filter(Boolean).reduce((s, i) => s + Number(i.price ?? i.basePrice ?? 0), 0)
  ), [selectedItems]);

  const perComboFinalPrice = useMemo(() => {
    if (!appliedOffer) return perComboBasePrice;
    if (appliedOffer.type === "FLAT") return Math.max(perComboBasePrice - appliedOffer.value, 0);
    if (appliedOffer.type === "PERCENT") return Math.round(perComboBasePrice * (1 - appliedOffer.value / 100));
    return perComboBasePrice;
  }, [perComboBasePrice, appliedOffer]);

  const originalTotal = perComboBasePrice * quantity;
  const discountedPrice = perComboFinalPrice * quantity;
  const savings = originalTotal - discountedPrice;

  const isComboComplete = !!(selectedItems.starter && selectedItems.main && selectedItems.drink);
  const selectedCount = [selectedItems.starter, selectedItems.main, selectedItems.drink].filter(Boolean).length;

  const comboTitle = useMemo(() => {
    if (!isComboComplete) return "";
    return [selectedItems.starter.name, selectedItems.main.name, selectedItems.drink.name].join(" + ");
  }, [selectedItems, isComboComplete]);

  const phase = !selectedItems.starter ? "starters" : !selectedItems.main ? "mainCourse" : !selectedItems.drink ? "beverages" : "done";
  const phaseTypeKey = phase === "starters" ? "starter" : phase === "mainCourse" ? "main" : phase === "beverages" ? "drink" : null;

  const handlePick = useCallback((type, item) => {
    setSelectedItems(prev => ({ ...prev, [type]: item }));
    if (type === "starter") setActiveMainGroup(null);
    else if (type === "main") setActiveDrinkGroup(null);
  }, []);

  /* ── Open "My Combo" sheet automatically once the last item
     (drink) completes the combo, instead of waiting for the
     cart icon tap. Only fires on the false → true transition,
     so manually closing the sheet afterwards won't reopen it. ── */
  useEffect(() => {
    if (isComboComplete) setShowCart(true);
  }, [isComboComplete]);

  const handleUndo = useCallback((type) => {
    setSelectedItems(prev => {
      if (type === "starter") return { starter: null, main: null, drink: null };
      if (type === "main") return { ...prev, main: null, drink: null };
      return { ...prev, drink: null };
    });
    if (type === "starter") { setActiveMainGroup(null); setActiveDrinkGroup(null); }
    else if (type === "main") setActiveDrinkGroup(null);
  }, []);

  const handleAddToBag = useCallback(() => {
    const comboItem = {
      id: `combo_${Date.now()}`,
      name: comboTitle,
      categoryId: "combo",
      quantity,
      unitPrice: perComboFinalPrice,
      perComboBasePrice,
      perComboFinalPrice,
      totalPrice: perComboFinalPrice * quantity,
      originalPrice: originalTotal,
      appliedOffer,
      comboItems: selectedItems,
      isCombo: true
    };
    if (isEditMode) updateBagItem(editIndex, comboItem);
    else addToBag(comboItem);
    setJustAdded(true);
  }, [comboTitle, quantity, perComboFinalPrice, perComboBasePrice, originalTotal, appliedOffer, selectedItems, isEditMode, editIndex, addToBag, updateBagItem]);

  const handleCloseConfirmation = useCallback(() => {
    setJustAdded(false);
    setShowCart(false);
    setQuantity(1);
  }, []);

  const handleDoneReceipt = useCallback(() => {
    handleCloseConfirmation();
    handleHome?.();
  }, [handleCloseConfirmation, handleHome]);

  const handleHintAdd = useCallback(() => {
    if (!offerHint) return;
    const item = findComboItemByName(offerHint.targetType, offerHint.targetName);
    if (item) handlePick(offerHint.targetType, item);
    setOfferHint(null);
  }, [offerHint, findComboItemByName, handlePick]);

  const handleVarietySwap = useCallback(() => {
    if (!varietyHint) return;
    handlePick("starter", varietyHint.item);
    setVarietyHint(null);
  }, [varietyHint, handlePick]);

  const handleConfirmAddFav = useCallback(async () => {
    if (!currentUser || !isComboComplete) return;
    setIsSavingFav(true);

    const newCombo = {
      id: `favcombo_${Date.now()}`,
      title: comboTitle,
      items: { starter: selectedItems.starter.name, main: selectedItems.main.name, drink: selectedItems.drink.name },
      comboItems: selectedItems,
      originalPrice: originalTotal,
      perComboFinalPrice,
      totalPrice: discountedPrice,
      appliedOffer,
      createdAt: new Date().toISOString()
    };

    const existingCombos = currentUser.combo || [];
    const isDuplicate = existingCombos.some(c =>
      c.items.starter === newCombo.items.starter &&
      c.items.main === newCombo.items.main &&
      c.items.drink === newCombo.items.drink
    );

    if (isDuplicate) { setIsSavingFav(false); setShowAddFavConfirm(false); setShowDuplicateOverlay(true); return; }

    try {
      const updatedUser = { ...currentUser, combo: [...existingCombos, newCombo] };
      await api.put(`/users/${currentUser.id}`, updatedUser);
      setCurrentUser(updatedUser);
      setShowAddFavConfirm(false);
    } catch (err) {
      console.error("Failed to save favourite combo", err);
      toast.error("Couldn't save to favourites. Please try again.");
      setShowAddFavConfirm(false);
    } finally {
      setIsSavingFav(false);
    }
  }, [currentUser, isComboComplete, comboTitle, selectedItems, originalTotal, perComboFinalPrice, discountedPrice, appliedOffer, setCurrentUser, toast]);

  /* ── Items / groups feeding the active reel ── */
  const starterItems = useMemo(() => (startersSection.groups || []).find(g => g.id === activeStarterGroup)?.items || [], [startersSection, activeStarterGroup]);
  const mainItems = useMemo(() => (mainSection.groups || []).find(g => g.id === activeMainGroup)?.items || [], [mainSection, activeMainGroup]);
  const drinkItems = useMemo(() => (beveragesSection.groups || []).find(g => g.id === activeDrinkGroup)?.items || [], [beveragesSection, activeDrinkGroup]);

  useEffect(() => { if (!activeMainGroup) setActiveMainGroup(mainSection.groups?.[0]?.id || null); }, [mainSection, activeMainGroup]);
  useEffect(() => { if (!activeDrinkGroup) setActiveDrinkGroup(beveragesSection.groups?.[0]?.id || null); }, [beveragesSection, activeDrinkGroup]);

  const activeItems = phase === "starters" ? starterItems : phase === "mainCourse" ? mainItems : phase === "beverages" ? drinkItems : [];

  const phaseGroups = phase === "starters" ? startersSection.groups || []
    : phase === "mainCourse" ? mainSection.groups || []
      : phase === "beverages" ? beveragesSection.groups || []
        : [];
  const phaseActiveGroup = phase === "starters" ? activeStarterGroup : phase === "mainCourse" ? activeMainGroup : activeDrinkGroup;
  const setPhaseActiveGroup = phase === "starters" ? setActiveStarterGroup : phase === "mainCourse" ? setActiveMainGroup : setActiveDrinkGroup;


  return (
    <motion.div className="combo-page" variants={pageVariant} initial="hidden" animate="show">

      {/* ── Top bar (back chevron + bag) ── */}
      <div className="combo-topbar">
        <motion.button className="back-button" onClick={handleBack} aria-label="Back" whileTap={{ scale: 0.85, x: -2 }} />

        <div className="combo-phase-label">
          {phase === "starters" && "Swipe up or down to browse, pick a starter"}
          {phase === "mainCourse" && "Now swipe up or down and pick a main course"}
          {phase === "beverages" && "Now swipe up or down and pick a beverage"}
          {phase === "done" && "Your combo is grouped"}
        </div>

        <div className="combo-topbar-actions">
          {currentUser && currentUser.id !== "guest" && (
            <Button3D
              as={motion.button}
              className="btn-3d white"
              onClick={() => navigate("/favourite-combos")}
              aria-label="My favourite combos"
              whileTap={{ scale: 0.88 }}
            >
              Favourites
            </Button3D>
          )}
          <Button3D
            as={motion.button}
            className="btn-3d white sq-padding combo-icon-btn"
            onClick={() => setShowCart(true)}
            aria-label="View your combo"
            whileTap={{ scale: 0.88 }}
          >
            <img src={cartIcon} alt="Cart" />
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.span
                  key={selectedCount}
                  className="combo-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={checkSpring}
                >
                  {selectedCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button3D>
        </div>
      </div>

      {/* ── Group pills for the active phase ── */}
      <AnimatePresence mode="popLayout" initial={false}>
        {phaseGroups.length > 1 && (
          <motion.div
            key={phase}
            className="combo-size-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="combo-size-pills">
              {phaseGroups.map(g => (
                <Button3D
                  key={g.id}
                  as={motion.button}
                  className={`chip ${phaseActiveGroup === g.id ? "active" : ""}`}
                  onClick={() => setPhaseActiveGroup(g.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{ marginTop: "10px", marginBottom: "10px" }}
                >
                  {g.title}
                </Button3D>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Swipeable reel — crossfades between phases, hidden once the
           combo is complete since the sheet modal takes over from there ── */}
      <AnimatePresence mode="popLayout" initial={false}>
        {phase !== "done" && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(5px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%" }}
          >
            <ComboReel items={activeItems} angle={ANGLES[phaseTypeKey] ?? 90} type={phaseTypeKey} onSelect={(item) => handlePick(phaseTypeKey, item)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grouping strip — lives at page level (not inside the reel)
           so it survives the reel unmounting once phase === 'done'.
           Below the reel images while picking; once all 3 dishes are
           chosen it centers itself over the page via the --complete
           modifier, sliding back on undo thanks to `layout`. ── */}
      {selectedCount > 0 && (
        <motion.div
          className={`combo-group-strip${selectedCount === 3 ? " combo-group-strip--complete" : ""}`}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className="combo-group-strip-pricing">
            {perComboFinalPrice < perComboBasePrice && (
              <div className="combo-group-strip-regular">
                <span className="combo-group-strip-regular-label">Regular Price</span>
                <span className="combo-group-strip-regular-price">₹{perComboBasePrice}/-</span>
              </div>
            )}
            <div className="combo-group-strip-final">
              <span className="combo-group-strip-final-label">
                {perComboFinalPrice < perComboBasePrice ? "Combo @ Just" : "Combo Total"}
              </span>
              <span className="combo-group-strip-final-price">₹{perComboFinalPrice}/-</span>
            </div>
          </div>

          <div className="combo-group-strip-photos">
            {selectedItems.starter && <GroupNode item={selectedItems.starter} type="starter" onClick={() => handleUndo("starter")} />}
            {selectedItems.main && <GroupNode item={selectedItems.main} type="main" onClick={() => handleUndo("main")} />}
            {selectedItems.drink && <GroupNode item={selectedItems.drink} type="drink" onClick={() => handleUndo("drink")} />}
          </div>
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        {offerHint && (
          <motion.div className="combo-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <p className="combo-modal-text">{offerHint.message}</p>
              <div className="combo-modal-actions">
                <Button3D as={motion.button} className="btn-3d white" onClick={() => setOfferHint(null)} whileTap={{ scale: 0.96 }}>No, thanks</Button3D>
                <Button3D as={motion.button} className="btn-3d green" onClick={handleHintAdd} whileTap={{ scale: 0.96 }}>Add Item</Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Variety hint (Starter repeats Main's protein) ── */}
      <AnimatePresence mode="wait">
        {varietyHint && (
          <motion.div className="combo-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <p className="combo-modal-text">{varietyHint.message}</p>
              <div className="combo-modal-actions">
                <Button3D as={motion.button} className="btn-3d white" onClick={() => setVarietyHint(null)} whileTap={{ scale: 0.96 }}>Keep it</Button3D>
                <Button3D as={motion.button} className="btn-3d green" onClick={handleVarietySwap} whileTap={{ scale: 0.96 }}>Swap Starter</Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add to fav confirm ── */}
      <AnimatePresence mode="wait">
        {showAddFavConfirm && (
          <motion.div className="combo-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <h3 className="combo-modal-title">Save to Favourites?</h3>
              <p className="combo-modal-text">{comboTitle}</p>
              <div className="combo-modal-actions">
                <Button3D as={motion.button} className="btn-3d white" onClick={() => setShowAddFavConfirm(false)} whileTap={{ scale: 0.96 }}>Cancel</Button3D>
                <Button3D
                  as={motion.button}
                  className="btn-3d green"
                  disabled={!isComboComplete || isSavingFav}
                  onClick={handleConfirmAddFav}
                  whileTap={{ scale: 0.96 }}
                >
                  {isSavingFav ? "Saving…" : "Confirm"}
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Duplicate overlay ── */}
      <AnimatePresence mode="wait">
        {showDuplicateOverlay && (
          <motion.div className="combo-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <h3 className="combo-modal-title">Already Saved</h3>
              <p className="combo-modal-text">This combo already exists in your favourites.</p>
              <div className="combo-modal-actions">
                <Button3D as={motion.button} className="btn-3d white" style={{ width: "100%" }} onClick={() => setShowDuplicateOverlay(false)} whileTap={{ scale: 0.96 }}>Okay</Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "My Combo" sheet — clone of My Order / Receipt ── */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="combo-sheet-overlay"
            variants={overlayAnim}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => !justAdded && setShowCart(false)}
          >
            <motion.div
              className="combo-sheet-modal"
              variants={sheetAnim}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              drag={!justAdded ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90) setShowCart(false);
              }}
            >
              <div className="combo-sheet-handle" />

              {justAdded ? (
                <>
                  <div className="combo-sheet-header">
                    <h3>Receipt</h3>
                    <Button3D as={motion.button} className="home-btn home-btn-icon" onClick={handleCloseConfirmation} whileTap={{ scale: 0.85 }} aria-label="Close" frontClassName="close-padding"><img src={closeIcon} style={{ width: "20px", height: "20px" }} alt="Close" /></Button3D>
                  </div>
                  <AddedConfirmation
                    comboTitle={comboTitle}
                    discountedPrice={discountedPrice}
                    onDone={handleDoneReceipt}
                  />
                </>
              ) : (
                <>
                  <div className="combo-sheet-header">
                    <h3>My Combo</h3>
                    <Button3D as={motion.button} className="btn-3d red" onClick={() => setShowCart(false)} whileTap={{ scale: 0.85 }} aria-label="Close" frontClassName="close-padding"><img style={{ width: "20px", height: "20px", filter: "brightness(0) invert(1)" }} src={closeIcon} alt="Close" /></Button3D>
                  </div>

                  <div className="combo-sheet-body">
                    <MyComboContent
                      selectedItems={selectedItems}
                      quantity={quantity}
                      setQuantity={setQuantity}
                      appliedOffer={appliedOffer}
                      originalTotal={originalTotal}
                      discountedPrice={discountedPrice}
                      savings={savings}
                      isComboComplete={isComboComplete}
                      onDelete={handleUndo}
                    />

                    {isComboComplete && currentUser && currentUser.id !== "guest" && (
                      <Button3D
                        as={motion.button}
                        className="btn-3d white combo-save-btn"
                        onClick={() => setShowAddFavConfirm(true)}
                        whileTap={{ scale: 0.96 }}
                      >
                        Save to Favourites
                      </Button3D>
                    )}
                  </div>

                  <Button3D
                    as={motion.button}
                    className="btn-3d red combo-checkout-bar"
                    style={{ width: "170px", alignSelf: "end" }}
                    disabled={!isComboComplete}
                    onClick={handleAddToBag}
                    whileTap={{ scale: 0.97 }}
                    frontStyle={{ display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <span>{isEditMode ? "Update Combo" : "Add to Bag"}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={discountedPrice}
                        className="combo-checkout-amount"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        ₹{discountedPrice}
                      </motion.span>
                    </AnimatePresence>
                  </Button3D>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ComboPage;