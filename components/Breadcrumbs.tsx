
import React from 'react';
import { ViewMode } from './SiteLayout';

interface BreadcrumbsProps {
    items: { label: string; view?: ViewMode; id?: string }[];
    onNavigate: (view: ViewMode, id?: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center text-xs font-mono text-gray-500 uppercase tracking-widest">
                <li>
                    <a 
                        href="?view=home" 
                        onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                        className="hover:text-neon-blue transition-colors flex items-center gap-2"
                    >
                        <span>⌂</span> COMMAND
                    </a>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <span className="mx-2 text-gray-700">/</span>
                        {item.view ? (
                            <a 
                                href={`?view=${item.view}${item.id ? `&id=${item.id}` : ''}`}
                                onClick={(e) => { e.preventDefault(); item.view && onNavigate(item.view, item.id); }}
                                className={`hover:text-neon-blue transition-colors ${index === items.length - 1 ? 'text-neon-blue font-bold pointer-events-none' : ''}`}
                                aria-current={index === items.length - 1 ? 'page' : undefined}
                            >
                                {item.label}
                            </a>
                        ) : (
                            <span className={`text-neon-blue font-bold ${index === items.length - 1 ? 'text-white' : ''}`}>
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
