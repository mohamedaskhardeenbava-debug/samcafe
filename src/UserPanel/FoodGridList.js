import "./FoodGridList.css";
import { useParams, useNavigate } from "react-router-dom";
import homeIcon from "../assets/icons/home.png";
import { flyToBag } from "./flyToBag";

const FoodGridList = ({ foodData, addToBag, handleBack, handleHome }) => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

let category = foodData.categories.find(c => c.id === categoryId);

if (!category) {
  for (const cat of foodData.categories) {
    const sub = cat.subCategories?.find(s => s.id === categoryId);
    if (sub) {
      category = sub;
      break;
    }
  }
}

if (!category) return null;

    return (
        <div className="food-grid-page">

            <div className="food-grid-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-grid-title">{category.name}</div>
                <div className="home-btn" onClick={handleHome}>
                    <img src={homeIcon} alt="" />
                </div>
            </div>
            <div className="food-grid">
                {(category.dishes || []).map(dish => (
                    <div
                        key={dish.id}
                        className="food-grid-card"
                        onClick={() =>
                            navigate(`/foods/${categoryId}`, {
                                state: { dishId: dish.id }
                            })
                        }
                    >
                        <div className="food-grid-card-image">
                            <img src={dish.image} alt={dish.name} />
                        </div>

                        <div className="grid-info">
                            <div className="grid-name">{dish.name}</div>
                            <div className="grid-price">₹{dish.basePrice}</div>
                        </div>

                        <div
                            className="grid-link"
                        >
                            View dishes →
                        </div>

                        <button
                            className="grid-add-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                const img = e.currentTarget
                                    .closest(".food-grid-card")
                                    .querySelector("img");

                                // 1️⃣ Add placeholder item immediately (text only)
                                addToBag({
                                    id: dish.id,
                                    name: dish.name,
                                    image: dish.image,
                                    categoryId,
                                    quantity: 1,
                                    unitPrice: dish.basePrice,
                                    totalPrice: dish.basePrice,
                                    isCustomized: false,
                                    notes: "",
                                    __pendingImage: true
                                });

                                flyToBag({ imgEl: img, dishId: dish.id });
                            }}
                        >
                            +
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default FoodGridList;