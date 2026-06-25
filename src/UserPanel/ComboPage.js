import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./ComboPage.css";
import FavouriteCombo from "./FavouriteCombo";
import api from "../api";
import socket from "../socket";
import ButtonFace from "./shared/ButtonFace";
import { useToast } from "../components/Usetoast";

/* ─── Animations ──────────────────────────────────────────── */
const pageVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" } })
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
};

const slideIn = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.28, ease: "easeInOut" } }
};

const overlayAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};

const modalAnim = {
  hidden: { scale: 0.9, y: 20, opacity: 0 },
  show: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  exit: { scale: 0.93, y: 12, opacity: 0, transition: { duration: 0.22 } }
};

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

/* ─── Sub-components ──────────────────────────────────────── */
const CategoryCard = ({ title, active, selected, disabled, onClick }) => (
  <button
    className={`combo-category-card ${active ? "active" : ""} ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
    onClick={onClick}
    disabled={disabled}
  >
    <ButtonFace>
      {selected && <span className="combo-category-tick">✓</span>}
      {title}
    </ButtonFace>
  </button>
);

const SubCategoryBar = ({ groups, activeGroup, onSelect }) => (
  <div className="combo-subcategory-row">
    {groups.map(g => (
      <button
        key={g.id}
        className={`combo-subcategory-btn ${activeGroup === g.id ? "active" : ""}`}
        onClick={() => onSelect(g.id)}
      >
        <ButtonFace>{g.title}</ButtonFace>
      </button>
    ))}
  </div>
);

const ComboItemCard = ({ item, onAdd, index }) => (
  <motion.div
    className="combo-item-card"
    variants={itemVariants}
    custom={index}
    whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.97 }}
  >
    <div className="combo-item-image">
      <img src={item.image} alt={item.name} loading="lazy" />
    </div>
    <div className="combo-item-name">{item.name}</div>
    <div className="combo-item-price">₹{item.price ?? item.basePrice ?? 0}</div>
    <button className="combo-action-btn" onClick={onAdd}>
      <ButtonFace>Add</ButtonFace>
    </button>
  </motion.div>
);

const SelectedItem = ({ item, label, onDelete }) => (
  <motion.div
    className="combo-selected-item"
    variants={slideIn}
    initial="hidden"
    animate="show"
    exit="exit"
    layout
  >
    <div className="combo-selected-label">{label}</div>
    <div className="combo-selected-image">
      <img src={item.image} alt={item.name} />
    </div>
    <div className="combo-selected-info">
      <div className="combo-selected-name">{item.name}</div>
      <div className="combo-selected-price">₹{item.price ?? item.basePrice ?? 0}</div>
    </div>
    <button className="combo-selected-delete" onClick={onDelete} aria-label="Remove">✕</button>
  </motion.div>
);

const ProgressSteps = ({ starter, main, drink }) => {
  const steps = [
    { key: "starter", label: "Starter", done: !!starter, name: starter?.name },
    { key: "main", label: "Main", done: !!main, name: main?.name },
    { key: "drink", label: "Drink", done: !!drink, name: drink?.name },
  ];
  return (
    <div className="combo-progress">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`combo-progress-step ${s.done ? "done" : ""}`}>
            <div className="combo-progress-dot">{s.done ? "✓" : i + 1}</div>
            <div className="combo-progress-label">{s.done ? s.name : s.label}</div>
          </div>
          {i < 2 && <div className={`combo-progress-line ${s.done ? "done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
const ComboPage = ({ foodData, addToBag, updateBagItem, handleBack, currentUser, setCurrentUser }) => {
  const location = useLocation();
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
  const [activeSection, setActiveSection] = useState("starters");
  const [activeStarterGroup, setActiveStarterGroup] = useState(() => startersSection.groups?.[0]?.id || null);
  const [activeMainGroup, setActiveMainGroup] = useState(null);
  const [activeDrinkGroup, setActiveDrinkGroup] = useState(null);
  const [offerHint, setOfferHint] = useState(null);
  const [showAddFavConfirm, setShowAddFavConfirm] = useState(false);
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [activeLeftView, setActiveLeftView] = useState("builder");
  const [quantity, setQuantity] = useState(() => (isEditMode && editQuantity) ? editQuantity : 1);

  const [selectedItems, setSelectedItems] = useState(() => {
    // ── 1. Edit mode (fromBag) — full comboItems already stored ──
    if (location.state?.comboItems) return location.state.comboItems;

    // ── 2. comboOffer navigation (from PromoCard / FoodCategory) ──
    // comboOffer = { condition: { starter: "Dish Name", main: "Dish Name" }, ... }
    // We need to look up the actual item objects from the combo sections so
    // prices, images etc. are all available. Since combo data isn't ready at
    // useState init time we seed with null here and resolve in a useEffect below.
    return { starter: null, main: null, drink: null };
  });

  /* ── Find item by name (bug fix: search groups not section.items) ── */
  const findComboItemByName = useCallback((type, name) => {
    const section = type === "starter" ? startersSection : type === "main" ? mainSection : beveragesSection;
    for (const group of (section.groups || [])) {
      const found = (group.items || []).find(i => i.name === name);
      if (found) return found;
    }
    return null;
  }, [startersSection, mainSection, beveragesSection]);

  // Resolve comboOffer → pre-selected items once combo data is available
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

    // Only apply if we found at least one item
    if (resolved.starter || resolved.main) {
      setSelectedItems(resolved);
      // Advance the active section to the first incomplete step
      if (resolved.starter && !resolved.main) setActiveSection("mainCourse");
      else if (resolved.starter && resolved.main) setActiveSection("beverages");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findComboItemByName]);

  /* ── Initialise groups when section activates ── */
  // Always reset to first subcategory whenever the active section changes,
  // so switching to a section always opens its first subcategory tab.
  useEffect(() => {
    if (activeSection === "starters")
      setActiveStarterGroup(startersSection.groups?.[0]?.id || null);
    if (activeSection === "mainCourse")
      setActiveMainGroup(mainSection.groups?.[0]?.id || null);
    if (activeSection === "beverages")
      setActiveDrinkGroup(beveragesSection.groups?.[0]?.id || null);
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Edit mode auto-advance ── */
  const { starter, main, drink } = selectedItems;
  useEffect(() => {
    if (!isEditMode) return;
    if (starter && !main) setActiveSection("mainCourse");
    else if (starter && main && !drink) setActiveSection("beverages");
    else if (starter && main && drink) setActiveSection(null);
  }, [isEditMode, starter?.name, main?.name, drink?.name]);

  /* ── Offer matching ── */
  const appliedOffer = useMemo(() => {
    const sName = selectedItems.starter?.name;
    const mName = selectedItems.main?.name;
    if (!sName || !mName) return null;
    return comboOfferRules.find(r => r.condition.starter === sName && r.condition.main === mName) || null;
  }, [selectedItems.starter?.name, selectedItems.main?.name, comboOfferRules]);

  /* ── Offer hint (only when exactly one is selected) ── */
  useEffect(() => {
    const hint = getOfferHint(selectedItems.starter, selectedItems.main, comboOfferRules);
    setOfferHint(hint);
  }, [selectedItems.starter?.name, selectedItems.main?.name, comboOfferRules]);

  /* ── Prices ── */
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

  const comboTitle = useMemo(() => {
    if (!isComboComplete) return "";
    return [selectedItems.starter.name, selectedItems.main.name, selectedItems.drink.name].join(" + ");
  }, [selectedItems, isComboComplete]);

  /* ── Actions ── */
  const handleAddItem = useCallback((type, item) => {
    setSelectedItems(prev => ({ ...prev, [type]: item }));
    if (type === "starter") { setActiveSection("mainCourse"); setActiveMainGroup(null); }
    else if (type === "main") { setActiveSection("beverages"); setActiveDrinkGroup(null); }
    else setActiveSection(null);
  }, []);

  const handleDelete = useCallback((type) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [type]: null };
      if (type === "starter") { updated.main = null; updated.drink = null; setActiveSection("starters"); setActiveMainGroup(null); setActiveDrinkGroup(null); }
      else if (type === "main") { updated.drink = null; setActiveSection("mainCourse"); setActiveMainGroup(null); }
      else setActiveSection("beverages");
      return updated;
    });
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
    setQuantity(1);
  }, [comboTitle, quantity, perComboFinalPrice, perComboBasePrice, originalTotal, appliedOffer, selectedItems, isEditMode, editIndex]);

  const handleHintAdd = useCallback(() => {
    if (!offerHint) return;
    const item = findComboItemByName(offerHint.targetType, offerHint.targetName);
    if (item) handleAddItem(offerHint.targetType, item);
    setOfferHint(null);
  }, [offerHint, findComboItemByName, handleAddItem]);

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
      setActiveLeftView("favourites");
    } catch (err) {
      console.error("Failed to save favourite combo", err);
      toast.error("Couldn't save to favourites. Please try again.");
      setShowAddFavConfirm(false);
    } finally {
      setIsSavingFav(false);
    }
  }, [currentUser, isComboComplete, comboTitle, selectedItems, originalTotal, perComboFinalPrice, discountedPrice, appliedOffer]);

  /* ── Render items ── */
  const currentItems = useMemo(() => {
    const getGroup = (section, activeGroup) => (section.groups || []).find(g => g.id === activeGroup);
    if (activeSection === "starters") return (getGroup(startersSection, activeStarterGroup)?.items || []);
    if (activeSection === "mainCourse") return (getGroup(mainSection, activeMainGroup)?.items || []);
    if (activeSection === "beverages") return (getGroup(beveragesSection, activeDrinkGroup)?.items || []);
    return [];
  }, [activeSection, activeStarterGroup, activeMainGroup, activeDrinkGroup, startersSection, mainSection, beveragesSection]);

  const currentGroups = useMemo(() => {
    if (activeSection === "starters") return startersSection.groups || [];
    if (activeSection === "mainCourse") return mainSection.groups || [];
    if (activeSection === "beverages") return beveragesSection.groups || [];
    return [];
  }, [activeSection, startersSection, mainSection, beveragesSection]);

  const activeGroup = activeSection === "starters" ? activeStarterGroup : activeSection === "mainCourse" ? activeMainGroup : activeDrinkGroup;
  const setActiveGroup = activeSection === "starters" ? setActiveStarterGroup : activeSection === "mainCourse" ? setActiveMainGroup : setActiveDrinkGroup;

  return (
    <motion.div className="combo-page" variants={pageVariant} initial="hidden" animate="show">

      {/* ── Offer hint overlay ── */}
      <AnimatePresence mode="wait">
        {offerHint && (
          <motion.div className="offer-hint-backdrop" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="offer-hint-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <div className="offer-hint-text">{offerHint.message}</div>
              <div className="btn-section">
                <button className="btn-3d red" onClick={() => setOfferHint(null)}>
                  <ButtonFace>Skip for now</ButtonFace>
                </button>
                <button className="btn-3d green" onClick={handleHintAdd}>
                  <ButtonFace>Add Item</ButtonFace>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add to fav confirm ── */}
      <AnimatePresence mode="wait">
        {showAddFavConfirm && (
          <motion.div className="combo-add-fav-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-add-fav-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <h3>Save to Favourites?</h3>
              <p className="combo-add-fav-title">{comboTitle}</p>
              <div className="btn-section">
                <button className="btn-3d white" onClick={() => setShowAddFavConfirm(false)}>
                  <ButtonFace>Cancel</ButtonFace>
                </button>
                <button className="btn-3d red" disabled={!isComboComplete || isSavingFav} onClick={() => { handleConfirmAddFav(); }}>
                  <ButtonFace>{isSavingFav ? "Saving…" : "Confirm"}</ButtonFace>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Duplicate overlay ── */}
      <AnimatePresence mode="wait">
        {showDuplicateOverlay && (
          <motion.div className="combo-add-fav-overlay" variants={overlayAnim} initial="hidden" animate="show" exit="exit">
            <motion.div className="combo-add-fav-modal" variants={modalAnim} initial="hidden" animate="show" exit="exit">
              <h3>Already Saved</h3>
              <p className="combo-add-fav-title">This combo already exists in your favourites.</p>
              <div className="btn-section">
                <button className="btn-3d red" onClick={() => setShowDuplicateOverlay(false)}>
                  <ButtonFace>Okay</ButtonFace>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEFT PANEL ── */}
      <div className="combo-left">
        {activeLeftView === "builder" && (
          <div className="combo-header">
            <div className="back-and-head">
              <button className="back-button" onClick={handleBack} />
              <div>
                <h2>{isEditMode ? "Edit Combo" : "Build Your Combo"}</h2>
                <p>Starter · Main · Drink — one of each</p>
              </div>
            </div>
            {currentUser && currentUser.id !== "guest" && (
              <div className="combo-header-btn-section">
                <button className="btn-3d red" disabled={!isComboComplete} onClick={() => setShowAddFavConfirm(true)}>
                  <ButtonFace frontStyle={{ padding: "0 10px" }}>♥ Save</ButtonFace>
                </button>
                <button className="btn-3d red" onClick={() => setActiveLeftView("favourites")}>
                  <ButtonFace frontStyle={{ padding: "0 10px" }}>My Favs</ButtonFace>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress steps */}
        {activeLeftView === "builder" && (
          <ProgressSteps starter={selectedItems.starter} main={selectedItems.main} drink={selectedItems.drink} />
        )}

        {activeLeftView === "builder" && (
          <>
            {/* Section tabs */}
            <div className="combo-category-row">
              <CategoryCard
                title="Starters"
                active={activeSection === "starters"}
                selected={!!selectedItems.starter}
                disabled={activeSection === "starters" && !!selectedItems.starter}
                onClick={() => setActiveSection("starters")}
              />
              <CategoryCard
                title="Main Course"
                active={activeSection === "mainCourse"}
                selected={!!selectedItems.main}
                disabled={!selectedItems.starter || (activeSection === "mainCourse" && !!selectedItems.main)}
                onClick={() => setActiveSection("mainCourse")}
              />
              <CategoryCard
                title="Beverages"
                active={activeSection === "beverages"}
                selected={!!selectedItems.drink}
                disabled={!selectedItems.main || (activeSection === "beverages" && !!selectedItems.drink)}
                onClick={() => setActiveSection("beverages")}
              />
            </div>

            {/* Subcategory bar */}
            {activeSection && currentGroups.length > 1 && (
              <SubCategoryBar groups={currentGroups} activeGroup={activeGroup} onSelect={setActiveGroup} />
            )}

            {/* Items grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection + activeGroup}
                className="combo-items-grid"
                variants={gridVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {currentItems.map((item, i) => (
                  <ComboItemCard
                    key={item.id}
                    item={item}
                    index={i}
                    onAdd={() => handleAddItem(
                      activeSection === "starters" ? "starter" : activeSection === "mainCourse" ? "main" : "drink",
                      item
                    )}
                  />
                ))}
                {currentItems.length === 0 && (
                  <div className="combo-empty">Select a category above to get started</div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {activeLeftView === "favourites" && (
          <>
            <div className="fav-combo-header">
              <button className="back-button" onClick={() => setActiveLeftView("builder")} />
              <h2>My Favourite Combos</h2>
            </div>
            <FavouriteCombo currentUser={currentUser} setCurrentUser={setCurrentUser} addToBag={addToBag} />
          </>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="combo-right">
        <div className="combo-right-header">
          <h3>Your Combo</h3>
          {isComboComplete && <span className="combo-complete-badge">Complete ✓</span>}
        </div>

        <div className="combo-slots">
          {/* Placeholder slots when empty */}
          {!selectedItems.starter && !selectedItems.main && !selectedItems.drink && (
            <div className="combo-slots-empty">
              {["Starter", "Main Course", "Beverage"].map(l => (
                <div key={l} className="combo-slot-placeholder">
                  <span className="combo-slot-icon">+</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {selectedItems.starter && <SelectedItem key={`s-${selectedItems.starter.id}`} item={selectedItems.starter} label="Starter" onDelete={() => handleDelete("starter")} />}
            {selectedItems.main && <SelectedItem key={`m-${selectedItems.main.id}`} item={selectedItems.main} label="Main" onDelete={() => handleDelete("main")} />}
            {selectedItems.drink && <SelectedItem key={`d-${selectedItems.drink.id}`} item={selectedItems.drink} label="Drink" onDelete={() => handleDelete("drink")} />}
          </AnimatePresence>
        </div>

        <div className="combo-summary">
          {/* Quantity */}
          <div className="quantity-section">
            <div className="quantity-label">Qty</div>
            <div className="stepper-ctrl">
              <button className="stepper-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity === 1}>
                −
              </button>
              <div className="stepper-val">{quantity}</div>
              <button className="stepper-btn" onClick={() => setQuantity(q => q + 1)}>
                +
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="combo-price-block">
            {appliedOffer ? (
              <>
                <div className="combo-price-row muted">
                  <span>Subtotal</span>
                  <span className="diagonal-strike">₹{originalTotal}</span>
                </div>
                <div className="combo-offer-tag">
                  <span className="combo-offer-badge">🏷 {appliedOffer.label}</span>
                  <span className="combo-offer-saving">−₹{savings}</span>
                </div>
                <div className="combo-price-row final">
                  <span>Total</span>
                  <span>₹{discountedPrice}</span>
                </div>
              </>
            ) : (
              <div className="combo-price-row final">
                <span>Total</span>
                <span>₹{originalTotal}</span>
              </div>
            )}
          </div>

          <button
            className="btn-3d red"
            onClick={handleAddToBag}
            disabled={!isComboComplete}
          >
            <ButtonFace>
              {isEditMode ? "Update Combo" : "Add to Bag"}
            </ButtonFace>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ComboPage;