import { AppError } from '../../../common/errors/app-error';

interface Coordinates {
    lat: number;
    lng: number;
}

// Helper: Haversine distance formula
function calculateHaversineDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
    const dLon = (coords2.lng - coords1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1.lat * (Math.PI / 180)) *
        Math.cos(coords2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper: Get coordinates from ZIP code (using Zippopotamus.us for India)
async function getZipCoordinates(zipCode: string): Promise<Coordinates> {
    try {
        // Fallback for common ZIPs if API fails or to save requests
        const mocks: Record<string, Coordinates> = {
            '110001': { lat: 28.6333, lng: 77.2167 }, // Delhi
            '400001': { lat: 18.9333, lng: 72.8333 }, // Mumbai
            '560001': { lat: 12.9667, lng: 77.5667 }, // Bangalore
            '600001': { lat: 13.0827, lng: 80.2707 }, // Chennai
            '700001': { lat: 22.5726, lng: 88.3639 }, // Kolkata
        };

        if (mocks[zipCode]) return mocks[zipCode];

        const response = await fetch(`http://api.zippopotam.us/IN/${zipCode}`);
        if (!response.ok) {
            // If API fails, return a random coordinate near India center for demo purposes
            return {
                lat: 20 + Math.random() * 5,
                lng: 78 + Math.random() * 5
            };
        }

        const data = await response.json();
        const place = data.places[0];
        return {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
        };
    } catch (error) {
        console.error('Failed to fetch zip coordinates:', error);
        // Fallback
        return { lat: 20.5937, lng: 78.9629 }; // Center of India
    }
}

// Helper: Get real driving distance using OSRM API
async function calculateRouteDistance(coords1: Coordinates, coords2: Coordinates): Promise<number | null> {
    try {
        // OSRM expects: longitude,latitude;longitude,latitude
        const url = `http://router.project-osrm.org/route/v1/driving/${coords1.lng},${coords1.lat};${coords2.lng},${coords2.lat}?overview=false`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            // OSRM returns distance in meters
            return data.routes[0].distance / 1000;
        }
        return null;
    } catch (error) {
        console.warn('OSRM API failed, falling back to Haversine:', error);
        return null;
    }
}

export async function estimateDelivery(originZip: string, destinationZip: string) {
    const originCoords = await getZipCoordinates(originZip);
    const destinationCoords = await getZipCoordinates(destinationZip);

    // Try to get real driving distance via API first
    let distanceKm = await calculateRouteDistance(originCoords, destinationCoords);

    // Fallback to Haversine if API fails
    if (distanceKm === null) {
        console.log('[ShippingService] Using Haversine fallback distance.');
        distanceKm = calculateHaversineDistance(originCoords, destinationCoords);
    } else {
        console.log(`[ShippingService] Obtained OSRM driving distance: ${distanceKm.toFixed(2)} km`);
    }

    // Estimation Logic:
    // 1 day base processing
    // 1 day per 500km
    // Minimum 2 days, Maximum 7 days
    const addedDays = Math.max(2, Math.min(7, 1 + Math.ceil(distanceKm / 500)));

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + addedDays);

    return {
        distanceKm: Math.round(distanceKm),
        estimatedDate,
        originCoords,
        destinationCoords
    };
}
