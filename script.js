// Global state variables
let characterName = "Vash the Stampede";
let walletBalance = 2500; // Starting Eurodollars
let isEditingWallet = false;
let tempWalletBalance = walletBalance;
let showCustomAmountInput = false;
let customAmount = '';
let selectedItem = '';
let transactions = [];
let inventory = [];
let alertMessage = '';
let showAlert = false;

// Data for items and their prices
const itemsData = [
    { id: 1, name: "Basic Pistol (Poor)", price: 100, type: "Weapon" },
    { id: 2, name: "Light Armor (Poor)", price: 250, type: "Armor" },
    { id: 3, name: "Medkit", price: 50, type: "Consumable" },
    { id: 4, name: "Cyberdeck (Basic)", price: 1000, type: "Cyberware" },
    { id: 5, name: "Street Drug (Boost)", price: 20, type: "Consumable" },
    { id: 6, name: "Data Chip (Empty)", price: 10, type: "Misc" },
    { id: 7, name: "Heavy Pistol (Poor)", price: 300, type: "Weapon" },
    { id: 8, name: "Assault Rifle (Poor)", price: 750, type: "Weapon" },
    { id: 9, name: "Wired Reflexes (Alpha)", price: 1500, type: "Cyberware" },
    { id: 10, name: "Grapple Gun", price: 120, type: "Gear" },
    { id: 11, name: "Cyberware: Smartgun Link", price: 500, type: "Cyberware" },
    { id: 12, name: "Heavy Melee Weapon (Poor)", price: 100, type: "Weapon" },
    { id: 13, name: "Grenade (EMP)", price: 50, type: "Explosive" },
    { id: 14, name: "Fashionware: Light Tattoo", price: 50, type: "Fashionware" },
    { id: 15, name: "Vehicle: Thorton Galena", price: 10000, type: "Vehicle" },
];

// --- DOM Element References ---
const characterNameDisplay = document.getElementById('character-name-display');
const characterNameInput = document.getElementById('characterNameInput');
const walletBalanceDisplay = document.getElementById('wallet-balance-display');
const walletBalanceInput = document.getElementById('wallet-balance-input');
const editWalletButton = document.getElementById('edit-wallet-button');
const saveWalletButton = document.getElementById('save-wallet-button');
const cancelWalletButton = document.getElementById('cancel-wallet-button');
const toggleCustomAmountButton = document.getElementById('toggle-custom-amount-button');
const customAmountControls = document.getElementById('custom-amount-controls');
const customAmountInput = document.getElementById('custom-amount-input');
const addCustomAmountButton = document.getElementById('add-custom-amount-button');
const subtractCustomAmountButton = document.getElementById('subtract-custom-amount-button');
const itemSelect = document.getElementById('item-select');
const purchaseItemButton = document.getElementById('purchase-item-button');
const receiveFundsButton = document.getElementById('receive-funds-button');
const inventoryList = document.getElementById('inventory-list');
const emptyInventoryMessage = document.getElementById('empty-inventory-message');
const transactionHistoryList = document.getElementById('transaction-history-list');
const emptyTransactionsMessage = document.getElementById('empty-transactions-message');
const itemsPricingList = document.getElementById('items-pricing-list');
const customAlertDialog = document.getElementById('custom-alert');

// --- Helper Functions ---

// Function to show custom alert message
function showCustomAlert(message) {
    alertMessage = message;
    showAlert = true;
    customAlertDialog.textContent = alertMessage;
    customAlertDialog.classList.remove('hidden');
    customAlertDialog.style.opacity = '0'; // Reset opacity for animation
    customAlertDialog.style.animation = 'none'; // Reset animation
    customAlertDialog.offsetHeight; // Trigger reflow
    customAlertDialog.style.animation = null; // Re-enable animation
    customAlertDialog.style.animation = 'fadeInOut 3s forwards';

    setTimeout(() => {
        showAlert = false;
        alertMessage = '';
        customAlertDialog.classList.add('hidden');
    }, 3000); // Hide after 3 seconds
}

// Function to update the UI based on current state
function updateUI() {
    // Update Character Name
    characterNameDisplay.textContent = characterName;
    characterNameInput.value = characterName;

    // Update Wallet Balance Display
    walletBalanceDisplay.textContent = `€$ ${walletBalance.toLocaleString()}`;
    walletBalanceInput.value = walletBalance;

    // Toggle Wallet Edit Mode UI
    if (isEditingWallet) {
        walletBalanceDisplay.classList.add('hidden');
        walletBalanceInput.classList.remove('hidden');
        editWalletButton.classList.add('hidden');
        saveWalletButton.classList.remove('hidden');
        cancelWalletButton.classList.remove('hidden');
    } else {
        walletBalanceDisplay.classList.remove('hidden');
        walletBalanceInput.classList.add('hidden');
        editWalletButton.classList.remove('hidden');
        saveWalletButton.classList.add('hidden');
        cancelWalletButton.classList.add('hidden');
    }

    // Toggle Custom Amount Input UI
    if (showCustomAmountInput) {
        customAmountControls.classList.remove('hidden');
        toggleCustomAmountButton.textContent = "Hide Custom Amount";
    } else {
        customAmountControls.classList.add('hidden');
        toggleCustomAmountButton.textContent = "Add/Subtract Custom Amount";
        customAmountInput.value = ''; // Clear input when hidden
    }
    customAmountInput.value = customAmount; // Keep input value updated

    // Populate Item Selection Dropdown (if not already populated)
    if (itemSelect.options.length === 0 || itemSelect.options.length !== itemsData.length) {
        itemSelect.innerHTML = ''; // Clear existing options
        itemsData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (€$ ${item.price.toLocaleString()})`;
            itemSelect.appendChild(option);
        });
        if (itemsData.length > 0) {
            selectedItem = itemsData[0].id.toString(); // Set default selected item
            itemSelect.value = selectedItem;
        }
    } else {
        itemSelect.value = selectedItem; // Ensure selected value is correct
    }


    // Render Inventory
    inventoryList.innerHTML = ''; // Clear current inventory display
    if (inventory.length === 0) {
        emptyInventoryMessage.classList.remove('hidden');
    } else {
        emptyInventoryMessage.classList.add('hidden');
        inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "flex flex-col sm:flex-row justify-between items-center p-2 mb-1 rounded-md bg-gray-700 border border-gray-600";
            itemDiv.innerHTML = `
                <div class="flex-grow text-gray-200 text-sm md:text-base mb-2 sm:mb-0">
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-xs text-gray-400">Type: ${item.type} | Price: €$ ${item.price.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-2">
                    <label for="qty-${item.id}" class="text-gray-400 text-sm">Qty:</label>
                    <input
                        id="qty-${item.id}"
                        type="number"
                        value="${item.quantity}"
                        min="0"
                        class="input-field w-16 text-center text-sm"
                    />
                    <button data-item-id="${item.id}" class="cyber-button use-item-button px-3 py-1 text-xs">Use</button>
                    <button data-item-id="${item.id}" class="cyber-button-sell sell-inventory-item-button px-3 py-1 text-xs">Sell</button>
                </div>
            `;
            inventoryList.appendChild(itemDiv);

            // Add event listeners for quantity input, use, and sell buttons
            itemDiv.querySelector(`#qty-${item.id}`).addEventListener('change', (e) => handleInventoryQuantityChange(item.id, e.target.value));
            itemDiv.querySelector('.use-item-button').addEventListener('click', () => handleUseItem(item.id));
            itemDiv.querySelector('.sell-inventory-item-button').addEventListener('click', () => handleSellInventoryItem(item.id));
        });
    }

    // Render Transaction History
    transactionHistoryList.innerHTML = ''; // Clear current transaction display
    if (transactions.length === 0) {
        emptyTransactionsMessage.classList.remove('hidden');
    } else {
        emptyTransactionsMessage.classList.add('hidden');
        // Display latest transactions first
        transactions.slice().reverse().forEach(transaction => {
            const transactionDiv = document.createElement('div');
            const isNegative = transaction.type.includes("Purchased") || transaction.type.includes("Subtracted") || (transaction.type.includes("Wallet Edited") && transaction.amount < 0);
            transactionDiv.className = `flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 mb-1 rounded-md ${
                isNegative ? "bg-red-900 bg-opacity-30 border border-red-700" : "bg-green-900 bg-opacity-30 border border-green-700"
            }`;
            const amountText = transaction.amount !== 0 ?
                `<span class="font-mono font-bold text-right sm:text-left ${isNegative ? "text-red-400" : "text-green-400"}">
                    ${transaction.amount > 0 ? "+" : ""}€$ ${transaction.amount.toLocaleString()}
                </span>` : '';

            transactionDiv.innerHTML = `
                <span class="text-gray-200 text-sm md:text-base">
                    ${transaction.timestamp} - ${transaction.type}: ${transaction.name}
                </span>
                ${amountText}
            `;
            transactionHistoryList.appendChild(transactionDiv);
        });
    }

    // Render Items & Pricing List
    itemsPricingList.innerHTML = ''; // Clear current display
    itemsData.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "bg-gray-800 p-4 rounded-md border border-gray-600 flex justify-between items-center";
        itemDiv.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-gray-200">${item.name}</p>
                <p class="text-sm text-gray-400">Type: ${item.type}</p>
            </div>
            <span class="text-xl font-mono text-green-400">€$ ${item.price.toLocaleString()}</span>
        `;
        itemsPricingList.appendChild(itemDiv);
    });
}

// --- Event Handlers ---

function handlePurchase() {
    const item = itemsData.find(i => i.id.toString() === selectedItem);
    if (item) {
        if (walletBalance >= item.price) {
            walletBalance -= item.price;

            const existingItemIndex = inventory.findIndex(invItem => invItem.id === item.id);
            if (existingItemIndex > -1) {
                inventory[existingItemIndex].quantity += 1;
            } else {
                inventory.push({ ...item, quantity: 1 });
            }

            transactions.push({
                type: "Purchased",
                name: item.name,
                amount: item.price,
                timestamp: new Date().toLocaleString()
            });
            showCustomAlert(`Purchased ${item.name} for €$ ${item.price.toLocaleString()}`);
            updateUI();
        } else {
            showCustomAlert("Insufficient Eurodollars to purchase this item!");
        }
    }
}

function handleReceiveFunds() {
    const item = itemsData.find(i => i.id.toString() === selectedItem);
    if (item) {
        walletBalance += item.price;
        transactions.push({
            type: "Received Funds (Item Value)",
            name: item.name,
            amount: item.price,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Received €$ ${item.price.toLocaleString()} for ${item.name}`);
        updateUI();
    }
}

function handleUseItem(itemId) {
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex > -1 && inventory[itemIndex].quantity > 0) {
        const usedItem = inventory[itemIndex];
        inventory[itemIndex].quantity -= 1;
        if (inventory[itemIndex].quantity === 0) {
            inventory.splice(itemIndex, 1); // Remove if quantity drops to 0
        }

        transactions.push({
            type: "Used Item",
            name: usedItem.name,
            amount: 0,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Used one ${usedItem.name}`);
        updateUI();
    }
}

function handleSellInventoryItem(itemId) {
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex > -1 && inventory[itemIndex].quantity > 0) {
        const soldItem = inventory[itemIndex];
        walletBalance += soldItem.price;
        inventory[itemIndex].quantity -= 1;
        if (inventory[itemIndex].quantity === 0) {
            inventory.splice(itemIndex, 1); // Remove if quantity drops to 0
        }

        transactions.push({
            type: "Sold Item",
            name: soldItem.name,
            amount: soldItem.price,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Sold one ${soldItem.name} for €$ ${soldItem.price.toLocaleString()}`);
        updateUI();
    }
}

function handleInventoryQuantityChange(itemId, newQuantity) {
    const quantity = parseInt(newQuantity, 10);
    const itemIndex = inventory.findIndex(item => item.id === itemId);

    if (itemIndex > -1 && !isNaN(quantity) && quantity >= 0) {
        inventory[itemIndex].quantity = quantity;
        if (inventory[itemIndex].quantity === 0) {
            inventory.splice(itemIndex, 1); // Remove if quantity becomes 0
        }
        updateUI();
    }
}

function toggleEditWallet() {
    isEditingWallet = !isEditingWallet;
    if (isEditingWallet) {
        tempWalletBalance = walletBalance; // Set temp to current when entering edit mode
        walletBalanceInput.value = tempWalletBalance;
    }
    updateUI();
}

function saveWalletBalance() {
    const newBalance = parseInt(walletBalanceInput.value, 10);
    if (!isNaN(newBalance)) {
        const amountDifference = newBalance - walletBalance;
        walletBalance = newBalance;
        transactions.push({
            type: "Wallet Edited",
            name: "Direct adjustment",
            amount: amountDifference,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Wallet balance updated to €$ ${newBalance.toLocaleString()}`);
    } else {
        showCustomAlert("Invalid amount entered for wallet balance.");
    }
    isEditingWallet = false;
    updateUI();
}

function cancelEditWallet() {
    isEditingWallet = false;
    updateUI();
}

function handleCustomAmountInputChange(e) {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
        customAmount = value;
    }
}

function addCustomAmount() {
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) {
        walletBalance += amount;
        transactions.push({
            type: "Added Custom Funds",
            name: "Direct deposit",
            amount: amount,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Added €$ ${amount.toLocaleString()} to wallet.`);
        customAmount = '';
        showCustomAmountInput = false;
        updateUI();
    } else {
        showCustomAlert("Please enter a valid positive amount to add.");
    }
}

function subtractCustomAmount() {
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) {
        walletBalance -= amount;
        transactions.push({
            type: "Subtracted Custom Funds",
            name: "Direct withdrawal",
            amount: -amount,
            timestamp: new Date().toLocaleString()
        });
        showCustomAlert(`Subtracted €$ ${amount.toLocaleString()} from wallet.`);
        customAmount = '';
        showCustomAmountInput = false;
        updateUI();
    } else {
        showCustomAlert("Please enter a valid positive amount to subtract.");
    }
}

// --- Initialization ---

// Function to set up all event listeners
function setupEventListeners() {
    characterNameInput.addEventListener('input', (e) => {
        characterName = e.target.value;
        updateUI(); // Only update the display, not necessarily re-render everything
    });

    editWalletButton.addEventListener('click', toggleEditWallet);
    saveWalletButton.addEventListener('click', saveWalletBalance);
    cancelWalletButton.addEventListener('click', cancelEditWallet);
    walletBalanceInput.addEventListener('input', (e) => {
        tempWalletBalance = e.target.value;
    });

    toggleCustomAmountButton.addEventListener('click', () => {
        showCustomAmountInput = !showCustomAmountInput;
        updateUI();
    });
    customAmountInput.addEventListener('input', handleCustomAmountInputChange);
    addCustomAmountButton.addEventListener('click', addCustomAmount);
    subtractCustomAmountButton.addEventListener('click', subtractCustomAmount);

    itemSelect.addEventListener('change', (e) => {
        selectedItem = e.target.value;
    });
    purchaseItemButton.addEventListener('click', handlePurchase);
    receiveFundsButton.addEventListener('click', handleReceiveFunds);

    // Initial population of item select
    if (itemsData.length > 0) {
        selectedItem = itemsData[0].id.toString();
    }
}

// Run on window load
window.onload = function() {
    setupEventListeners();
    updateUI(); // Initial render of the UI
};