
import React from 'react';
import { ViewMode } from './SiteLayout';

interface BreadcrumbsProps {
    items: { label: string; view?: ViewMode; id?: string }[];
    onNavigate: (view: ViewMode, id?: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
    const getItemPath = (view?: ViewMode, id?: string) => {
        if (!view || view === 'home') return '/';
        if (view === 'game') return id ? `/game/${id}` : '/game/galaxy_miner';
        if (view === 'blog') return id ? `/blog/${id}` : '/blog';
        return `/${view}`;
    };

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center text-xs font-mono text-gray-500 uppercase tracking-widest">
                <li>
                    <a 
                        href="/" 
                        onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                        className="hover:text-neon-blue transition-colors flex items-center gap-2"
                    >
                        <span>⌂</span> COMMAND
                    </a>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const path = getItemPath(item.view, item.id);

                    return (
                        <li key={index} className="flex items-center">
                            <span className="mx-2 text-gray-700">/</span>
                            {item.view && !isLast ? (
                                <a 
                                    href={path}
                                    onClick={(e) => { e.preventDefault(); item.view && onNavigate(item.view, item.id); }}
                                    className="hover:text-neon-blue transition-colors"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <span 
                                    className={`text-neon-blue font-bold ${isLast ? 'text-white' : ''}`}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
