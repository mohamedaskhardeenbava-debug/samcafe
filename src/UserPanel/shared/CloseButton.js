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
        <ButtonFace frontStyle={{padding:"6px 9px", backgroundColor:"var(--bg-surface)"}}>
<<<<<<< HEAD
            <img src={closeIcon} alt="home-btn" style={{ width: "16px", height: "16px" }} />
=======
            <img src={closeIcon} alt="close" style={{ width: "16px", height: "16px" }} />
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8
        </ButtonFace>
    </div>
);

export default CloseButton;
