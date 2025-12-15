import './App.css'
import Welcome from './UserPanel/Welcome'
import FoodCategory from './UserPanel/FoodCategory'
import FoodList from './UserPanel/FoodList'
import IngredientDetail from './UserPanel/IngredientDetail'
import FoodItem from './UserPanel/FoodItem'


import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
//import AdminLogin from './AdminPanel/AdminLogin'

/* Page animation variants */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -24,
  },
}

/* Premium transition */
const pageTransition = {
  duration: 0.35,
  ease: 'easeInOut',
}


const motionProps = {
  variants: pageVariants,
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  transition: pageTransition,
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = (e) => {
    e?.preventDefault()
    navigate(-1)
  }

  const [foodData, setFoodData] = useState({
    categories: [
      {
        id: "pizza",
        name: "Pizza",
        varieties: [
          { id: "pizza_sm", name: "Small", basePrice: 199 },
          { id: "pizza_md", name: "Medium", basePrice: 299 },
          { id: "pizza_lg", name: "Large", basePrice: 399 },
          { id: "pizza_special", name: "Special", basePrice: 449 },
          { id: "pizza_king", name: "King Size", basePrice: 549 },
          { id: "pizza_thin", name: "Thin Crust", basePrice: 349 },
          { id: "pizza_cheese_burst", name: "Cheese Burst", basePrice: 499 },
          { id: "pizza_stuffed", name: "Stuffed Crust", basePrice: 469 }
        ]
      },
      {
        id: "burger",
        name: "Burger",
        varieties: [
          { id: "burger_reg", name: "Regular", basePrice: 149 },
          { id: "burger_double", name: "Double Patty", basePrice: 199 },
          { id: "burger_cheese", name: "Cheese Loaded", basePrice: 189 },
          { id: "burger_supreme", name: "Supreme", basePrice: 229 },
          { id: "burger_king", name: "King Burger", basePrice: 269 },
          { id: "burger_grilled", name: "Grilled", basePrice: 209 },
          { id: "burger_crispy", name: "Crispy", basePrice: 199 },
          { id: "burger_signature", name: "Signature", basePrice: 249 }
        ]
      },
      {
        id: "wraps",
        name: "Wraps",
        varieties: [
          { id: "wrap_classic", name: "Classic Wrap", basePrice: 159 },
          { id: "wrap_grilled", name: "Grilled Wrap", basePrice: 179 },
          { id: "wrap_cheese", name: "Cheese Wrap", basePrice: 189 },
          { id: "wrap_double", name: "Double Filling", basePrice: 209 },
          { id: "wrap_spicy", name: "Spicy Wrap", basePrice: 169 },
          { id: "wrap_large", name: "Large Wrap", basePrice: 199 },
          { id: "wrap_special", name: "Special Wrap", basePrice: 219 },
          { id: "wrap_signature", name: "Signature Wrap", basePrice: 239 }
        ]
      },
      {
        id: "sandwich",
        name: "Sandwich",
        varieties: [
          { id: "sandwich_plain", name: "Plain", basePrice: 119 },
          { id: "sandwich_grilled", name: "Grilled", basePrice: 139 },
          { id: "sandwich_cheese", name: "Cheese Sandwich", basePrice: 149 },
          { id: "sandwich_club", name: "Club Sandwich", basePrice: 189 },
          { id: "sandwich_double", name: "Double Layer", basePrice: 169 },
          { id: "sandwich_toasted", name: "Toasted", basePrice: 129 },
          { id: "sandwich_special", name: "Special", basePrice: 199 },
          { id: "sandwich_signature", name: "Signature", basePrice: 219 }
        ]
      },
      {
        id: "pasta",
        name: "Pasta",
        varieties: [
          { id: "pasta_regular", name: "Regular", basePrice: 179 },
          { id: "pasta_white", name: "White Sauce", basePrice: 199 },
          { id: "pasta_red", name: "Red Sauce", basePrice: 189 },
          { id: "pasta_cheese", name: "Cheese Pasta", basePrice: 209 },
          { id: "pasta_baked", name: "Baked Pasta", basePrice: 229 },
          { id: "pasta_spicy", name: "Spicy Pasta", basePrice: 199 },
          { id: "pasta_large", name: "Large Bowl", basePrice: 249 },
          { id: "pasta_signature", name: "Signature Pasta", basePrice: 269 }
        ]
      },
      {
        id: "rice",
        name: "Rice",
        varieties: [
          { id: "rice_plain", name: "Plain Rice", basePrice: 99 },
          { id: "rice_fried", name: "Fried Rice", basePrice: 149 },
          { id: "rice_veg", name: "Veg Rice", basePrice: 159 },
          { id: "rice_spicy", name: "Spicy Rice", basePrice: 169 },
          { id: "rice_bowl", name: "Rice Bowl", basePrice: 179 },
          { id: "rice_large", name: "Large Bowl", basePrice: 199 },
          { id: "rice_special", name: "Special Rice", basePrice: 219 },
          { id: "rice_signature", name: "Signature Rice", basePrice: 239 }
        ]
      },
      {
        id: "noodles",
        name: "Noodles",
        varieties: [
          { id: "noodle_plain", name: "Plain Noodles", basePrice: 139 },
          { id: "noodle_hakka", name: "Hakka Noodles", basePrice: 159 },
          { id: "noodle_spicy", name: "Spicy Noodles", basePrice: 169 },
          { id: "noodle_schezwan", name: "Schezwan", basePrice: 179 },
          { id: "noodle_fried", name: "Fried Noodles", basePrice: 159 },
          { id: "noodle_large", name: "Large Bowl", basePrice: 199 },
          { id: "noodle_special", name: "Special Noodles", basePrice: 219 },
          { id: "noodle_signature", name: "Signature Noodles", basePrice: 239 }
        ]
      },
      {
        id: "nachos",
        name: "Nachos",
        varieties: [
          { id: "nachos_plain", name: "Plain Nachos", basePrice: 129 },
          { id: "nachos_cheese", name: "Cheese Nachos", basePrice: 159 },
          { id: "nachos_loaded", name: "Loaded Nachos", basePrice: 199 },
          { id: "nachos_spicy", name: "Spicy Nachos", basePrice: 169 },
          { id: "nachos_large", name: "Large Nachos", basePrice: 189 },
          { id: "nachos_supreme", name: "Supreme Nachos", basePrice: 219 },
          { id: "nachos_special", name: "Special Nachos", basePrice: 239 },
          { id: "nachos_signature", name: "Signature Nachos", basePrice: 259 }
        ]
      }
    ],

    ingredients: [
      {
        id: "mozzarella",
        name: "Mozzarella Cheese",
        usedInCategories: ["pizza", "burger", "sandwich", "nachos", "pasta"],
        pricePer100g: 60,
        nutritionPer100g: { kcal: 280, protein: 28, fat: 17, fibre: 0 },
        description:
          "Mozzarella is a soft, creamy cheese known for its mild flavor and excellent melting quality. It adds richness and a stretchy texture to dishes.",
        history:
          "Mozzarella originated in Italy and became globally popular through pizza. It is now a staple cheese in many cuisines."
      },
      {
        id: "tomato_sauce",
        name: "Tomato Sauce",
        usedInCategories: ["pizza", "pasta", "sandwich"],
        pricePer100g: 20,
        nutritionPer100g: { kcal: 29, protein: 1, fat: 0, fibre: 2 },
        description:
          "Tomato sauce provides a tangy, savory base for many dishes. It enhances flavor while adding moisture and balance.",
        history:
          "Introduced to Europe in the 16th century, tomato sauce became central to Italian cuisine and later spread worldwide."
      },
      {
        id: "lettuce",
        name: "Lettuce",
        usedInCategories: ["burger", "sandwich", "wraps"],
        pricePer100g: 10,
        nutritionPer100g: { kcal: 15, protein: 1, fat: 0, fibre: 1 },
        description:
          "Lettuce adds freshness and crunch to meals. It balances heavier ingredients with a light texture.",
        history:
          "Cultivated since ancient Egyptian times, lettuce later became a staple in salads and sandwiches globally."
      },
      {
        id: "chicken",
        name: "Chicken",
        usedInCategories: ["burger", "wraps", "rice", "noodles"],
        pricePer100g: 80,
        nutritionPer100g: { kcal: 239, protein: 27, fat: 14, fibre: 0 },
        description:
          "Chicken is a lean and versatile protein that absorbs flavors well. It is widely used in global cuisines.",
        history:
          "Domesticated over 8,000 years ago, chicken became one of the most consumed meats worldwide."
      },
      {
        id: "onion",
        name: "Onion",
        usedInCategories: ["pizza", "burger", "sandwich", "wraps", "rice", "noodles"],
        pricePer100g: 12,
        nutritionPer100g: { kcal: 40, protein: 1, fat: 0, fibre: 2 },
        description:
          "Onions add sweetness and aroma to dishes when cooked. They enhance depth of flavor in meals.",
        history:
          "Onions have been cultivated for over 5,000 years and were highly valued in ancient civilizations."
      },
      {
        id: "capsicum",
        name: "Capsicum",
        usedInCategories: ["pizza", "pasta", "rice", "noodles", "nachos"],
        pricePer100g: 18,
        nutritionPer100g: { kcal: 31, protein: 1, fat: 0, fibre: 2 },
        description:
          "Capsicum adds crunch, mild sweetness, and vibrant color to food.",
        history:
          "Originating in the Americas, capsicum spread globally through trade routes."
      },
      {
        id: "mushroom",
        name: "Mushroom",
        usedInCategories: ["pizza", "pasta", "burger", "noodles"],
        pricePer100g: 30,
        nutritionPer100g: { kcal: 22, protein: 3, fat: 0, fibre: 1 },
        description:
          "Mushrooms provide a meaty texture and rich umami flavor.",
        history:
          "Consumed since ancient times, mushrooms became popular worldwide for their taste and nutrition."
      },
      {
        id: "paneer",
        name: "Paneer",
        usedInCategories: ["pizza", "wraps", "sandwich", "rice"],
        pricePer100g: 70,
        nutritionPer100g: { kcal: 265, protein: 18, fat: 20, fibre: 0 },
        description:
          "Paneer is a fresh Indian cheese that absorbs spices well.",
        history:
          "Paneer has been part of Indian cuisine for centuries as a vegetarian protein source."
      },
      {
        id: "pepperoni",
        name: "Pepperoni",
        usedInCategories: ["pizza", "nachos"],
        pricePer100g: 95,
        nutritionPer100g: { kcal: 494, protein: 24, fat: 44, fibre: 0 },
        description:
          "Pepperoni is a spicy cured meat with bold flavor.",
        history:
          "It originated in the United States as an Italian-American creation."
      },
      {
        id: "olive",
        name: "Black Olives",
        usedInCategories: ["pizza", "pasta", "sandwich"],
        pricePer100g: 45,
        nutritionPer100g: { kcal: 115, protein: 1, fat: 11, fibre: 3 },
        description:
          "Black olives add a salty and tangy Mediterranean flavor.",
        history:
          "Olives have been cultivated for over 6,000 years in the Mediterranean region."
      },
      {
        id: "jalapeno",
        name: "Jalapeno",
        usedInCategories: ["pizza", "burger", "nachos", "wraps"],
        pricePer100g: 20,
        nutritionPer100g: { kcal: 29, protein: 1, fat: 0, fibre: 3 },
        description:
          "Jalapenos add moderate heat and crunch to dishes.",
        history:
          "They originated in Mexico and became popular through Tex-Mex cuisine."
      },
      {
        id: "mayonnaise",
        name: "Mayonnaise",
        usedInCategories: ["burger", "sandwich", "wraps"],
        pricePer100g: 25,
        nutritionPer100g: { kcal: 680, protein: 1, fat: 75, fibre: 0 },
        description:
          "Mayonnaise is a creamy sauce that adds richness to food.",
        history:
          "Believed to have originated in France in the 18th century."
      },
      {
        id: "schezwan_sauce",
        name: "Schezwan Sauce",
        usedInCategories: ["rice", "noodles", "wraps"],
        pricePer100g: 22,
        nutritionPer100g: { kcal: 90, protein: 2, fat: 6, fibre: 1 },
        description:
          "Schezwan sauce is spicy and garlicky, adding bold flavor.",
        history:
          "It comes from Sichuan cuisine and gained popularity in Indo-Chinese food."
      },
      {
        id: "oregano",
        name: "Oregano",
        usedInCategories: ["pizza", "pasta"],
        pricePer100g: 150,
        nutritionPer100g: { kcal: 265, protein: 9, fat: 4, fibre: 43 },
        description:
          "Oregano is an aromatic herb used in Italian cooking.",
        history:
          "Used since ancient Greek times for cooking and medicine."
      },
      {
        id: "garlic",
        name: "Garlic",
        usedInCategories: ["pizza", "pasta", "rice", "noodles", "wraps"],
        pricePer100g: 14,
        nutritionPer100g: { kcal: 149, protein: 6, fat: 0, fibre: 2 },
        description:
          "Garlic adds strong aroma and depth of flavor.",
        history:
          "Garlic has been used for over 7,000 years across many cultures."
      }
    ]
  });

  return (
    <div className="App">

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          <Route
            path="/"
            element={
              <motion.div {...motionProps}>
                <Welcome />
              </motion.div>
            }
          />

          <Route
            path="/categories"
            element={
              <motion.div {...motionProps}>
                <FoodCategory foodData = {foodData}/>
              </motion.div>
            }
          />

          <Route
            path="/foods/:categoryId"
            element={
              <motion.div {...motionProps}>
                <FoodList handleBack={handleBack} foodData = {foodData} />
              </motion.div>
            }
          />

          <Route
            path="/food/:id"
            element={
              <motion.div {...motionProps}>
                <FoodItem handleBack={handleBack}  foodData={foodData} />
              </motion.div>
            }
          />

          <Route
            path="/ingredient/:id"
            element={
              <motion.div {...motionProps}>
                <IngredientDetail handleBack={handleBack} foodData={foodData}/>
              </motion.div>
            }
          />

        </Routes>
      </AnimatePresence>

      {/* <AdminLogin /> */}
    </div>
  )
}

export default App
