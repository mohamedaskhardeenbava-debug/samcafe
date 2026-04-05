import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import homeIcon from "../assets/icons/home.png";
import "./EventHome.css";

const EventHome = ({ handleBack, handleHome }) => {
  const navigate = useNavigate();

  const options = [
    {
      name: "Table Reservation",
      path: "/events/reservation",
      icon: "/assets/icons/table.png",
      description: "Book your table in advance"
    },
    {
      name: "Birthday / Candle Light",
      path: "/events/celebration",
      icon: "/assets/icons/cake.png",
      description: "Celebrate special moments"
    },
    {
      name: "Pre Booking",
      path: "/events/prebooking",
      icon: "/assets/icons/calendar.png",
      description: "Schedule your visit early"
    },
    {
      name: "Catering Order",
      path: "/events/catering",
      icon: "/assets/icons/catering.png",
      description: "Bulk food for events"
    }
  ];

  return (
    <div className="event-home-page">

      {/* HEADER (same pattern as FoodList) */}
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">Events & Booking</div>
        <div className="home-btn" onClick={handleHome}>
          <img src={homeIcon} alt="home" />
        </div>
      </div>

      {/* HERO TEXT */}
      <div className="event-hero">
        <h2>Plan Your Experience</h2>
        <p>Choose how you want to enjoy your visit</p>
      </div>

      {/* GRID */}
      <div className="event-grid">
        {options.map((opt, index) => (
          <div
            key={opt.name}
            className="event-card"
            onClick={() => navigate(opt.path)}
          >
            <div className="event-icon">
              <img src={opt.icon} alt={opt.name} />
            </div>

            <div className="event-content">
              <h3>{opt.name}</h3>
              <p>{opt.description}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default EventHome;