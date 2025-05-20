const mockBarcodePrinter = {
    print: (barcode, itemName) => {
        // In a real application, you would interact with a printer here.
        console.log(`Printing barcode ${barcode} for item: ${itemName}`);
        // Simulate a successful print
        return Promise.resolve({ success: true, message: `Printed barcode ${barcode}` });
    },
};

export default mockBarcodePrinter;