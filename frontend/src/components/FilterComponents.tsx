import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import '../styles/filters.css';

interface FilterGroupProps {
    title: string;
    isOpen?: boolean;
    children: React.ReactNode;
}

export const FilterGroup = ({ title, isOpen = true, children }: FilterGroupProps) => {
    const [open, setOpen] = useState(isOpen);

    return (
        <div className="filter-section">
            <div className="filter-header" onClick={() => setOpen(!open)}>
                <span>{title}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {open && <div className="filter-content">{children}</div>}
        </div>
    );
};

interface CheckboxFilterProps {
    options: string[];
    selected: string[];
    onChange: (value: string) => void;
}

export const CheckboxFilter = ({ options, selected, onChange }: CheckboxFilterProps) => {
    return (
        <div className="filter-options">
            {options.map((option) => (
                <label key={option} className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => onChange(option)}
                    />
                    <div className="checkbox-custom"></div>
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );
};

interface ColorFilterProps {
    colors: string[];
    selected: string[];
    onChange: (color: string) => void;
}

export const ColorFilter = ({ colors, selected, onChange }: ColorFilterProps) => {
    const colorMap: Record<string, string> = {
        'Black': '#000000',
        'White': '#ffffff',
        'Blue': '#3b82f6',
        'Red': '#ef4444',
        'Green': '#22c55e',
        'Yellow': '#eab308',
        'Grey': '#6b7280',
        'Beige': '#f5f5dc',
        'Brown': '#78350f',
        'Pink': '#ec4899',
        'Navy': '#1e3a8a',
        'Purple': '#a855f7'
    };

    return (
        <div className="color-options">
            {colors.map((color) => {
                const isSelected = selected.includes(color);
                return (
                    <div
                        key={color}
                        className={`filter-color-swatch-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => onChange(color)}
                        title={color}
                    >
                        <div
                            className="filter-color-swatch"
                            style={{ backgroundColor: colorMap[color] || color }}
                        >
                            {isSelected && <Check className="color-check-icon" size={14} style={{ opacity: 0 }} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface PriceRangeFilterProps {
    min: number;
    max: number;
    onChange: (min: number, max: number) => void;
}

export const PriceRangeFilter = ({ min, max, onChange }: PriceRangeFilterProps) => {
    const priceRanges = [
        { label: 'Under ₹2,000', min: 0, max: 200000 },
        { label: '₹2,000 - ₹5,000', min: 200000, max: 500000 },
        { label: '₹5,000 - ₹10,000', min: 500000, max: 1000000 },
        { label: '₹10,000 - ₹20,000', min: 1000000, max: 2000000 },
        { label: 'Above ₹20,000', min: 2000000, max: 100000000 }, // Large max (10 Lakhs)
    ];

    // Local state to track which ranges are checked
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Initialize from props if needed
    useEffect(() => {
        if (!min && !max) {
            setSelectedIndices([]);
            return;
        }

        // Find which ranges match the current min/max (best effort)
        const indices: number[] = [];
        priceRanges.forEach((range, idx) => {
            if (range.min >= (Number(min) || 0) && range.max <= (Number(max) || 1000000)) {
                indices.push(idx);
            }
        });
        setSelectedIndices(indices);
    }, [min, max]);

    const handleToggle = (index: number) => {
        let newIndices;
        if (selectedIndices.includes(index)) {
            newIndices = selectedIndices.filter(i => i !== index);
        } else {
            newIndices = [...selectedIndices, index];
        }
        setSelectedIndices(newIndices);

        if (newIndices.length === 0) {
            onChange(0, 0); // No filter (or reset)
            return;
        }

        // Calculate consolidated min/max
        const selectedRanges = newIndices.map(i => priceRanges[i]);
        const finalMin = Math.min(...selectedRanges.map(r => r.min));
        const finalMax = Math.max(...selectedRanges.map(r => r.max));

        onChange(finalMin, finalMax);
    };

    return (
        <div className="filter-options">
            {priceRanges.map((range, index) => (
                <label key={index} className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={selectedIndices.includes(index)}
                        onChange={() => handleToggle(index)}
                    />
                    <div className="checkbox-custom"></div>
                    <span>{range.label}</span>
                </label>
            ))}
        </div>
    );
};

interface SortOption {
    label: string;
    value: string;
}

interface SortDropdownProps {
    options: SortOption[];
    value: string;
    onChange: (value: string) => void;
}

export const SortDropdown = ({ options, value, onChange }: SortDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.sort-dropdown-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="sort-dropdown-container">
            <div
                className={`sort-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption.label}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="sort-menu">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`sort-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                            {option.value === value && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
