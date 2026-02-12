import React, { useState, useRef, useEffect } from "react";
import "./FoodList.css";
import AnimatedPrice from "./AnimatedPrice";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import homeIcon from "../assets/icons/home.png";
import { flyToBag } from "./flyToBag";

const SLOT_X = [-1000, 0, 420, 700, 900];
const FOODLIST_EXIT_DURATION = 750;

const SLOW_SPRING = {
  type: "spring",
  stiffness: 55,
  damping: 26,
  mass: 1.4
};

const SOFT_SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 22,
  mass: 1.2
};

const DETAIL_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 0,
    filter: "blur(10px)"
  },
  show: {
    opacity: 1,
    y: [-60, 0],
    filter: "blur(0px)"
  }
};

const DETAIL_EXIT_VARIANT = {
  opacity: 0,
  y: -60,
  filter: "blur(10px)"
};

const FoodList = ({ foodData, addToBag, handleBack, handleHome }) => {
  const { categoryId } = useParams();
  const location = useLocation();
  const initialDishId = location.state?.dishId;
  const navigate = useNavigate();
  const category = foodData.categories.find(
    (cat) => cat.id === categoryId
  );

  const [detailKey, setDetailKey] = useState(0);
  const [isGlidingOut, setIsGlidingOut] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const exitTimerRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const isPointerDown = useRef(false);
  const slides = category?.dishes || [];
  const imageRefs = useRef({});

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const initialIndex = (() => {
    if (!slides.length || !initialDishId) return 0;

    const idx = slides.findIndex(d => d.id === initialDishId);
    return idx !== -1 ? idx : 0;
  })();

  const [logicalIndex, setLogicalIndex] = useState(initialIndex);
  const [renderIndex, setRenderIndex] = useState(initialIndex);

  useEffect(() => {
    setDetailKey(k => k + 1);
  }, [renderIndex]);

  const visible = [
    slides[(renderIndex - 1 + slides.length) % slides.length], // slot 0 (far-left)
    slides[renderIndex],                                       // slot 1 (ACTIVE)
    slides[(renderIndex + 1) % slides.length],                 // slot 2 (NEXT)
    slides[(renderIndex + 2) % slides.length],                 // slot 3 (LAST)
    slides[(renderIndex + 3) % slides.length]                  // slot 4 (far-right)
  ];

  // FoodList should only render REAL menu categories
  if (!category) {
    return (
      <div className="food-list">
        <div className="food-header">
          <button className="back-button" onClick={handleBack} />
          <div className="food-list-title">Category not found</div>
          <div className="home-btn" onClick={handleHome}>
            <img src={homeIcon} alt="" />
          </div>
        </div>
      </div>
    );
  }

  const goNext = () => {
    setLogicalIndex(i => (i + 1) % slides.length);
    setRenderIndex(i => (i + 1) % slides.length);
  };

  const goPrev = () => {
    setLogicalIndex(i => (i - 1 + slides.length) % slides.length);
    setRenderIndex(i => (i - 1 + slides.length) % slides.length);
  };

  return (
    <div className="food-list">
      {/* HEADER */}
      <div className="food-header">
        <button
          className="back-button"
          onClick={(e) => { handleBack(e) }}
        />
        <div className="food-list-title">
          {category.name}
        </div>
        <div className="home-btn" onClick={handleHome}>
          <img src={homeIcon} alt="" />
        </div>
      </div>

      {/* MAIN AREA */}
      <div
        className="food-reel"
        onPointerDown={(e) => {
          // ❗ ignore clicks on buttons
          if (e.target.closest("button") || e.target.closest(".reel-cta")) {
            return;
          }

          e.currentTarget.setPointerCapture(e.pointerId);
          startX.current = e.clientX;
          startY.current = e.clientY;
          isPointerDown.current = true;
        }}

        onPointerUp={(e) => {
          if (!isPointerDown.current || isGlidingOut) return;
          const dx = startX.current - e.clientX;
          const dy = Math.abs(startY.current - e.clientY);

          if (dy > Math.abs(dx)) {
            isPointerDown.current = false;
            return;
          }

          if (dx > 40) goNext();
          else if (dx < -40) goPrev();

          isPointerDown.current = false;
        }}
      >
        {/* LEFT — DETAILS */}
        <div
          className="food-details"
          transition={SOFT_SPRING}
        >
          <motion.div
            key={detailKey}
            className="food-details-container"
            initial="hidden"
            animate={isGlidingOut ? DETAIL_EXIT_VARIANT : "show"}
            variants={DETAIL_VARIANTS}
            transition={isGlidingOut ? SLOW_SPRING : SOFT_SPRING}
          >
            <h2 className="dish-name">
              {visible[1].name}
            </h2>

            <div className="dish-price">
              <AnimatedPrice value={visible[1].basePrice} />
            </div>

            <p className="dish-description">
              {visible[1].description}
            </p>

            <div className="btn-section">
              <button
                className="reel-cta"
                onClick={() => {
                  const dish = visible[1];
                  const unitPrice = Number(dish.basePrice || 0);
                  const img = document.querySelector(
                    `.dish-image[data-active-dish="${dish.id}"]`
                  );

                  addToBag({
                    id: dish.id,
                    name: dish.name,
                    image: dish.image,
                    categoryId: category.id,
                    quantity: 1,
                    unitPrice,
                    totalPrice: unitPrice,
                    ingredients: Array.isArray(dish.ingredients)
                      ? dish.ingredients.map(i => ({
                        id: i.id,
                        name: i.name,
                        quantity: i.quantity,
                        pricePer100g: i.pricePer100g || 0,
                        totalPrice: 0
                      }))
                      : [],
                    selectedSize: null,
                    notes: "",
                    isCustomized: false,
                    isCombo: false
                  });
                  flyToBag({ imgEl: img, dishId: visible[1].id });
                }}
              >
                Add to Bag
              </button>

              <button
                className="show-more-btn"
                onClick={() => {
                  if (isNavigatingRef.current) return;
                  isNavigatingRef.current = true;
                  setIsGlidingOut(true);

                  exitTimerRef.current = setTimeout(() => {
                    navigate(`/foods/${category.id}/expanded`, {
                      state: {
                        categoryId: category.id,
                        dishId: visible[1].id,
                        disablePageAnimation: true
                      }
                    });
                  }, FOODLIST_EXIT_DURATION);
                }}
              >
                Show more
              </button>
            </div>
          </motion.div>

        </div>

        {/* RIGHT — IMAGE CONVEYOR */}
        <div className="food-images">
          {visible.map((item, slot) => {

            return (
              <motion.img
                data-active-dish={slot === 1 ? item.id : undefined}
                initial={
                  slot === 2 || slot === 3
                    ? { x: SLOT_X[slot] + 500 }
                    : false
                }
                ref={(el) => {
                  if (slot === 1 && el) {
                    imageRefs.current[visible[1].id] = el;
                  }
                }}
                key={item.id}
                layoutId={slot === 1 ? `dish-${item.id}` : undefined}
                src={item.image}
                className="dish-image"
                animate={
                  isGlidingOut
                    ? slot === 1
                      ? {
                        x: SLOT_X[1],
                        scale: 1,
                        zIndex: 5
                      }
                      : slot === 2
                        ? {
                          x: SLOT_X[2] + 800,   // 👉 glide right from current pos
                          scale: 0.7
                        }
                        : slot === 3
                          ? {
                            x: SLOT_X[3] + 1600, // 👉 glide right from current pos
                            scale: 0.4
                          }
                          : {
                            x: SLOT_X[slot],
                            scale: 0.3
                          }
                    : {
                      x: SLOT_X[slot],
                      scale:
                        slot === 1 ? 1 :
                          slot === 2 ? 0.7 :
                            slot === 3 ? 0.4 : 0.3,
                      filter:
                        slot === 1 ? "blur(0px)" :
                          slot === 2 ? "blur(6px)" :
                            slot === 3 ? "blur(10px)" : "blur(14px)",
                      zIndex:
                        slot === 1 ? 3 :
                          slot === 2 ? 2 :
                            slot === 3 ? 1 : 0
                    }
                }
                transition={
                  isGlidingOut
                    ? SLOW_SPRING
                    : SOFT_SPRING
                }
              />
            );
          })}
        </div>

        <div className="carousel-controls">
          <button
            className="image-nav-btn backward-btn"
            onClick={goPrev}
          />

          <div className="carousel-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === logicalIndex ? "active" : ""}`}
                onClick={() => {
                  if (i > logicalIndex) {
                    goNext();
                  } else if (i < logicalIndex) {
                    goPrev();
                  }
                }}
              />
            ))}
          </div>

          <button className="image-nav-btn forward-btn" onClick={goNext}>
          </button>
        </div>
      </div>
    </div >
  );
};

export default FoodList;