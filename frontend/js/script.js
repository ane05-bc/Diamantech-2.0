const API_BASE_URL = 'http://localhost:3000/api';

let cart = []; 
let currentUser = null; 
let currentOrderDetails = null; 
let deliveryZones = [];

document.addEventListener('DOMContentLoaded', () => {
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

    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartToggleBtnMobileHeader = document.getElementById('cartToggleBtnMobileHeader');
    const cartModalEl = document.getElementById('cartModal'); 
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartItemCountMobileHeader = document.getElementById('cartItemCountMobileHeader');
    const cartSubtotalDisplay = document.getElementById('cartSubtotalDisplay');
    const cartEmptyMessage = document.getElementById('cartEmptyMessage');
    const cartTotalsDiv = document.getElementById('cartTotals');
        
    const authModal = document.getElementById('authModal');
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

    // Elementos para la página de confirmación de pedido y QR
    const orderConfirmationTitle = document.getElementById('orderConfirmationTitle');
    const orderQrImage = document.getElementById('orderQrImage');
    const orderQrInstructions = document.getElementById('orderQrInstructions');
    const paymentConfirmationBtn = document.getElementById('paymentConfirmationBtn'); // Botón "He realizado el pago"
    const orderStatusMessage = document.getElementById('orderStatusMessage');
    const backToHomeFromConfirmationBtn = document.getElementById('backToHomeFromConfirmationBtn');


    // --- Funciones de Autenticación y Token ---
    function saveUserSession(userData) {
        localStorage.setItem('diamantechUser', JSON.stringify(userData));
        currentUser = userData;
        updateUserUI();
        fetchCart(); 
    }

    function getToken() {
        return currentUser ? currentUser.token : null;
    }

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
        currentUser = null;
        cart = []; 
        updateUserUI();
        renderCartItems(); 
    }

    function isLoggedIn() {
        return !!currentUser && !!currentUser.token;
    }

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

            if(userGreeting) {
                userGreeting.textContent = `Hola, ${currentUser.usuario.nombre_completo.split(' ')[0]}`;
                userGreeting.classList.remove('hidden');
            }
            if(userGreetingMobile) { 
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
    
    // --- Alertas y Notificaciones ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-xl z-[100]`;
        if (type === 'success') {
            toast.classList.add('bg-green-500');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500');
        } else {
            toast.classList.add('bg-blue-500');
        }
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // --- Navegación entre Vistas ---
    function showView(viewToShow) {
        mainPageContent.classList.add('view-hidden');
        categoryView.classList.add('view-hidden');
        checkoutPage.classList.add('view-hidden');
        orderConfirmationPage.classList.add('view-hidden'); 
        if(userProfilePage) userProfilePage.classList.add('view-hidden');
            
        if (viewToShow === 'main') mainPageContent.classList.remove('view-hidden');
        if (viewToShow === 'category') categoryView.classList.remove('view-hidden');
        if (viewToShow === 'checkout') checkoutPage.classList.remove('view-hidden');
        if (viewToShow === 'confirmation') orderConfirmationPage.classList.remove('view-hidden'); 
        if (viewToShow === 'profile' && userProfilePage) userProfilePage.classList.remove('view-hidden');
        window.scrollTo(0, 0);
    }

    // --- Carga de Datos (Categorías y Productos) ---
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/products/categories`);
            if (!response.ok) throw new Error('Error al cargar categorías');
            allCategoriesData = await response.json();
            renderMainCategories();
        } catch (error) {
            console.error("Error en fetchCategories:", error);
            if(mainCatalogCategoriesContainer) mainCatalogCategoriesContainer.innerHTML = '<p class="text-red-500 col-span-full text-center">No se pudieron cargar las categorías. Intenta más tarde.</p>';
        }
    }

    function renderMainCategories() {
        if (!mainCatalogCategoriesContainer) return;
        mainCatalogCategoriesContainer.innerHTML = '';
        if (allCategoriesData.length === 0) {
             mainCatalogCategoriesContainer.innerHTML = '<p class="col-span-full text-center">No hay categorías disponibles.</p>';
             return;
        }
        allCategoriesData.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'product-card bg-white p-6 rounded-lg shadow-xl text-center cursor-pointer';
            categoryCard.dataset.categorySlug = category.slug_categoria; // Usar slug para cargar productos
            categoryCard.dataset.categoryName = category.nombre_categoria; 
            categoryCard.innerHTML = `
                <img src="${category.imagen_url_categoria || 'https://placehold.co/400x300/E2E8F0/A0AEC0?text=Joyeria'}" alt="[Imagen de ${category.nombre_categoria}]" class="w-full h-56 object-cover rounded-md mb-5 mx-auto" onerror="this.onerror=null;this.src='https://placehold.co/400x300/E2E8F0/A0AEC0?text=Error+Imagen';">
                <h3 class="text-2xl font-semibold mb-2 text-blue-600">${category.nombre_categoria}</h3>
                <p class="text-gray-600">${category.descripcion_categoria || 'Explora nuestra selección.'}</p>
            `;
            categoryCard.addEventListener('click', () => {
                loadCategoryProductsPage(category.slug_categoria, category.nombre_categoria);
            });
            mainCatalogCategoriesContainer.appendChild(categoryCard);
        });
    }

    async function loadCategoryProductsPage(categorySlug, categoryName) {
        categoryTitleEl.textContent = `Catálogo: ${categoryName}`;
        categoryProductsGridEl.innerHTML = '<p class="col-span-full text-center text-gray-500">Cargando productos...</p>';
        showView('category');
        try {
            const response = await fetch(`${API_BASE_URL}/products/category/${categorySlug}`);
            if (!response.ok) throw new Error(`Error al cargar productos para ${categoryName}`);
            const productsInCategory = await response.json();
            
            categoryProductsGridEl.innerHTML = ''; 
            if (productsInCategory.length === 0) {
                categoryProductsGridEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay productos en esta categoría en este momento.</p>';
            } else {
                productsInCategory.forEach(product => {
                   
                    const displayPrice = product.precio_final_desde || product.precio_base;

                    const productEl = document.createElement('div');
                    productEl.className = 'category-product-card bg-white p-6 rounded-lg shadow-lg text-center';
                    productEl.innerHTML = `
                        <img src="${product.imagen_principal_url || 'https://placehold.co/300x200/E2E8F0/A0AEC0?text=Producto'}" alt="[Imagen de ${product.nombre_producto}]" class="w-full h-48 object-cover rounded-md mb-4 mx-auto" onerror="this.onerror=null;this.src='https://placehold.co/300x200/E2E8F0/A0AEC0?text=Error+Imagen';">
                        <h3 class="text-xl font-semibold mb-1 text-gray-800">${product.nombre_producto}</h3>
                        <p class="text-sm text-gray-500 mb-2">${(product.descripcion_corta || '').substring(0,50)}...</p>
                        <p class="text-lg font-bold text-blue-600 mb-3">$${parseFloat(displayPrice).toFixed(2)}</p>
                        <button class="add-to-cart-btn bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm" data-product-id="${product.id_producto}" data-product-slug="${product.slug_producto}">
                            <i class="fas fa-cart-plus mr-1"></i> Añadir al Carrito
                        </button>
                    `;
                    categoryProductsGridEl.appendChild(productEl);
                });
                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', handleAddToCartClick);
                });
            }
        } catch (error) {
            console.error("Error en loadCategoryProductsPage:", error);
            categoryProductsGridEl.innerHTML = `<p class="col-span-full text-center text-red-500">${error.message}. Intenta más tarde.</p>`;
        }
    }
    async function fetchDeliveryZones() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/delivery-zones`);
            if (!response.ok) throw new Error('Error al cargar zonas de entrega');
            deliveryZones = await response.json();
            populateDeliveryZonesSelect();
        } catch (error) {
            console.error("Error en fetchDeliveryZones:", error);
        }
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

    // --- Lógica del Carrito ---
    function toggleCartModal() { if (cartModalEl) cartModalEl.classList.toggle('active'); if (cartModalEl && cartModalEl.classList.contains('active')) renderCartItems(); }
    if(cartToggleBtn) cartToggleBtn.addEventListener('click', toggleCartModal);
    if(cartToggleBtnMobileHeader) cartToggleBtnMobileHeader.addEventListener('click', toggleCartModal);
    if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCartModal);

    async function fetchCart() {
        if (!isLoggedIn()) {
            cart = JSON.parse(localStorage.getItem('diamantechGuestCart') || '[]'); // Carrito local para invitados
            renderCartItems();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) {
                if (response.status === 401) clearUserSession(); 
                throw new Error('Error al cargar el carrito');
            }
            else{
                const cartData = await response.json();
                cart = cartData.items.map(item => ({
                    id: item.id_producto, // USA ID_PRODUCTO
                    cart_item_id: item.id_item_carrito, 
                    name: item.nombre_producto,
                    price: parseFloat(item.precio_unitario_al_agregar), 
                    quantity: item.cantidad,
                    image: item.imagen_principal_url || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joya', 
                    sku: item.sku,
                }));
            }
            renderCartItems();
        } catch (error) {
            console.error("Error en fetchCart:", error);
            showToast('No se pudo cargar tu carrito.', 'error');
            cart = []; 
            renderCartItems();
        }
    }

    function renderCartItems() {
        if (!cartItemsContainer || !cartEmptyMessage || !cartTotalsDiv || !cartSubtotalDisplay) return;
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        if (cart.length === 0) {
            cartEmptyMessage.classList.remove('hidden');
            cartTotalsDiv.classList.add('hidden');
        } else {
            cartEmptyMessage.classList.add('hidden');
            cartTotalsDiv.classList.remove('hidden');
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'flex items-center border-b pb-4';
                const imageUrl = item.image || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joyeria';
                itemElement.innerHTML = `
                    <img src="${imageUrl}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md mr-3 md:mr-4" onerror="this.onerror=null;this.src='https://placehold.co/80x80/E2E8F0/A0AEC0?text=Error+Imagen';">
                    <div class="flex-grow">
                        <h3 class="font-semibold text-sm md:text-base">${item.name}</h3>
                        <p class="text-blue-600 font-bold text-sm md:text-base">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="ml-auto flex flex-col md:flex-row items-end md:items-center">
                        <input type="number" value="${item.quantity}" min="1" class="w-12 text-center border rounded-md p-1 mb-1 md:mb-0 md:mr-2 cart-item-quantity" data-item-id="${item.cart_item_id}" data-product-id="${item.id}">
                        <button class="text-red-500 hover:text-red-700 remove-cart-item" data-item-id="${item.cart_item_id}" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
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
        if (!isLoggedIn()) { /* ... (como antes) ... */ return; }
        const productId = event.target.dataset.productId; // Ahora es directo id_producto
        const productName = event.target.closest('.category-product-card').querySelector('h3').textContent; // Para el toast
        if (!productId) {
            showToast('ID de producto no encontrado.', 'error');
            return;
        }
        await addItemToBackendCart(productId, 1, productName);
    }
    
    async function addItemToBackendCart(productId, quantity, productName) {
        if (!isLoggedIn()) {
             showToast('Debes iniciar sesión para añadir productos.', 'info');
             toggleAuthModal();
             return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cart/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ id_producto: productId, cantidad: quantity }) // CAMBIO: id_producto
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al añadir item');
            showToast(`${productName || 'Item'} añadido al carrito.`, 'success');
            await fetchCart();
        } catch (error) { showToast(error.message, 'error'); }
    }

    async function handleQuantityChange(event) {
        if (!isLoggedIn()) {
            showToast('Inicia sesión para modificar tu carrito.', 'info');
            return;
        }
        const itemId = event.target.dataset.itemId; 
        const newQuantity = parseInt(event.target.value);

        if (newQuantity < 1) {
            showToast('La cantidad no puede ser menor a 1. Para eliminar, usa el ícono de basura.', 'info');
            event.target.value = cart.find(item => (item.cart_item_id || item.id) == itemId)?.quantity || 1; // Revertir
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ cantidad: newQuantity })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al actualizar cantidad');
            
            showToast('Cantidad actualizada.', 'success');
            await fetchCart();
        } catch (error) {
            console.error("Error en handleQuantityChange:", error);
            showToast(error.message, 'error');
            await fetchCart();
        }
    }

    async function handleRemoveItem(event) {
        if (!isLoggedIn()) {
            showToast('Inicia sesión para modificar tu carrito.', 'info');
            return;
        }
        const itemId = event.currentTarget.dataset.itemId; 
         try {
            const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al eliminar item');

            showToast('Item eliminado del carrito.', 'success');
            await fetchCart();
        } catch (error) {
            console.error("Error en handleRemoveItem:", error);
            showToast(error.message, 'error');
        }
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if(cartItemCount) cartItemCount.textContent = totalItems;
        if(cartItemCountMobileHeader) cartItemCountMobileHeader.textContent = totalItems;
    }

    // --- Checkout ---
    if(goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) {
            showToast('Debes iniciar sesión para proceder al pago.', 'info');
            toggleAuthModal();
            return;
        }
        if (cart.length === 0) {
            showToast('Tu carrito está vacío. Añade productos antes de pagar.', 'info');
            return;
        }
        try {
            const addressResponse = await fetch(`${API_BASE_URL}/users/me/default-address`, { 
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!addressResponse.ok) {
                const errorData = await addressResponse.json().catch(() => ({}));
                showToast(errorData.message || 'No tienes una dirección predeterminada. Por favor, añádela en tu perfil.', 'info');
                
                if (checkoutAddressInfo) checkoutAddressInfo.innerHTML = `<p class="text-red-500">No se encontró dirección predeterminada. Por favor, configura una en tu perfil.</p>`;
                return; 
            }
            const address = await addressResponse.json();
            loadCheckoutPage(address); 
            toggleCartModalEl(); 
            showView('checkout');

        } catch (error) {
            console.error("Error al obtener dirección para checkout:", error);
            showToast('Error al cargar información de envío.', 'error');
        }
    });

    if(backToCartBtn) backToCartBtn.addEventListener('click', () => {
        showView('main'); 
        toggleCartModal(); 
    });
    
    function loadCheckoutPage(addressData) {
        if (!checkoutOrderSummaryEl || !checkoutSubtotalEl || !checkoutShippingEl || !checkoutTotalEl || !checkoutAddressInfo) return;
        checkoutOrderSummaryEl.innerHTML = '';
        let subtotal = 0;
        const shippingCost = addressData ? parseFloat(addressData.costo_envio_zona) : 10.00; 

        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'flex justify-between items-center text-sm py-1';
            itemEl.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span class="font-medium">$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            checkoutOrderSummaryEl.appendChild(itemEl);
            subtotal += item.price * item.quantity;
        });

        checkoutSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        checkoutShippingEl.textContent = `$${shippingCost.toFixed(2)}`;
        checkoutTotalEl.textContent = `$${(subtotal + shippingCost).toFixed(2)}`;
        if (addressData) {
            checkoutAddressInfo.innerHTML = `
                <h4 class="font-semibold mb-1">Enviar a:</h4>
                <p>${addressData.nombre_destinatario || currentUser.usuario.nombre_completo}</p>
                <p>${addressData.calle_avenida}, Nro. ${addressData.numero_vivienda}</p>
                <p>Zona: ${addressData.nombre_zona}</p>
                ${addressData.referencia_adicional ? `<p>Ref: ${addressData.referencia_adicional}</p>` : ''}
                <p>Teléfono: ${currentUser.usuario.telefono || 'No provisto'}</p>
                `;
            
        } else {
            checkoutAddressInfo.innerHTML = `<p class="text-red-500">No se pudo cargar la dirección de envío.</p>`;
        }
        if(shippingForm) shippingForm.classList.add('hidden');
        // Pre-llenar email si el usuario está logueado
        if (isLoggedIn() && currentUser.usuario.email) {
            const emailInput = document.getElementById('emailCheckout');
            if(emailInput) emailInput.value = currentUser.usuario.email;
        }
         if (isLoggedIn() && currentUser.usuario.nombre_completo) {
            const nameInput = document.getElementById('fullName');
            if(nameInput) nameInput.value = currentUser.usuario.nombre_completo;
        }
    }

    if(confirmPurchaseBtn) confirmPurchaseBtn.addEventListener('click', async () => {
        try {
            showToast('Procesando tu pedido...', 'info');
            const response = await fetch(`${API_BASE_URL}/orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
            });
            const orderResult = await response.json();
            if (!response.ok) throw new Error(orderResult.message || 'Error al crear pedido');
            currentOrderDetails = orderResult; 
            showToast(orderResult.message || 'Pedido creado.', 'success');
            displayOrderConfirmation(orderResult);
            await fetchCart(); 
        } catch (error) {
            console.error("Error al confirmar la compra:", error);
            showToast(error.message, 'error');
        }
    });

    function displayOrderConfirmation(orderData) {
        orderConfirmationTitle.textContent = `Pedido #${orderData.codigo_pedido} Recibido`;
        
        if (orderData.paymentInfo.qrImageUrl) {
            orderQrImage.src = orderData.paymentInfo.qrImageUrl;
            orderQrImage.classList.remove('hidden');
        } else {
            orderQrImage.classList.add('hidden');
            // Podrías mostrar qrDataString en un <pre> o generar QR en frontend si la imagen falla
            console.warn("No se pudo cargar la imagen QR desde el backend. Mostrando datos en texto si es posible.");
        }
        orderQrInstructions.textContent = orderData.paymentInfo.instructions;
        orderStatusMessage.textContent = `Estado actual: ${orderData.estado_pedido}. Por favor, realiza el pago.`;
        paymentConfirmationBtn.classList.remove('hidden'); // Mostrar botón para simular pago
        paymentConfirmationBtn.dataset.orderId = orderData.id_pedido; // Guardar id_pedido para la simulación
        showView('confirmation');
    }
    
    if(paymentConfirmationBtn) paymentConfirmationBtn.addEventListener('click', async (event) => {
        const orderId = event.target.dataset.orderId;
        if (!orderId) {
            showToast('Error: No se encontró ID del pedido para confirmar.', 'error');
            return;
        }
        try {
            showToast('Simulando confirmación de pago...', 'info');
            const response = await fetch(`${API_BASE_URL}/payment/confirm-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ orderId: parseInt(orderId) })
            });
            const paymentResult = await response.json();
            if (!response.ok) {
                throw new Error(paymentResult.message || 'Error al simular la confirmación del pago');
            }
            showToast(paymentResult.message, 'success');
            orderStatusMessage.textContent = `Estado actual: ${paymentResult.newStatus}. ¡Gracias por tu compra!`;
            orderQrImage.classList.add('hidden'); // Ocultar QR
            orderQrInstructions.textContent = 'Tu pago ha sido procesado.';
            paymentConfirmationBtn.classList.add('hidden'); // Ocultar botón de confirmación

        } catch (error) {
            console.error("Error al simular confirmación de pago:", error);
            showToast(error.message, 'error');
             orderStatusMessage.textContent = `Error al procesar el pago. Por favor, contacta a soporte.`;
        }
    });

    if(backToHomeFromConfirmationBtn) backToHomeFromConfirmationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentOrderDetails = null; 
        showView('main');
    });


    // --- Autenticación Modales y Formularios ---
    function toggleAuthModal() {
        authModal.classList.toggle('active');
        if (authModal.classList.contains('active')) {
            // Resetear formularios y mensajes de error al abrir
            loginForm.reset();
            registerForm.reset();
            loginFormContainer.classList.remove('hidden');
            registerFormContainer.classList.add('hidden');
            // Limpiar mensajes de error previos si los hubiera
        }
    }
    if(loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); });
    if(loginBtnMobile) loginBtnMobile.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); if(mobileMenu) mobileMenu.classList.add('hidden');});
    if(closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', toggleAuthModal);

    if(showRegisterForm) showRegisterForm.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });
    if(showLoginForm) showLoginForm.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    if(loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }
            saveUserSession(data); // data = { message, token, usuario: { id_usuario, nombre_completo, email, rol } }
            showToast('Inicio de sesión exitoso.', 'success');
            toggleAuthModal();
        } catch (error) {
            console.error('Error de login:', error);
            showToast(error.message, 'error');
        }
    });

    if(registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nombre_completo: registerForm.nombre_completo.value,
            email: registerForm.email.value,
            password: registerForm.password.value,
            telefono: registerForm.telefono.value,
            id_zona: registerForm.id_zona.value, 
            calle_avenida: registerForm.calle_avenida.value,
            numero_vivienda: registerForm.numero_vivienda.value, 
            referencia_adicional: registerForm.referencia_adicional.value 
        };
        const confirmPassword = registerForm.confirmPassword.value;
        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden.', 'error');
            return;
        }
        if (!formData.id_zona) { showToast('Por favor, selecciona una zona de entrega.', 'error'); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al registrar');
            saveUserSession(data); 
            showToast('Registro exitoso. ¡Bienvenido!', 'success');
            toggleAuthModal();
        } catch (error) {
            console.error('Error de registro:', error);
            showToast(error.message, 'error');
        }
    });
    
    if(logoutBtn) logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearUserSession();
        showToast('Has cerrado sesión.', 'info');
        showView('main'); 
    });
    //const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    //if(logoutBtnMobile) logoutBtnMobile.addEventListener('click', (e) => { /* ... */ });
    // --- Perfil de Usuario y Pedidos ---
    if (profileLink) profileLink.addEventListener('click', (e) => { e.preventDefault(); if(isLoggedIn()) loadUserProfile(); });
    const profileLinkMobile = document.getElementById('profileLinkMobile');
    if (profileLinkMobile) profileLinkMobile.addEventListener('click', (e) => { e.preventDefault(); if(isLoggedIn()) { loadUserProfile(); if(mobileMenu) mobileMenu.classList.add('hidden'); } });

    async function loadUserProfile() {
        if (!userProfilePage || !orderHistoryContainer) return;
        showView('profile');
        orderHistoryContainer.innerHTML = '<p>Cargando historial de pedidos...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Error al cargar historial de pedidos');
            const orders = await response.json();
            renderOrderHistory(orders);
        } catch (error) {
            console.error("Error cargando perfil:", error);
            orderHistoryContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    function renderOrderHistory(orders) {
        if (!orderHistoryContainer) return;
        if (orders.length === 0) {
            orderHistoryContainer.innerHTML = '<p>No tienes pedidos aún.</p>';
            return;
        }
        orderHistoryContainer.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-gray-700">Mis Pedidos</h3>
            <div class="space-y-4">
                ${orders.map(order => `
                    <div class="bg-white p-4 rounded-lg shadow">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold text-blue-600">Pedido #${order.codigo_pedido}</span>
                            <span class="text-sm text-gray-500">${new Date(order.fecha_pedido).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm">Estado: <span class="font-medium ${getOrderStatusColor(order.estado_pedido)}">${formatOrderStatus(order.estado_pedido)}</span></p>
                        <p class="text-sm">Total: <span class="font-medium">$${parseFloat(order.total_pedido).toFixed(2)}</span></p>
                        <div class="mt-2 flex space-x-2">
                            <button class="view-order-details-btn text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" data-order-id="${order.id_pedido}">Ver Detalles</button>
                            ${order.estado_pedido === 'entregado' && !order.tiene_queja ? 
                                `<button class="register-complaint-btn text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded" data-order-id="${order.id_pedido}" data-order-code="${order.codigo_pedido}">Registrar Queja</button>` : ''}
                            ${order.tiene_queja ? 
                                `<button class="view-complaint-btn text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded" data-order-id="${order.id_pedido}">Ver Queja</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        // Event Listeners para botones de pedidos
        document.querySelectorAll('.register-complaint-btn').forEach(btn => btn.addEventListener('click', openComplaintModal));
        document.querySelectorAll('.view-complaint-btn').forEach(btn => btn.addEventListener('click', openViewComplaintModal));
        document.querySelectorAll('.view-order-details-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            showToast(`Cargando detalles del pedido ${orderId}...`, 'info');
        }));
    }
    function getOrderStatusColor(status) {
        const colors = {
            'pendiente_pago': 'text-yellow-600', 'pagado': 'text-green-600', 'en_proceso': 'text-blue-600',
            'enviado': 'text-purple-600', 'entregado': 'text-teal-600', 'cancelado': 'text-red-600', 'fallido': 'text-red-700'
        };
        return colors[status] || 'text-gray-600';
    }
    function formatOrderStatus(status) {
        return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // --- Sistema de Quejas (Cliente) ---
    function openComplaintModal(event) {
        const orderId = event.target.dataset.orderId;
        const orderCode = event.target.dataset.orderCode;
        if (complaintModal && complaintOrderIdHidden && complaintForm) {
            complaintOrderIdHidden.value = orderId;
            complaintForm.reset();
            complaintModal.querySelector('h2').textContent = `Registrar Queja para Pedido #${orderCode}`;
            complaintModal.classList.add('active');
        }
    }
    if (closeComplaintModalBtn) closeComplaintModalBtn.addEventListener('click', () => complaintModal.classList.remove('active'));
    if (complaintForm) complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const orderId = complaintOrderIdHidden.value;
        const descripcion_queja = complaintForm.descripcion_queja.value;
        if (!descripcion_queja.trim()) {
            showToast('Por favor, describe tu queja.', 'error'); return;
        }
        try {
            complaintForm.querySelector('button[type="submit"]').disabled = true;
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/complaint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`},
                body: JSON.stringify({ descripcion_queja })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al enviar queja');
            showToast('Queja enviada exitosamente.', 'success');
            complaintModal.classList.remove('active');
            loadUserProfile(); // Recargar historial para mostrar queja
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            if (complaintForm.querySelector('button[type="submit"]')) complaintForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

    async function openViewComplaintModal(event) {
        const orderId = event.target.dataset.orderId;
        if (!viewComplaintModal || !viewComplaintDetailsContainer) return;
        viewComplaintDetailsContainer.innerHTML = '<p>Cargando queja...</p>';
        viewComplaintModal.classList.add('active');
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/complaint`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Error al cargar la queja.');
            const complaint = await response.json();
            if (!complaint) {
                viewComplaintDetailsContainer.innerHTML = '<p>No se encontró queja para este pedido.</p>'; return;
            }
            viewComplaintModal.querySelector('h2').textContent = `Detalle de Queja - Pedido #${complaint.codigo_pedido}`;
            viewComplaintDetailsContainer.innerHTML = `
                <p><strong>Fecha de Queja:</strong> ${new Date(complaint.fecha_queja).toLocaleString()}</p>
                <p><strong>Estado:</strong> <span class="${getOrderStatusColor(complaint.estado_queja.replace(/_admin|_cliente/g, ''))}">${formatOrderStatus(complaint.estado_queja)}</span></p>
                <p class="mt-2"><strong>Tu Queja:</strong></p>
                <p class="bg-gray-100 p-2 rounded">${complaint.descripcion_queja}</p>
                ${complaint.respuesta_admin ? `
                    <p class="mt-3"><strong>Respuesta de DIAMANTECH (${new Date(complaint.fecha_respuesta_admin).toLocaleString()}):</strong></p>
                    <p class="bg-blue-50 p-2 rounded">${complaint.respuesta_admin}</p>
                ` : '<p class="mt-3 text-gray-500">Aún no hay respuesta del administrador.</p>'}
            `;
        } catch (error) {
            viewComplaintDetailsContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if (closeViewComplaintModalBtn) closeViewComplaintModalBtn.addEventListener('click', () => viewComplaintModal.classList.remove('active'));
    
    // --- UI General y Navegación ---
    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    if(scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) scrollToTopBtn.classList.remove('hidden');
            else scrollToTopBtn.classList.add('hidden');
        });
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    document.querySelectorAll('a.nav-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === "#inicio" || targetId === "#catalogo" || targetId === "#nosotros" || targetId === "#equipo-seccion") {
                showView('main'); 
                // Esperar a que la vista principal esté visible antes de hacer scroll
                setTimeout(() => {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const headerOffset = document.querySelector('header')?.offsetHeight || 70; 
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                    }
                    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                    }
                }, 50);
            } else {
                 // Para otros enlaces que no cambian de vista principal
                 const targetElement = document.querySelector(targetId);
                 if (targetElement) {
                    const headerOffset = document.querySelector('header')?.offsetHeight || 70;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth"});
                 }
                 if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
    
    // --- Inicialización ---
    loadUserSession(); 
    fetchCategories(); 
    // fetchDeliveryZones(); // Se llama al abrir el modal de registro
    showView('main'); 
});
