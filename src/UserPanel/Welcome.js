import "./Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Welcome = () => {
  const navigate = useNavigate();

  const goToCategories = () => {
    navigate("/categories", {
      state: { direction: "forward" }
    });
  };

  return (
    <div className="welcome-page">
      <ThemeToggle />

      <div className="welcome-container">
        <div className="welcome-text">Welcome to</div>

        <div className="welcome-title">
          <img src={logo} alt="Cafe" />
        </div>

        <div className="welcome-slogan">
          Where every bite feels right
        </div>

        <div className="welcome-cta">
          <button
            className="cta-button"
            onClick={goToCategories}
          >
            Explore Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
