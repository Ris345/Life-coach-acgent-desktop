import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    variant?: 'default' | 'featured' | 'subtle';
}

export function GlassCard({
    children,
    className = '',
    hoverEffect = true,
    variant = 'default'
}: GlassCardProps) {

    const baseStyles = "relative rounded-2xl backdrop-blur-md border transition-all duration-300 overflow-hidden";

    const variants = {
        default: "bg-white/5 border-white/10",
        featured: "bg-gradient-to-br from-white/10 to-white/5 border-white/20 shadow-lg",
        subtle: "bg-white/5 border-transparent hover:border-white/10"
    };

    const hoverStyles = hoverEffect
        ? "hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 group"
        : "";

    return (
        <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
            {/* Inner Shine Effect */}
            {hoverEffect && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
