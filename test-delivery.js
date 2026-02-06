// Standalone Test for Delivery Logic
// To run: node test-delivery.js

const calculateDeliveryDate = (warehouseZip, targetZip) => {
    if (!targetZip || !warehouseZip) {
        return { days: 7, date: 'in 7 days' };
    }

    const s = warehouseZip.toString().padStart(6, '0');
    const t = targetZip.toString().padStart(6, '0');

    let days = 7;
    let category = "";

    if (s.substring(0, 3) === t.substring(0, 3)) {
        days = 2;
        category = "Local (Same Cluster)";
    } else if (s.substring(0, 2) === t.substring(0, 2)) {
        days = 3;
        category = "Nearby (Same Sub-Zone)";
    } else if (s[0] === t[0]) {
        days = 4;
        category = "Regional (Same Main Zone)";
    } else if (Math.abs(parseInt(s[0]) - parseInt(t[0])) === 1) {
        days = 5;
        category = "Inter-State (Neighboring Zone)";
    } else {
        days = 7;
        category = "National (Distant Region)";
    }

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + days);
    const formattedDate = arrivalDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return { days, date: formattedDate, category };
};

console.log("=== DELIVERY LOGIC TEST SUITE ===");
console.log(`Reference Date (Today): ${new Date().toDateString()}\n`);

const warehouse = "516001"; // Cuddapah, AP (Zone 5)
console.log(`WAREHOUSE LOCATION: ${warehouse} (Andhra Pradesh, Zone 5)\n`);

const testCases = [
    { zip: "516004", name: "Cuddapah Center (Local)" },
    { zip: "518001", name: "Kurnool (Same Sub-Zone)" },
    { zip: "560001", name: "Bangalore (Same Zone)" },
    { zip: "600001", name: "Chennai (Neighboring Zone 6)" },
    { zip: "400001", name: "Mumbai (Neighboring Zone 4)" },
    { zip: "110001", name: "Delhi (Distant Zone 1)" },
    { zip: "700001", name: "Kolkata (Distant Zone 7)" }
];

testCases.forEach(test => {
    const result = calculateDeliveryDate(warehouse, test.zip);
    console.log(`[Test Card] -> ${test.name}`);
    console.log(`Destination ZIP: ${test.zip}`);
    console.log(`Logic Applied  : ${result.category}`);
    console.log(`Days to Deliver: ${result.days} days`);
    console.log(`Arrival Date   : ${result.date}`);
    console.log("-----------------------------------------");
});
