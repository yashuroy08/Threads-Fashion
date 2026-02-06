import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import '../styles/breadcrumb.css';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    showHome?: boolean;
}

export default function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
            <ol className="breadcrumb-list">
                {showHome && (
                    <li className="breadcrumb-item home-item">
                        <Link to="/" aria-label="Home" className="breadcrumb-link">
                            <Home size={16} />
                        </Link>
                        <ChevronRight size={14} className="breadcrumb-separator" />
                    </li>
                )}

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={index} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                            {isLast ? (
                                <span aria-current="page" className="breadcrumb-current">
                                    {item.label}
                                </span>
                            ) : (
                                <>
                                    <Link to={item.href || '#'} className="breadcrumb-link">
                                        {item.label}
                                    </Link>
                                    <ChevronRight size={14} className="breadcrumb-separator" />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
