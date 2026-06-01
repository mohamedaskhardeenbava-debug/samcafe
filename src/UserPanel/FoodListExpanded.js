import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./FoodList.css"; // reuse same styles
import "./FoodListExpanded.css";
import AnimatedPrice from "./AnimatedPrice";
import IngredientsCarousel from "./IngredientsCarousel";
import homeIcon from "../assets/icons/home.png";
import caloriesIcon from "../assets/icons/calorie.png";
import proteinIcon from "../assets/icons/protein.png";
import fibreIcon from "../assets/icons/fiber.png";
import fatIcon from "../assets/icons/fat.png";
import { flyToBag } from "./flyToBag";

/* 🔁 SAME animation config */
const SOFT_SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 22,
  mass: 1.2
};

const SLOW_SPRING = {
  type: "spring",
  stiffness: 55,
  damping: 26,
  mass: 1.4
};

const DETAIL_VARIANTS = {
  hidden: {
    y: 60,
    opacity: 0,
    filter: "blur(10px)"
  },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)"
  }
};

const FoodListExpanded = ({ foodData, addToBag, handleHome, handleBack }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { dishId } = state || {};

  // ── Resolve category + dish ──────────────────────────────────────────────
  // categoryId is optional in state — we resolve it by searching all categories
  // so navigation from PromoCard / Popular Dishes only needs to pass dishId.
  let category = null;
  let dish = null;

  // 1. Try exact categoryId match if provided
  if (state?.categoryId) {
    category = foodData.categories.find(c => c.id === state.categoryId);
    if (!category) {
      for (const cat of foodData.categories) {
        const sub = cat.subCategories?.find(s => s.id === state.categoryId);
        if (sub) { category = sub; break; }
      }
    }
    dish = category?.dishes?.find(d => d.id === dishId);
  }

  // 2. If categoryId not provided or dish not found yet — scan all categories by dishId
  if (!dish && dishId) {
    for (const cat of foodData.categories) {
      const found = cat.dishes?.find(d => d.id === dishId);
      if (found) { category = cat; dish = found; break; }
      for (const sub of cat.subCategories || []) {
        const foundSub = sub.dishes?.find(d => d.id === dishId);
        if (foundSub) { category = sub; dish = foundSub; break; }
      }
      if (dish) break;
    }
  }

  // 3. Also check foodData.favourites (crowd picks / my favs may have enriched copies)
  if (!dish && dishId && foodData.favourites) {
    dish = foodData.favourites.find(d => d.id === dishId);
    if (dish && !category) {
      category = foodData.categories.find(c => c.id === dish.categoryId);
    }
  }

  const resolvedCategoryId = category?.id || state?.categoryId || dish?.categoryId;

  const [steps, setSteps] = useState(["hidden", "hidden", "hidden", "hidden"]);

  /* 🔁 SAME stagger logic */
  useEffect(() => {
    setSteps(["hidden", "hidden", "hidden", "hidden"]);
    setTimeout(() => setSteps(["show", "hidden", "hidden", "hidden"]), 180);
    setTimeout(() => setSteps(["show", "show", "hidden", "hidden"]), 360);
    setTimeout(() => setSteps(["show", "show", "show", "hidden"]), 540);
    setTimeout(() => setSteps(["show", "show", "show", "show"]), 720);
  }, [dishId]);

  // Redirect only if we genuinely have no dishId at all
  useEffect(() => {
    if (!dishId) {
      navigate("/categories", { replace: true });
    }
  }, [dishId, navigate]);

  if (!dish) return null;

  const filteredIngredients = (dish.ingredients || []).filter((ing) => {
    const full = foodData.ingredients.find(i =>
      i.id === ing.id ||
      i.name === ing.name
    );

    // If ingredient not found in master list → allow it
    if (!full) return true;

    // Treat undefined as false
    const isGloballyDisabled = full.isDisabledGlobally === true;
    const isDisabledForDish =
      Array.isArray(full.disabledForDishes) &&
      full.disabledForDishes.includes(dish.id);

    if (isGloballyDisabled) return false;
    if (isDisabledForDish) return false;

    return true;
  });

  return (
    <div className="food-list">
      {/* HEADER */}
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">{dish.name}</div>
        <div className="home-btn  home-btn-icon" onClick={handleHome} >
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front"><img src={homeIcon} alt="home-btn" /></span>
        </div>
      </div>

      {/* MAIN */}
      <div className="food-reel-expanded">

        {/* LEFT — IMAGE */}
        <div className="food-images-expanded">
          <motion.img
            src={dish.image}
            className="dish-image image-main"
            layoutId={`dish-${dish.id}`}
            transition={SLOW_SPRING}
          />
        </div>

        {/* RIGHT — DETAILS */}
        <div className="food-details-expanded">
          <motion.div
            className="food-details-expanded-header"
            initial="hidden"
            animate={steps[0]}
            variants={DETAIL_VARIANTS}
            transition={SOFT_SPRING}
          >
            <h2 className="dish-name">
              {dish.name}
            </h2>

            <div className="dish-price">
              <AnimatedPrice value={dish.basePrice} />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            className="dish-nutrition"
            animate={steps[0]}
            variants={DETAIL_VARIANTS}
            transition={SOFT_SPRING}
          >
            {[
              [caloriesIcon, "Calories", dish.benefits?.calories, "kcal"],
              [proteinIcon, "protien", dish.benefits?.protein, "g"],
              [fibreIcon, "fibre", dish.benefits?.fibre, "g"],
              [fatIcon, "Fat", dish.benefits?.fat, "g"]
            ].map(([icon, label, value, unit], i) => (
              <div className="dish-nutrition-item" key={i}>
                <div className="dish-nutrition-image">
                  <img src={icon} alt="" />
                </div>
                <div className="dish-nutrition-name">{label}</div>
                <div className="dish-nutrition-value">{value}{unit}</div>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial="hidden"
            className="dish-description"
            animate={steps[1]}
            variants={DETAIL_VARIANTS}
            transition={SOFT_SPRING}
          >
            {dish.description}
          </motion.p>

          {dish.ingredients &&
            <motion.div
              initial="hidden"
              animate={steps[2]}
              variants={DETAIL_VARIANTS}
              transition={SOFT_SPRING}
            >
              <div className="ingredient-head">Add-ons</div>
              {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 && (
                <IngredientsCarousel
                  ingredients={filteredIngredients}
                  allIngredients={foodData.ingredients || []}
                />
              )}
            </motion.div>
          }

          <motion.div
            initial="hidden"
            className="button-section"
            animate={steps[3]}
            variants={DETAIL_VARIANTS}
            transition={SOFT_SPRING}
          >
            <button
              className="customize-button"
              onClick={() => {
                navigate("/food/customize", {
                  state: {
                    categoryId: resolvedCategoryId,
                    dishId: dish.id
                  }
                });
              }}
            >
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Customize</span>
            </button>

            <button
              type="button"
              className="place-order-button"
              onClick={() => {
                const img = document.querySelector(".dish-image.image-main");
                const bagItem = {
                  id: dish.id,
                  name: dish.name,
                  image: dish.image,
                  categoryId: resolvedCategoryId,
                  quantity: 1,
                  unitPrice: dish.basePrice,
                  totalPrice: dish.basePrice,
                  isCustomized: false,
                  notes: ""
                };

                addToBag(bagItem);
                flyToBag({ imgEl: img, dishId: dish.id });
              }}
            >
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Add to Bag</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FoodListExpanded;