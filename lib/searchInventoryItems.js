const searchInventoryItems = (inventoryItems, query) => {
    if (!query || !query.trim()) {
        return [];
    }

    const lowerCaseQuery = query.toLowerCase();
    return inventoryItems.filter(item =>
        item.itemName.toLowerCase().startsWith(lowerCaseQuery)
    );
};

export default searchInventoryItems;