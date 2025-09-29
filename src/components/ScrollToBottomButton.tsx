import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomButtonProps {
  scrollToBottom: () => void;
  isCollapsed: boolean; // sidebar collapsed state
}

const ScrollToBottomButton = ({ scrollToBottom, isCollapsed }: ScrollToBottomButtonProps) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 10) {
        setShowButton(false);
      } else {
        setShowButton(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
  {showButton && (
    <motion.div
      key="scroll-btn"
      initial={{ opacity: 0, y: 40 }} // only on first mount
      animate={{
        opacity: 1,
        y: 0,
        x: isCollapsed ? 0 : 200, // smooth horizontal shift
      }}
      exit={{ opacity: 0, y: 40 }}
      transition={{
        y: { type: "spring", stiffness: 300, damping: 25 },
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.3 },
      }}
      className="fixed bottom-32 sm:bottom-36 z-20 left-1/2 transform -translate-x-1/2"
    >
      <Button
        className="bg-gray-700 text-white shadow-lg rounded-full h-9 w-9"
        onClick={scrollToBottom}
      >
        <ArrowDown className="w-3 h-3 sm:h-4 sm:w-4 text-white" />
      </Button>
    </motion.div>
  )}
</AnimatePresence>

  );
};

export default ScrollToBottomButton;
