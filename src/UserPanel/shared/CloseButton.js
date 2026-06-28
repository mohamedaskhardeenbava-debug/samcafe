import ButtonFace from "./ButtonFace";
import closeIcon from "../../assets/icons/close.png";

/**
 * CloseButton
 * ----------
 * The recurring "Close" pill used for some pages.
 *
 * Example:
 *   <CloseButton onClick={handleClose} />
 */
const CloseButton = ({ onClick }) => (
  <div className="home-btn home-btn-icon" onClick={onClick} role="button" aria-label="close">
    <ButtonFace frontStyle={{ padding: "6px 9px", backgroundColor: "var(--bg-surface)" }}>
      <img src={closeIcon} alt="close" style={{ width: "16px", height: "16px" }} />
    </ButtonFace>
  </div>
);

export default CloseButton;
