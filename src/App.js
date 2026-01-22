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

import FavouriteCategories from "./UserPanel/FavouriteCategories";
import FavouriteDishList from "./UserPanel/FavouriteDishList";
import FavouriteDishDetail from "./UserPanel/FavouriteDishDetail";
import ComboPage from "./UserPanel/ComboPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [direction, setDirection] = useState(1);
  const [lastAction, setLastAction] = useState("forward");
  const [bag, setBag] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const initUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const res = await api.get(`/users/${userId}`);
      setCurrentUser(res.data);
    };

    initUser();
  }, []);

  const addToBag = (item) => {
    setBag(prev => [...prev, item]);
  };

  const toCamelCase = (value = "") => {
    // preserve trailing space while typing
    const hasTrailingSpace = value.endsWith(" ");

    const formatted = value
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map(
        word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");

    return hasTrailingSpace ? formatted + " " : formatted;
  };

  const handleBack = (e) => {
    e?.preventDefault();
    setDirection(-1);
    setLastAction("back");
    navigate(-1);
  };

  const handleHome = (e) => {
    e?.preventDefault();
    setDirection(-1);
    setLastAction("back");
    navigate("/categories");
  }

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
    favourites: [],
    combo: [],
    ingredients: [],
    orders: []
  });

  const onToggleFavourite = async (dish) => {
    try {
      const userId = localStorage.getItem("userId");

      /* =========================
         1️⃣ UPDATE MENU.FAVOURITES (ALWAYS)
         ========================= */
      const menuRes = await api.get("/menu");
      const menu = menuRes.data;

      const menuFavourites = Array.isArray(menu.favourites)
        ? menu.favourites
        : [];

      const existsInMenu = menuFavourites.some(f => f.id === dish.id);

      if (!existsInMenu) {
        const updatedMenu = {
          ...menu,
          favourites: [...menuFavourites, dish]
        };

        await api.put("/menu", updatedMenu);

        setFoodData(prev => ({
          ...prev,
          favourites: updatedMenu.favourites
        }));
      }

      /* =========================
         2️⃣ UPDATE USER.FAVOURITES (ONLY IF LOGGED IN)
         ========================= */
      if (!userId) {
        const guestFavs =
          JSON.parse(localStorage.getItem("guestFavourites")) || [];

        const exists = guestFavs.some(f => f.id === dish.id);
        if (!exists) {
          const updated = [...guestFavs, dish];
          localStorage.setItem("guestFavourites", JSON.stringify(updated));

          setFoodData(prev => ({
            ...prev,
            favourites: prev.favourites // menu favourites unchanged
          }));
        }
        return;
      }

      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;

      const userFavourites = Array.isArray(user.favourites)
        ? user.favourites
        : [];

      const existsInUser = userFavourites.some(f => f.id === dish.id);

      if (!existsInUser) {
        const updatedUser = {
          ...user,
          favourites: [...userFavourites, dish]
        };

        await api.put(`/users/${userId}`, updatedUser);
        setCurrentUser(updatedUser);
      }

    } catch (err) {
      console.error("Favourite save failed:", err);
    }
  };


  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("/menu");

        setFoodData(prev => ({
          ...prev,
          categories: res.data.categories || [],
          ingredients: res.data.ingredients || [],
          combo: res.data.combo || [],
          favourites: res.data.favourites || [],
        }));
      } catch (err) {
        console.error("Failed to fetch menu:", err);
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

  const updateBagItem = (index, updatedItem) => {
    setBag(prev =>
      prev.map((item, i) =>
        i === index ? updatedItem : item
      )
    );
  };

  // if (loading) return <div className="app-loading">Loading menu...</div>;
  // if (error) return <div className="app-error">Failed to load menu</div>;

  return (
    <div className="App">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div {...motionProps}>
                <Welcome
                  handleNavigate={handleNavigate}
                  toCamelCase={toCamelCase}
                />
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
                  currentUser={currentUser}
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
                  addToBag={addToBag}
                  handleHome={handleHome}
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
                  onToggleFavourite={onToggleFavourite}
                  addToBag={addToBag}
                  updateBagItem={updateBagItem}
                  setDirection={setDirection}
                  setLastAction={setLastAction}
                  toCamelCase={toCamelCase}
                  handleHome={handleHome}
                  currentUser={currentUser}
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
            element={
              <motion.div {...motionProps}>
                <ThankYou
                  bag={bag}
                  setBag={setBag}
                  onOrderPlaced={(order) =>
                    setFoodData(prev => ({
                      ...prev,
                      orders: [...(prev.orders || []), order]
                    }))
                  }
                />
              </motion.div>

            }
          />


          {/* FAV CATEGORY PAGE */}
          <Route
            path="/favourites/:source"
            element={
              <motion.div {...motionProps}>
                <FavouriteCategories
                  foodData={foodData}
                  currentUser={currentUser}
                  handleBack={handleBack}
                  handleHome={handleHome}
                />
              </motion.div>
            }
          />

          {/* FAV DISH LIST PAGE */}
          <Route
            path="/favourites/:source/:categoryId"
            element={
              <motion.div {...motionProps}>
                <FavouriteDishList
                  foodData={foodData}
                  currentUser={currentUser}
                  handleBack={handleBack}
                  handleHome={handleHome}
                />
              </motion.div>
            }
          />



          <Route
            path="/favourite/:dishId"
            element={
              <motion.div {...motionProps}>
                <FavouriteDishDetail
                  foodData={foodData}
                  handleBack={handleBack}
                  addToBag={addToBag}
                  handleHome={handleHome}
                />
              </motion.div>
            }
          />

          <Route
            path="/combo"
            element={
              <motion.div {...motionProps}>
                <ComboPage
                  foodData={foodData}
                  addToBag={addToBag}
                  updateBagItem={updateBagItem}
                  handleBack={handleBack}
                  currentUser={currentUser}          // ✅ ADD
                  setCurrentUser={setCurrentUser}    // ✅ ADD
                />
              </motion.div>
            }
          />

        </Routes>

      </AnimatePresence>
    </div>
  );
}

export default App;
