import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { COMBO_OFFER_RULES } from "./comboNotifications";
import "./ComboPage.css";
import FavouriteCombo from "./FavouriteCombo";
import FavouriteComboOverlay from "./FavouriteComboOverlay";
import api from "../api";

/*ANIMATIONS*/
const pageVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const getOfferHint = (starter, main) => {
  if (starter && !main) {
    const rule = COMBO_OFFER_RULES.find(
      r => r.condition.starter === starter.name
    );

    if (rule) {
      return {
        message: `Add ${rule.condition.main} to unlock ${rule.label}`,
        targetType: "main",
        targetName: rule.condition.main
      };
    }
  }

  if (main && !starter) {
    const rule = COMBO_OFFER_RULES.find(
      r => r.condition.main === main.name
    );

    if (rule) {
      return {
        message: `Add ${rule.condition.starter} to unlock ${rule.label}`,
        targetType: "starter",
        targetName: rule.condition.starter
      };
    }
  }

  return null;
};

/*COMPONENT*/
const ComboPage = ({
  foodData,
  addToBag,
  updateBagItem,
  handleBack,
  currentUser,
  setCurrentUser
}) => {
  const location = useLocation();

  const isEditMode = location.state?.fromBag;
  const editQuantity = location.state?.quantity;
  const editIndex = location.state?.bagIndex;
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [activeLeftView, setActiveLeftView] = useState("builder");
  /*DATA*/
  const combo = useMemo(
    () => (Array.isArray(foodData?.combo) ? foodData.combo : []),
    [foodData]
  );

  const startersSection =
    combo.find(c => c.type === "starters") || { items: [] };

  const mainSection = useMemo(
    () => combo.find(c => c.type === "mainCourse") || { groups: [] },
    [combo]
  );

  const drinksSection = useMemo(
    () => combo.find(c => c.type === "drinks") || { groups: [] },
    [combo]
  );

  /*STATE*/
  const [activeSection, setActiveSection] = useState("starters");
  const [activeMainGroup, setActiveMainGroup] = useState(null);
  const [activeDrinkGroup, setActiveDrinkGroup] = useState(null);
  const [offerHint, setOfferHint] = useState(null);
  const [showAddFavConfirm, setShowAddFavConfirm] = useState(false);
  const [quantity, setQuantity] = useState(() =>
    isEditMode && editQuantity ? editQuantity : 1
  );

  useEffect(() => {
    if (activeSection === "mainCourse" && !activeMainGroup) {
      setActiveMainGroup(mainSection.groups?.[0]?.id || null);
    }
  }, [activeSection, mainSection, activeMainGroup]);

  useEffect(() => {
    if (activeSection === "drinks" && !activeDrinkGroup) {
      setActiveDrinkGroup(drinksSection.groups?.[0]?.id || null);
    }
  }, [activeSection, drinksSection, activeDrinkGroup]);

  const [selectedItems, setSelectedItems] = useState(() => {
    if (isEditMode && location.state?.comboItems) {
      return location.state.comboItems;
    }
    return { starter: null, main: null, drink: null };
  });

  const [appliedOffer, setAppliedOffer] = useState(null);

  /*PRICE CALCULATION*/
  const perComboBasePrice = useMemo(() => {
    return Object.values(selectedItems)
      .filter(Boolean)
      .reduce((sum, item) => {
        const price = Number(item.price ?? item.basePrice ?? 0);
        return sum + price;
      }, 0);
  }, [selectedItems]);

  const perComboFinalPrice = useMemo(() => {
    if (!appliedOffer) return perComboBasePrice;

    if (appliedOffer.type === "FLAT") {
      return Math.max(perComboBasePrice - appliedOffer.value, 0);
    }

    if (appliedOffer.type === "PERCENT") {
      return Math.round(
        perComboBasePrice -
        (perComboBasePrice * appliedOffer.value) / 100
      );
    }

    return perComboBasePrice;
  }, [perComboBasePrice, appliedOffer]);

  const originalTotal = perComboBasePrice * quantity;
  const discountedPrice = perComboFinalPrice * quantity;

  const isComboComplete =
    selectedItems.starter &&
    selectedItems.main &&
    selectedItems.drink;

  const comboTitle = useMemo(() => {
    if (!isComboComplete) return "";

    return [
      selectedItems.starter.name,
      selectedItems.main.name,
      selectedItems.drink.name
    ].join(" + ");
  }, [selectedItems, isComboComplete]);

  const findComboItemByName = (type, name) => {
    if (type === "starter") {
      return startersSection.items.find(i => i.name === name);
    }

    if (type === "main") {
      for (const group of mainSection.groups) {
        const found = group.items.find(i => i.name === name);
        if (found) return found;
      }
    }

    if (type === "drink") {
      for (const group of drinksSection.groups) {
        const found = group.items.find(i => i.name === name);
        if (found) return found;
      }
    }

    return null;
  };

  const { starter, main, drink } = selectedItems;
  useEffect(() => {
    if (!isEditMode) return;

    if (starter && !main) {
      setActiveSection("mainCourse");
    } else if (starter && main && !drink) {
      setActiveSection("drinks");
    } else if (starter && main && drink) {
      setActiveSection(null);
    }
  }, [isEditMode, starter, main, drink]);

  useEffect(() => {
    const starterName = selectedItems.starter?.name;
    const mainName = selectedItems.main?.name;

    // Only starter or main missing → remove offer
    if (!starterName || !mainName) {
      setAppliedOffer(null);
      return;
    }

    // Find matching offer
    const matched = COMBO_OFFER_RULES.find(
      rule =>
        rule.condition.starter === starterName &&
        rule.condition.main === mainName
    );

    setAppliedOffer(matched || null);
  }, [
    selectedItems.starter?.name,
    selectedItems.main?.name
  ]);

  useEffect(() => {
    const hint = getOfferHint(starter, main);
    setOfferHint(hint);
  }, [starter, main]);

  const handleHintAdd = () => {
    if (!offerHint) return;

    const { targetType, targetName } = offerHint;

    const item = findComboItemByName(targetType, targetName);

    if (item) {
      handleAddItem(targetType, item); // ✅ ACTUALLY ADD
    }

    setOfferHint(null); // close overlay
  };

  const handleHintSkip = () => {
    setOfferHint(null); // manual close
  };

  /*ACTIONS*/
  const handleAddItem = (type, item) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [type]: item };

      // 🔁 AUTO-ADVANCE FLOW
      if (type === "starter") {
        setActiveSection("mainCourse");
      } else if (type === "main") {
        setActiveSection("drinks");
      } else {
        setActiveSection(null);
      }

      setActiveMainGroup(null);
      setActiveDrinkGroup(null);
      return updated;
    });
  };

  const handleDelete = (type) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [type]: null };

      if (type === "starter") {
        updated.main = null;
        updated.drink = null;
        setActiveSection("starters");
        setActiveMainGroup(null);
        setActiveDrinkGroup(null);
      } else if (type === "main") {
        updated.drink = null;
        setActiveSection("mainCourse");
        setActiveMainGroup(null);
      } else if (type === "drink") {
        setActiveSection("drinks");
        setActiveDrinkGroup(null);
      }
      return updated;
    });
  };

  const handleAddToBag = () => {
    const comboItem = {
      id: `combo_${Date.now()}`,
      name: comboTitle,
      categoryId: "combo",

      quantity,

      // ✅ ADD THIS (CRITICAL)
      unitPrice: perComboFinalPrice,

      // keep existing fields
      perComboBasePrice,
      perComboFinalPrice,

      // total must ALWAYS be unitPrice * quantity
      totalPrice: perComboFinalPrice * quantity,

      originalPrice: originalTotal,
      appliedOffer,
      comboItems: selectedItems,
      isCombo: true
    };

    if (isEditMode) {
      updateBagItem(editIndex, comboItem);
    } else {
      addToBag(comboItem);
    }
    setQuantity(1);
  };

  const increaseQty = () => setQuantity(q => q + 1);

  const decreaseQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  /*RENDER HELPERS*/
  const renderStarters = () =>
    (startersSection?.items || []).map(item => (
      <ComboItemCard
        key={item.id}
        item={item}
        onAdd={() => handleAddItem("starter", item)}
      />
    ));

  const renderMain = () => {
    if (!Array.isArray(mainSection.groups)) return null;

    const group = mainSection.groups.find(g => g.id === activeMainGroup);
    if (!group || !Array.isArray(group.items)) return null;

    return group.items.map(item => (
      <ComboItemCard
        key={item.id}
        item={item}
        onAdd={() => handleAddItem("main", item)}
      />
    ));
  };

  const renderDrinks = () => {
    if (!Array.isArray(drinksSection.groups)) return null;

    if (!activeDrinkGroup) {
      return drinksSection.groups.map(group => (
        <GroupCard
          key={group.id}
          title={group.title}
          onClick={() => setActiveDrinkGroup(group.id)}
        />
      ));
    }

    const group = drinksSection.groups.find(g => g.id === activeDrinkGroup);
    if (!group || !Array.isArray(group.items)) return null;

    return group.items.map(item => (
      <ComboItemCard
        key={item.id}
        item={item}
        onAdd={() => handleAddItem("drink", item)}
      />
    ));
  };

  const renderMainSubCategories = () => (
    <div className="combo-subcategory-row">
      {mainSection.groups.map(group => (
        <button
          key={group.id}
          className={`combo-subcategory-btn ${activeMainGroup === group.id ? "active" : ""
            }`}
          onClick={() => setActiveMainGroup(group.id)}
        >
          {group.title}
        </button>
      ))}
    </div>
  );

  const renderDrinkSubCategories = () => (
    <div className="combo-subcategory-row">
      {drinksSection.groups.map(group => (
        <button
          key={group.id}
          className={`combo-subcategory-btn ${activeDrinkGroup === group.id ? "active" : ""
            }`}
          onClick={() => setActiveDrinkGroup(group.id)}
        >
          {group.title}
        </button>
      ))}
    </div>
  );

  const renderItems = () => {
    if (activeSection === "starters") {
      return renderStarters();
    }

    if (activeSection === "mainCourse") {
      return renderMain();
    }

    if (activeSection === "drinks") {
      return renderDrinks();
    }

    return null;
  };

  if (!startersSection || !mainSection || !drinksSection) {
    return <div className="combo-page combo-loading">Loading combos...</div>;
  }

  const handleConfirmAddFav = async () => {
    if (!currentUser || !isComboComplete) return;
    setIsSavingFav(true);

    const newCombo = {
      id: `favcombo_${Date.now()}`,
      title: comboTitle,
      items: {
        starter: selectedItems.starter.name,
        main: selectedItems.main.name,
        drink: selectedItems.drink.name
      },
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

    if (isDuplicate) {
      setIsSavingFav(false);          // ✅ RESET LOADING STATE
      setShowAddFavConfirm(false);
      setShowDuplicateOverlay(true);
      return;
    }

    try {
      const updatedUser = {
        ...currentUser,
        combo: [...existingCombos, newCombo]
      };

      await api.put(`/users/${currentUser.id}`, updatedUser);
      setCurrentUser(updatedUser);
      setShowAddFavConfirm(false);
      setActiveLeftView("favourites");
    } catch (err) {
      console.error("Failed to save favourite combo", err);
      alert("Failed to add combo to favourites.");
    } finally {
      setIsSavingFav(false);
    }
  };

  /*JSX*/
  return (
    <motion.div
      className="combo-page"
      variants={pageVariant}
      initial="hidden"
      animate="show"
    >

      <AnimatePresence mode="wait">
        {offerHint && (
          <motion.div
            className="offer-hint-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="offer-hint-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="offer-hint-text">
                🎉 {offerHint.message}
              </div>

              <div className="offer-hint-actions">
                <button
                  className="offer-hint-add"
                  onClick={handleHintAdd}
                >
                  Add
                </button>

                <button
                  className="offer-hint-skip"
                  onClick={handleHintSkip}
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* LEFT */}
      <div className="combo-left">
        {activeLeftView === "builder" && (
          <div className="combo-header">
            <button className="back-button" onClick={handleBack} />

            <div>
              <h2>{isEditMode ? "Edit Combo" : "Create Your Combo"}</h2>
              <p>Select one starter, one main & one drink</p>
            </div>

            {currentUser && currentUser.id !== "guest" && (
              <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                <button
                  className="combo-add-fav-btn"
                  disabled={!isComboComplete}
                  onClick={() => {
                    setShowAddFavConfirm(true);
                  }}
                >
                  Add to Fav
                </button>

                <button
                  className="combo-my-fav-btn"
                  onClick={() => setActiveLeftView("favourites")}
                >
                  My Favourites
                </button>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {showAddFavConfirm && (
            <motion.div
              className="combo-add-fav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="combo-add-fav-modal"
                initial={{ scale: 0.94, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 20, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <h3>Add Combo to Favourites?</h3>

                <p className="combo-add-fav-title">
                  {comboTitle}
                </p>

                <div className="combo-add-fav-actions">
                  <button
                    className="combo-add-fav-cancel"
                    onClick={() => setShowAddFavConfirm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="combo-add-fav-confirm"
                    disabled={!isComboComplete || isSavingFav}
                    onClick={() => {
                      handleConfirmAddFav();
                      setActiveLeftView("favourites");
                    }}
                  >
                    {isSavingFav ? "Saving..." : "Confirm"}
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showDuplicateOverlay && (
            <motion.div
              className="combo-add-fav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="combo-add-fav-modal"
                initial={{ scale: 0.92, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 20, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h3>Already Added</h3>

                <p className="combo-add-fav-title">
                  This combo already exists in your favourites.
                </p>

                <div className="combo-add-fav-actions">
                  <button
                    className="combo-add-fav-confirm"
                    onClick={() => setShowDuplicateOverlay(false)}
                  >
                    Okay
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeLeftView === "builder" && (
          <>
            <div className="combo-category-row">
              <CategoryCard
                title="Starters"
                active={activeSection === "starters"}
                disabled={!!selectedItems.starter}
                onClick={() => setActiveSection("starters")}
              />

              <CategoryCard
                title="Main Course"
                active={activeSection === "mainCourse"}
                disabled={!!selectedItems.main}
                onClick={() => setActiveSection("mainCourse")}
              />

              <CategoryCard
                title="Drinks"
                active={activeSection === "drinks"}
                disabled={!!selectedItems.drink}
                onClick={() => setActiveSection("drinks")}
              />
            </div>

            {activeSection === "mainCourse" && renderMainSubCategories()}
            {activeSection === "drinks" && renderDrinkSubCategories()}

            <div className="combo-items-grid">
              {renderItems()}
            </div>
          </>
        )}

        {activeLeftView === "favourites" && (
          <>
            <div className="combo-header">
              <button
                className="back-button"
                onClick={() => setActiveLeftView("builder")}
              />
              <h2>My Favourite Combos</h2>
            </div>

            <FavouriteCombo
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              addToBag={addToBag}
            />
          </>
        )}
      </div>

      {/* RIGHT */}
      <div className="combo-right">
        <h3>Your Combo</h3>

        <AnimatePresence>
          {selectedItems.starter && (
            <SelectedItem
              key={`selected-starter-${selectedItems.starter.id}`}
              item={selectedItems.starter}
              onDelete={() => handleDelete("starter")}
            />
          )}
          {selectedItems.main && (
            <SelectedItem
              key={`selected-main-${selectedItems.main.id}`}
              item={selectedItems.main}
              onDelete={() => handleDelete("main")}
            />
          )}
          {selectedItems.drink && (
            <SelectedItem
              key={`selected-drink-${selectedItems.drink.id}`}
              item={selectedItems.drink}
              onDelete={() => handleDelete("drink")}
            />
          )}
        </AnimatePresence>

        <div className="combo-summary">
          <div className="quantity-section">
            <div className="quantity-label">Quantity</div>

            <div className="quantity-controls">
              <button
                className="qty-btn"
                onClick={decreaseQty}
                disabled={quantity === 1}
              >
                -
              </button>

              <div className="qty-value">{quantity}x</div>

              <button
                className="qty-btn"
                onClick={increaseQty}
              >
                +
              </button>
            </div>
          </div>

          {appliedOffer ? (
            <>
              <div className="combo-original-price strike">
                <div>Total Price:</div>
                <div className="diagonal-strike">₹{originalTotal}</div>
              </div>

              <div className="combo-offer-label">
                {appliedOffer.label}
              </div>

              <div className="combo-discounted-price">
                <div>Discounted Price</div>
                <div>
                  ₹{(perComboBasePrice - perComboFinalPrice) * quantity}
                </div>
              </div>

              <div className="combo-final-price">
                <div>Final Price: </div>
                <div>₹{discountedPrice}</div>
              </div>
            </>
          ) : (
            <div className="combo-final-price">
              <div>Final Price: </div>
              <div>₹{originalTotal}</div>
            </div>
          )}

          <button
            className="combo-add-btn"
            disabled={!isComboComplete}
            onClick={handleAddToBag}
          >
            {isEditMode ? "Update Combo" : "Add Combo to Bag"}
          </button>
        </div>

      </div>
    </motion.div>
  );
};

/*SUB COMPONENTS*/
const CategoryCard = ({ title, active, disabled, onClick }) => (
  <button
    className={`combo-category-card 
      ${active ? "active" : ""} 
      ${disabled ? "disabled" : ""}`}
    onClick={!disabled ? onClick : undefined}
  >
    {title}
  </button>
);

const GroupCard = ({ title, onClick }) => (
  <motion.div
    className="combo-group-card"
    variants={itemVariants}
    whileHover={{ y: -4 }}
    onClick={onClick}
  >
    {title}
  </motion.div>
);

const ComboItemCard = ({ item, onAdd }) => (
  <motion.div
    className="combo-item-card"
    variants={itemVariants}
    whileHover={{
      y: -6,
      scale: 1.03,
      transition: { duration: 0.25, ease: "easeOut" }
    }}
  >
    <div className="combo-item-image">
      <img src={item.image} alt="" />
    </div>
    <div className="combo-item-name">{item.name}</div>
    <div className="combo-item-price">₹{item.price}</div>
    <button onClick={onAdd}>Add</button>
  </motion.div>
);

const SelectedItem = ({ item, onDelete }) => (

  <motion.div
    className="combo-selected-item"
    initial={{ opacity: 0, x: 50 }}
    animate={{
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
    }}
    exit={{
      opacity: 0,
      x: -50,
      transition: { duration: 0.35, ease: "easeInOut" }
    }}
  >
    <div className="combo-selected-image">
      <img src={item.image} alt="" />
    </div>
    <div className="combo-selected-info">
      <div>{item.name}</div>
      <div>₹{item.price}</div>
    </div>
    <button onClick={onDelete}>✕</button>
  </motion.div>
);

export default ComboPage;
