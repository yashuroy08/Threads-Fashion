export interface DeliveryEstimation {
    days: number;
    date: string;
}

/**
 * Amazon-style delivery estimation logic based on distance proxy (PIN zones in India)
 * @param warehouseZip - Six digit PIN code of the warehouse
 * @param targetZip - Six digit PIN code of the delivery address
 * @returns {DeliveryEstimation} - Object containing number of days and the formatted arrival date
 */
export const calculateDeliveryDate = (warehouseZip: string, targetZip: string): DeliveryEstimation => {
    if (!targetZip || !warehouseZip) {
        return { days: 7, date: 'in 7 days' };
    }

    // Clean PIN codes to ensure 6 digits
    const s = warehouseZip.toString().padStart(6, '0');
    const t = targetZip.toString().padStart(6, '0');

    let days = 7;

    // Logic based on India's PIN zone structure (1st digit is Zone, 2nd is sub-zone, 3rd is cluster)
    if (s.substring(0, 3) === t.substring(0, 3)) {
        // Very Close - Same Cluster (Local)
        days = 2;
    } else if (s.substring(0, 2) === t.substring(0, 2)) {
        // Near - Same Sub-Zone
        days = 3;
    } else if (s[0] === t[0]) {
        // Medium - Same Major Zone
        days = 4;
    } else if (Math.abs(parseInt(s[0]) - parseInt(t[0])) === 1) {
        // Neighboring Zones
        days = 5;
    } else {
        // Distant State / Far Region
        days = 7;
    }

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + days);

    const formattedDate = arrivalDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return { days, date: formattedDate };
};
