import "./AppetizerBuilder.css";
import { useState } from "react";
import homeIcon from "../assets/icons/home.png";

const AppetizerBuilder = ({ foodData, addToBag, handleBack, handleHome }) => {

    const [selectedSauce, setSelectedSauce] = useState(null);
    const [selectedMain, setSelectedMain] = useState(null);
    const [qty, setQty] = useState(1);

    const appetizerCategory = foodData.categories.find(
        c => c.id === "appetizer"
    );

    const sauces = appetizerCategory?.appetizerSauces || [];
    const mains = appetizerCategory?.appetizerMain || [];

    const finalDish =
        selectedSauce && selectedMain
            ? appetizerCategory?.dishes?.find(
                d => d.id === `${selectedSauce.id}_${selectedMain.id}`
            )
            : null;

    const addDishToBag = () => {
        if (!finalDish) return;

        addToBag({
            id: finalDish.id,
            name: finalDish.name,
            image: finalDish.image,
            quantity: qty,
            unitPrice: finalDish.basePrice,
            totalPrice: finalDish.basePrice * qty,
            categoryId: "appetizer",
            ingredients: finalDish.ingredients,
            isCustomized: false
        });
    };

    return (
        <div className="appetizer-builder">

            <div className="builder-header">
                <button className="back-button" onClick={handleBack} />
                <h2>Build Your Appetizer</h2>
                <div className="home-btn  home-btn-icon" onClick={handleHome} />
            </div>

            <div className="builder-grid">

                {/* SAUCE COLUMN */}
                <div className="appetizer-first-grid">
                    <div className="builder-column">
                        <h3 className="builder-column-header">Sauce</h3>
                        <div className="builder-column-scroll">
                            <div className="builder-column-grid">
                                {sauces.map(sauce => (
                                    <div
                                        key={sauce.id}
                                        className={`builder-item ${selectedSauce?.id === sauce.id ? "active" : ""}`}
                                        onClick={() => setSelectedSauce(sauce)}
                                    >
                                        <div className="builder-item-image">
                                            <img src={sauce.image} alt="" />
                                        </div>
                                        <div className="builder-item-name">{sauce.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* MAIN INGREDIENT */}

                    <div className="builder-column">
                        <h3 className="builder-column-header">Main Ingredient</h3>
                        <div className="builder-column-scroll">
                            <div className="builder-main-column-grid">
                                {mains.map(item => (
                                    <div
                                        key={item.id}
                                        className={`builder-main-item ${selectedMain?.id === item.id ? "active" : ""}`}
                                        onClick={() => setSelectedMain(item)}
                                    >
                                        <div className="builder-main-item-image">
                                            <img src={item.image} alt="" />
                                        </div>
                                        <div className="builder-main-item-name">{item.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* FINAL DISH */}
                <div className="appetizer-last-grid">
                    <div className="final-column">
                        <h3 className="builder-column-header">Your Appetizer</h3>
                        <div className="final-column-scroll">
                            {finalDish ? (
                                <div className="final-card">
                                    <div className="final-image">
                                        <img src={finalDish.image} alt={finalDish.name} />
                                    </div>

                                    <div className="final-name">
                                        {finalDish.name}
                                    </div>

                                    <div className="final-price">
                                        ₹ {finalDish.basePrice}
                                    </div>

                                    <button
                                        className="appetizer-delete-btn"
                                        onClick={() => {
                                            setSelectedSauce(null);
                                            setSelectedMain(null);
                                            setQty(1);
                                        }}
                                    >
                                        Delete
                                    </button>

                                    <button
                                        className="appetizer-add-btn"
                                        onClick={addDishToBag}
                                    >
                                        <span className="shadow" />
                                        <span className="edge" />
                                        <span className="front">Add to Bag</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="final-placeholder">
                                    <div className="placeholder-icon">🍽️</div>
                                    <div className="placeholder-text">
                                        Select a <strong>sauce</strong> and <strong>main ingredient</strong> to build your appetizer
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppetizerBuilder;