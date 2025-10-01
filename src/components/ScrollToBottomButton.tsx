import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomButtonProps {
  scrollToBottom: () => void;
}

const ScrollToBottomButton = ({ scrollToBottom }: ScrollToBottomButtonProps) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setShowButton(scrollTop + windowHeight < documentHeight - 10);
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{
            y: { type: "spring", stiffness: 300, damping: 25 },
            opacity: { duration: 0.3 },
          }}
          className="fixed bottom-32 z-20 left-1/2 transform -translate-x-1/2"
        >
          <Button
            className="bg-gray-200 text-gray-700 hover:bg-gray-600 hover:text-white shadow-md rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottomButton;