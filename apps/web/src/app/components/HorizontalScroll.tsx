"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";

interface Card {
  title: string;
  description: string;
  icon: string;
}

interface HorizontalScrollProps {
  cards: Card[];
}

const HorizontalScroll = ({ cards }: HorizontalScrollProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  const scrollToCard = useCallback((index: number) => {
    if (carouselRef.current && carouselRef.current.children[0]) {
      const firstChild = carouselRef.current.children[0] as HTMLElement;
      const cardWidth = firstChild.offsetWidth + 24;
      carouselRef.current.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  }, []);

  const handleScroll = () => {
    if (carouselRef.current && carouselRef.current.children[0]) {
      const firstChild = carouselRef.current.children[0] as HTMLElement;
      const cardWidth = firstChild.offsetWidth + 24;
      const scrollLeft = carouselRef.current.scrollLeft;
      const newIndex = Math.round(scrollLeft / cardWidth);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
    scrollToCard(newIndex);
  };

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    scrollToCard(newIndex);
  }, [currentIndex, cards.length, scrollToCard]);

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [goToNext]);

  const cardVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    }),
  };

  return (
    <div ref={containerRef} className="relative max-w-6xl mx-auto px-4">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="badge mb-4">Powered by AI</span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          <span className="text-white">Supercharge Your </span>
          <span className="text-gradient">Learning</span>
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Discover our suite of intelligent tools designed to transform how you study
        </p>
      </motion.div>

      {/* Carousel container */}
      <div className="relative">
        {/* Cards */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto px-4 py-4 snap-x snap-mandatory scrollbar-hide"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover={{ scale: 1.02, y: -8 }}
              className="feature-card flex-none w-[300px] md:w-[340px] snap-center cursor-pointer group"
            >
              {/* Icon with glow */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full transform scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative text-5xl md:text-6xl">{card.icon}</div>
              </div>

              {/* Content */}
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-gradient transition-all duration-300">
                {card.title}
              </h3>
              <p className="text-white/60 text-sm md:text-base leading-relaxed">
                {card.description}
              </p>

              {/* Hover indicator */}
              <div className="mt-6 flex items-center text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                Learn more
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation arrows */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 w-12 h-12 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
          aria-label="Previous slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 w-12 h-12 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
          aria-label="Next slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.button>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center mt-8 gap-2">
        {cards.map((_, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollToCard(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-gradient-to-r from-indigo-500 to-cyan-500"
                : "w-2 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HorizontalScroll;
