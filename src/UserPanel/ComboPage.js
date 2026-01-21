import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { COMBO_OFFER_RULES } from "./comboNotifications";
import "./ComboPage.css";

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

const getOfferHint = (selectedItems) => {
  // Starter selected, main missing
  if (selectedItems.starter && !selectedItems.main) {
    const rule = COMBO_OFFER_RULES.find(
      r => r.condition.starter === selectedItems.starter.name
    );

    if (rule) {
      return {
        message: `Add ${rule.condition.main} to unlock ${rule.label}`,
        targetType: "main",
        targetName: rule.condition.main
      };
    }
  }

  // Main selected, starter missing (future-proof)
  if (selectedItems.main && !selectedItems.starter) {
    const rule = COMBO_OFFER_RULES.find(
      r => r.condition.main === selectedItems.main.name
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
const ComboPage = ({ foodData, addToBag, updateBagItem, handleBack }) => {
  const location = useLocation();

  const isEditMode = location.state?.fromBag;
  const editIndex = location.state?.bagIndex;

  /*DATA*/
  const combo = useMemo(
    () => (Array.isArray(foodData?.combo) ? foodData.combo : []),
    [foodData]
  );

  const startersSection =
    combo.find(c => c.type === "starters") || { items: [] };

  const mainSection =
    combo.find(c => c.type === "mainCourse") || { groups: [] };

  const drinksSection =
    combo.find(c => c.type === "drinks") || { groups: [] };

  /*STATE*/
  const [activeSection, setActiveSection] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [offerHint, setOfferHint] = useState(null);
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState(() => {
    if (isEditMode && location.state?.comboItems) {
      return location.state.comboItems;
    }
    return { starter: null, main: null, drink: null };
  });

  const [appliedOffer, setAppliedOffer] = useState(null);

  /*PRICE CALCULATION*/
  const originalTotal = useMemo(() => {
    return Object.values(selectedItems)
      .filter(Boolean)
      .reduce((sum, item) => sum + item.price, 0);
  }, [selectedItems]);

  const discountedPrice = useMemo(() => {
    if (!appliedOffer) return originalTotal;

    if (appliedOffer.type === "FLAT") {
      return Math.max(originalTotal - appliedOffer.value, 0);
    }

    if (appliedOffer.type === "PERCENT") {
      return Math.round(
        originalTotal - (originalTotal * appliedOffer.value) / 100
      );
    }

    return originalTotal;
  }, [originalTotal, appliedOffer]);

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
    const hint = getOfferHint(selectedItems);

    if (hint) {
      setOfferHint(hint);
    }
  }, [selectedItems.starter, selectedItems.main]);

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
    setSelectedItems(prev => ({ ...prev, [type]: item }));
    setActiveSection(null);
    setActiveGroup(null);
  };

  const handleDelete = (type) => {
    setSelectedItems(prev => ({ ...prev, [type]: null }));
  };

  const handleAddToBag = () => {
    const comboItem = {
      id: `combo_${Date.now()}`,
      name: "Custom Combo",
      categoryId: "combo",
      quantity: 1,

      originalPrice: originalTotal,
      totalPrice: discountedPrice,
      appliedOffer,

      comboItems: selectedItems,
      isCombo: true
    };

    if (isEditMode) {
      updateBagItem(editIndex, comboItem);
    } else {
      addToBag(comboItem);
    }

    navigate("/thank-you");
  };

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

    if (!activeGroup) {
      return mainSection.groups.map(group => (
        <GroupCard
          key={group.id}
          title={group.title}
          onClick={() => setActiveGroup(group.id)}
        />
      ));
    }

    const group = mainSection.groups.find(g => g.id === activeGroup);
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

    if (!activeGroup) {
      return drinksSection.groups.map(group => (
        <GroupCard
          key={group.id}
          title={group.title}
          onClick={() => setActiveGroup(group.id)}
        />
      ));
    }

    const group = drinksSection.groups.find(g => g.id === activeGroup);
    if (!group || !Array.isArray(group.items)) return null;

    return group.items.map(item => (
      <ComboItemCard
        key={item.id}
        item={item}
        onAdd={() => handleAddItem("drink", item)}
      />
    ));
  };

  const renderItems = () => {
    if (activeSection === "starters") return renderStarters();
    if (activeSection === "mainCourse") return renderMain();
    if (activeSection === "drinks") return renderDrinks();
    return null;
  };

  if (!startersSection || !mainSection || !drinksSection) {
    return <div className="combo-page combo-loading">Loading combos...</div>;
  }

  /*JSX*/
  return (
    <motion.div
      className="combo-page"
      variants={pageVariant}
      initial="hidden"
      animate="show"
    >

      <AnimatePresence>
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
        <div className="combo-header">
          <button
            className="back-button"
            onClick={handleBack}
          >
          </button>

          <div>
            <h2>{isEditMode ? "Edit Combo" : "Create Your Combo"}</h2>
            <p>Select one starter, one main & optional drink</p>
          </div>
        </div>

        <div className="combo-category-row">
          <CategoryCard
            title="Starters"
            disabled={!!selectedItems.starter}
            onClick={() => setActiveSection("starters")}
          />
          <CategoryCard
            title="Main Course"
            disabled={!!selectedItems.main}
            onClick={() => setActiveSection("mainCourse")}
          />
          <CategoryCard
            title="Drinks"
            disabled={!!selectedItems.drink}
            onClick={() => setActiveSection("drinks")}
          />
        </div>

        <div className="combo-items-grid">
          {renderItems()}
        </div>
      </div>

      {/* RIGHT */}
      <div className="combo-right">
        <h3>Your Combo</h3>

        <AnimatePresence>
          {selectedItems.starter && (
            <SelectedItem
              item={selectedItems.starter}
              onDelete={() => handleDelete("starter")}
            />
          )}
          {selectedItems.main && (
            <SelectedItem
              item={selectedItems.main}
              onDelete={() => handleDelete("main")}
            />
          )}
          {selectedItems.drink && (
            <SelectedItem
              item={selectedItems.drink}
              onDelete={() => handleDelete("drink")}
            />
          )}
        </AnimatePresence>

        <div className="combo-summary">
          {appliedOffer ? (
            <>
              <div className="combo-original-price">
                <div>Total Price: </div>
                <div>₹{originalTotal}</div>
              </div>

              <div className="combo-offer-label">
                {appliedOffer.label}
              </div>

              <div className="combo-discounted-price">
                <div>Discounted Price: </div>
                <div>₹{discountedPrice}</div>
              </div>
            </>
          ) : (
            <div className="combo-discounted-price">
              <div>Total Price: </div>
              <div>₹{originalTotal}</div>
            </div>
          )}

          <button
            className="combo-add-btn"
            disabled={!selectedItems.starter || !selectedItems.main}
            onClick={handleAddToBag}
          >
            Add Combo to Bag
          </button>
        </div>

      </div>

    </motion.div>
  );
};

/*SUB COMPONENTS*/
const CategoryCard = ({ title, disabled, onClick }) => (
  <div
    className={`combo-category-card ${disabled ? "disabled" : ""}`}
    onClick={!disabled ? onClick : undefined}
  >
    {title}
  </div>
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
    whileHover={{ y: -6, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
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
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 30 }}
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
