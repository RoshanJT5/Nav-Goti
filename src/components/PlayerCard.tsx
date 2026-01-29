"use client";

import { motion } from "framer-motion";
import { getTheme } from "@/lib/themes";

interface PlayerCardProps {
    player: {
        name: string;
        color: 'white' | 'black';
        piecesToPlace: number;
        piecesOnBoard: number;
    };
    isActive: boolean;
    position: 'left' | 'right';
    themeId?: string;
}

export function PlayerCard({ player, isActive, position, themeId = 'classic' }: PlayerCardProps) {
    const theme = getTheme(themeId);
    const pieceTheme = player.color === 'white' ? theme.whitePiece : theme.blackPiece;

    return (
        <motion.div
            className="flex flex-col items-center justify-center gap-3 py-4 px-2 rounded-lg transition-all duration-300"
            animate={{
                opacity: isActive ? 1 : 0.8,
                scale: isActive ? 1 : 0.95,
            }}
            style={{
                backgroundColor: isActive ? theme.cardBg : theme.headerBg,
                borderWidth: isActive ? '2px' : '1px',
                borderColor: isActive ? theme.accentColor : theme.lineColor + '20',
                boxShadow: isActive ? `0 0 20px ${theme.accentColor}40` : 'none',
            }}
        >
            {/* Avatar */}
            <motion.div
                className="rounded-full border-2 flex items-center justify-center text-sm font-bold relative"
                animate={{
                    width: isActive ? 56 : 48,
                    height: isActive ? 56 : 48,
                    borderWidth: isActive ? 3 : 2,
                }}
                style={{
                    background: pieceTheme.bg,
                    borderColor: isActive ? theme.accentColor : pieceTheme.border,
                    color: pieceTheme.color,
                    boxShadow: isActive
                        ? `0 0 16px ${theme.accentColor}`
                        : '0 2px 4px rgba(0,0,0,0.2)',
                }}
            >
                {pieceTheme.content}
            </motion.div>

            {/* Name */}
            <div className="flex flex-col items-center gap-1 w-full px-2">
                <motion.div
                    className="font-bold text-center truncate w-full"
                    animate={{
                        fontSize: isActive ? '0.95rem' : '0.875rem',
                    }}
                    style={{
                        color: isActive ? theme.accentColor : theme.textColor,
                        fontWeight: isActive ? 800 : 600,
                    }}
                >
                    {player.name}
                </motion.div>

                {/* Turn Indicator */}
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: theme.accentColor + '20',
                            color: theme.accentColor,
                        }}
                    >
                        YOUR TURN
                    </motion.div>
                )}
            </div>

            {/* Stats */}
            <div className="flex flex-col items-center gap-1 text-center w-full">
                <div
                    className="text-[11px] opacity-70 whitespace-nowrap"
                    style={{ color: theme.textColor }}
                >
                    {player.piecesToPlace} to place
                </div>
                <div
                    className="text-[11px] opacity-70 whitespace-nowrap"
                    style={{ color: theme.textColor }}
                >
                    {player.piecesOnBoard} on board
                </div>
            </div>

            {/* Pulsing Indicator */}
            {isActive && (
                <motion.div
                    className="w-2 h-2 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{ backgroundColor: theme.accentColor }}
                />
            )}
        </motion.div>
    );
}
