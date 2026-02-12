import { motion, AnimatePresence } from "framer-motion";
import FavouriteCombo from "./FavouriteCombo";

const overlayVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariant = {
  hidden: { y: 60, opacity: 0, scale: 0.96 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    y: 40,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.25 }
  }
};

const FavouriteComboOverlay = ({
  open,
  onClose,
  currentUser,
  setCurrentUser,
  addToBag
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="combo-my-fav-overlay"
          variants={overlayVariant}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="combo-my-fav-modal"
            variants={modalVariant}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="combo-my-fav-header">
              <h3 className="combo-my-fav-title">My Favourite Combos</h3>
              <button
                className="combo-my-fav-close-btn"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            <div className="combo-my-fav-list">
              <FavouriteCombo
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                addToBag={addToBag}
                handleBack={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FavouriteComboOverlay;
