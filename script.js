// Ensure Firebase services are available globally from index.html script
const db = window.db;
const auth = window.auth;
const { collection, addDoc, doc, getDoc } = firebase.firestore;
const { signInAnonymously } = firebase.auth;


document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const characterNameDisplay = document.getElementById('character-name-display');
    const characterNameInput = document.getElementById('character-name-input');
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    const editWalletButton = document.getElementById('edit-wallet-button');
    const editWalletControls = document.getElementById('edit-wallet-controls');
    const tempWalletBalanceInput = document.getElementById('temp-wallet-balance-input');
    const saveWalletButton = document.getElementById('save-wallet-button');
    const cancelEditWalletButton = document.getElementById('cancel-edit-wallet-button');
    const toggleCustomAmountButton = document.getElementById('toggle-custom-amount-button');
    const customAmountControls = document.getElementById('custom-amount-controls');
    const customAmountInput = document.getElementById('custom-amount-input');
    const addCustomAmountButton = document.getElementById('add-custom-amount-button');
    const subtractCustomAmountButton = document.getElementById('subtract-custom-amount-button');
    const itemSelect = document.getElementById('item-select');
    const purchaseButton = document.getElementById('purchase-button');
    const receiveFundsButton = document.getElementById('receive-funds-button');
    const inventoryList = document.getElementById('inventory-list');
    const emptyInventoryMessage = document.getElementById('empty-inventory-message');
    const transactionHistory = document.getElementById('transaction-history');
    const emptyTransactionsMessage = document.getElementById('empty-transactions-message');
    const itemListDisplay = document.getElementById('item-list-display');
    const customAlert = document.getElementById('custom-alert');

    // Character Image Elements
    const characterImage = document.getElementById('character-image');
    const imageFileInput = document.getElementById('image-file-input');
    const changeImageButton = document.getElementById('change-image-button');

    // Share Modal Elements
    const shareLogButton = document.getElementById('share-log-button');
    const shareModal = document.getElementById('share-modal');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkButton = document.getElementById('copy-share-link-button');
    const closeModalButton = shareModal.querySelector('.close-button');
    const readOnlyMessage = document.getElementById('read-only-message');


    // --- Data (initialized from localStorage or defaults) ---
    let characterName = localStorage.getItem('characterName') || "Vash the Stampede";
    let walletBalance = parseInt(localStorage.getItem('walletBalance') || 2500);
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    let currentCharacterImage = localStorage.getItem('characterImage') || "https://placehold.co/192x192/000000/FFFFFF?text=CHIP";

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

    let isReadOnlyMode = false; // Flag for read-only mode

    // --- Helper Functions ---

    function saveState() {
        localStorage.setItem('characterName', characterName);
        localStorage.setItem('walletBalance', walletBalance);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('characterImage', currentCharacterImage);
    }

    function updateUI() {
        characterNameDisplay.textContent = characterName;
        characterNameInput.value = characterName;
        walletBalanceDisplay.textContent = `€$ ${walletBalance.toLocaleString()}`;
        characterImage.src = currentCharacterImage;
        renderInventory();
        renderTransactions();
        renderItemsList();

        // Apply read-only mode if active
        if (isReadOnlyMode) {
            document.body.classList.add('read-only-mode');
            readOnlyMessage.classList.remove('hidden');
        } else {
            document.body.classList.remove('read-only-mode');
            readOnlyMessage.classList.add('hidden');
        }
    }

    function showCustomAlert(message) {
        customAlert.textContent = message;
        customAlert.classList.remove('hidden');
        customAlert.style.opacity = '0'; // Reset opacity for animation
        customAlert.style.animation = 'none'; // Reset animation
        customAlert.offsetHeight; // Trigger reflow
        customAlert.style.animation = null; // Re-enable animation
        customAlert.style.animation = 'fadeInOut 3s forwards';

        setTimeout(() => {
            customAlert.classList.add('hidden');
        }, 3000); // Hide after 3 seconds
    }

    function renderInventory() {
        inventoryList.innerHTML = ''; // Clear existing
        if (inventory.length === 0) {
            emptyInventoryMessage.classList.remove('hidden');
        } else {
            emptyInventoryMessage.classList.add('hidden');
            inventory.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex flex-col sm:flex-row justify-between items-center p-2 mb-1 rounded-md bg-gray-700 border border-gray-600';
                itemDiv.innerHTML = `
                    <div class="flex-grow text-gray-200 text-sm md:text-base mb-2 sm:mb-0">
                        <p class="font-semibold">${item.name}</p>
                        <p class="text-xs text-gray-400">Type: ${item.type} | Price: €$ ${item.price.toLocaleString()}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="qty-${item.id}" class="text-gray-400 text-sm">Qty:</label>
                        <input
                            type="number"
                            id="qty-${item.id}"
                            value="${item.quantity}"
                            min="0"
                            class="input-field w-16 text-center text-sm inventory-qty-input"
                            data-item-id="${item.id}"
                            ${isReadOnlyMode ? 'disabled' : ''}
                        />
                        <button class="cyber-button px-3 py-1 text-xs use-item-button" data-item-id="${item.id}" ${isReadOnlyMode ? 'disabled' : ''}>Use</button>
                        <button class="cyber-button-sell px-3 py-1 text-xs sell-item-button" data-item-id="${item.id}" ${isReadOnlyMode ? 'disabled' : ''}>Sell</button>
                    </div>
                `;
                inventoryList.appendChild(itemDiv);
            });
            // Add event listeners for new buttons/inputs (only if not in read-only mode)
            if (!isReadOnlyMode) {
                inventoryList.querySelectorAll('.use-item-button').forEach(button => {
                    button.addEventListener('click', (e) => handleUseItem(parseInt(e.target.dataset.itemId)));
                });
                inventoryList.querySelectorAll('.sell-item-button').forEach(button => {
                    button.addEventListener('click', (e) => handleSellInventoryItem(parseInt(e.target.dataset.itemId)));
                });
                inventoryList.querySelectorAll('.inventory-qty-input').forEach(input => {
                    input.addEventListener('change', (e) => handleInventoryQuantityChange(parseInt(e.target.dataset.itemId), e.target.value));
                });
            }
        }
    }

    function renderTransactions() {
        transactionHistory.innerHTML = ''; // Clear existing
        if (transactions.length === 0) {
            emptyTransactionsMessage.classList.remove('hidden');
        } else {
            emptyTransactionsMessage.classList.add('hidden');
            // Reverse to show latest first
            transactions.slice().reverse().forEach(transaction => {
                const transactionDiv = document.createElement('div');
                const isNegative = transaction.type.includes("Purchased") || transaction.type.includes("Subtracted") || (transaction.type.includes("Wallet Edited") && transaction.amount < 0);
                transactionDiv.className = `flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 mb-1 rounded-md ${
                    isNegative ? "bg-red-900 bg-opacity-30 border border-red-700" : "bg-green-900 bg-opacity-30 border border-green-700"
                }`;
                transactionDiv.innerHTML = `
                    <span class="text-gray-200 text-sm md:text-base">
                        ${transaction.timestamp} - ${transaction.type}: ${transaction.name}
                    </span>
                    ${transaction.amount !== 0 ? `
                    <span class="font-mono font-bold text-right sm:text-left ${isNegative ? "text-red-400" : "text-green-400"}">
                        ${transaction.amount > 0 ? "+" : ""}€$ ${transaction.amount.toLocaleString()}
                    </span>` : ''}
                `;
                transactionHistory.appendChild(transactionDiv);
            });
        }
    }

    function renderItemsList() {
        itemListDisplay.innerHTML = ''; // Clear existing
        itemsData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-gray-800 p-4 rounded-md border border-gray-600 flex justify-between items-center';
            itemDiv.innerHTML = `
                <div>
                    <p class="text-lg font-semibold text-gray-200">${item.name}</p>
                    <p class="text-sm text-gray-400">Type: ${item.type}</p>
                </div>
                <span class="text-xl font-mono text-green-400">€$ ${item.price.toLocaleString()}</span>
            `;
            itemListDisplay.appendChild(itemDiv);
        });
    }

    function populateItemSelect() {
        itemSelect.innerHTML = ''; // Clear existing options
        itemsData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (€$ ${item.price.toLocaleString()})`;
            itemSelect.appendChild(option);
        });
        // Set initial selected item if not already set
        if (itemSelect.value === '' && itemsData.length > 0) {
            itemSelect.value = itemsData[0].id;
        }
        itemSelect.disabled = isReadOnlyMode; // Disable if read-only
    }

    // --- Event Handlers ---

    // Only attach event listeners if not in read-only mode
    if (!isReadOnlyMode) {
        characterNameInput.addEventListener('input', (e) => {
            characterName = e.target.value;
            saveState();
            updateUI();
        });

        editWalletButton.addEventListener('click', () => {
            editWalletButton.classList.add('hidden');
            editWalletControls.classList.remove('hidden');
            tempWalletBalanceInput.value = walletBalance;
        });

        saveWalletButton.addEventListener('click', () => {
            const newBalance = parseInt(tempWalletBalanceInput.value);
            if (!isNaN(newBalance)) {
                const amountChange = newBalance - walletBalance;
                walletBalance = newBalance;
                transactions.push({
                    type: "Wallet Edited",
                    name: "Direct adjustment",
                    amount: amountChange,
                    timestamp: new Date().toLocaleString()
                });
                showCustomAlert(`Wallet balance updated to €$ ${newBalance.toLocaleString()}`);
            } else {
                showCustomAlert("Invalid amount entered for wallet balance.");
            }
            editWalletButton.classList.remove('hidden');
            editWalletControls.classList.add('hidden');
            saveState();
            updateUI();
        });

        cancelEditWalletButton.addEventListener('click', () => {
            editWalletButton.classList.remove('hidden');
            editWalletControls.classList.add('hidden');
            updateUI();
        });

        toggleCustomAmountButton.addEventListener('click', () => {
            if (customAmountControls.classList.contains('hidden')) {
                customAmountControls.classList.remove('hidden');
                toggleCustomAmountButton.textContent = "Hide Custom Amount";
            } else {
                customAmountControls.classList.add('hidden');
                toggleCustomAmountButton.textContent = "Add/Subtract Custom Amount";
                customAmountInput.value = '';
            }
        });

        customAmountInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
                // Valid input (empty or digits)
            } else {
                e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
            }
        });

        addCustomAmountButton.addEventListener('click', () => {
            const amount = parseInt(customAmountInput.value, 10);
            if (!isNaN(amount) && amount > 0) {
                walletBalance += amount;
                transactions.push({
                    type: "Added Custom Funds",
                    name: "Direct deposit",
                    amount: amount,
                    timestamp: new Date().toLocaleString()
                });
                showCustomAlert(`Added €$ ${amount.toLocaleString()} to wallet.`);
                customAmountInput.value = '';
                customAmountControls.classList.add('hidden');
                toggleCustomAmountButton.textContent = "Add/Subtract Custom Amount";
                saveState();
                updateUI();
            } else {
                showCustomAlert("Please enter a valid positive amount to add.");
            }
        });

        subtractCustomAmountButton.addEventListener('click', () => {
            const amount = parseInt(customAmountInput.value, 10);
            if (!isNaN(amount) && amount > 0) {
                walletBalance -= amount;
                transactions.push({
                    type: "Subtracted Custom Funds",
                    name: "Direct withdrawal",
                    amount: -amount,
                    timestamp: new Date().toLocaleString()
                });
                showCustomAlert(`Subtracted €$ ${amount.toLocaleString()} from wallet.`);
                customAmountInput.value = '';
                customAmountControls.classList.add('hidden');
                toggleCustomAmountButton.textContent = "Add/Subtract Custom Amount";
                saveState();
                updateUI();
            } else {
                showCustomAlert("Please enter a valid positive amount to subtract.");
            }
        });

        purchaseButton.addEventListener('click', () => {
            const selectedItemId = parseInt(itemSelect.value);
            const item = itemsData.find(i => i.id === selectedItemId);
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
                } else {
                    showCustomAlert("Insufficient Eurodollars to purchase this item!");
                }
            }
            saveState();
            updateUI();
        });

        receiveFundsButton.addEventListener('click', () => {
            const selectedItemId = parseInt(itemSelect.value);
            const item = itemsData.find(i => i.id === selectedItemId);
            if (item) {
                walletBalance += item.price;
                transactions.push({
                    type: "Received Funds (Item Value)",
                    name: item.name,
                    amount: item.price,
                    timestamp: new Date().toLocaleString()
                });
                showCustomAlert(`Received €$ ${item.price.toLocaleString()} for ${item.name}`);
            }
            saveState();
            updateUI();
        });

        // Character Image Handlers
        changeImageButton.addEventListener('click', () => {
            imageFileInput.click(); // Trigger click on hidden file input
        });

        imageFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    currentCharacterImage = reader.result; // Save Base64 string
                    saveState();
                    updateUI();
                    showCustomAlert("Character image updated!");
                };
                reader.readAsDataURL(file); // Read file as Base64
            }
        });

        // Share Log Button
        shareLogButton.addEventListener('click', async () => {
            if (!auth.currentUser) {
                showCustomAlert("Please wait, signing in to Firebase...");
                await signInAnonymously(auth); // Ensure user is authenticated
            }

            const logData = {
                characterName: characterName,
                walletBalance: walletBalance,
                inventory: inventory,
                transactions: transactions,
                characterImage: currentCharacterImage,
                timestamp: new Date().toISOString(),
                sharedBy: auth.currentUser ? auth.currentUser.uid : 'anonymous'
            };

            try {
                const docRef = await addDoc(collection(db, "sharedLogs"), logData);
                const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`;
                shareLinkInput.value = shareUrl;
                shareModal.classList.remove('hidden');
                shareLinkInput.select(); // Select the text for easy copying
                showCustomAlert("Log shared successfully!");
            } catch (error) {
                console.error("Error sharing log:", error);
                showCustomAlert("Failed to share log. Please try again.");
            }
        });

        copyShareLinkButton.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy'); // Fallback for older browsers/iframes
            showCustomAlert("Link copied to clipboard!");
        });

        closeModalButton.addEventListener('click', () => {
            shareModal.classList.add('hidden');
        });

    } // End of !isReadOnlyMode block

    // --- Initial Load Logic ---

    // Check URL for shareId to determine mode
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');

    if (shareId) {
        isReadOnlyMode = true;
        // Disable all interactive elements immediately
        document.body.classList.add('read-only-mode');
        characterNameInput.disabled = true;
        editWalletButton.disabled = true;
        toggleCustomAmountButton.disabled = true;
        shareLogButton.disabled = true;
        purchaseButton.disabled = true;
        receiveFundsButton.disabled = true;
        changeImageButton.disabled = true;
        itemSelect.disabled = true;


        // Fetch shared data from Firestore
        const docRef = doc(db, "sharedLogs", shareId);
        getDoc(docRef).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                characterName = data.characterName;
                walletBalance = data.walletBalance;
                inventory = data.inventory || [];
                transactions = data.transactions || [];
                currentCharacterImage = data.characterImage || "https://placehold.co/192x192/000000/FFFFFF?text=CHIP";
                updateUI();
                showCustomAlert("Loaded shared log (Read-Only)");
            } else {
                showCustomAlert("Shared log not found.");
                // Fallback to local storage if shared log not found
                isReadOnlyMode = false;
                updateUI();
            }
        }).catch((error) => {
            console.error("Error fetching shared log:", error);
            showCustomAlert("Error loading shared log.");
            // Fallback to local storage on error
            isReadOnlyMode = false;
            updateUI();
        });

    } else {
        // Normal mode: load from local storage
        updateUI();
    }

    populateItemSelect(); // Always populate the select dropdown
});
