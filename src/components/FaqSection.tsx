/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: "How is my privacy protected? Where are my files uploaded?",
      answer: "Your files are never uploaded anywhere! Filo works 100% locally on your own computer or phone. All tools—like cutting, rotating, grouping pictures into PDFs, and pulling out text—happen entirely inside your web browser. Your documents never touch the internet or any external servers, meaning your data stays completely private and secure."
    },
    {
      question: "What file formats are supported?",
      answer: "You can add standard image types like PNG, JPG, JPEG, and WebP to turn them into PDFs. To extract text, you can upload standard PDF documents to download them as Plain Text (.txt) files or formatted Markdown (.md) notes (which are great for note-taking apps like Notion or Obsidian)."
    },
    {
      question: "Is there a file size or page limit?",
      answer: "No! Since Filo runs on your own device instead of our servers, we don't have any upload speed limits or file size caps. You can convert files as large as your browser can handle. The speed depends entirely on how fast your device is."
    },
    {
      question: "How does the 'Fit Photo' layout format work?",
      answer: "Normally, files are sized to standard document paper (like A4). If you select 'Fit Photo' page size, the PDF pages will automatically adjust to match the exact shape (proportions) of your images. This ensures your pictures don't get cut off, stretched, or given unexpected white borders."
    },
    {
      question: "Can I extract text from scanned PDFs?",
      answer: "It depends. Filo can extract text if it is selectable (meaning you can highlight it with your cursor). If the PDF is a scan (a picture of text taken with a scanner or phone camera), it doesn't contain actual text data yet. In this case, direct text extraction will be blank, because Filo runs fully offline and does not include OCR (Optical Character Recognition—the technology that reads text inside photos)."
    }
  ];

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-2xl mx-auto pt-10 pb-16 space-y-8 relative z-10 select-none">
      <div className="text-center space-y-2">
        <h2 className="font-brand italic text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Frequently Asked Questions
        </h2>
        <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
          Everything you need to know about Filo's secure local converters.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <div
              key={idx}
              className="border border-stone-200/50 dark:border-stone-800/40 bg-white/30 dark:bg-stone-950/20 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-700"
            >
              <button
                type="button"
                onClick={() => toggleExpand(idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none bg-transparent"
              >
                <span className="font-sans text-xs font-semibold text-stone-800 dark:text-stone-200 pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="text-stone-400 dark:text-stone-500 flex-shrink-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400 border-t border-stone-100/50 dark:border-stone-800/30">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
