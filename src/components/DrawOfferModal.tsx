'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Handshake, X, Check } from 'lucide-react';

interface DrawOfferModalProps {
    isOpen: boolean;
    offeredByName: string;
    onAccept: () => void;
    onDecline: () => void;
}

export function DrawOfferModal({ isOpen, offeredByName, onAccept, onDecline }: DrawOfferModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700"
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring' }}
                                className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center"
                            >
                                <Handshake className="w-8 h-8 text-amber-400" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-center text-white mb-2">
                            Draw Offered
                        </h2>

                        {/* Message */}
                        <p className="text-gray-300 text-center mb-6">
                            <span className="font-semibold text-amber-400">{offeredByName}</span> is offering a draw.
                            <br />
                            Do you accept?
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Button
                                onClick={onDecline}
                                variant="outline"
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 hover:text-red-300"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Decline
                            </Button>
                            <Button
                                onClick={onAccept}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Accept
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
