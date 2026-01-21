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
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

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
    categories: [
      {
        id: "pizza",
        name: "Pizza",
        image: "/image-assets/pizza/pizza.png",
        sizes: [
          {
            name: "small",
            description: "7 inch · Serves 1",
            priceMultiplier: 1
          },
          {
            name: "medium",
            description: "10 inch · Serves 2",
            priceMultiplier: 1.25
          },
          {
            name: "large",
            description: "12 inch · Serves 3",
            priceMultiplier: 1.5
          }
        ],
        dishes: [
          {
            id: "cheese_pizza",
            name: "Cheese Pizza",
            image: "/image-assets/pizza/pizza1.png",
            basePrice: 249,
            description: "Cheese Pizza is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 441,
              protein: 21,
              fibre: 6,
              fat: 10
            },
            ingredients: [
              {
                name: "Beef Patty",
                quantity: 30
              },
              {
                name: "Macaroni",
                quantity: 40
              },
              {
                name: "Turmeric",
                quantity: 20
              },
              {
                name: "Chilli Sauce",
                quantity: 30
              },
              {
                name: "Paneer",
                quantity: 30
              },
              {
                name: "Sausage",
                quantity: 30
              }
            ],
            history: "Pizza dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "chicken_pizza",
            name: "Chicken Pizza",
            image: "/image-assets/pizza/pizza2.png",
            basePrice: 249,
            description: "Chicken Pizza is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 430,
              protein: 26,
              fibre: 5,
              fat: 10
            },
            ingredients: [
              {
                name: "Corn",
                quantity: 30
              },
              {
                name: "Egg Noodles",
                quantity: 40
              },
              {
                name: "White Pepper",
                quantity: 30
              },
              {
                name: "Sweet Potato",
                quantity: 40
              },
              {
                name: "Garlic",
                quantity: 30
              },
              {
                name: "Sausage",
                quantity: 30
              }
            ],
            history: "Pizza dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_pizza",
            name: "Paneer Pizza",
            image: "/image-assets/pizza/pizza3.png",
            basePrice: 249,
            description: "Paneer Pizza is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 395,
              protein: 23,
              fibre: 3,
              fat: 14
            },
            ingredients: [
              {
                name: "Parsley",
                quantity: 10
              },
              {
                name: "Pizza Base",
                quantity: 10
              },
              {
                name: "Beef",
                quantity: 40
              },
              {
                name: "Turmeric",
                quantity: 20
              },
              {
                name: "Jalapeno",
                quantity: 20
              },
              {
                name: "Paneer",
                quantity: 20
              }
            ],
            history: "Pizza dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "veg_loaded_pizza",
            name: "Veg Loaded Pizza",
            image: "/image-assets/pizza/pizza4.png",
            basePrice: 199,
            description: "Veg Loaded Pizza is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 486,
              protein: 15,
              fibre: 5,
              fat: 13
            },
            ingredients: [
              {
                name: "Mutton",
                quantity: 40
              },
              {
                name: "Yogurt",
                quantity: 30
              },
              {
                name: "Mixed Vegetables",
                quantity: 30
              },
              {
                name: "Frozen Corn",
                quantity: 20
              },
              {
                name: "Tomato",
                quantity: 40
              },
              {
                name: "Egg Noodles",
                quantity: 20
              }
            ],
            history: "Pizza dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "spicy_chicken_pizza",
            name: "Spicy Chicken Pizza",
            image: "/image-assets/pizza/pizza5.png",
            basePrice: 169,
            description: "Spicy Chicken Pizza is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 486,
              protein: 32,
              fibre: 5,
              fat: 14
            },
            ingredients: [
              {
                name: "Pasta",
                quantity: 10
              },
              {
                name: "Lasagna Sheets",
                quantity: 20
              },
              {
                name: "Yogurt",
                quantity: 30
              },
              {
                name: "Egg Noodles",
                quantity: 10
              },
              {
                name: "Beef Patty",
                quantity: 10
              },
              {
                name: "Salt",
                quantity: 40
              }
            ],
            history: "Pizza dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "burger",
        name: "Burger",
        image: "/assets/category-assets/burger.png",
        sizes: [
          {
            name: "single",
            description: "Single patty",
            priceMultiplier: 1
          },
          {
            name: "double",
            description: "Double patty",
            priceMultiplier: 1.35
          },
          {
            name: "jumbo",
            description: "Triple patty",
            priceMultiplier: 1.6
          }
        ],
        dishes: [
          {
            id: "classic_chicken_burger",
            name: "Classic Chicken Burger",
            image: "/image-assets/burger/burger1.png",
            basePrice: 299,
            description: "Classic Chicken Burger is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 547,
              protein: 27,
              fibre: 4,
              fat: 12
            },
            ingredients: [
              {
                name: "Cheese Slice",
                quantity: 20
              },
              {
                name: "Chilli Sauce",
                quantity: 30
              },
              {
                name: "Spinach",
                quantity: 10
              },
              {
                name: "Cheddar Cheese",
                quantity: 30
              },
              {
                name: "Chicken Nuggets",
                quantity: 40
              },
              {
                name: "Basmati Rice",
                quantity: 40
              }
            ],
            history: "Burger dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "cheese_burger",
            name: "Cheese Burger",
            image: "/image-assets/burger/burger2.png",
            basePrice: 189,
            description: "Cheese Burger is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 396,
              protein: 29,
              fibre: 5,
              fat: 23
            },
            ingredients: [
              {
                name: "Mustard",
                quantity: 30
              },
              {
                name: "Brown Rice",
                quantity: 10
              },
              {
                name: "Garam Masala",
                quantity: 30
              },
              {
                name: "Mozzarella Cheese",
                quantity: 40
              },
              {
                name: "Potato",
                quantity: 40
              },
              {
                name: "Veg Patty",
                quantity: 40
              }
            ],
            history: "Burger dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_burger",
            name: "Paneer Burger",
            image: "/image-assets/burger/burger3.png",
            basePrice: 169,
            description: "Paneer Burger is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 354,
              protein: 21,
              fibre: 5,
              fat: 25
            },
            ingredients: [
              {
                name: "Chicken Strips",
                quantity: 20
              },
              {
                name: "Olive Oil",
                quantity: 10
              },
              {
                name: "Sour Cream",
                quantity: 40
              },
              {
                name: "Sweet Potato",
                quantity: 30
              },
              {
                name: "Milk",
                quantity: 40
              },
              {
                name: "Mustard",
                quantity: 40
              }
            ],
            history: "Burger dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "spicy_chicken_burger",
            name: "Spicy Chicken Burger",
            image: "/image-assets/burger/burger4.png",
            basePrice: 219,
            description: "Spicy Chicken Burger is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 414,
              protein: 24,
              fibre: 3,
              fat: 18
            },
            ingredients: [
              {
                name: "Peas",
                quantity: 20
              },
              {
                name: "Veg Patty",
                quantity: 20
              },
              {
                name: "Sweet Potato",
                quantity: 30
              },
              {
                name: "Spinach",
                quantity: 30
              },
              {
                name: "Salt",
                quantity: 30
              },
              {
                name: "Olive Oil",
                quantity: 40
              }
            ],
            history: "Burger dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "veg_supreme_burger",
            name: "Veg Supreme Burger",
            image: "/image-assets/burger/burger5.png",
            basePrice: 299,
            description: "Veg Supreme Burger is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 527,
              protein: 24,
              fibre: 5,
              fat: 24
            },
            ingredients: [
              {
                name: "Chicken",
                quantity: 10
              },
              {
                name: "Coriander",
                quantity: 20
              },
              {
                name: "Red Chilli Flakes",
                quantity: 20
              },
              {
                name: "Chilli Powder",
                quantity: 10
              },
              {
                name: "Rice",
                quantity: 40
              },
              {
                name: "Chicken Mince",
                quantity: 30
              }
            ],
            history: "Burger dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "wraps",
        name: "Wraps",
        image: "/assets/category-assets/wraps.png",
        sizes: [
          {
            name: "regular",
            description: "Standard wrap",
            priceMultiplier: 1
          },
          {
            name: "large",
            description: "Large wrap",
            priceMultiplier: 1.3
          }
        ],
        dishes: [
          {
            id: "chicken_wrap",
            name: "Chicken Wrap",
            image: "/image-assets/wraps/wraps1.png",
            basePrice: 189,
            description: "Chicken Wrap is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 532,
              protein: 28,
              fibre: 3,
              fat: 14
            },
            ingredients: [],
            history: "Wraps dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_wrap",
            name: "Paneer Wrap",
            image: "/image-assets/wraps/wraps2.png",
            basePrice: 299,
            description: "Paneer Wrap is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 489,
              protein: 24,
              fibre: 4,
              fat: 12
            },
            ingredients: [],
            history: "Wraps dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "veg_wrap",
            name: "Veg Wrap",
            image: "/image-assets/wraps/wraps3.png",
            basePrice: 189,
            description: "Veg Wrap is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 490,
              protein: 21,
              fibre: 6,
              fat: 18
            },
            ingredients: [],
            history: "Wraps dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "cheese_wrap",
            name: "Cheese Wrap",
            image: "/image-assets/wraps/wraps4.png",
            basePrice: 219,
            description: "Cheese Wrap is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 365,
              protein: 27,
              fibre: 5,
              fat: 17
            },
            ingredients: [],
            history: "Wraps dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "spicy_chicken_wrap",
            name: "Spicy Chicken Wrap",
            image: "/image-assets/wraps/wraps5.png",
            basePrice: 169,
            description: "Spicy Chicken Wrap is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 400,
              protein: 29,
              fibre: 5,
              fat: 16
            },
            ingredients: [],
            history: "Wraps dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "sandwich",
        name: "Sandwich",
        image: "/assets/category-assets/sandwich.png",
        sizes: [
          {
            name: "regular",
            description: "Standard sandwich",
            priceMultiplier: 1
          },
          {
            name: "double",
            description: "Double filling",
            priceMultiplier: 1.4
          }
        ],
        dishes: [
          {
            id: "chicken_sandwich",
            name: "Chicken Sandwich",
            image: "/image-assets/sandwich/sandwich1.png",
            basePrice: 249,
            description: "Chicken Sandwich is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 369,
              protein: 14,
              fibre: 5,
              fat: 17
            },
            ingredients: [
              {
                name: "Turmeric",
                quantity: 30
              },
              {
                name: "Sour Cream",
                quantity: 40
              },
              {
                name: "Brown Rice",
                quantity: 20
              },
              {
                name: "Sesame Oil",
                quantity: 20
              },
              {
                name: "Frozen Peas",
                quantity: 10
              },
              {
                name: "Mutton",
                quantity: 30
              }
            ],
            history: "Sandwich dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "veg_sandwich",
            name: "Veg Sandwich",
            image: "/image-assets/sandwich/sandwich2.png",
            basePrice: 189,
            description: "Veg Sandwich is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 478,
              protein: 17,
              fibre: 5,
              fat: 19
            },
            ingredients: [
              {
                name: "Frozen Peas",
                quantity: 40
              },
              {
                name: "Turmeric",
                quantity: 10
              },
              {
                name: "Chilli",
                quantity: 20
              },
              {
                name: "Noodles",
                quantity: 30
              },
              {
                name: "Spaghetti",
                quantity: 40
              },
              {
                name: "Spring Onion",
                quantity: 10
              }
            ],
            history: "Sandwich dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_sandwich",
            name: "Paneer Sandwich",
            image: "/image-assets/sandwich/sandwich3.png",
            basePrice: 219,
            description: "Paneer Sandwich is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 383,
              protein: 31,
              fibre: 5,
              fat: 19
            },
            ingredients: [
              {
                name: "Cumin",
                quantity: 20
              },
              {
                name: "Lasagna Sheets",
                quantity: 10
              },
              {
                name: "Peas",
                quantity: 20
              },
              {
                name: "Parsley",
                quantity: 10
              },
              {
                name: "Paneer Tikka",
                quantity: 30
              },
              {
                name: "Ginger",
                quantity: 20
              }
            ],
            history: "Sandwich dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "cheese_sandwich",
            name: "Cheese Sandwich",
            image: "/image-assets/sandwich/sandwich4.png",
            basePrice: 169,
            description: "Cheese Sandwich is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 355,
              protein: 32,
              fibre: 6,
              fat: 25
            },
            ingredients: [
              {
                name: "Ginger",
                quantity: 40
              },
              {
                name: "Beef Patty",
                quantity: 30
              },
              {
                name: "Vinegar",
                quantity: 40
              },
              {
                name: "Sweet Potato",
                quantity: 40
              },
              {
                name: "Cumin",
                quantity: 20
              },
              {
                name: "Sausage",
                quantity: 20
              }
            ],
            history: "Sandwich dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "club_sandwich",
            name: "Club Sandwich",
            image: "/image-assets/sandwich/sandwich5.png",
            basePrice: 199,
            description: "Club Sandwich is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 456,
              protein: 19,
              fibre: 4,
              fat: 16
            },
            ingredients: [
              {
                name: "Pizza Base",
                quantity: 40
              },
              {
                name: "Rice",
                quantity: 40
              },
              {
                name: "Caramelized Onions",
                quantity: 40
              },
              {
                name: "Sour Cream",
                quantity: 30
              },
              {
                name: "Noodles",
                quantity: 40
              },
              {
                name: "Cream Cheese",
                quantity: 20
              }
            ],
            history: "Sandwich dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "pasta",
        name: "Pasta",
        image: "/assets/category-assets/pasta.png",
        sizes: [
          {
            name: "regular",
            description: "Regular bowl",
            priceMultiplier: 1
          },
          {
            name: "large",
            description: "Large bowl",
            priceMultiplier: 1.4
          }
        ],
        dishes: [
          {
            id: "white_sauce_pasta",
            name: "White Sauce Pasta",
            image: "/image-assets/pasta/pasta1.png",
            basePrice: 169,
            description: "White Sauce Pasta is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 422,
              protein: 28,
              fibre: 5,
              fat: 19
            },
            ingredients: [],
            history: "Pasta dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "red_sauce_pasta",
            name: "Red Sauce Pasta",
            image: "/image-assets/pasta/pasta2.png",
            basePrice: 249,
            description: "Red Sauce Pasta is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 546,
              protein: 22,
              fibre: 6,
              fat: 25
            },
            ingredients: [],
            history: "Pasta dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "chicken_pasta",
            name: "Chicken Pasta",
            image: "/image-assets/pasta/pasta3.png",
            basePrice: 219,
            description: "Chicken Pasta is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 356,
              protein: 21,
              fibre: 3,
              fat: 12
            },
            ingredients: [],
            history: "Pasta dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_pasta",
            name: "Paneer Pasta",
            image: "/image-assets/pasta/pasta4.png",
            basePrice: 299,
            description: "Paneer Pasta is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 437,
              protein: 14,
              fibre: 6,
              fat: 15
            },
            ingredients: [],
            history: "Pasta dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "spicy_schezwan_pasta",
            name: "Spicy Schezwan Pasta",
            image: "/image-assets/pasta/pasta5.png",
            basePrice: 219,
            description: "Spicy Schezwan Pasta is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 445,
              protein: 31,
              fibre: 3,
              fat: 10
            },
            ingredients: [],
            history: "Pasta dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "rice",
        name: "Rice",
        image: "/assets/category-assets/rice.png",
        sizes: [
          {
            name: "regular",
            description: "Single serving",
            priceMultiplier: 1
          },
          {
            name: "large",
            description: "Large bowl",
            priceMultiplier: 1.4
          }
        ],
        dishes: [
          {
            id: "chicken_fried_rice",
            name: "Chicken Fried Rice",
            image: "/image-assets/rice/rice1.png",
            basePrice: 219,
            description: "Chicken Fried Rice is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 493,
              protein: 14,
              fibre: 6,
              fat: 12
            },
            ingredients: [],
            history: "Rice dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "veg_fried_rice",
            name: "Veg Fried Rice",
            image: "/image-assets/rice/rice2.png",
            basePrice: 189,
            description: "Veg Fried Rice is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 425,
              protein: 20,
              fibre: 4,
              fat: 22
            },
            ingredients: [],
            history: "Rice dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_rice",
            name: "Paneer Rice",
            image: "/image-assets/rice/rice3.png",
            basePrice: 299,
            description: "Paneer Rice is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 351,
              protein: 21,
              fibre: 6,
              fat: 16
            },
            ingredients: [],
            history: "Rice dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "schezwan_rice",
            name: "Schezwan Rice",
            image: "/image-assets/rice/rice4.png",
            basePrice: 199,
            description: "Schezwan Rice is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 423,
              protein: 23,
              fibre: 6,
              fat: 15
            },
            ingredients: [],
            history: "Rice dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "garlic_rice",
            name: "Garlic Rice",
            image: "/image-assets/rice/rice5.png",
            basePrice: 249,
            description: "Garlic Rice is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 468,
              protein: 14,
              fibre: 4,
              fat: 19
            },
            ingredients: [],
            history: "Rice dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      },
      {
        id: "noodles",
        name: "Noodles",
        image: "/assets/category-assets/noodles.png",
        sizes: [
          {
            name: "regular",
            description: "Standard bowl",
            priceMultiplier: 1
          },
          {
            name: "large",
            description: "Large bowl",
            priceMultiplier: 1.4
          }
        ],
        dishes: [
          {
            id: "veg_noodles",
            name: "Veg Noodles",
            image: "/image-assets/noodles/noodles1.png",
            basePrice: 299,
            description: "Veg Noodles is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 499,
              protein: 24,
              fibre: 3,
              fat: 15
            },
            ingredients: [],
            history: "Noodles dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "chicken_noodles",
            name: "Chicken Noodles",
            image: "/image-assets/noodles/noodles2.png",
            basePrice: 299,
            description: "Chicken Noodles is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 426,
              protein: 19,
              fibre: 4,
              fat: 11
            },
            ingredients: [],
            history: "Noodles dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "schezwan_noodles",
            name: "Schezwan Noodles",
            image: "/image-assets/noodles/noodles3.png",
            basePrice: 249,
            description: "Schezwan Noodles is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 362,
              protein: 19,
              fibre: 3,
              fat: 22
            },
            ingredients: [],
            history: "Noodles dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "paneer_noodles",
            name: "Paneer Noodles",
            image: "/image-assets/noodles/noodles4.png",
            basePrice: 199,
            description: "Paneer Noodles is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 423,
              protein: 18,
              fibre: 3,
              fat: 19
            },
            ingredients: [],
            history: "Noodles dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          },
          {
            id: "garlic_noodles",
            name: "Garlic Noodles",
            image: "/image-assets/noodles/noodles5.png",
            basePrice: 199,
            description: "Garlic Noodles is prepared using fresh ingredients and balanced seasoning to deliver consistent flavor. It is cooked carefully to maintain texture, aroma, and overall quality in every serving.",
            benefits: {
              calories: 524,
              protein: 14,
              fibre: 4,
              fat: 20
            },
            ingredients: [],
            history: "Noodles dishes originated from popular street-style and traditional recipes. Over time, they have been refined to suit modern tastes while retaining their original character."
          }
        ]
      }
    ],
    ingredients: [
      {
        id: "ingredient_001",
        name: "Mozzarella Cheese",
        image: "/assets/ingredient-assets/mozzarella_cheese.png",
        lastUpdated: "2025-01-02",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 21,
        stockRemaining: 6,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 51,
          protein: 2,
          fat: 1,
          fibre: 1
        },
        description: "Mozzarella Cheese is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mozzarella Cheese has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_002",
        name: "Cheddar Cheese",
        image: "/assets/ingredient-assets/cheddar_cheese.png",
        lastUpdated: "2025-01-03",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 22,
        stockRemaining: 7,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 52,
          protein: 3,
          fat: 2,
          fibre: 2
        },
        description: "Cheddar Cheese is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cheddar Cheese has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_003",
        name: "Paneer",
        image: "/assets/ingredient-assets/paneer.png",
        lastUpdated: "2025-01-04",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 23,
        stockRemaining: 8,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 53,
          protein: 4,
          fat: 3,
          fibre: 3
        },
        description: "Paneer is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Paneer has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_004",
        name: "Butter",
        image: "/assets/ingredient-assets/butter.png",
        lastUpdated: "2025-01-05",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 24,
        stockRemaining: 9,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 54,
          protein: 5,
          fat: 4,
          fibre: 4
        },
        description: "Butter is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Butter has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_005",
        name: "Cream",
        image: "/assets/ingredient-assets/cream.png",
        lastUpdated: "2025-01-06",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 25,
        stockRemaining: 10,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 55,
          protein: 6,
          fat: 5,
          fibre: 5
        },
        description: "Cream is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cream has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_006",
        name: "Milk",
        image: "/assets/ingredient-assets/milk.png",
        lastUpdated: "2025-01-07",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 26,
        stockRemaining: 11,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 56,
          protein: 7,
          fat: 6,
          fibre: 6
        },
        description: "Milk is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Milk has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_007",
        name: "Yogurt",
        image: "/assets/ingredient-assets/yogurt.png",
        lastUpdated: "2025-01-08",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 27,
        stockRemaining: 12,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 57,
          protein: 8,
          fat: 7,
          fibre: 7
        },
        description: "Yogurt is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Yogurt has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_008",
        name: "Chicken",
        image: "/assets/ingredient-assets/chicken.png",
        lastUpdated: "2025-01-09",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 28,
        stockRemaining: 13,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 58,
          protein: 9,
          fat: 8,
          fibre: 8
        },
        description: "Chicken is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_009",
        name: "Beef",
        image: "/assets/ingredient-assets/beef.png",
        lastUpdated: "2025-01-10",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 29,
        stockRemaining: 14,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 59,
          protein: 10,
          fat: 9,
          fibre: 9
        },
        description: "Beef is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Beef has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_010",
        name: "Mutton",
        image: "/assets/ingredient-assets/mutton.png",
        lastUpdated: "2025-01-11",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 30,
        stockRemaining: 15,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 60,
          protein: 11,
          fat: 10,
          fibre: 0
        },
        description: "Mutton is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mutton has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_011",
        name: "Egg",
        image: "/assets/ingredient-assets/egg.png",
        lastUpdated: "2025-01-12",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 31,
        stockRemaining: 16,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 61,
          protein: 12,
          fat: 11,
          fibre: 1
        },
        description: "Egg is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Egg has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_012",
        name: "Bacon",
        image: "/assets/ingredient-assets/bacon.png",
        lastUpdated: "2025-01-13",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 32,
        stockRemaining: 17,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 62,
          protein: 13,
          fat: 12,
          fibre: 2
        },
        description: "Bacon is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Bacon has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_013",
        name: "Sausage",
        image: "/assets/ingredient-assets/sausage.png",
        lastUpdated: "2025-01-14",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 33,
        stockRemaining: 18,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 63,
          protein: 14,
          fat: 13,
          fibre: 3
        },
        description: "Sausage is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Sausage has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_014",
        name: "Tomato",
        image: "/assets/ingredient-assets/tomato.png",
        lastUpdated: "2025-01-15",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 34,
        stockRemaining: 19,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 64,
          protein: 15,
          fat: 14,
          fibre: 4
        },
        description: "Tomato is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Tomato has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_015",
        name: "Onion",
        image: "/assets/ingredient-assets/onion.png",
        lastUpdated: "2025-01-16",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 35,
        stockRemaining: 20,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 65,
          protein: 16,
          fat: 15,
          fibre: 5
        },
        description: "Onion is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Onion has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_016",
        name: "Garlic",
        image: "/assets/ingredient-assets/garlic.png",
        lastUpdated: "2025-01-17",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 36,
        stockRemaining: 21,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 66,
          protein: 17,
          fat: 16,
          fibre: 6
        },
        description: "Garlic is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Garlic has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_017",
        name: "Ginger",
        image: "/assets/ingredient-assets/ginger.png",
        lastUpdated: "2025-01-18",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 37,
        stockRemaining: 22,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 67,
          protein: 18,
          fat: 17,
          fibre: 7
        },
        description: "Ginger is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Ginger has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_018",
        name: "Capsicum",
        image: "/assets/ingredient-assets/capsicum.png",
        lastUpdated: "2025-01-19",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 38,
        stockRemaining: 23,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 68,
          protein: 19,
          fat: 18,
          fibre: 8
        },
        description: "Capsicum is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Capsicum has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_019",
        name: "Chilli",
        image: "/assets/ingredient-assets/chilli.png",
        lastUpdated: "2025-01-20",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 39,
        stockRemaining: 24,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 69,
          protein: 20,
          fat: 19,
          fibre: 9
        },
        description: "Chilli is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chilli has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_020",
        name: "Jalapeno",
        image: "/assets/ingredient-assets/jalapeno.png",
        lastUpdated: "2025-01-21",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 40,
        stockRemaining: 25,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 70,
          protein: 21,
          fat: 0,
          fibre: 0
        },
        description: "Jalapeno is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Jalapeno has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_021",
        name: "Mushroom",
        image: "/assets/ingredient-assets/mushroom.png",
        lastUpdated: "2025-01-22",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 41,
        stockRemaining: 26,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 71,
          protein: 22,
          fat: 1,
          fibre: 1
        },
        description: "Mushroom is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mushroom has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_022",
        name: "Olives",
        image: "/assets/ingredient-assets/olives.png",
        lastUpdated: "2025-01-23",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 42,
        stockRemaining: 27,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 72,
          protein: 23,
          fat: 2,
          fibre: 2
        },
        description: "Olives is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Olives has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_023",
        name: "Corn",
        image: "/assets/ingredient-assets/corn.png",
        lastUpdated: "2025-01-24",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 43,
        stockRemaining: 28,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 73,
          protein: 24,
          fat: 3,
          fibre: 3
        },
        description: "Corn is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Corn has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_024",
        name: "Spinach",
        image: "/assets/ingredient-assets/spinach.png",
        lastUpdated: "2025-01-25",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 44,
        stockRemaining: 29,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 74,
          protein: 25,
          fat: 4,
          fibre: 4
        },
        description: "Spinach is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Spinach has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_025",
        name: "Lettuce",
        image: "/assets/ingredient-assets/lettuce.png",
        lastUpdated: "2025-01-26",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 45,
        stockRemaining: 5,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 75,
          protein: 26,
          fat: 5,
          fibre: 5
        },
        description: "Lettuce is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Lettuce has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_026",
        name: "Cabbage",
        image: "/assets/ingredient-assets/cabbage.png",
        lastUpdated: "2025-01-27",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 46,
        stockRemaining: 6,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 76,
          protein: 27,
          fat: 6,
          fibre: 6
        },
        description: "Cabbage is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cabbage has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_027",
        name: "Potato",
        image: "/assets/ingredient-assets/potato.png",
        lastUpdated: "2025-01-28",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 47,
        stockRemaining: 7,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 77,
          protein: 28,
          fat: 7,
          fibre: 7
        },
        description: "Potato is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Potato has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_028",
        name: "Sweet Potato",
        image: "/assets/ingredient-assets/sweet_potato.png",
        lastUpdated: "2025-01-29",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 48,
        stockRemaining: 8,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 78,
          protein: 29,
          fat: 8,
          fibre: 8
        },
        description: "Sweet Potato is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Sweet Potato has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_029",
        name: "Carrot",
        image: "/assets/ingredient-assets/carrot.png",
        lastUpdated: "2025-01-30",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 49,
        stockRemaining: 9,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 79,
          protein: 30,
          fat: 9,
          fibre: 9
        },
        description: "Carrot is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Carrot has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_030",
        name: "Beans",
        image: "/assets/ingredient-assets/beans.png",
        lastUpdated: "2025-01-31",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 50,
        stockRemaining: 10,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 80,
          protein: 1,
          fat: 10,
          fibre: 0
        },
        description: "Beans is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Beans has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_031",
        name: "Peas",
        image: "/assets/ingredient-assets/peas.png",
        lastUpdated: "2025-02-01",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 51,
        stockRemaining: 11,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 81,
          protein: 2,
          fat: 11,
          fibre: 1
        },
        description: "Peas is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Peas has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_032",
        name: "Rice",
        image: "/assets/ingredient-assets/rice.png",
        lastUpdated: "2025-02-02",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 52,
        stockRemaining: 12,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 82,
          protein: 3,
          fat: 12,
          fibre: 2
        },
        description: "Rice is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Rice has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_033",
        name: "Basmati Rice",
        image: "/assets/ingredient-assets/basmati_rice.png",
        lastUpdated: "2025-02-03",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 53,
        stockRemaining: 13,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 83,
          protein: 4,
          fat: 13,
          fibre: 3
        },
        description: "Basmati Rice is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Basmati Rice has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_034",
        name: "Brown Rice",
        image: "/assets/ingredient-assets/brown_rice.png",
        lastUpdated: "2025-02-04",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 54,
        stockRemaining: 14,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 84,
          protein: 5,
          fat: 14,
          fibre: 4
        },
        description: "Brown Rice is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Brown Rice has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_035",
        name: "Noodles",
        image: "/assets/ingredient-assets/noodles.png",
        lastUpdated: "2025-02-05",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 55,
        stockRemaining: 15,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 85,
          protein: 6,
          fat: 15,
          fibre: 5
        },
        description: "Noodles is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Noodles has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_036",
        name: "Egg Noodles",
        image: "/assets/ingredient-assets/egg_noodles.png",
        lastUpdated: "2025-02-06",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 56,
        stockRemaining: 16,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 86,
          protein: 7,
          fat: 16,
          fibre: 6
        },
        description: "Egg Noodles is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Egg Noodles has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_037",
        name: "Rice Noodles",
        image: "/assets/ingredient-assets/rice_noodles.png",
        lastUpdated: "2025-02-07",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 57,
        stockRemaining: 17,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 87,
          protein: 8,
          fat: 17,
          fibre: 7
        },
        description: "Rice Noodles is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Rice Noodles has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_038",
        name: "Pasta",
        image: "/assets/ingredient-assets/pasta.png",
        lastUpdated: "2025-02-08",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 58,
        stockRemaining: 18,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 88,
          protein: 9,
          fat: 18,
          fibre: 8
        },
        description: "Pasta is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Pasta has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_039",
        name: "Macaroni",
        image: "/assets/ingredient-assets/macaroni.png",
        lastUpdated: "2025-02-09",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 59,
        stockRemaining: 19,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 89,
          protein: 10,
          fat: 19,
          fibre: 9
        },
        description: "Macaroni is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Macaroni has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_040",
        name: "Spaghetti",
        image: "/assets/ingredient-assets/spaghetti.png",
        lastUpdated: "2025-02-10",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 60,
        stockRemaining: 20,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 90,
          protein: 11,
          fat: 0,
          fibre: 0
        },
        description: "Spaghetti is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Spaghetti has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_041",
        name: "Lasagna Sheets",
        image: "/assets/ingredient-assets/lasagna_sheets.png",
        lastUpdated: "2025-02-11",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 61,
        stockRemaining: 21,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 91,
          protein: 12,
          fat: 1,
          fibre: 1
        },
        description: "Lasagna Sheets is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Lasagna Sheets has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_042",
        name: "Tomato Sauce",
        image: "/assets/ingredient-assets/tomato_sauce.png",
        lastUpdated: "2025-02-12",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 62,
        stockRemaining: 22,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 92,
          protein: 13,
          fat: 2,
          fibre: 2
        },
        description: "Tomato Sauce is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Tomato Sauce has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_043",
        name: "Chilli Sauce",
        image: "/assets/ingredient-assets/chilli_sauce.png",
        lastUpdated: "2025-02-13",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 63,
        stockRemaining: 23,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 93,
          protein: 14,
          fat: 3,
          fibre: 3
        },
        description: "Chilli Sauce is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chilli Sauce has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_044",
        name: "Schezwan Sauce",
        image: "/assets/ingredient-assets/schezwan_sauce.png",
        lastUpdated: "2025-02-14",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 64,
        stockRemaining: 24,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 94,
          protein: 15,
          fat: 4,
          fibre: 4
        },
        description: "Schezwan Sauce is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Schezwan Sauce has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_045",
        name: "Mayonnaise",
        image: "/assets/ingredient-assets/mayonnaise.png",
        lastUpdated: "2025-02-15",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 65,
        stockRemaining: 25,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 95,
          protein: 16,
          fat: 5,
          fibre: 5
        },
        description: "Mayonnaise is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mayonnaise has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_046",
        name: "Mustard",
        image: "/assets/ingredient-assets/mustard.png",
        lastUpdated: "2025-02-16",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 66,
        stockRemaining: 26,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 96,
          protein: 17,
          fat: 6,
          fibre: 6
        },
        description: "Mustard is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mustard has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_047",
        name: "Ketchup",
        image: "/assets/ingredient-assets/ketchup.png",
        lastUpdated: "2025-02-17",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 67,
        stockRemaining: 27,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 97,
          protein: 18,
          fat: 7,
          fibre: 7
        },
        description: "Ketchup is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Ketchup has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_048",
        name: "Oregano",
        image: "/assets/ingredient-assets/oregano.png",
        lastUpdated: "2025-02-18",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 68,
        stockRemaining: 28,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 98,
          protein: 19,
          fat: 8,
          fibre: 8
        },
        description: "Oregano is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Oregano has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_049",
        name: "Basil",
        image: "/assets/ingredient-assets/basil.png",
        lastUpdated: "2025-02-19",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 69,
        stockRemaining: 29,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 99,
          protein: 20,
          fat: 9,
          fibre: 9
        },
        description: "Basil is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Basil has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_050",
        name: "Parsley",
        image: "/assets/ingredient-assets/parsley.png",
        lastUpdated: "2025-02-20",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 70,
        stockRemaining: 5,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 100,
          protein: 21,
          fat: 10,
          fibre: 0
        },
        description: "Parsley is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Parsley has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_051",
        name: "Black Pepper",
        image: "/assets/ingredient-assets/black_pepper.png",
        lastUpdated: "2025-02-21",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 71,
        stockRemaining: 6,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 101,
          protein: 22,
          fat: 11,
          fibre: 1
        },
        description: "Black Pepper is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Black Pepper has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_052",
        name: "White Pepper",
        image: "/assets/ingredient-assets/white_pepper.png",
        lastUpdated: "2025-02-22",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 72,
        stockRemaining: 7,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 102,
          protein: 23,
          fat: 12,
          fibre: 2
        },
        description: "White Pepper is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "White Pepper has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_053",
        name: "Salt",
        image: "/assets/ingredient-assets/salt.png",
        lastUpdated: "2025-02-23",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 73,
        stockRemaining: 8,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 103,
          protein: 24,
          fat: 13,
          fibre: 3
        },
        description: "Salt is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Salt has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_054",
        name: "Soy Sauce",
        image: "/assets/ingredient-assets/soy_sauce.png",
        lastUpdated: "2025-02-24",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 74,
        stockRemaining: 9,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 104,
          protein: 25,
          fat: 14,
          fibre: 4
        },
        description: "Soy Sauce is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Soy Sauce has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_055",
        name: "Vinegar",
        image: "/assets/ingredient-assets/vinegar.png",
        lastUpdated: "2025-02-25",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 75,
        stockRemaining: 10,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 105,
          protein: 26,
          fat: 15,
          fibre: 5
        },
        description: "Vinegar is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Vinegar has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_056",
        name: "Sesame Oil",
        image: "/assets/ingredient-assets/sesame_oil.png",
        lastUpdated: "2025-02-26",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 76,
        stockRemaining: 11,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 106,
          protein: 27,
          fat: 16,
          fibre: 6
        },
        description: "Sesame Oil is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Sesame Oil has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_057",
        name: "Olive Oil",
        image: "/assets/ingredient-assets/olive_oil.png",
        lastUpdated: "2025-02-27",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 77,
        stockRemaining: 12,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 107,
          protein: 28,
          fat: 17,
          fibre: 7
        },
        description: "Olive Oil is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Olive Oil has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_058",
        name: "Paneer Cubes",
        image: "/assets/ingredient-assets/paneer_cubes.png",
        lastUpdated: "2025-02-28",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 78,
        stockRemaining: 13,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 108,
          protein: 29,
          fat: 18,
          fibre: 8
        },
        description: "Paneer Cubes is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Paneer Cubes has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_059",
        name: "Chicken Tikka",
        image: "/assets/ingredient-assets/chicken_tikka.png",
        lastUpdated: "2025-03-01",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 79,
        stockRemaining: 14,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 109,
          protein: 30,
          fat: 19,
          fibre: 9
        },
        description: "Chicken Tikka is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken Tikka has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_060",
        name: "Chicken Sausage",
        image: "/assets/ingredient-assets/chicken_sausage.png",
        lastUpdated: "2025-03-02",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 20,
        stockRemaining: 15,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 110,
          protein: 1,
          fat: 0,
          fibre: 0
        },
        description: "Chicken Sausage is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken Sausage has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_061",
        name: "Chicken Mince",
        image: "/assets/ingredient-assets/chicken_mince.png",
        lastUpdated: "2025-03-03",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 21,
        stockRemaining: 16,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 111,
          protein: 2,
          fat: 1,
          fibre: 1
        },
        description: "Chicken Mince is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken Mince has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_062",
        name: "Beef Patty",
        image: "/assets/ingredient-assets/beef_patty.png",
        lastUpdated: "2025-03-04",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 22,
        stockRemaining: 17,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 112,
          protein: 3,
          fat: 2,
          fibre: 2
        },
        description: "Beef Patty is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Beef Patty has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_063",
        name: "Veg Patty",
        image: "/assets/ingredient-assets/veg_patty.png",
        lastUpdated: "2025-03-05",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 23,
        stockRemaining: 18,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 113,
          protein: 4,
          fat: 3,
          fibre: 3
        },
        description: "Veg Patty is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Veg Patty has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_064",
        name: "Falafel",
        image: "/assets/ingredient-assets/falafel.png",
        lastUpdated: "2025-03-06",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 24,
        stockRemaining: 19,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 114,
          protein: 5,
          fat: 4,
          fibre: 4
        },
        description: "Falafel is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Falafel has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_065",
        name: "Bread",
        image: "/assets/ingredient-assets/bread.png",
        lastUpdated: "2025-03-07",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 25,
        stockRemaining: 20,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 115,
          protein: 6,
          fat: 5,
          fibre: 5
        },
        description: "Bread is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Bread has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_066",
        name: "Burger Bun",
        image: "/assets/ingredient-assets/burger_bun.png",
        lastUpdated: "2025-03-08",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 26,
        stockRemaining: 21,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 116,
          protein: 7,
          fat: 6,
          fibre: 6
        },
        description: "Burger Bun is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Burger Bun has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_067",
        name: "Wrap Bread",
        image: "/assets/ingredient-assets/wrap_bread.png",
        lastUpdated: "2025-03-09",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 27,
        stockRemaining: 22,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 117,
          protein: 8,
          fat: 7,
          fibre: 7
        },
        description: "Wrap Bread is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Wrap Bread has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_068",
        name: "Pizza Base",
        image: "/assets/ingredient-assets/pizza_base.png",
        lastUpdated: "2025-03-10",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 28,
        stockRemaining: 23,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 118,
          protein: 9,
          fat: 8,
          fibre: 8
        },
        description: "Pizza Base is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Pizza Base has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_069",
        name: "Cheese Slice",
        image: "/assets/ingredient-assets/cheese_slice.png",
        lastUpdated: "2025-03-11",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 29,
        stockRemaining: 24,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 119,
          protein: 10,
          fat: 9,
          fibre: 9
        },
        description: "Cheese Slice is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cheese Slice has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_070",
        name: "Cheese Spread",
        image: "/assets/ingredient-assets/cheese_spread.png",
        lastUpdated: "2025-03-12",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 30,
        stockRemaining: 25,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 120,
          protein: 11,
          fat: 10,
          fibre: 0
        },
        description: "Cheese Spread is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cheese Spread has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_071",
        name: "Cream Cheese",
        image: "/assets/ingredient-assets/cream_cheese.png",
        lastUpdated: "2025-03-13",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 31,
        stockRemaining: 26,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 121,
          protein: 12,
          fat: 11,
          fibre: 1
        },
        description: "Cream Cheese is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cream Cheese has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_072",
        name: "Butter Milk",
        image: "/assets/ingredient-assets/butter_milk.png",
        lastUpdated: "2025-03-14",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 32,
        stockRemaining: 27,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 122,
          protein: 13,
          fat: 12,
          fibre: 2
        },
        description: "Butter Milk is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Butter Milk has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_073",
        name: "Sour Cream",
        image: "/assets/ingredient-assets/sour_cream.png",
        lastUpdated: "2025-03-15",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 33,
        stockRemaining: 28,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 123,
          protein: 14,
          fat: 13,
          fibre: 3
        },
        description: "Sour Cream is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Sour Cream has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_074",
        name: "Milk Powder",
        image: "/assets/ingredient-assets/milk_powder.png",
        lastUpdated: "2025-03-16",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 34,
        stockRemaining: 29,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 124,
          protein: 15,
          fat: 14,
          fibre: 4
        },
        description: "Milk Powder is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Milk Powder has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_075",
        name: "Fried Onions",
        image: "/assets/ingredient-assets/fried_onions.png",
        lastUpdated: "2025-03-17",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 35,
        stockRemaining: 5,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 125,
          protein: 16,
          fat: 15,
          fibre: 5
        },
        description: "Fried Onions is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Fried Onions has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_076",
        name: "Caramelized Onions",
        image: "/assets/ingredient-assets/caramelized_onions.png",
        lastUpdated: "2025-03-18",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 36,
        stockRemaining: 6,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 126,
          protein: 17,
          fat: 16,
          fibre: 6
        },
        description: "Caramelized Onions is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Caramelized Onions has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_077",
        name: "Spring Onion",
        image: "/assets/ingredient-assets/spring_onion.png",
        lastUpdated: "2025-03-19",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 37,
        stockRemaining: 7,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 127,
          protein: 18,
          fat: 17,
          fibre: 7
        },
        description: "Spring Onion is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Spring Onion has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_078",
        name: "Green Chilli",
        image: "/assets/ingredient-assets/green_chilli.png",
        lastUpdated: "2025-03-20",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 38,
        stockRemaining: 8,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 128,
          protein: 19,
          fat: 18,
          fibre: 8
        },
        description: "Green Chilli is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Green Chilli has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_079",
        name: "Red Chilli Flakes",
        image: "/assets/ingredient-assets/red_chilli_flakes.png",
        lastUpdated: "2025-03-21",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 39,
        stockRemaining: 9,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 129,
          protein: 20,
          fat: 19,
          fibre: 9
        },
        description: "Red Chilli Flakes is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Red Chilli Flakes has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_080",
        name: "Chilli Powder",
        image: "/assets/ingredient-assets/chilli_powder.png",
        lastUpdated: "2025-03-22",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 40,
        stockRemaining: 10,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 130,
          protein: 21,
          fat: 0,
          fibre: 0
        },
        description: "Chilli Powder is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chilli Powder has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_081",
        name: "Coriander",
        image: "/assets/ingredient-assets/coriander.png",
        lastUpdated: "2025-03-23",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 41,
        stockRemaining: 11,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 131,
          protein: 22,
          fat: 1,
          fibre: 1
        },
        description: "Coriander is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Coriander has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_082",
        name: "Cumin",
        image: "/assets/ingredient-assets/cumin.png",
        lastUpdated: "2025-03-24",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 42,
        stockRemaining: 12,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 132,
          protein: 23,
          fat: 2,
          fibre: 2
        },
        description: "Cumin is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Cumin has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_083",
        name: "Turmeric",
        image: "/assets/ingredient-assets/turmeric.png",
        lastUpdated: "2025-03-25",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 43,
        stockRemaining: 13,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 133,
          protein: 24,
          fat: 3,
          fibre: 3
        },
        description: "Turmeric is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Turmeric has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_084",
        name: "Garam Masala",
        image: "/assets/ingredient-assets/garam_masala.png",
        lastUpdated: "2025-03-26",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 44,
        stockRemaining: 14,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 134,
          protein: 25,
          fat: 4,
          fibre: 4
        },
        description: "Garam Masala is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Garam Masala has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_085",
        name: "Mixed Vegetables",
        image: "/assets/ingredient-assets/mixed_vegetables.png",
        lastUpdated: "2025-03-27",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 45,
        stockRemaining: 15,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 135,
          protein: 26,
          fat: 5,
          fibre: 5
        },
        description: "Mixed Vegetables is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Mixed Vegetables has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_086",
        name: "Frozen Peas",
        image: "/assets/ingredient-assets/frozen_peas.png",
        lastUpdated: "2025-03-28",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 46,
        stockRemaining: 16,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 136,
          protein: 27,
          fat: 6,
          fibre: 6
        },
        description: "Frozen Peas is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Frozen Peas has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_087",
        name: "Frozen Corn",
        image: "/assets/ingredient-assets/frozen_corn.png",
        lastUpdated: "2025-03-29",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 47,
        stockRemaining: 17,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 137,
          protein: 28,
          fat: 7,
          fibre: 7
        },
        description: "Frozen Corn is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Frozen Corn has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_088",
        name: "Paneer Tikka",
        image: "/assets/ingredient-assets/paneer_tikka.png",
        lastUpdated: "2025-03-30",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich"
        ],
        pricePer100g: 48,
        stockRemaining: 18,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 138,
          protein: 29,
          fat: 8,
          fibre: 8
        },
        description: "Paneer Tikka is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Paneer Tikka has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_089",
        name: "Chicken Strips",
        image: "/assets/ingredient-assets/chicken_strips.png",
        lastUpdated: "2025-03-31",
        usedInCategories: [
          "pizza",
          "burger",
          "sandwich",
          "nachos"
        ],
        pricePer100g: 49,
        stockRemaining: 19,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 139,
          protein: 30,
          fat: 9,
          fibre: 9
        },
        description: "Chicken Strips is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken Strips has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      },
      {
        id: "ingredient_090",
        name: "Chicken Nuggets",
        image: "/assets/ingredient-assets/chicken_nuggets.png",
        lastUpdated: "2025-04-01",
        usedInCategories: [
          "pizza",
          "burger"
        ],
        pricePer100g: 50,
        stockRemaining: 20,
        stockMin: 5,
        stockMax: 30,
        nutritionPer100g: {
          kcal: 140,
          protein: 1,
          fat: 10,
          fibre: 0
        },
        description: "Chicken Nuggets is widely used across multiple dishes to enhance flavor and texture. It blends well with other ingredients and maintains consistency during cooking. Chefs prefer it for its reliability and balanced taste profile.",
        history: "Chicken Nuggets has been used in culinary preparations for many decades. It became popular due to its versatility and ease of storage. Over time, it found a place in modern fast-food and fusion cuisine."
      }
    ],
    favourites: [],
    combo: [
      {
        id: "combo_starters",
        image: "/image-assets/pizza/pizza1.png",
        type: "starters",
        title: "Starters",
        items: [
          {
            id: "st_1",
            name: "Garlic Bread",
            price: 99,
            image: "/combo/starters/garlic-bread.png"
          },
          {
            id: "st_2",
            name: "Cheese Balls",
            price: 129,
            image: "/combo/starters/cheese-balls.png"
          },
          {
            id: "st_3",
            name: "Chicken Wings",
            price: 149,
            image: "/combo/starters/chicken-wings.png"
          },
          {
            id: "st_4",
            name: "French Fries",
            price: 89,
            image: "/combo/starters/fries.png"
          },
          {
            id: "st_5",
            name: "Spring Rolls",
            price: 119,
            image: "/combo/starters/spring-rolls.png"
          },
          {
            id: "st_6",
            name: "Paneer Tikka",
            price: 159,
            image: "/combo/starters/paneer-tikka.png"
          },
          {
            id: "st_7",
            name: "Chicken Popcorn",
            price: 139,
            image: "/combo/starters/popcorn.png"
          },
          {
            id: "st_8",
            name: "Veg Nuggets",
            price: 109,
            image: "/combo/starters/nuggets.png"
          },
          {
            id: "st_9",
            name: "Onion Rings",
            price: 99,
            image: "/combo/starters/onion-rings.png"
          },
          {
            id: "st_10",
            name: "Mozzarella Sticks",
            price: 149,
            image: "/combo/starters/mozzarella.png"
          }
        ]
      },
      {
        id: "combo_main",
        type: "mainCourse",
        title: "Main Course",
        groups: [
          {
            id: "pizza",
            title: "Pizza",
            items: [
              {
                id: "pz_1",
                name: "Margherita",
                price: 299,
                image: "/combo/pizza/margherita.png"
              },
              {
                id: "pz_2",
                name: "Farmhouse",
                price: 349,
                image: "/combo/pizza/farmhouse.png"
              },
              {
                id: "pz_3",
                name: "Pepperoni",
                price: 399,
                image: "/combo/pizza/pepperoni.png"
              },
              {
                id: "pz_4",
                name: "BBQ Chicken",
                price: 429,
                image: "/combo/pizza/bbq.png"
              },
              {
                id: "pz_5",
                name: "Veg Supreme",
                price: 379,
                image: "/combo/pizza/supreme.png"
              },
              {
                id: "pz_6",
                name: "Paneer Overload",
                price: 389,
                image: "/combo/pizza/paneer.png"
              },
              {
                id: "pz_7",
                name: "Mexican Green Wave",
                price: 359,
                image: "/combo/pizza/mexican.png"
              },
              {
                id: "pz_8",
                name: "Cheese Burst",
                price: 419,
                image: "/combo/pizza/cheese-burst.png"
              },
              {
                id: "pz_9",
                name: "Chicken Tikka",
                price: 449,
                image: "/combo/pizza/tikka.png"
              },
              {
                id: "pz_10",
                name: "Hawaiian",
                price: 399,
                image: "/combo/pizza/hawaiian.png"
              }
            ]
          },
          {
            id: "burger",
            title: "Burger",
            items: [
              {
                id: "bg_1",
                name: "Veg Burger",
                price: 149,
                image: "/combo/burger/veg.png"
              },
              {
                id: "bg_2",
                name: "Cheese Burger",
                price: 179,
                image: "/combo/burger/cheese.png"
              },
              {
                id: "bg_3",
                name: "Chicken Burger",
                price: 199,
                image: "/combo/burger/chicken.png"
              },
              {
                id: "bg_4",
                name: "Peri Peri Burger",
                price: 209,
                image: "/combo/burger/peri.png"
              },
              {
                id: "bg_5",
                name: "Paneer Burger",
                price: 189,
                image: "/combo/burger/paneer.png"
              },
              {
                id: "bg_6",
                name: "Double Patty Burger",
                price: 239,
                image: "/combo/burger/double.png"
              },
              {
                id: "bg_7",
                name: "BBQ Chicken Burger",
                price: 219,
                image: "/combo/burger/bbq.png"
              },
              {
                id: "bg_8",
                name: "Crispy Chicken Burger",
                price: 229,
                image: "/combo/burger/crispy.png"
              },
              {
                id: "bg_9",
                name: "Veg Loaded Burger",
                price: 169,
                image: "/combo/burger/loaded.png"
              },
              {
                id: "bg_10",
                name: "Classic Burger",
                price: 159,
                image: "/combo/burger/classic.png"
              }
            ]
          },
          {
            id: "sandwich",
            title: "Sandwich",
            items: [
              {
                id: "sw_1",
                name: "Grilled Sandwich",
                price: 179,
                image: "/combo/sandwich/grilled.png"
              },
              {
                id: "sw_2",
                name: "Club Sandwich",
                price: 219,
                image: "/combo/sandwich/club.png"
              },
              {
                id: "sw_3",
                name: "Veg Sandwich",
                price: 149,
                image: "/combo/sandwich/veg.png"
              },
              {
                id: "sw_4",
                name: "Chicken Sandwich",
                price: 199,
                image: "/combo/sandwich/chicken.png"
              },
              {
                id: "sw_5",
                name: "Paneer Sandwich",
                price: 189,
                image: "/combo/sandwich/paneer.png"
              },
              {
                id: "sw_6",
                name: "Cheese Sandwich",
                price: 169,
                image: "/combo/sandwich/cheese.png"
              },
              {
                id: "sw_7",
                name: "Corn Sandwich",
                price: 159,
                image: "/combo/sandwich/corn.png"
              },
              {
                id: "sw_8",
                name: "Egg Sandwich",
                price: 189,
                image: "/combo/sandwich/egg.png"
              },
              {
                id: "sw_9",
                name: "Tandoori Sandwich",
                price: 209,
                image: "/combo/sandwich/tandoori.png"
              },
              {
                id: "sw_10",
                name: "Mexican Sandwich",
                price: 199,
                image: "/combo/sandwich/mexican.png"
              }
            ]
          }
        ]
      },
      {
        id: "combo_drinks",
        type: "drinks",
        title: "Drinks",
        groups: [
          {
            id: "hot",
            title: "Hot Drinks",
            items: [
              {
                id: "dr_h1",
                name: "Coffee",
                price: 79,
                image: "/combo/drinks/coffee.png"
              },
              {
                id: "dr_h2",
                name: "Tea",
                price: 59,
                image: "/combo/drinks/tea.png"
              },
              {
                id: "dr_h3",
                name: "Hot Chocolate",
                price: 99,
                image: "/combo/drinks/hot-chocolate.png"
              }
            ]
          },
          {
            id: "milkshake",
            title: "Milkshakes",
            items: [
              {
                id: "dr_m1",
                name: "Chocolate Shake",
                price: 149,
                image: "/combo/drinks/chocolate.png"
              },
              {
                id: "dr_m2",
                name: "Strawberry Shake",
                price: 139,
                image: "/combo/drinks/strawberry.png"
              },
              {
                id: "dr_m3",
                name: "Vanilla Shake",
                price: 129,
                image: "/combo/drinks/vanilla.png"
              }
            ]
          },
          {
            id: "cold",
            title: "Cold Drinks",
            items: [
              {
                id: "dr_c1",
                name: "Coke",
                price: 59,
                image: "/combo/drinks/coke.png"
              },
              {
                id: "dr_c2",
                name: "Pepsi",
                price: 59,
                image: "/combo/drinks/pepsi.png"
              },
              {
                id: "dr_c3",
                name: "Sprite",
                price: 59,
                image: "/combo/drinks/sprite.png"
              }
            ]
          }
        ]
      }
    ]
  });

  const onToggleFavourite = (dish) => {
    setFoodData((prev) => {
      const exists = prev.favourites.some(
        (f) => f.id === dish.id
      );

      // REMOVE
      if (exists) {
        return {
          ...prev,
          favourites: prev.favourites.filter(
            (f) => f.id !== dish.id
          )
        };
      }

      // ADD (snapshot, not reference)
      return {
        ...prev,
        favourites: [
          ...prev.favourites,
          {
            ...dish,
            // freeze price at time of favourite
            totalPrice: dish.totalPrice ?? dish.basePrice
          }
        ]
      };
    });
  };


  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("/menu");

        setFoodData({
          categories: res.data.categories || [],
          ingredients: res.data.ingredients || [],
          combo: res.data.combo || [],
          favourites: res.data.favourites || [],
          orders: res.data.orders || []
        });
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
                <Welcome handleNavigate={handleNavigate} users={users} setUsers={setUsers}/>
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
                  orders={orders}
                  setOrders={setOrders}
                />
              </motion.div>

            }
          />

          <Route
            path="/favourites"
            element={
              <motion.div {...motionProps}>
                <FavouriteCategories
                  foodData={foodData}
                  handleBack={handleBack}
                  handleHome={handleHome}
                />
              </motion.div>
            }
          />

          <Route
            path="/favourites/:categoryId"
            element={
              <motion.div {...motionProps}>
                <FavouriteDishList
                  foodData={foodData}
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
