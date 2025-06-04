// frontend/js/script.js
const API_BASE_URL = 'http://localhost:3000/api';

let cart = []; 
let currentUser = null; 
let currentOrderDetails = null; 
let deliveryZones = []; 

document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores ---
    const mainPageContent = document.getElementById('mainPageContent');
    const categoryView = document.getElementById('categoryView');
    const checkoutPage = document.getElementById('checkoutPage');
    const orderConfirmationPage = document.getElementById('orderConfirmationPage');
    const userProfilePage = document.getElementById('userProfilePage'); 
    const orderHistoryContainer = document.getElementById('orderHistoryContainer'); 
    
    const complaintModal = document.getElementById('complaintModal'); 
    const closeComplaintModalBtn = document.getElementById('closeComplaintModalBtn'); 
    const complaintForm = document.getElementById('complaintForm'); 
    const complaintOrderIdHidden = document.getElementById('complaintOrderIdHidden'); 
    
    const viewComplaintModal = document.getElementById('viewComplaintModal'); 
    const closeViewComplaintModalBtn = document.getElementById('closeViewComplaintModalBtn'); 
    const viewComplaintDetailsContainer = document.getElementById('viewComplaintDetailsContainer'); 

    const clientOrderDetailModal = document.getElementById('clientOrderDetailModal'); // NUEVO
    const closeClientOrderDetailModalBtn = document.getElementById('closeClientOrderDetailModalBtn'); // NUEVO
    const clientOrderDetailModalTitle = document.getElementById('clientOrderDetailModalTitle'); // NUEVO
    const clientOrderDetailModalContent = document.getElementById('clientOrderDetailModalContent'); // NUEVO


    const cartModalEl = document.getElementById('cartModal'); 
    const closeCartBtn = document.getElementById('closeCartBtn');
    const authModal = document.getElementById('authModal');

    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartItemCountMobileHeader = document.getElementById('cartItemCountMobileHeader');
    const cartSubtotalDisplay = document.getElementById('cartSubtotalDisplay');
    const cartEmptyMessage = document.getElementById('cartEmptyMessage');
    const cartTotalsDiv = document.getElementById('cartTotals');
        
    const loginBtn = document.getElementById('loginBtn'); 
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const logoutBtn = document.getElementById('logoutBtn'); 
    const userGreeting = document.getElementById('userGreeting'); 
    const profileLink = document.getElementById('profileLink'); 

    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const deliveryZoneSelect = document.getElementById('registerDeliveryZone'); 

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        
    const mainCatalogCategoriesContainer = document.getElementById('mainCatalogCategories'); 
    const categoryTitleEl = document.getElementById('categoryTitle');
    const categoryProductsGridEl = document.getElementById('categoryProductsGrid');
    const backToMainCatalogBtn = document.getElementById('backToMainCatalogBtn');

    const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');
    const backToCartBtn = document.getElementById('backToCartBtn'); 
    const shippingForm = document.getElementById('shippingForm'); 
    const confirmPurchaseBtn = document.getElementById('confirmPurchaseBtn');
    const checkoutOrderSummaryEl = document.getElementById('checkoutOrderSummary');
    const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
    const checkoutShippingEl = document.getElementById('checkoutShipping'); 
    const checkoutTotalEl = document.getElementById('checkoutTotal');
    const checkoutAddressInfo = document.getElementById('checkoutAddressInfo'); 

    const orderConfirmationTitle = document.getElementById('orderConfirmationTitle');
    const orderQrImage = document.getElementById('orderQrImage');
    const orderQrInstructions = document.getElementById('orderQrInstructions');
    const paymentConfirmationBtn = document.getElementById('paymentConfirmationBtn'); 
    const orderStatusMessage = document.getElementById('orderStatusMessage');
    const backToHomeFromConfirmationBtn = document.getElementById('backToHomeFromConfirmationBtn');

    // --- Funciones para manejar la visibilidad de los modales ---
    function hideAllModals() {
        if (authModal) authModal.classList.remove('active');
        if (cartModalEl) cartModalEl.classList.remove('active');
        if (complaintModal) complaintModal.classList.remove('active');
        if (viewComplaintModal) viewComplaintModal.classList.remove('active');
        if (clientOrderDetailModal) clientOrderDetailModal.classList.remove('active'); // NUEVO
    }

    function openModal(modalElement) {
        hideAllModals(); 
        if (modalElement) {
            modalElement.classList.add('active');
        } else {
            console.error("Error: Se intentó abrir un modal que no existe o es nulo.");
        }
    }

    // --- Funciones de Autenticación y Token ---
    function saveUserSession(userData) {
        localStorage.setItem('diamantechUser', JSON.stringify(userData));
        currentUser = userData;

        if (currentUser && currentUser.usuario && currentUser.usuario.rol === 'administrador') {
            showToast('Bienvenido Admin. Redirigiendo al panel...', 'success');
            localStorage.setItem('diamantechAdminToken', currentUser.token); 
            localStorage.setItem('diamantechAdminUser', JSON.stringify(currentUser.usuario)); 
            
            window.location.href = 'admin.html'; 
            return; 
        }
        
        updateUserUI();
        fetchCart(); 
    }
    function getToken() { return currentUser ? currentUser.token : null; }
    function loadUserSession() {
        const storedUser = localStorage.getItem('diamantechUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateUserUI();
            fetchCart(); 
        } else {
            updateUserUI(); 
        }
    }
    function clearUserSession() {
        localStorage.removeItem('diamantechUser');
        localStorage.removeItem('diamantechAdminToken');
        localStorage.removeItem('diamantechAdminUser');
        currentUser = null;
        cart = []; 
        updateUserUI();
        renderCartItems(); 
        showView('main'); 
    }
    function isLoggedIn() { return !!currentUser && !!currentUser.token; }

    function updateUserUI() {
        const userGreetingMobile = document.getElementById('userGreetingMobile');
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');
        const profileLinkMobile = document.getElementById('profileLinkMobile'); 

        if (isLoggedIn()) {
            if(loginBtn) loginBtn.classList.add('hidden');
            if(loginBtnMobile) loginBtnMobile.classList.add('hidden');
            if(logoutBtn) logoutBtn.classList.remove('hidden');
            if(logoutBtnMobile) logoutBtnMobile.classList.remove('hidden');
            if(profileLink) profileLink.classList.remove('hidden');
            if(profileLinkMobile) profileLinkMobile.classList.remove('hidden');

            if(userGreeting && currentUser && currentUser.usuario) {
                userGreeting.textContent = `Hola, ${currentUser.usuario.nombre_completo.split(' ')[0]}`;
                userGreeting.classList.remove('hidden');
            }
            if(userGreetingMobile && currentUser && currentUser.usuario) { 
                userGreetingMobile.textContent = `Hola, ${currentUser.usuario.nombre_completo.split(' ')[0]}`;
                userGreetingMobile.classList.remove('hidden');
            }
        } else {
            if(loginBtn) loginBtn.classList.remove('hidden');
            if(loginBtnMobile) loginBtnMobile.classList.remove('hidden');
            if(logoutBtn) logoutBtn.classList.add('hidden');
            if(logoutBtnMobile) logoutBtnMobile.classList.add('hidden'); 
            if(profileLink) profileLink.classList.add('hidden');
            if(profileLinkMobile) profileLinkMobile.classList.add('hidden');
            if(userGreeting) userGreeting.classList.add('hidden');
            if(userGreetingMobile) userGreetingMobile.classList.add('hidden'); 
        }
    }
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-xl z-[100]`;
        if (type === 'success') toast.classList.add('bg-green-500');
        else if (type === 'error') toast.classList.add('bg-red-500');
        else toast.classList.add('bg-blue-500');
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    function showView(viewToShow) {
        if(mainPageContent) mainPageContent.classList.add('view-hidden');
        if(categoryView) categoryView.classList.add('view-hidden');
        if(checkoutPage) checkoutPage.classList.add('view-hidden');
        if(orderConfirmationPage) orderConfirmationPage.classList.add('view-hidden'); 
        if(userProfilePage) userProfilePage.classList.add('view-hidden');
            
        if (viewToShow === 'main' && mainPageContent) mainPageContent.classList.remove('view-hidden');
        if (viewToShow === 'category' && categoryView) categoryView.classList.remove('view-hidden');
        if (viewToShow === 'checkout' && checkoutPage) checkoutPage.classList.remove('view-hidden');
        if (viewToShow === 'confirmation' && orderConfirmationPage) orderConfirmationPage.classList.remove('view-hidden'); 
        if (viewToShow === 'profile' && userProfilePage) userProfilePage.classList.remove('view-hidden');
        window.scrollTo(0, 0);
    }

    async function fetchCategories() {
        if (!mainCatalogCategoriesContainer) { console.warn("El contenedor mainCatalogCategories no existe."); return; }
        mainCatalogCategoriesContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Cargando categorías...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/products/categories`);
            if (!response.ok) { const errorData = await response.json().catch(() => ({ message: 'Error al cargar categorías.' })); throw new Error(errorData.message || `Error HTTP ${response.status}`);}
            const categories = await response.json();
            renderMainCategories(categories);
        } catch (error) { console.error("Error en fetchCategories:", error); mainCatalogCategoriesContainer.innerHTML = `<p class="text-red-500 col-span-full text-center">No se pudieron cargar las categorías: ${error.message}.</p>`;}
    }

    function renderMainCategories(categories) {
        if (!mainCatalogCategoriesContainer) return;
        mainCatalogCategoriesContainer.innerHTML = ''; 
        if (!categories || categories.length === 0) { mainCatalogCategoriesContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay categorías disponibles en este momento.</p>'; return; }
        categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'product-card bg-white p-6 rounded-lg shadow-xl text-center cursor-pointer transition-transform duration-300 hover:scale-105';
            categoryCard.dataset.categorySlug = category.slug_categoria; 
            categoryCard.dataset.categoryName = category.nombre_categoria; 
            const imageUrl = category.imagen_url_categoria || 'https://placehold.co/400x300/E2E8F0/A0AEC0?text=Joyeria';
            categoryCard.innerHTML = `<img src="${imageUrl}" alt="${category.nombre_categoria}" class="w-full h-56 object-cover rounded-md mb-5 mx-auto" onerror="this.onerror=null;this.src='https://placehold.co/400x300/E2E8F0/A0AEC0?text=Error+Imagen';"> <h3 class="text-2xl font-semibold mb-2 text-blue-600">${category.nombre_categoria}</h3> <p class="text-gray-600">${category.descripcion_categoria || 'Explora nuestra selección.'}</p>`;
            categoryCard.addEventListener('click', () => loadCategoryProductsPage(category.slug_categoria, category.nombre_categoria));
            mainCatalogCategoriesContainer.appendChild(categoryCard);
        });
    }

    async function loadCategoryProductsPage(categorySlug, categoryName) {
        if (!categoryTitleEl || !categoryProductsGridEl) { console.error("Elementos para vista de categoría no encontrados."); return; }
        categoryTitleEl.textContent = `Catálogo: ${categoryName}`;
        categoryProductsGridEl.innerHTML = '<p class="col-span-full text-center text-gray-500">Cargando productos...</p>';
        showView('category');
        try {
            const response = await fetch(`${API_BASE_URL}/products/category/${categorySlug}`);
            if (!response.ok) { const errorData = await response.json().catch(() => ({ message: `Error al cargar productos para ${categoryName}` })); throw new Error(errorData.message || `Error HTTP ${response.status}`);}
            const products = await response.json();
            categoryProductsGridEl.innerHTML = ''; 
            if (products.length === 0) { categoryProductsGridEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay productos en esta categoría.</p>';
            } else {
                products.forEach(product => {
                    const displayPrice = product.precio; 
                    const imageUrl = product.imagen_principal_url || 'https://placehold.co/300x200/E2E8F0/A0AEC0?text=Producto';
                    const productEl = document.createElement('div');
                    productEl.className = 'category-product-card bg-white p-4 md:p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105';
                    productEl.innerHTML = `<img src="${imageUrl}" alt="${product.nombre_producto}" class="w-full h-48 object-cover rounded-md mb-4 mx-auto" onerror="this.onerror=null;this.src='https://placehold.co/300x200/E2E8F0/A0AEC0?text=Error+Imagen';"> <h3 class="text-lg md:text-xl font-semibold mb-1 text-gray-800">${product.nombre_producto}</h3> <p class="text-xs md:text-sm text-gray-500 mb-2 h-10 overflow-hidden">${(product.descripcion_corta || '').substring(0,50)}...</p> <p class="text-md md:text-lg font-bold text-blue-600 mb-3">$${parseFloat(displayPrice).toFixed(2)}</p> <button class="add-to-cart-btn bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 md:px-4 rounded-md text-xs md:text-sm w-full" data-product-id="${product.id_producto}"><i class="fas fa-cart-plus mr-1"></i> Añadir al Carrito</button>`;
                    categoryProductsGridEl.appendChild(productEl);
                });
                document.querySelectorAll('.add-to-cart-btn').forEach(button => button.addEventListener('click', handleAddToCartClick));
            }
        } catch (error) { console.error("Error en loadCategoryProductsPage:", error); categoryProductsGridEl.innerHTML = `<p class="col-span-full text-center text-red-500">${error.message}.</p>`;}
    }

     async function fetchDeliveryZones() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/delivery-zones`);
            if (!response.ok) throw new Error('Error al cargar zonas de entrega');
            deliveryZones = await response.json();
            populateDeliveryZonesSelect();
        } catch (error) { console.error("Error en fetchDeliveryZones:", error); if(deliveryZoneSelect) deliveryZoneSelect.innerHTML = '<option value="">Error al cargar zonas</option>'; }
    }

    function populateDeliveryZonesSelect() {
        if (!deliveryZoneSelect) return;
        deliveryZoneSelect.innerHTML = '<option value="">Selecciona una zona...</option>';
        deliveryZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.id_zona;
            option.textContent = `${zone.nombre_zona} (Bs. ${parseFloat(zone.costo_envio_zona).toFixed(2)})`;
            deliveryZoneSelect.appendChild(option);
        });
    }

    if(backToMainCatalogBtn) backToMainCatalogBtn.addEventListener('click', () => showView('main'));

    function toggleCartModalEl() { 
        if (cartModalEl) {
            if (cartModalEl.classList.contains('active')) {
                cartModalEl.classList.remove('active');
            } else {
                openModal(cartModalEl); 
                renderCartItems();
            }
        }
    }
    if(cartToggleBtn) cartToggleBtn.addEventListener('click', toggleCartModalEl);
    if(cartToggleBtnMobileHeader) cartToggleBtnMobileHeader.addEventListener('click', toggleCartModalEl);
    if(closeCartBtn) closeCartBtn.addEventListener('click', () => { if(cartModalEl) cartModalEl.classList.remove('active'); }); 

    async function fetchCart() { 
        if (!isLoggedIn()) { cart = []; renderCartItems(); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/cart`, { headers: { 'Authorization': `Bearer ${getToken()}` }});
            if (!response.ok) { 
                if (response.status === 401) { showToast('Sesión expirada.', 'error'); clearUserSession(); } 
                else { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.message || 'Error al cargar carrito');}
                cart = []; 
            } else {
                const cartData = await response.json();
                cart = cartData.items.map(item => ({
                    id: item.id_producto, 
                    cart_item_id: item.id_item_carrito, 
                    name: item.nombre_producto,
                    price: parseFloat(item.precio_unitario_al_agregar), 
                    quantity: item.cantidad,
                    image: item.imagen_principal_url || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joya', 
                    sku: item.sku,
                }));
            }
            renderCartItems();
        } catch (error) { console.error("Error en fetchCart:", error); showToast(error.message, 'error'); cart = []; renderCartItems(); }
    }

    function renderCartItems() { 
        if (!cartItemsContainer || !cartEmptyMessage || !cartTotalsDiv || !cartSubtotalDisplay) return;
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        if (cart.length === 0) { cartEmptyMessage.classList.remove('hidden'); cartTotalsDiv.classList.add('hidden');}
        else {
            cartEmptyMessage.classList.add('hidden');
            cartTotalsDiv.classList.remove('hidden');
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'flex items-center border-b pb-4';
                const imageUrl = item.image || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joyeria';
                itemElement.innerHTML = `<img src="${imageUrl}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md mr-3 md:mr-4" onerror="this.onerror=null;this.src='https://placehold.co/80x80/E2E8F0/A0AEC0?text=Error+Imagen';"> <div class="flex-grow"> <h3 class="font-semibold text-sm md:text-base">${item.name}</h3> <p class="text-blue-600 font-bold text-sm md:text-base">$${item.price.toFixed(2)}</p> </div> <div class="ml-auto flex flex-col md:flex-row items-end md:items-center"> <input type="number" value="${item.quantity}" min="1" class="w-12 text-center border rounded-md p-1 mb-1 md:mb-0 md:mr-2 cart-item-quantity" data-item-id="${item.cart_item_id}" data-product-id="${item.id}"> <button class="text-red-500 hover:text-red-700 remove-cart-item" data-item-id="${item.cart_item_id}" data-product-id="${item.id}"><i class="fas fa-trash"></i></button> </div>`;
                cartItemsContainer.appendChild(itemElement);
                subtotal += item.price * item.quantity;
            });
        }
        cartSubtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        updateCartCount();
        document.querySelectorAll('.cart-item-quantity').forEach(input => input.addEventListener('change', handleQuantityChange));
        document.querySelectorAll('.remove-cart-item').forEach(button => button.addEventListener('click', handleRemoveItem));
    }
    
    async function handleAddToCartClick(event) {
        if (!isLoggedIn()) { showToast('Debes iniciar sesión para añadir productos.', 'info'); openModal(authModal); return; }
        const productId = event.target.dataset.productId; 
        const productName = event.target.closest('.category-product-card').querySelector('h3').textContent; 
        if (!productId) { showToast('ID de producto no encontrado.', 'error'); return; }
        await addItemToBackendCart(productId, 1, productName);
    }
    
    async function addItemToBackendCart(productId, quantity, productName) { 
        if (!isLoggedIn()) { showToast('Debes iniciar sesión.', 'info'); openModal(authModal); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/cart/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ id_producto: productId, cantidad: quantity }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al añadir item');
            showToast(`${productName || 'Item'} añadido al carrito.`, 'success');
            await fetchCart();
        } catch (error) { showToast(error.message, 'error'); }
    }

    async function handleQuantityChange(event) { 
        if (!isLoggedIn()) { showToast('Inicia sesión para modificar tu carrito.', 'info'); return; }
        const itemId = event.target.dataset.itemId; 
        const newQuantity = parseInt(event.target.value);
        if (newQuantity < 1) { showToast('La cantidad no puede ser menor a 1.', 'info'); const currentItemInCart = cart.find(item => item.cart_item_id == itemId); event.target.value = currentItemInCart ? currentItemInCart.quantity : 1; return; }
        try {
            const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ cantidad: newQuantity }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al actualizar cantidad');
            showToast('Cantidad actualizada.', 'success');
            await fetchCart();
        } catch (error) { showToast(error.message, 'error'); await fetchCart(); }
    }

    async function handleRemoveItem(event) { 
        if (!isLoggedIn()) { showToast('Inicia sesión para modificar tu carrito.', 'info'); return; }
        const itemId = event.currentTarget.dataset.itemId; 
         try {
            const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al eliminar item');
            showToast('Item eliminado.', 'success');
            await fetchCart();
        } catch (error) { showToast(error.message, 'error'); }
    }

    function updateCartCount() { 
        if (!cartItemCount || !cartItemCountMobileHeader) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCount.textContent = totalItems;
        cartItemCountMobileHeader.textContent = totalItems;
    }

    if(goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) { 
            showToast('Debes iniciar sesión para proceder.', 'info'); 
            openModal(authModal); 
            return; 
        }
        if (cart.length === 0) { 
            showToast('Tu carrito está vacío.', 'info'); 
            return; 
        }
        
        if (checkoutAddressInfo) checkoutAddressInfo.innerHTML = `<p class="text-gray-500">Verificando dirección...</p>`;
        try {
            const response = await fetch(`${API_BASE_URL}/users/me/default-address`, { 
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            
            if (!response.ok) { 
                let errorMessage = 'No tienes una dirección predeterminada. Por favor, configúrala en "Mi Cuenta".';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si el cuerpo del error no es JSON, usar mensaje genérico
                }
                showToast(errorMessage, 'error'); 
                if (checkoutAddressInfo) checkoutAddressInfo.innerHTML = `<p class="text-red-500">${errorMessage}</p>`; 
                return; 
            }
            
            const address = await response.json();
            if (!address || !address.id_direccion) { 
                showToast('No tienes una dirección predeterminada configurada. Por favor, ve a "Mi Cuenta".', 'error');
                if (checkoutAddressInfo) checkoutAddressInfo.innerHTML = `<p class="text-red-500">No se encontró dirección predeterminada válida. Ve a "Mi Cuenta" para añadir una.</p>`; 
                return;
            }
            
            loadCheckoutPage(address); 
            showView('checkout');

        } catch (error) { 
            console.error("Error al obtener dirección para checkout:", error); 
            showToast('Error al cargar información de envío. Intenta de nuevo.', 'error'); 
            if (checkoutAddressInfo) checkoutAddressInfo.innerHTML = `<p class="text-red-500">Ocurrió un error al cargar tu dirección.</p>`;
        }
    });

    if(backToCartBtn) backToCartBtn.addEventListener('click', () => { showView('main'); openModal(cartModalEl); });
    
    function loadCheckoutPage(addressData) { 
        if (!checkoutOrderSummaryEl || !checkoutSubtotalEl || !checkoutShippingEl || !checkoutTotalEl || !checkoutAddressInfo) return;
        checkoutOrderSummaryEl.innerHTML = '';
        let subtotal = 0;
        const shippingCost = addressData && addressData.costo_envio_zona !== undefined ? parseFloat(addressData.costo_envio_zona) : 10.00; 
        cart.forEach(item => { const itemEl = document.createElement('div'); itemEl.className = 'flex justify-between items-center text-sm py-1'; itemEl.innerHTML = `<span>${item.name} (x${item.quantity})</span> <span class="font-medium">$${(item.price * item.quantity).toFixed(2)}</span>`; checkoutOrderSummaryEl.appendChild(itemEl); subtotal += item.price * item.quantity; });
        checkoutSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        checkoutShippingEl.textContent = `$${shippingCost.toFixed(2)}`;
        checkoutTotalEl.textContent = `$${(subtotal + shippingCost).toFixed(2)}`;
        if (addressData) {
            checkoutAddressInfo.innerHTML = `<h4 class="font-semibold mb-1">Enviar a:</h4> <p>${addressData.nombre_destinatario || (currentUser && currentUser.usuario ? currentUser.usuario.nombre_completo : '')}</p> <p>${addressData.calle_avenida}, Nro. ${addressData.numero_vivienda}</p> <p>Zona: ${addressData.nombre_zona}</p> ${addressData.referencia_adicional ? `<p>Ref: ${addressData.referencia_adicional}</p>` : ''} <p>Teléfono: ${(currentUser && currentUser.usuario ? currentUser.usuario.telefono : '') || 'No provisto'}</p>`;
        } else { checkoutAddressInfo.innerHTML = `<p class="text-red-500">No se pudo cargar la dirección. Por favor, asegúrate de tener una dirección predeterminada en "Mi Cuenta".</p>`; }
        if(shippingForm) shippingForm.classList.add('hidden'); 
    }

    if(confirmPurchaseBtn) confirmPurchaseBtn.addEventListener('click', async () => {
        const submitButton = confirmPurchaseBtn;
        try {
            showToast('Procesando tu pedido...', 'info'); 
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Procesando...';}
            const response = await fetch(`${API_BASE_URL}/orders/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }});
            const orderResult = await response.json();
            if (!response.ok) throw new Error(orderResult.message || 'Error al crear pedido');
            currentOrderDetails = orderResult; 
            showToast(orderResult.message || 'Pedido creado.', 'success');
            displayOrderConfirmation(orderResult);
            await fetchCart(); 
        } catch (error) { console.error("Error al confirmar compra:", error); showToast(error.message, 'error'); }
        finally { if(submitButton) {submitButton.disabled = false; submitButton.textContent = 'Confirmar y Proceder al Pago';} }
    });

    function displayOrderConfirmation(orderData) { 
        if(!orderConfirmationTitle || !orderQrImage || !orderQrInstructions || !orderStatusMessage || !paymentConfirmationBtn) return;
        orderConfirmationTitle.textContent = `Pedido #${orderData.codigo_pedido} Recibido`;
        if (orderData.paymentInfo && orderData.paymentInfo.qrImageUrl) { orderQrImage.src = orderData.paymentInfo.qrImageUrl; orderQrImage.classList.remove('hidden'); } 
        else { orderQrImage.classList.add('hidden'); console.warn("No se pudo cargar imagen QR."); }
        orderQrInstructions.textContent = orderData.paymentInfo ? orderData.paymentInfo.instructions : 'Instrucciones no disponibles.';
        orderStatusMessage.textContent = `Estado actual: ${orderData.estado_pedido}. Realiza el pago.`;
        paymentConfirmationBtn.classList.remove('hidden'); 
        paymentConfirmationBtn.dataset.orderId = orderData.id_pedido; 
        showView('confirmation');
    }

    if(paymentConfirmationBtn) paymentConfirmationBtn.addEventListener('click', async (event) => { 
        const orderId = event.target.dataset.orderId;
        if (!orderId) { showToast('Error: No se encontró ID del pedido.', 'error'); return; }
        const submitButton = paymentConfirmationBtn;
        try {
            showToast('Simulando confirmación de pago...', 'info');
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Confirmando...'; }
            const response = await fetch(`${API_BASE_URL}/payment/confirm-qr`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ orderId: parseInt(orderId) }) });
            const paymentResult = await response.json();
            if (!response.ok) throw new Error(paymentResult.message || 'Error al simular pago');
            showToast(paymentResult.message, 'success');
            if(orderStatusMessage) orderStatusMessage.textContent = `Estado actual: ${paymentResult.newStatus}. ¡Gracias!`;
            if(orderQrImage) orderQrImage.classList.add('hidden'); 
            if(orderQrInstructions) orderQrInstructions.textContent = 'Pago procesado.';
            submitButton.classList.add('hidden'); 
        } catch (error) { console.error("Error al simular pago:", error); showToast(error.message, 'error'); if(orderStatusMessage) orderStatusMessage.textContent = `Error procesando pago.`; } 
        finally { if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'He Realizado el Pago'; } }
    });

    if(backToHomeFromConfirmationBtn) backToHomeFromConfirmationBtn.addEventListener('click', (e) => { e.preventDefault(); currentOrderDetails = null; showView('main'); });

    function toggleAuthModal() { 
        if(!authModal) return;
        if (authModal.classList.contains('active')) {
            authModal.classList.remove('active');
        } else {
            openModal(authModal); 
            if(loginForm) loginForm.reset(); 
            if(registerForm) registerForm.reset(); 
            if(loginFormContainer) loginFormContainer.classList.remove('hidden'); 
            if(registerFormContainer) registerFormContainer.classList.add('hidden');
            fetchDeliveryZones(); 
        }
    }
    if(loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); });
    if(loginBtnMobile) loginBtnMobile.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); if(mobileMenu) mobileMenu.classList.add('hidden');});
    if(closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', () => { if(authModal) authModal.classList.remove('active'); }); 
    if(showRegisterForm) showRegisterForm.addEventListener('click', (e) => { e.preventDefault(); if(loginFormContainer) loginFormContainer.classList.add('hidden'); if(registerFormContainer) registerFormContainer.classList.remove('hidden'); });
    if(showLoginForm) showLoginForm.addEventListener('click', (e) => { e.preventDefault(); if(registerFormContainer) registerFormContainer.classList.add('hidden'); if(loginFormContainer) loginFormContainer.classList.remove('hidden'); });

    if(loginForm) loginForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        try {
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Ingresando...';}
            const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');
            
            saveUserSession(data); 

            if (!(currentUser && currentUser.usuario && currentUser.usuario.rol === 'administrador')) {
                showToast('Inicio de sesión exitoso.', 'success');
                if(authModal) authModal.classList.remove('active'); 
            }
        } catch (error) { console.error('Error de login:', error); showToast(error.message, 'error'); } 
        finally { if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Ingresar';} }
    });

    if(registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nombre_completo: registerForm.nombre_completo.value, email: registerForm.email.value,
            password: registerForm.password.value, telefono: registerForm.telefono.value,
            id_zona: registerForm.id_zona.value, calle_avenida: registerForm.calle_avenida.value,
            numero_vivienda: registerForm.numero_vivienda.value, referencia_adicional: registerForm.referencia_adicional.value
        };
        const confirmPassword = registerForm.confirmPassword.value;
        if (formData.password !== confirmPassword) { showToast('Las contraseñas no coinciden.', 'error'); return; }
        if (!formData.id_zona) { showToast('Selecciona una zona de entrega.', 'error'); return; }
        const submitButton = registerForm.querySelector('button[type="submit"]');
        try {
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Registrando...';}
            const response = await fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al registrar');
            saveUserSession(data); 
            showToast('Registro exitoso. ¡Bienvenido!', 'success');
            if(authModal) authModal.classList.remove('active'); 
        } catch (error) { console.error('Error de registro:', error); showToast(error.message, 'error'); } 
        finally { if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Registrarse';} }
    });
    
    if(logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); clearUserSession(); });
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    if(logoutBtnMobile) logoutBtnMobile.addEventListener('click', (e) => { e.preventDefault(); clearUserSession(); if(mobileMenu) mobileMenu.classList.add('hidden'); });

    if (profileLink) profileLink.addEventListener('click', (e) => { e.preventDefault(); if(isLoggedIn()) loadUserProfile(); });
    const profileLinkMobile = document.getElementById('profileLinkMobile');
    if (profileLinkMobile) profileLinkMobile.addEventListener('click', (e) => { e.preventDefault(); if(isLoggedIn()) { loadUserProfile(); if(mobileMenu) mobileMenu.classList.add('hidden'); } });

    async function loadUserProfile() {
        if (!userProfilePage || !orderHistoryContainer) { console.error("Elementos del perfil no encontrados"); return;}
        showView('profile');
        if(currentUser && currentUser.usuario) {
            const profileNameEl = document.getElementById('profileName');
            const profileEmailEl = document.getElementById('profileEmail');
            const profilePhoneEl = document.getElementById('profilePhone');
            if(profileNameEl) profileNameEl.textContent = currentUser.usuario.nombre_completo;
            if(profileEmailEl) profileEmailEl.textContent = currentUser.usuario.email;
            if(profilePhoneEl) profilePhoneEl.textContent = currentUser.usuario.telefono || 'No provisto';
        }
        
        const profileAddressEl = document.getElementById('profileAddress');
        if(profileAddressEl) profileAddressEl.innerHTML = 'Cargando dirección...';
        try {
            const addrResponse = await fetch(`${API_BASE_URL}/users/me/default-address`, { headers: { 'Authorization': `Bearer ${getToken()}` }});
            if(addrResponse.ok) {
                const addr = await addrResponse.json();
                if(profileAddressEl && addr && addr.id_direccion) { 
                    profileAddressEl.innerHTML = `${addr.calle_avenida}, Nro. ${addr.numero_vivienda}<br>Zona: ${addr.nombre_zona}${addr.referencia_adicional ? `<br>Ref: ${addr.referencia_adicional}` : ''}`;
                } else if (profileAddressEl) {
                     profileAddressEl.textContent = 'No tienes una dirección predeterminada o no se pudo cargar.';
                }
            } else {
                const errorData = await addrResponse.json().catch(() => ({message: 'Error al obtener la dirección desde el servidor.'}));
                if (profileAddressEl) profileAddressEl.textContent = errorData.message || 'Error al cargar dirección.';
            }
        } catch (e) { 
            console.error("Error fetching default address:", e);
            if(profileAddressEl) profileAddressEl.textContent = 'Error al cargar dirección.'; 
        }

        if(orderHistoryContainer) orderHistoryContainer.innerHTML = '<p>Cargando historial de pedidos...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, { headers: { 'Authorization': `Bearer ${getToken()}` }});
            if (!response.ok) throw new Error('Error al cargar historial de pedidos');
            const orders = await response.json();
            renderOrderHistory(orders);
        } catch (error) { console.error("Error cargando perfil:", error); if(orderHistoryContainer) orderHistoryContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`; }
    }

    function renderOrderHistory(orders) {
        if (!orderHistoryContainer) return;
        if (orders.length === 0) { orderHistoryContainer.innerHTML = '<p>No tienes pedidos aún.</p>'; return; }
        orderHistoryContainer.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-700">Mis Pedidos</h3> <div class="space-y-4"> ${orders.map(order => ` <div class="bg-white p-4 rounded-lg shadow"> <div class="flex justify-between items-center mb-2"> <span class="font-semibold text-blue-600">Pedido #${order.codigo_pedido}</span> <span class="text-sm text-gray-500">${new Date(order.fecha_pedido).toLocaleDateString()}</span> </div> <p class="text-sm">Estado: <span class="font-medium ${getOrderStatusColor(order.estado_pedido)}">${formatOrderStatus(order.estado_pedido)}</span></p> <p class="text-sm">Total: <span class="font-medium">$${parseFloat(order.total_pedido).toFixed(2)}</span></p> <div class="mt-2 flex space-x-2"> <button class="view-order-details-btn text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" data-order-id="${order.id_pedido}">Ver Detalles</button> ${order.estado_pedido === 'entregado' && !order.tiene_queja ? `<button class="register-complaint-btn text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded" data-order-id="${order.id_pedido}" data-order-code="${order.codigo_pedido}">Registrar Queja</button>` : ''} ${order.tiene_queja ? `<button class="view-complaint-btn text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded" data-order-id="${order.id_pedido}">Ver Queja</button>` : ''} </div> </div>`).join('')} </div>`;
        document.querySelectorAll('.register-complaint-btn').forEach(btn => btn.addEventListener('click', openComplaintModal));
        document.querySelectorAll('.view-complaint-btn').forEach(btn => btn.addEventListener('click', openViewComplaintModal));
        document.querySelectorAll('.view-order-details-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            openClientOrderDetailModal(orderId); 
        }));
    }
    function getOrderStatusColor(status) { const colors = { 'pendiente_pago': 'text-yellow-600', 'pagado': 'text-green-600', 'en_proceso': 'text-blue-600', 'enviado': 'text-purple-600', 'entregado': 'text-teal-600', 'cancelado': 'text-red-600', 'fallido': 'text-red-700' }; return colors[status] || 'text-gray-600'; }
    function formatOrderStatus(status) { return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

    // --- Detalles del Pedido (Cliente) ---
    async function openClientOrderDetailModal(orderId) {
        if (!clientOrderDetailModal || !clientOrderDetailModalContent || !clientOrderDetailModalTitle) {
            console.error("Elementos del modal de detalle de pedido del cliente no encontrados.");
            return;
        }
        clientOrderDetailModalContent.innerHTML = '<p>Cargando detalles del pedido...</p>';
        openModal(clientOrderDetailModal);

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar los detalles del pedido.');
            }
            const order = await response.json();
            
            clientOrderDetailModalTitle.textContent = `Detalles del Pedido #${order.codigo_pedido}`;
            
            let itemsHtml = '<p class="font-semibold mb-1">Productos:</p><ul class="list-disc list-inside pl-4 space-y-1">';
            if (order.detalles && order.detalles.length > 0) {
                order.detalles.forEach(item => {
                    itemsHtml += `<li>${item.cantidad_comprada}x ${item.nombre_producto_historico} (SKU: ${item.sku_historico}) - Bs. ${parseFloat(item.precio_unitario_compra).toFixed(2)} c/u</li>`;
                });
            } else {
                itemsHtml += '<li>No hay productos en este pedido.</li>';
            }
            itemsHtml += '</ul>';

            clientOrderDetailModalContent.innerHTML = `
                <div class="space-y-2">
                    <p><strong>Fecha del Pedido:</strong> ${new Date(order.fecha_pedido).toLocaleString()}</p>
                    <p><strong>Estado del Pedido:</strong> <span class="font-medium ${getOrderStatusColor(order.estado_pedido)}">${formatOrderStatus(order.estado_pedido)}</span></p>
                    <hr class="my-2">
                    <p class="font-semibold">Dirección de Envío:</p>
                    <p>${order.nombre_cliente_envio || (currentUser && currentUser.usuario ? currentUser.usuario.nombre_completo : '')}</p>
                    <p>${order.calle_avenida}, Nro. ${order.numero_vivienda}</p>
                    <p>Zona: ${order.nombre_zona}</p>
                    ${order.referencia_adicional ? `<p>Ref: ${order.referencia_adicional}</p>` : ''}
                    <hr class="my-2">
                    ${itemsHtml}
                    <hr class="my-2">
                    <div class="text-right space-y-1">
                        <p><strong>Subtotal Productos:</strong> Bs. ${parseFloat(order.subtotal_productos).toFixed(2)}</p>
                        <p><strong>Costo de Envío:</strong> Bs. ${parseFloat(order.costo_envio).toFixed(2)}</p>
                        <p class="font-bold text-lg"><strong>Total Pedido:</strong> Bs. ${parseFloat(order.total_pedido).toFixed(2)}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Error al abrir detalle de pedido del cliente:", error);
            clientOrderDetailModalContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }

    if(closeClientOrderDetailModalBtn) {
        closeClientOrderDetailModalBtn.addEventListener('click', () => {
            if(clientOrderDetailModal) clientOrderDetailModal.classList.remove('active');
        });
    }

    // --- Sistema de Quejas (Cliente) ---
    function openComplaintModal(event) {
        const orderId = event.target.dataset.orderId;
        const orderCode = event.target.dataset.orderCode;
        if (complaintModal && complaintOrderIdHidden && complaintForm) {
            complaintOrderIdHidden.value = orderId;
            complaintForm.reset();
            const titleEl = complaintModal.querySelector('h2');
            if(titleEl) titleEl.textContent = `Registrar Queja para Pedido #${orderCode}`;
            openModal(complaintModal); 
        } else {
            console.error("Elementos del modal de registrar queja no encontrados al ABRIR.");
        }
    }

    if (closeComplaintModalBtn) {
        closeComplaintModalBtn.addEventListener('click', () => { 
            if (complaintModal) {
                complaintModal.classList.remove('active');
            }
        });
    }

    if (complaintForm) complaintForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        const orderId = complaintOrderIdHidden.value;
        const descripcion_queja = complaintForm.descripcion_queja.value;
        if (!descripcion_queja.trim()) { showToast('Por favor, describe tu queja.', 'error'); return; }
        const submitButton = complaintForm.querySelector('button[type="submit"]');
        try {
            if(submitButton) {submitButton.disabled = true; submitButton.textContent = "Enviando...";}
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/complaint`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`}, body: JSON.stringify({ descripcion_queja }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al enviar queja');
            showToast('Queja enviada exitosamente.', 'success');
            if(complaintModal) complaintModal.classList.remove('active'); 
            loadUserProfile(); 
        } catch (error) { showToast(error.message, 'error'); } 
        finally { if(submitButton) {submitButton.disabled = false; submitButton.textContent = "Enviar Queja";} }
    });

    async function openViewComplaintModal(event) {
        const orderId = event.target.dataset.orderId;
        if (!viewComplaintModal || !viewComplaintDetailsContainer) return;
        viewComplaintDetailsContainer.innerHTML = '<p>Cargando queja...</p>';
        openModal(viewComplaintModal); 
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/complaint`, { headers: { 'Authorization': `Bearer ${getToken()}` }});
            if (!response.ok) throw new Error('Error al cargar la queja.');
            const complaint = await response.json();
            if (!complaint) { viewComplaintDetailsContainer.innerHTML = '<p>No se encontró queja para este pedido.</p>'; return; }
            const titleEl = viewComplaintModal.querySelector('h2');
            if(titleEl) titleEl.textContent = `Detalle de Queja - Pedido #${complaint.codigo_pedido}`;
            viewComplaintDetailsContainer.innerHTML = `<p><strong>Fecha de Queja:</strong> ${new Date(complaint.fecha_queja).toLocaleString()}</p> <p><strong>Estado:</strong> <span class="${getOrderStatusColor(complaint.estado_queja.replace(/_admin|_cliente/g, ''))}">${formatOrderStatus(complaint.estado_queja)}</span></p> <p class="mt-2"><strong>Tu Queja:</strong></p> <p class="bg-gray-100 p-2 rounded">${complaint.descripcion_queja}</p> ${complaint.respuesta_admin ? `<p class="mt-3"><strong>Respuesta de DIAMANTECH (${new Date(complaint.fecha_respuesta_admin).toLocaleString()}):</strong></p> <p class="bg-blue-50 p-2 rounded">${complaint.respuesta_admin}</p>` : '<p class="mt-3 text-gray-500">Aún no hay respuesta del administrador.</p>'}`;
        } catch (error) { viewComplaintDetailsContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`; }
    }
    
    if (closeViewComplaintModalBtn) {
        closeViewComplaintModalBtn.addEventListener('click', () => {
            if (viewComplaintModal) {
                viewComplaintModal.classList.remove('active');
            }
        });
    }

    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => { if(mobileMenu) mobileMenu.classList.toggle('hidden'); });
    if(scrollToTopBtn) { window.addEventListener('scroll', () => { if (window.pageYOffset > 300) { if(scrollToTopBtn) scrollToTopBtn.classList.remove('hidden'); } else { if(scrollToTopBtn) scrollToTopBtn.classList.add('hidden'); } }); if(scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); }
    const currentYearEl = document.getElementById('currentYear');
    if(currentYearEl) currentYearEl.textContent = new Date().getFullYear();
    document.querySelectorAll('a.nav-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === "#inicio" || targetId === "#catalogo" || targetId === "#nosotros" || targetId === "#equipo-seccion") {
                showView('main'); 
                setTimeout(() => { const targetElement = document.querySelector(targetId); if (targetElement) { const headerOffset = document.querySelector('header')?.offsetHeight || 70; const elementPosition = targetElement.getBoundingClientRect().top; const offsetPosition = elementPosition + window.pageYOffset - headerOffset; window.scrollTo({ top: offsetPosition, behavior: "smooth" }); } if (mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden'); }, 50);
            } else { const targetElement = document.querySelector(targetId); if (targetElement) { const headerOffset = document.querySelector('header')?.offsetHeight || 70; const elementPosition = targetElement.getBoundingClientRect().top; const offsetPosition = elementPosition + window.pageYOffset - headerOffset; window.scrollTo({ top: offsetPosition, behavior: "smooth"}); } if (mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden');}
        });
    });
    
    hideAllModals();
    loadUserSession(); 
    fetchCategories(); 
    showView('main'); 
});
