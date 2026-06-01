import "./SubCategoryPage.css";
import { useParams, useNavigate } from "react-router-dom";
import homeIcon from "../assets/icons/home.png";

const SubCategoryPage = ({ foodData, handleBack, handleHome }) => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    const category = foodData.categories.find(
        c => c.id === categoryId
    );

    const subCategories = category?.subCategories || [];

    return (
        <div className="food-category">

            <div className="food-grid-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-grid-title">{category?.name}</div>
                <div className="home-btn  home-btn-icon" onClick={handleHome} >
                    <span className="shadow"></span>
                    <span className="edge"></span>
                    <span className="front"><img src={homeIcon} alt="home-btn" /></span>
                </div>
            </div>

            <div className="food-category-container">
                {subCategories.map(sub => (
                    <div
                        key={sub.id}
                        className="food-category-items"
                        onClick={() => navigate(`/foods/${sub.id}/grid`)}
                    >
                        <div className="food-category-image">
                            <img src={sub.image} alt={sub.name} />
                        </div>

                        <div className="food-category-name">
                            {sub.name}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default SubCategoryPage;