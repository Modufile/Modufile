'use client';

/**
 * ToolCard Component (Layer 1: Presentation)
 * 
 * A card representing a single tool in the grid.
 * Follows the design spec: subtle borders, hover lift, icons.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { AnimatedToolIcon } from './AnimatedToolIcon';

interface ToolCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    iconColor?: string;
}

export function ToolCard({
    title,
    description,
    href,
    icon: Icon,
    iconColor = 'var(--brand-primary)',
}: ToolCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link href={href} prefetch={false}>
            <motion.div
                className="
          group flex flex-col p-5
          bg-zinc-900 border border-zinc-800 rounded-lg
          transition-all duration-200 ease-out
          hover:border-zinc-700 hover:bg-zinc-900/80
          cursor-pointer h-full
        "
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                >
                    <Icon className="w-5 h-5" />
                </div>

                <h3 className="text-base font-medium text-zinc-100 mb-1 group-hover:text-white transition-colors">
                    {title}
                </h3>

                <p className="text-sm text-zinc-500 leading-relaxed">
                    {description}
                </p>
            </motion.div>
        </Link>
    );
}
