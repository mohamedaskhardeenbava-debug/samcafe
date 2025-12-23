import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import "./ThankYou.css";

const ThankYou = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 60000); 

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      className="thankyou-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="thankyou-card">
        <h1 className="thankyou-title">Thank You for Your Order!</h1>

        <h5 className="thankyou-message">
          Your order has been successfully placed and is being prepared with
          fresh ingredients and will be delivered to you at <span className="table-number">TABLE NUMBER #07</span><br /> within 
          
          <span className="time"> 15-20 minutes</span>
        </h5>

        <button
          className="order-again-btn"
          onClick={() => navigate("/categories")}
        >
          Order Another
        </button>

        <button
            className="done-btn"
            onClick={() => navigate("/")}
          >
            Thanks
          </button>
      </div>
    </motion.div>
  );
};

export default ThankYou;
