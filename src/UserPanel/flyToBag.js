export const flyToBag = ({ imgEl, dishId, customizationKey = "" }) => {
    if (!imgEl || !dishId) return;

    const animateParabolicToTarget = (imgEl, targetEl) => {
        const imgRect = imgEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const clone = imgEl.cloneNode(true);
        clone.className = "fly-img";
        clone.style.zIndex = 1000;

        clone.style.width = imgRect.width + "px";
        clone.style.height = imgRect.height + "px";
        clone.style.left = imgRect.left + "px";
        clone.style.top = imgRect.top + "px";
        clone.style.transform = "translate3d(0,0,0) scale(1.2)";

        document.body.appendChild(clone);

        const startCX = imgRect.left + imgRect.width / 2;
        const startCY = imgRect.top + imgRect.height / 2;
        const endCX = targetRect.left + targetRect.width / 2;
        const endCY = targetRect.top + targetRect.height / 2;

        const dx = endCX - startCX;
        const dy = endCY - startCY;

        const duration = 900;
        const startTime = performance.now();
        const peak = Math.min(0, dy) - 180;

        const animate = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 4);

            const startScale = 1.2;
            const endScale = targetRect.width / imgRect.width;
            const scale = startScale + (endScale - startScale) * ease;

            const x = dx * ease;
            const y =
                (1 - ease) * (1 - ease) * 0 +
                2 * (1 - ease) * ease * peak +
                ease * ease * dy;

            clone.style.transform = `
        translate3d(${x}px, ${y}px, 0)
        scale(${scale})
      `;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                clone.remove();
                targetEl.classList.remove("pending-img");
                targetEl.classList.add("visible-img");
            }
        };

        requestAnimationFrame(animate);
    };

    // 🔍 DESTINATION RESOLUTION
    const sheetOpen = document.querySelector(".bag-sheet");

    if (sheetOpen) {
        const waitForRow = () => {
            const row = document.querySelector(
                customizationKey
                    ? `.bag-item-row[data-dish-id="${dishId}"][data-custom-key="${customizationKey}"]`
                    : `.bag-item-row[data-dish-id="${dishId}"]`
            );

            if (row) {
                const container = document.getElementById("bag-items-container");
                if (container) {
                    row.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest"
                    });
                }
            }

            if (!row) {
                requestAnimationFrame(waitForRow);
                return;
            }

            const imgInRow = row.querySelector("img");
            if (!imgInRow) return;

            animateParabolicToTarget(imgEl, imgInRow);
        };

        waitForRow();
        return;
    }

    const bagBtn = document.getElementById("floating-bag-btn");
    if (bagBtn) {
        animateParabolicToTarget(imgEl, bagBtn);
    }
};