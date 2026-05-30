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
      answer: "Filo operates 100% locally in your browser. All operations—including cropping, rotating, compiling PDF documents, and extracting text layers—are executed using client-side JavaScript on your device. Your files never leave your computer or touch a remote server, ensuring absolute confidentiality."
    },
    {
      question: "What file formats are supported?",
      answer: "For compiling PDFs, we support PNG, JPG, JPEG, and WebP images. For text extraction, you can load any standard PDF document to pull out clean Plain Text (.txt) or formatted Markdown (.md) notes."
    },
    {
      question: "Is there a file size or page limit?",
      answer: "Since all conversions run locally on your device, there are no artificial file size, page count, or upload speed limits imposed by us. The processing speed is entirely determined by your browser's capability and device memory."
    },
    {
      question: "How does the 'Fit Photo' layout format work?",
      answer: "By default, the converter is set to A4 with 0 margins, but you can also choose 'Fit Photo' page size. This option dynamically adjusts each PDF page's dimensions to fit the original aspect ratio of your image exactly. This prevents cropping, stretching, or adding unexpected white borders to your files."
    },
    {
      question: "Can I extract text from scanned PDFs?",
      answer: "Filo extracts structured text layers directly from the document layer of PDFs. If a PDF is a scan (consisting entirely of photos without underlying text), you can convert it to images, but direct text extraction will be empty as OCR (Optical Character Recognition) is not running client-side."
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
