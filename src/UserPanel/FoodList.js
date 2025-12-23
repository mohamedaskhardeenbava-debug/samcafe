import React, { useState, useRef, useEffect } from "react";
import "./FoodList.css";
import AnimatedPrice from "./AnimatedPrice";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import caloriesIcon from "../assets/icons/calorie.png";
import proteinIcon from "../assets/icons/protein.png";
import fibreIcon from "../assets/icons/fiber.png";
import fatIcon from "../assets/icons/fat.png";
import IngredientsCarousel from "./IngredientsCarousel";



const SWIPE_THRESHOLD = 80;
const ITEMS_PER_SLIDE = 5;
const AUTO_SLIDE_INTERVAL = 5000;


const imageVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 140 : -140,
    opacity: 0,
    scale: 1.04,
  }),

  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 280, damping: 34 },
      scale: { duration: 0.28, ease: "easeOut" },
      opacity: { duration: 0.22 },
      filter: { duration: 0.22 }
    }
  },

  exit: (direction) => ({
    x: direction > 0 ? -140 : 140,
    opacity: 0,
    scale: 0.96,
    transition: {
      x: { type: "spring", stiffness: 320, damping: 36 },
      opacity: { duration: 0.18 },
      scale: { duration: 0.18 }
    }
  })
};

const contentVariants = {
  enter: {
    opacity: 0,
    filter: "blur(6px)"
  },

  center: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      opacity: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      y: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      scale: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      filter: { duration: 0.3 }
    }
  },

  exit: {
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.6, 1]
    }
  }
};

const ingredientSlideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 620 : -620,
  }),
  center: {
    x: 0,
    transition: {
      x: { type: "spring", stiffness: 180, damping: 24 },
      opacity: { duration: 0.25, ease: [0.25, 1, 0.5, 1] },
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? -20 : 20,
    transition: {
      x: { type: "spring", stiffness: 200, damping: 26 },
      opacity: { duration: 0.2 },
    },
  }),
};



const FoodList = ({ handleBack, foodData }) => {
  const { categoryId } = useParams();

  const category = foodData.categories.find(
    (cat) => cat.id === categoryId
  );

  const [[index, direction], setIndex] = useState([0, 0]);
  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);
  const navigate = useNavigate();

  const [addonIndex, setAddonIndex] = useState(0);
  const [ingredientDirection, setIngredientDirection] = useState(0);

  const addonStartX = useRef(0);
  const addonIsDown = useRef(false);

  const slides = [
    ...category.dishes,
    { id: "__custom__", name: "Make Your Own" }
  ];

  const current = slides[index];
  const isCustomCard = current.id === "__custom__";








  useEffect(() => {
    if (!current.ingredients || current.ingredients.length <= ITEMS_PER_SLIDE)
      return;

    const interval = setInterval(() => {
      // Always slide left on auto-scroll
      setIngredientDirection(1);
      setAddonIndex((prev) =>
        (prev + ITEMS_PER_SLIDE) % current.ingredients.length
      );
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [current.ingredients]);


  const onPointerDown = (e) => {
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
  };
  if (!category) return <p>Category not found</p>;

  const onPointerUp = (e) => {
    if (!isPointerDown.current) return;

    const diffX = startX.current - e.clientX;
    const diffY = Math.abs(startY.current - e.clientY);

    if (diffY > Math.abs(diffX)) {
      isPointerDown.current = false;
      return;
    }

    if (diffX > SWIPE_THRESHOLD) {
      setIndex(([i]) => [(i + 1) % slides.length, 1]);
    } else if (diffX < -SWIPE_THRESHOLD) {
      setIndex(([i]) => [(i - 1 + slides.length) % slides.length, -1]);
    }

    isPointerDown.current = false;
  };

  const slideNext = () => {
    setIngredientDirection(1);
    setAddonIndex((prev) =>
      (prev + ITEMS_PER_SLIDE) % current.ingredients.length
    );
  };

  const slidePrev = () => {
    setIngredientDirection(-1);
    setAddonIndex((prev) =>
      (prev - ITEMS_PER_SLIDE + current.ingredients.length) %
      current.ingredients.length
    );
  };



  const onAddonPointerDown = (e) => {
    addonIsDown.current = true;
    addonStartX.current = e.clientX;
  };

  const onAddonPointerUp = (e) => {
    if (!addonIsDown.current) return;
    const diff = addonStartX.current - e.clientX;

    if (diff > 50) {
      setIngredientDirection(1);
      slideNext();
    } else if (diff < -50) {
      setIngredientDirection(-1);
      slidePrev();
    }

    addonIsDown.current = false;
  };



  const ingredients = Array.isArray(current?.ingredients)
    ? current.ingredients
    : [];


  const visibleAddons = ingredients
    .concat(current.ingredients)
    .slice(addonIndex, addonIndex + ITEMS_PER_SLIDE);


  return (
    <div className="food-list">
      <AnimatePresence mode="wait">
        <motion.div
          key={category.id}
          variants={contentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="food-header"
        >
          <button className="back-button" onClick={handleBack} />
          <div className="food-list-title">{category.name}</div>
        </motion.div>
      </AnimatePresence>

      <div
        className="dish-card"
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onPointerUp(e);
        }}
      >
        <div className="dish-image-container">
          <div
            role="button"
            className="image-nav-btn backward-btn"
            onClick={() =>
              setIndex(([i]) => [(i - 1 + slides.length) % slides.length, -1])
            }
          >

          </div>

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current.id}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="dish-image"
            >
              {!isCustomCard ? (
                <img
                  src={current.image}
                  alt={current.name}
                  draggable={false}
                />
              ) : (
                <img
                  src="/image-assets/burger/image6.png"
                  alt="Make your own"
                  draggable={false}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div
            role="button"
            className="image-nav-btn forward-btn"
            onClick={() => setIndex(([i]) => [(i + 1) % slides.length, 1])}
          >

          </div>
        </div>



        {!isCustomCard && (
          <>


            <div
              className="dish-info"
            >
              <div className="dish-header">
                <h2 className="dish-name">{current.name}</h2>
                <div className="dish-price">
                  <AnimatedPrice value={current.basePrice} />
                </div>

              </div>
            </div>


            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-nutrition"}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ delay: 0.05 }}
                className="dish-nutrition"
              >
                {[
                  [caloriesIcon, "Calories", current.benefits.calories, "kcal"],
                  [proteinIcon, "Protein", current.benefits.protein, "g"],
                  [fibreIcon, "Fibre", current.benefits.fibre, "g"],
                  [fatIcon, "Fat", current.benefits.fat, "g"]
                ].map(([icon, label, value, unit]) => (
                  <div className="dish-nutrition-item" key={label}>
                    <div className="dish-nutrition-image">
                      <img src={icon} alt={label} />
                    </div>

                    <div className="dish-nutrition-value">
                      {value} {unit}
                    </div>

                    <div className="dish-nutrition-name">{label}</div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-info"}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="description-section"
              >
                <h2 className="description-heading">Description</h2>
                <p className="dish-description">{current.description}</p>
              </motion.div>
            </AnimatePresence>

            {current.ingredients && (
              <div className="ingredients-section">
                <h2 className="ingredient-heading">Add-ons</h2>

                <IngredientsCarousel
                  ingredients={current.ingredients}
                  allIngredients={foodData.ingredients}
                />
              </div>
            )}




            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-actions"}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="button-section"
              >
                <Link
                  className="customize-button"
                  to="/food/customize"
                  state={{ categoryId, dishId: current.id }}
                >
                  Customize
                </Link>

                <Link className="place-order-button" to="/thank-you">
                  Place Order
                </Link>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {isCustomCard && (
          <AnimatePresence mode="wait">
            <motion.div
              key={category.id}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="custom-food-card"
            >
              <h3>Make Your Own {category.name}</h3>
              <p>
                Choose ingredients, control quantity, and build your food
                exactly the way you like.
              </p>

              <Link
                className="make-your-own-button"
                to="/food/customize"
                state={{ categoryId, dishId: null }}
              >
                Make Your Own
              </Link>
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
};

export default FoodList;
