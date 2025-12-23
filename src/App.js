import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "./api";

import Welcome from "./UserPanel/Welcome";
import FoodCategory from "./UserPanel/FoodCategory";
import FoodList from "./UserPanel/FoodList";
import FoodItem from "./UserPanel/FoodItem";
import IngredientDetail from "./UserPanel/IngredientDetail";
import ThankYou from "./UserPanel/ThankYou";
import AnimatedPrice from "./UserPanel/AnimatedPrice";


function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [direction, setDirection] = useState(1);
  const [lastAction, setLastAction] = useState("forward");

  const handleBack = (e) => {
    e?.preventDefault();
    setDirection(-1);
    setLastAction("back");
    navigate(-1);
  };

  const handleNavigate = (path) => {
    setDirection(1);
    setLastAction("forward");
    navigate(path);
  };

  useEffect(() => {
    if (lastAction === "back") {
      const timer = setTimeout(() => {
        setDirection(1);
        setLastAction("forward");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, lastAction]);

  const [foodData, setFoodData] = useState({
    categories: [],
    ingredients: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("/menu");
        setFoodData({
          categories: res.data.categories || [],
          ingredients: res.data.ingredients || [],
        });
      } catch (err) {
        console.error("Failed to fetch menu:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const pageVariants = {
    initial: (direction) => ({
      opacity: 0,
      x: direction > 0 ? 100 : -100,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction) => ({
      opacity: 0,
      x: direction > 0 ? -100 : 100,
    }),
  };

  const pageTransition = {
    duration: 0.35,
    ease: "easeInOut",
  };

  const motionProps = {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit",
    transition: pageTransition,
    custom: direction,
  };

  if (loading) return <div className="app-loading">Loading menu...</div>;
  if (error) return <div className="app-error">Failed to load menu</div>;

  return (
    <div className="App">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div {...motionProps}>
                <Welcome handleNavigate={handleNavigate} />
              </motion.div>
            }
          />

          <Route
            path="/categories"
            element={
              <motion.div {...motionProps}>
                <FoodCategory
                  foodData={foodData}
                  handleNavigate={handleNavigate}
                />
              </motion.div>
            }
          />

          <Route
            path="/foods/:categoryId"
            element={
              <motion.div {...motionProps}>
                <FoodList
                  handleBack={handleBack}
                  foodData={foodData}
                  handleNavigate={handleNavigate}
                />
              </motion.div>
            }
          />

          <Route
            path="/food/:id"
            element={
              <motion.div {...motionProps}>
                <FoodItem
                  handleBack={handleBack}
                  foodData={foodData}
                  handleNavigate={handleNavigate}
                />
              </motion.div>
            }
          />

          <Route
            path="/ingredient/:id"
            element={
              <motion.div {...motionProps}>
                <IngredientDetail
                  handleBack={handleBack}
                  foodData={foodData}
                  handleNavigate={handleNavigate}
                />
              </motion.div>
            }
          />

          <Route
            path="/thank-you"
            element={<ThankYou />} />
        </Routes>

      </AnimatePresence>
    </div>
  );
}

export default App;
