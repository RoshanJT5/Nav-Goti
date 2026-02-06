'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Frown, Handshake, Home, RotateCcw } from 'lucide-react';

interface GameOverOverlayProps {
    isWinner: boolean | null; // true = win, false = lose, null = draw
    reason: string;
    onBackToLobby: () => void;
    onPlayAgain?: () => void;
    showPlayAgain?: boolean;
    opponentName?: string;
}

export function GameOverOverlay({
    isWinner,
    reason,
    onBackToLobby,
    onPlayAgain,
    showPlayAgain = false,
    opponentName = 'Opponent'
}: GameOverOverlayProps) {

    // Theme colors based on outcome
    const getTheme = () => {
        if (isWinner === null) {
            // Draw
            return {
                bgGradient: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
                accentColor: '#9ca3af',
                icon: <Handshake className="w-16 h-16 md:w-24 md:h-24" />,
                title: 'DRAW',
                emoji: '🤝'
            };
        } else if (isWinner) {
            // Victory
            return {
                bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #22c55e 50%, #15803d 100%)',
                accentColor: '#fbbf24',
                icon: <Trophy className="w-16 h-16 md:w-24 md:h-24" />,
                title: 'VICTORY!',
                emoji: '🏆'
            };
        } else {
            // Defeat
            return {
                bgGradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #7f1d1d 100%)',
                accentColor: '#f87171',
                icon: <Frown className="w-16 h-16 md:w-24 md:h-24" />,
                title: 'DEFEAT',
                emoji: '😔'
            };
        }
    };

    const theme = getTheme();

    const getReasonText = () => {
        switch (reason) {
            case 'timeout':
                return isWinner ? `${opponentName} ran out of time!` : 'You ran out of time!';
            case 'resign':
                return isWinner ? `${opponentName} resigned!` : 'You resigned.';
            case 'disconnect':
                return isWinner ? `${opponentName} disconnected!` : 'You disconnected.';
            case 'draw':
                return 'Game ended in a draw by mutual agreement.';
            case 'checkmate':
                return isWinner ? 'You captured all opponent pieces!' : 'All your pieces were captured!';
            default:
                return reason || 'Game Over';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            style={{ background: theme.bgGradient }}
        >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full opacity-30"
                        style={{ backgroundColor: theme.accentColor }}
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 500
                        }}
                        animate={{
                            y: -50,
                            transition: {
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className="relative z-10 text-center text-white max-w-md w-full"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                    className="mb-4 flex justify-center"
                    style={{ color: theme.accentColor }}
                >
                    {theme.icon}
                </motion.div>

                {/* Emoji */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-5xl md:text-7xl mb-4"
                >
                    {theme.emoji}
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-6xl font-black mb-2 tracking-wider"
                    style={{
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        color: theme.accentColor
                    }}
                >
                    {theme.title}
                </motion.h1>

                {/* Reason */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg md:text-xl opacity-90 mb-8"
                >
                    {getReasonText()}
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    {showPlayAgain && onPlayAgain && (
                        <Button
                            onClick={onPlayAgain}
                            size="lg"
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Play Again
                        </Button>
                    )}
                    <Button
                        onClick={onBackToLobby}
                        size="lg"
                        className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Lobby
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
