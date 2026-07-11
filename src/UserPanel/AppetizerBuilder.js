import "./AppetizerBuilder.css";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button3D from "./shared/Button3D.js";
import { buildDishBagItem } from "./shared/bagUtils.js";
import closeIcon from "../assets/icons/close.png";
import homeIcon from "../assets/icons/home.png";
import cartIcon from "../assets/icons/cart.png";

/* ─── Animations (mirrors ComboPage) ─────────────────────────── */
const pageVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
};

/* Phase-to-phase crossfade — same blur/scale language as the combo
   builder so the two flows feel like the same product. */
const phaseTransition = {
  hidden: { opacity: 0, y: 26, scale: 0.97, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -18,
    scale: 0.97,
    filter: "blur(8px)",
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] }
  }
};

const REEL_SLOT_DIST = [-820, 0, 260, 430, 560];
const REEL_SPRING = { type: "spring", stiffness: 90, damping: 22, mass: 1.2 };

const overlayAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
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

/* ─── Grouping geometry (compact progress strip) ──────────────
   Sauce docks straight up (90°) from the base, main ingredient
   docks at 45° from the sauce — same angle language as the combo
   builder's starter → main → drink strip, just with two slots.
──────────────────────────────────────────────────────────── */
const ANGLES = { sauce: 90, main: 45 };
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

const buildAnchors = (selectedSauce, selectedMain) => {
  const anchors = [BASE_ANCHOR];
  if (selectedSauce) anchors.push(slotFor(anchors[0], ANGLES.sauce, 0));
  if (selectedMain) anchors.push(slotFor(anchors[1], ANGLES.main, 0));
  return anchors;
};

const reelSlotTransform = (slot, angleDeg) => {
  const d = dirFor(angleDeg);
  const dist = REEL_SLOT_DIST[slot];
  return { x: d.dx * dist, y: d.dy * dist };
};

const SLOT_LABELS = { sauce: "Sauce", main: "Main Ingredient" };

const GroupNode = ({ item, anchor, onClick }) => (
  <motion.div
    className="appetizer-group-node"
    style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
    layout
    initial={{ opacity: 0, scale: 0.4, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 220, damping: 26 }}
  >
    <button
      as={motion.button}
      className="btn-3d white appetizer-group-node-btn"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Change ${item.name}`}
    >
      <span className="appetizer-group-node-img">
        <img src={item.image} alt="" draggable={false} />
      </span>
    </button>
  </motion.div>
);

/* ─── FoodList-style swipeable reel for the active phase ─────── */
const AppetizerReel = ({ items, angle, onSelect }) => {
  const [renderIndex, setRenderIndex] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);

  useEffect(() => { setRenderIndex(0); }, [items]);

  if (!items.length) {
    return <div className="appetizer-reel-empty">Nothing here yet — check back soon.</div>;
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
      className="appetizer-reel"
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
        if (dy > 40) goPrev();
        else if (dy < -40) goNext();
      }}
      onPointerCancel={() => { isPointerDown.current = false; }}
    >
      <div className="appetizer-reel-details">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={REEL_SPRING}
          >
            <h2 className="appetizer-reel-name">{active.name}</h2>
            {active.description && <p className="appetizer-reel-desc">{active.description}</p>}
          </motion.div>
        </AnimatePresence>

        <Button3D className="btn-3d red" style={{ marginTop: 22, width: "fit-content" }} onClick={() => onSelect(active)}>
          Select »
        </Button3D>
      </div>

      <div className="appetizer-reel-images">
        {visible.map((item, slot) => {
          const t = reelSlotTransform(slot, angle);
          return (
            <motion.div
              key={item.id}
              className="appetizer-reel-image-wrapper"
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
                className="appetizer-reel-image"
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

const ROW_ICONS = { sauce: "🌶️", main: "🍢" };

/* ─── Sheet list content (clone of ComboPage's "My Combo" list) ─ */
const AppetizerContent = ({ selectedSauce, selectedMain, qty, setQty, finalDish, isComplete, onDelete }) => (
  <div className="appetizer-cart-content">
    <motion.div className="appetizer-cart-list" variants={listStagger} initial="hidden" animate="show">
      <AnimatePresence initial={false}>
        {["sauce", "main"].map(key => {
          const item = key === "sauce" ? selectedSauce : selectedMain;
          const label = SLOT_LABELS[key];
          return (
            <motion.div
              key={key}
              layout
              variants={listRow}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: -14, transition: { duration: 0.18 } }}
              className={`appetizer-cart-row ${item ? "filled" : "empty"}`}
            >
              <div className="appetizer-cart-row-icon" aria-hidden="true">{ROW_ICONS[key]}</div>
              <div className="appetizer-cart-row-text">
                <span className="appetizer-cart-row-label">{label}</span>
                <span className="appetizer-cart-row-name">{item ? item.name : "Not selected"}</span>
              </div>
              {item ? (
                <div className="appetizer-cart-row-right">
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
                <span className="appetizer-cart-row-empty">—</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>

    {isComplete && finalDish && (
      <>
        <div className="appetizer-cart-qty">
          <span>Quantity</span>
          <div className="stepper-ctrl">
            <button
              className="stepper-btn"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty === 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="stepper-val">{qty}</span>
            <button
              className="stepper-btn"
              onClick={() => setQty(q => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="appetizer-cart-divider" />

        <div className="appetizer-cart-totals">
          <div className="appetizer-cart-total-row final">
            <span>Total</span>
            <span>₹{finalDish.basePrice * qty}</span>
          </div>
        </div>
      </>
    )}
  </div>
);

/* ─── Receipt-style confirmation (mirrors ComboPage's) ───────── */
const AddedConfirmation = ({ dishTitle, price, onDone }) => (
  <motion.div
    className="appetizer-receipt"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
  >
    <motion.div
      className="appetizer-receipt-check"
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
      className="appetizer-receipt-sub"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.26, duration: 0.25 }}
    >
      Your appetizer is waiting in your bag
    </motion.p>

    <div className="appetizer-cart-divider" />

    <div className="appetizer-receipt-row">
      <span>{dishTitle}</span>
      <span>₹{price}</span>
    </div>

    <Button3D
      as={motion.button}
      className="btn-3d green appetizer-receipt-done"
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
const AppetizerBuilder = ({ foodData, addToBag, handleBack, handleHome }) => {
  const [selectedSauce, setSelectedSauce] = useState(null);
  const [selectedMain, setSelectedMain] = useState(null);
  const [qty, setQty] = useState(1);
  const [showSheet, setShowSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const appetizerCategory = useMemo(
    () => foodData.categories.find(c => c.id === "appetizer"),
    [foodData]
  );

  const sauces = useMemo(() => appetizerCategory?.appetizerSauces || [], [appetizerCategory]);
  const mains = useMemo(() => appetizerCategory?.appetizerMain || [], [appetizerCategory]);

  const finalDish = useMemo(() => (
    selectedSauce && selectedMain
      ? appetizerCategory?.dishes?.find(d => d.id === `${selectedSauce.id}_${selectedMain.id}`)
      : null
  ), [selectedSauce, selectedMain, appetizerCategory]);

  const phase = !selectedSauce ? "sauce" : !selectedMain ? "main" : "done";
  const phaseTypeKey = phase === "sauce" ? "sauce" : phase === "main" ? "main" : null;
  const activeItems = phase === "sauce" ? sauces : phase === "main" ? mains : [];

  const handlePick = useCallback((type, item) => {
    if (type === "sauce") setSelectedSauce(item);
    else setSelectedMain(item);
  }, []);

  const handleUndo = useCallback((type) => {
    if (type === "sauce") { setSelectedSauce(null); setSelectedMain(null); }
    else setSelectedMain(null);
    setQty(1);
  }, []);

  const resetSelection = () => {
    setSelectedSauce(null);
    setSelectedMain(null);
    setQty(1);
  };

  const addDishToBag = () => {
    if (!finalDish) return;

    addToBag(
      buildDishBagItem(finalDish, "appetizer", {
        quantity: qty,
        totalPrice: finalDish.basePrice * qty,
        ingredients: finalDish.ingredients
      })
    );

    setJustAdded(true);
  };

  const handleCloseConfirmation = useCallback(() => {
    setJustAdded(false);
    setShowSheet(false);
    setQty(1);
  }, []);

  const handleDoneReceipt = useCallback(() => {
    handleCloseConfirmation();
    handleHome?.();
  }, [handleCloseConfirmation, handleHome]);

  const selectedCount = [selectedSauce, selectedMain].filter(Boolean).length;

  /* ── Open the "My Appetizer" sheet automatically once the last
     item (main ingredient) completes the pick, instead of waiting
     for a bag-icon tap. Only fires on the false → true transition,
     so manually closing the sheet afterwards won't reopen it. ── */
  useEffect(() => {
    if (phase === "done") setShowSheet(true);
  }, [phase]);

  const anchors = useMemo(() => buildAnchors(selectedSauce, selectedMain), [selectedSauce, selectedMain]);

  return (
    <motion.div className="appetizer-page" variants={pageVariant} initial="hidden" animate="show">

      {/* ── Top bar (back chevron + phase label + home) ── */}
      <div className="appetizer-topbar">
        <motion.button className="back-button" onClick={handleBack} aria-label="Back" whileTap={{ scale: 0.85, x: -2 }} />

        <div className="appetizer-phase-label">
          {phase === "sauce" && "Swipe up or down to browse, pick a sauce"}
          {phase === "main" && "Now swipe up or down and pick a main ingredient"}
          {phase === "done" && "Your appetizer is ready"}
        </div>

        <div className="appetizer-topbar-actions">
          <Button3D
            as={motion.button}
            className="btn-3d white sq-padding appetizer-icon-btn"
            onClick={() => setShowSheet(true)}
            aria-label="View your appetizer"
            whileTap={{ scale: 0.88 }}
            disabled={selectedCount === 0}
          >
            <img src={cartIcon} alt="View your appetizer" />
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.span
                  key={selectedCount}
                  className="appetizer-badge"
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

          <Button3D
            as={motion.button}
            className="home-btn home-btn-icon"
            onClick={handleHome}
            aria-label="Home"
            whileTap={{ scale: 0.88 }}
          >
            <img src={homeIcon} alt="Home" />
          </Button3D>
        </div>
      </div>

      {/* ── Grouping strip — bigger nodes, no connecting lines ── */}
      {(selectedSauce || selectedMain) && (
        <motion.div
          className="appetizer-group-strip"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {selectedSauce && anchors[1] && <GroupNode item={selectedSauce} anchor={anchors[1]} onClick={() => handleUndo("sauce")} />}
          {selectedMain && anchors[2] && <GroupNode item={selectedMain} anchor={anchors[2]} onClick={() => handleUndo("main")} />}
        </motion.div>
      )}

      {/* ── Swipeable reel — crossfades between phases, hidden once the
           appetizer is complete since the sheet modal takes over from there ── */}
      <AnimatePresence initial={false} mode="popLayout">
        {phase !== "done" && (
          <motion.div
            key={phase}
            variants={phaseTransition}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ position: "relative" }}
          >
            <AppetizerReel items={activeItems} angle={ANGLES[phaseTypeKey] ?? 90} onSelect={(item) => handlePick(phaseTypeKey, item)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "My Appetizer" sheet — mirrors ComboPage's combo-sheet exactly ── */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            className="appetizer-sheet-overlay"
            variants={overlayAnim}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => !justAdded && setShowSheet(false)}
          >
            <motion.div
              className="appetizer-sheet-modal"
              variants={sheetAnim}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              drag={!justAdded ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90) setShowSheet(false);
              }}
            >
              <div className="appetizer-sheet-handle" />

              {justAdded ? (
                <>
                  <div className="appetizer-sheet-header">
                    <h3>Receipt</h3>
                    <Button3D as={motion.button} className="home-btn home-btn-icon" onClick={handleCloseConfirmation} whileTap={{ scale: 0.85 }} aria-label="Close">
                      <img src={closeIcon} style={{ width: "20px", height: "20px" }} alt="Close" />
                    </Button3D>
                  </div>
                  <AddedConfirmation
                    dishTitle={finalDish ? finalDish.name : `${SLOT_LABELS.sauce} + ${SLOT_LABELS.main}`}
                    price={finalDish ? finalDish.basePrice * qty : 0}
                    onDone={handleDoneReceipt}
                  />
                </>
              ) : (
                <>
                  <div className="appetizer-sheet-header">
                    <h3>My Appetizer</h3>
                    <Button3D as={motion.button} className="home-btn home-btn-icon" onClick={() => setShowSheet(false)} whileTap={{ scale: 0.85 }} aria-label="Close">
                      <img style={{ width: "20px", height: "20px" }} src={closeIcon} alt="Close" />
                    </Button3D>
                  </div>

                  <div className="appetizer-sheet-body">
                    <AppetizerContent
                      selectedSauce={selectedSauce}
                      selectedMain={selectedMain}
                      qty={qty}
                      setQty={setQty}
                      finalDish={finalDish}
                      isComplete={phase === "done"}
                      onDelete={handleUndo}
                    />

                    {phase === "done" && !finalDish && (
                      <div className="final-placeholder">
                        <div className="placeholder-icon">🍽️</div>
                        <div className="placeholder-text">
                          This sauce and main ingredient combination isn't available yet.
                        </div>
                        <Button3D
                          as={motion.button}
                          className="btn-3d white"
                          onClick={() => { resetSelection(); setShowSheet(false); }}
                          whileTap={{ scale: 0.96 }}
                        >
                          Start Over
                        </Button3D>
                      </div>
                    )}
                  </div>

                  <Button3D
                    as={motion.button}
                    className="btn-3d red appetizer-checkout-bar"
                    disabled={!finalDish}
                    onClick={addDishToBag}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: "100%" }}
                    frontStyle={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
                  >
                    <span>Add to Bag</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={finalDish ? finalDish.basePrice * qty : 0}
                        className="appetizer-checkout-amount"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        ₹{finalDish ? finalDish.basePrice * qty : 0}
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

export default AppetizerBuilder;