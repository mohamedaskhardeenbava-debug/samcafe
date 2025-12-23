import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./IngredientsCarousel.css";

const ITEMS_VISIBLE = 5;
const STEP = 5; // 🔑 move 5 items per action
const AUTO_SLIDE_MS = 4500;
const ITEM_WIDTH = 84; // must match .dish-ingredient-item width
const GAP = 14;        // must match CSS gap


export default function IngredientsCarousel({
  ingredients = [],
  allIngredients = []
}) {
  const navigate = useNavigate();

  // ✅ ALWAYS define hooks first (no conditions)
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
  const total = safeIngredients.length;

  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

const initialIndex = total > ITEMS_VISIBLE ? STEP : 0;
  const [index, setIndex] = useState(initialIndex);

const clones = useMemo(() => {
  if (total <= ITEMS_VISIBLE) return safeIngredients;

  return [
    ...safeIngredients.slice(-STEP),
    ...safeIngredients,
    ...safeIngredients.slice(0, STEP)
  ];
}, [safeIngredients, total]);


  const slideTo = (i, animated = true) => {
  const target = -i * (ITEM_WIDTH + GAP);


  if (!animated) {
    x.set(target);
    return;
  }

  animate(x, target, {
    type: "spring",
    stiffness: 260,
    damping: 32,
    onComplete: () => {
      // 🔁 Loop reset ONLY after animation finishes
      if (total <= ITEMS_VISIBLE) return;

      if (i >= total + ITEMS_VISIBLE) {
        const reset = ITEMS_VISIBLE;
        setIndex(reset);
        x.set(-reset * ITEM_WIDTH);
      }

      if (i <= STEP - 1) {
        const reset = total + ITEMS_VISIBLE - 1;
        setIndex(reset);
        x.set(-reset * ITEM_WIDTH);
      }
    }
  });
};


  useEffect(() => {
    slideTo(index, false);
  }, []);

  useEffect(() => {
    if (total <= ITEMS_VISIBLE) return;

    const id = setInterval(() => {
      slideNext();
    }, AUTO_SLIDE_MS);

    return () => clearInterval(id);
  }, [index, total]);

const slideNext = () => {
  if (total <= ITEMS_VISIBLE) return;

  setIndex((i) => {
    const next = i + STEP;
    slideTo(next);
    return next;
  });
};

const slidePrev = () => {
  if (total <= ITEMS_VISIBLE) return;

  setIndex((i) => {
    const prev = i - STEP;
    slideTo(prev);
    return prev;
  });
};


  const handleLoopReset = () => {
    if (total <= ITEMS_VISIBLE) return;

    if (index >= total + STEP) {
      const reset = ITEMS_VISIBLE;
      setIndex(reset);
      slideTo(reset, false);
    }

    if (index <= ITEMS_VISIBLE - 1) {
      const reset = total + ITEMS_VISIBLE - 1;
      setIndex(reset);
      slideTo(reset, false);
    }
  };

  // ✅ CONDITIONAL RENDER (NOT conditional hooks)
  if (total === 0) return null;

  return (
    <div className="ingredients-carousel">
      {total > ITEMS_VISIBLE && (
        <button className="carousel-arrow ingredient-left-btn" onClick={slidePrev} />
      )}

      <div
        className="carousel-viewport"
        onPointerDown={(e) => {
          isDragging.current = true;
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (!isDragging.current) return;
          const diff = startX.current - e.clientX;
          if (diff > 60) slideNext();
          else if (diff < -60) slidePrev();
          isDragging.current = false;
        }}
        onPointerLeave={() => (isDragging.current = false)}
      >
        <motion.div
          className="carousel-track"
          style={{ x }}
          onUpdate={handleLoopReset}
        >
          {clones.map((ing, i) => {
            const full = allIngredients.find(
              (item) => item.name === ing.name
            );

            return (
              <div
                key={`${ing.name}-${i}`}
                className="dish-ingredient-item"
                onClick={() =>
                  full &&
                  navigate(`/ingredient/${full.id}`, {
                    state: { ingredientId: full.id }
                  })
                }
              >
                <div className="dish-ingredient-image">
                  <img
                    src={full?.image}
                    alt={ing.name}
                    draggable={false}
                  />
                </div>
                <div className="dish-ingredient-name">{ing.name}</div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {total > ITEMS_VISIBLE && (
        <button className="carousel-arrow ingredient-right-btn" onClick={slideNext} />
      )}
    </div>
  );
}
