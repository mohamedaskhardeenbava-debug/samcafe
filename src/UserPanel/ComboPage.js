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

const REEL_SLOT_DIST = [-820, 0, 260, 430, 560];
const REEL_SPRING = { type: "spring", stiffness: 90, damping: 22, mass: 1.2 };

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

const SLOT_LABELS = { starter: "Starter", main: "Main", drink: "Drink" };
const SLOT_ICONS = { starter: "🥗", main: "🍛", drink: "🥤" };

/* ─── Grouping geometry (compact progress strip) ─────────────
   Starter docks straight up (90°) from the base, main course
   docks at 45° from the starter, beverage docks at 135° from
   the main — same angles as the approved prototype, just drawn
   small now since the reel below does the heavy lifting.
──────────────────────────────────────────────────────────── */
const ANGLES = { starter: 90, main: 45, drink: 135 };
const BASE_ANCHOR = { x: 16, y: 82 };
const STEP = 26;

const dirFor = (deg) => {
  const r = (deg * Math.PI) / 180;
  return { dx: Math.cos(r), dy: -Math.sin(r) };
};

const slotFor = (anchor, angle, i) => {
  const d = dirFor(angle);
  return { x: anchor.x + d.dx * STEP * (i + 1), y: anchor.y + d.dy * STEP * (i + 1) };
};

const buildAnchors = (selectedItems) => {
  const anchors = [BASE_ANCHOR];
  if (selectedItems.starter) anchors.push(slotFor(anchors[0], ANGLES.starter, 0));
  if (selectedItems.main) anchors.push(slotFor(anchors[1], ANGLES.main, 0));
  if (selectedItems.drink) anchors.push(slotFor(anchors[2], ANGLES.drink, 0));
  return anchors;
};

/* Reel recede direction — same dirFor() the grouping strip uses,
   just applied to the browsing stack itself so the "one by one,
   behind, at Xdeg" motion is visible while picking, not only after. */
const reelSlotTransform = (slot, angleDeg) => {
  const d = dirFor(angleDeg);
  const dist = REEL_SLOT_DIST[slot];
  return { x: d.dx * dist, y: d.dy * dist };
};

const GroupNode = ({ item, anchor, onClick }) => (
  <motion.div
    className="combo-group-node"
    style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
    layout
    initial={{ opacity: 0, scale: 0.4, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 220, damping: 26 }}
  >
    <button
      as={motion.button}
      className="btn-3d white combo-group-node-btn"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Change ${item.name}`}
    >
      <span className="combo-group-node-img">
        <img src={item.image} alt="" draggable={false} />
      </span>
    </button>
  </motion.div>
);

/* ─── FoodList-style swipeable reel for the active phase ─────── */
const ComboReel = ({ items, angle, onSelect }) => {
  const [renderIndex, setRenderIndex] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);

  useEffect(() => { setRenderIndex(0); }, [items]);

  if (!items.length) {
    return <div className="combo-reel-empty">Nothing here yet — check back soon.</div>;
  }

  const visible = [
    items[(renderIndex - 1 + items.length) % items.length],
    items[renderIndex],
    items[(renderIndex + 1) % items.length],
    items[(renderIndex + 2) % items.length],
    items[(renderIndex + 3) % items.length]
  ];

  const goNext = () => setRenderIndex(i => (i + 1) % items.length);
  const goPrev = () => setRenderIndex(i => (i - 1 + items.length) % items.length);
  const active = visible[1];

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
            transition={REEL_SPRING}
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

      <div className="combo-reel-images">
        {visible.map((item, slot) => {
          const t = reelSlotTransform(slot, angle);
          return (
            <motion.div
              key={item.id}
              className="combo-reel-image-wrapper"
              initial={{ x: t.x, y: t.y, scale: slot === 1 ? 0.9 : slot === 2 ? 0.6 : slot === 3 ? 0.35 : 0.28, opacity: 0 }}
              animate={{
                x: t.x,
                y: t.y,
                scale: slot === 1 ? 1 : slot === 2 ? 0.7 : slot === 3 ? 0.4 : 0.3,
                zIndex: slot === 1 ? 3 : slot === 2 ? 2 : slot === 3 ? 1 : 0,
                opacity: 1
              }}
              transition={REEL_SPRING}
            >
              <motion.img
                src={item.image}
                alt={item.name}
                className="combo-reel-image"
                animate={{ filter: slot === 1 ? "blur(0px)" : slot === 2 ? "blur(6px)" : slot === 3 ? "blur(10px)" : "blur(14px)" }}
                transition={REEL_SPRING}
                draggable={false}
              />
            </motion.div>
          );
        })}
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
              <div className="combo-cart-row-icon" aria-hidden="true">{SLOT_ICONS[key]}</div>
              <div className="combo-cart-row-text">
                <span className="combo-cart-row-label">{label}</span>
                <span className="combo-cart-row-name">{item ? item.name : "Not selected"}</span>
              </div>
              {item ? (
                <div className="combo-cart-row-right">
                  <span className="combo-cart-row-price">₹{item.price ?? item.basePrice ?? 0}</span>
                  <Button3D
                    as={motion.button}
                    className="home-btn home-btn-icon"
                    onClick={() => onDelete(key)}
                    aria-label={`Remove ${label}`}
                    whileTap={{ scale: 0.8 }}
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

  const anchors = useMemo(() => buildAnchors(selectedItems), [selectedItems]);

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

      {/* ── Grouping strip — bigger nodes, no connecting lines ── */}
      {selectedCount > 0 && (
        <motion.div
          className="combo-group-strip"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {selectedItems.starter && anchors[1] && <GroupNode item={selectedItems.starter} anchor={anchors[1]} onClick={() => handleUndo("starter")} />}
          {selectedItems.main && anchors[2] && <GroupNode item={selectedItems.main} anchor={anchors[2]} onClick={() => handleUndo("main")} />}
          {selectedItems.drink && anchors[3] && <GroupNode item={selectedItems.drink} anchor={anchors[3]} onClick={() => handleUndo("drink")} />}
        </motion.div>
      )}

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
            <ComboReel items={activeItems} angle={ANGLES[phaseTypeKey] ?? 90} onSelect={(item) => handlePick(phaseTypeKey, item)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Offer hint ── */}
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
                    <Button3D as={motion.button} className="home-btn home-btn-icon" onClick={handleCloseConfirmation} whileTap={{ scale: 0.85 }} aria-label="Close"><img src={closeIcon} style={{ width: "20px", height: "20px" }} alt="Close" /></Button3D>
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
                    <Button3D as={motion.button} className="home-btn home-btn-icon" onClick={() => setShowCart(false)} whileTap={{ scale: 0.85 }} aria-label="Close"><img style={{ width: "20px", height: "20px" }} src={closeIcon} alt="Close" /></Button3D>
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
                    disabled={!isComboComplete}
                    onClick={handleAddToBag}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: "100%" }}
                    frontStyle={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
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