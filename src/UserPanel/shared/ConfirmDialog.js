import { AnimatePresence, motion } from "framer-motion";
<<<<<<< HEAD
=======
import Button3D from "./Button3D";
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8

/**
 * ConfirmDialog
 * -------------
 * Reusable "are you sure?" confirmation overlay used for destructive
 * actions (e.g. removing a favourite, deleting a saved combo).
 *
 * Props:
 *  - open:        whether the dialog is visible
 *  - title:       dialog heading
 *  - message:     node rendered as the body text
 *  - confirmLabel / cancelLabel: button labels (defaults: "Remove" / "Cancel")
 *  - onConfirm:   called when the confirm button is clicked
 *  - onCancel:    called when the cancel button is clicked
 *
 * Example:
 *   <ConfirmDialog
 *     open={showDeleteConfirm}
 *     title="Remove Favourite"
 *     message={<>Are you sure you want to remove <strong>{dishToDelete?.name}</strong>?</>}
 *     onConfirm={confirmDeleteFavourite}
 *     onCancel={() => setShowDeleteConfirm(false)}
 *   />
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) => (
  <AnimatePresence mode="wait">
    {open && (
      <motion.div
        className="confirm-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="confirm-box"
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {title && <h3>{title}</h3>}
          {message && <p>{message}</p>}

<<<<<<< HEAD
          <div className="confirm-actions">
            <button className="confirm-cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="confirm-remove" onClick={onConfirm}>
              {confirmLabel}
            </button>
=======
          <div className="btn-section">
            <Button3D className="btn-3d white" onClick={onCancel}>
              {cancelLabel}
            </Button3D>
            <Button3D className="btn-3d red" onClick={onConfirm}>
              {confirmLabel}
            </Button3D>
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
