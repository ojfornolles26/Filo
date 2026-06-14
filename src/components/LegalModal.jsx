/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle } from 'lucide-react';

export default function LegalModal({ type, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [type]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isPrivacy = type === 'privacy';

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          key="legal-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0c0a09]/45 dark:bg-[#0c0a09]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="legal-modal-content"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#f7f5f0] dark:bg-[#0c0a09] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden"
          >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200/50 dark:border-stone-800/40 flex items-center justify-between shrink-0 bg-white/40 dark:bg-stone-950/20 backdrop-blur-md">
            <div className="flex items-center">
              <h2 className="font-sans text-sm md:text-base font-bold text-stone-900 dark:text-stone-100">
                {isPrivacy ? 'Privacy Policy & Guarantees' : 'Terms of Service'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/40 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Contents */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
            
            {isPrivacy ? (
              /* Privacy Policy Text Block */
              <div className="space-y-5 font-sans text-xs md:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">1. Absolute Data Ownership</h3>
                  <p>
                    Filo operates as a static, local-first utility workspace. Because of this architecture, your input documents, images, metadata, and final compiled assets are handled solely in-memory within your browser. **We never see, collect, or store your documents.**
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">2. What Information We (Don't) Collect</h3>
                  <ul className="list-disc list-inside pl-1.5 space-y-1.5">
                    <li>
                      <strong className="text-stone-800 dark:text-stone-300">No Document Uploads:</strong> When you drag or add images or PDFs into the workspace queue, they remain on your filesystem or in temporary local blob memories.
                    </li>
                    <li>
                      <strong className="text-stone-800 dark:text-stone-300">No Remote Services or APIs:</strong> We do not forward your data to third-party APIs. Everything is compiled using local libraries.
                    </li>
                    <li>
                      <strong className="text-stone-800 dark:text-stone-300">No Telemetry or Tracking:</strong> There are no advertising trackers, analytical cookies, or diagnostic logs active.
                    </li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">3. Local Browser Storage</h3>
                  <p>
                    Filo uses the browser's standard <code className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900 rounded font-mono text-[10px] text-stone-700 dark:text-stone-300">localStorage</code> interface to persist a single state item:
                  </p>
                  <ul className="list-disc list-inside pl-1.5 space-y-1.5">
                    <li>
                      <code className="text-stone-800 dark:text-stone-300 font-mono text-[11px]">filo-theme</code>: Stores your theme layout choice (<code className="font-mono text-[10px]">"light"</code> or <code className="font-mono text-[10px]">"dark"</code>) to prevent visual flashes on reloading.
                    </li>
                  </ul>
                  <p>
                    No personal details or file metrics are written to storage. You can purge this setting at any time by clearing your browser cache.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">4. External Integrations</h3>
                  <p>
                    Our tool works offline once loaded. If you disconnect your internet connection entirely, the converters will continue functioning identically, validating the client-only promise.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">5. Changes to This Policy</h3>
                  <p>
                    Since the code runs server-free, any future changes to this policy will only accompany direct source modifications loaded onto this web page. We will never introduce silent remote-upload trackers in future patches.
                  </p>
                </section>
              </div>
            ) : (
              /* Terms of Service Text Block */
              <div className="space-y-5 font-sans text-xs md:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">1. Agreement & Client-Side Sandbox</h3>
                  <p>
                    By using Filo, you agree to execute the provided converter code locally on your personal device. Because processing is executed strictly on your processor, you are responsible for maintaining your device security and ensuring your files are safe.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">2. Acceptable Use License</h3>
                  <p>
                    You are granted a perpetual, free, non-transferable, and non-exclusive license to use Filo for personal, commercial, or institutional document processing. You may crop, orient, compress, and extract notes as needed.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">3. Serverless Limitation of Liability</h3>
                  <p>
                    Because Filo operates without uploading your files, we do not inspect, correct, or store backups of your documents:
                  </p>
                  <ul className="list-disc list-inside pl-1.5 space-y-1.5">
                    <li>
                      We are not liable for any temporary loss of files or data corruption that might occur during conversion processing inside your browser.
                    </li>
                    <li>
                      You are advised to always keep original copies of your images and PDFs before importing them.
                    </li>
                    <li>
                      The application is provided "AS-IS" and "AS-AVAILABLE" without warranties of any kind, express or implied.
                    </li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">4. Prohibited Actions</h3>
                  <p>
                    You agree not to reverse-engineer, frame, or clone this website to inject malicious remote file-harvesting scripts under our name.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-stone-800 dark:text-stone-200 font-bold">5. Governing Law</h3>
                  <p>
                    These terms are governed by standard internet utility regulations. If you host or run this code locally from its source repository, you assume full governance over its execution on your hardware.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-end shrink-0 bg-white/40 dark:bg-stone-950/20 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400 font-sans text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-0 focus-visible:outline-none"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Acknowledge & Close</span>
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
