import { useEffect } from "preact/hooks";

/**
 * Custom Preact hook that dynamically draws a beautiful pulsing chartreuse neon
 * lightning bolt favicon in the browser tab using HTML5 Canvas & requestAnimationFrame.
 */
export function useAnimatedFavicon() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Locate or create the favicon link node in DOM head
    let faviconLink = document.querySelector('link[rel*="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.type = "image/png";
      document.head.appendChild(faviconLink);
    }

    // Initialize 32x32 pixel canvas for the high-res favicon matrix
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const render = () => {
      if (!ctx) return;

      // 1. Clear previous canvas frame
      ctx.clearRect(0, 0, 32, 32);

      // 2. Draw dark rounded container box (matches the exact dark background in the request screenshot)
      ctx.fillStyle = "#0f172a"; // Deep luxury slate
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(1, 1, 30, 30, 8);
      } else {
        ctx.rect(1, 1, 30, 30);
      }
      ctx.fill();

      // 3. Dynamic Neon glow wave (Math.sin creates smooth pulsing heartbeat waves)
      const time = Date.now() / 250;
      const pulse = Math.sin(time);
      const glowBlur = 4 + pulse * 2.5; // Oscillates smoothly between 1.5px and 6.5px of neon glow blur

      // Set neon shadow parameters
      ctx.shadowColor = "#84cc16"; // Pulse shadow color (chartreuse green)
      ctx.shadowBlur = glowBlur;

      // Configure hollow lightning stroke styles
      ctx.strokeStyle = "#a3e635"; // Main glowing yellow-green stroke
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // 4. Trace the exact centered lightning bolt geometric path
      ctx.beginPath();
      ctx.moveTo(18, 5);   // Top right peak
      ctx.lineTo(9, 16);   // Middle-left corner
      ctx.lineTo(15, 16);  // Inner indentation
      ctx.lineTo(13, 27);  // Bottom shard tip
      ctx.lineTo(22, 15);  // Middle-right corner
      ctx.lineTo(16, 15);  // Inner indentation
      ctx.closePath();

      // 5. Stroke the path to create a clean, modern "hollow" look
      ctx.stroke();

      // 6. Draw a sharp inner overlay stroke for high legibility at 32x32 size
      ctx.shadowBlur = 0;           // Disable shadow for crisp overlay layer
      ctx.strokeStyle = "#bef264";  // Lighter, higher contrast chartreuse
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 7. Render canvas frame as a Data URL directly into the browser tab favicon link
      faviconLink.href = canvas.toDataURL("image/png");

      // Loop frame using high-efficiency requestAnimationFrame
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up animation thread instantly on unmount to avoid CPU/memory leakage
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}
