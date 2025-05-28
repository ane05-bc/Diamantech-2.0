// frontend/js/script.js

// API Base URL (ajusta si tu backend corre en otro puerto/dominio)
const API_BASE_URL = 'http://localhost:3000/api'; // Asegúrate que el puerto coincida con tu server.js

// Mock product data (será reemplazado por llamadas a API)
// const allMockProducts = [ ... ]; // Conservar por si la API falla o para desarrollo inicial
let allProductsData = []; // Para almacenar productos de la API
let allCategoriesData = []; // Para almacenar categorías de la API

let cart = []; // El carrito del usuario, se sincronizará con el backend
let currentUser = null; // Para almacenar información del usuario logueado y token
let currentOrderDetails = null; // Para almacenar detalles del pedido actual durante el checkout

document.addEventListener('DOMContentLoaded', () => {
    // Selectores de Elementos (sin cambios, pero asegúrate que todos estén)
    const mainPageContent = document.getElementById('mainPageContent');
    const categoryView = document.getElementById('categoryView');
    const checkoutPage = document.getElementById('checkoutPage');
    const orderConfirmationPage = document.getElementById('orderConfirmationPage'); // NUEVO para mostrar QR y estado

    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartToggleBtnMobileHeader = document.getElementById('cartToggleBtnMobileHeader');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartItemCountMobileHeader = document.getElementById('cartItemCountMobileHeader');
    const cartSubtotalDisplay = document.getElementById('cartSubtotalDisplay');
    const cartEmptyMessage = document.getElementById('cartEmptyMessage');
    const cartTotalsDiv = document.getElementById('cartTotals');
        
    const authModal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn'); // Botón "LOG IN" en el header
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const logoutBtn = document.getElementById('logoutBtn'); // NUEVO: Botón de Logout
    const userGreeting = document.getElementById('userGreeting'); // NUEVO: Saludo al usuario

    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        
    const mainCatalogCategoriesContainer = document.getElementById('mainCatalogCategories'); // Contenedor para categorías en #catalogo
    const categoryTitleEl = document.getElementById('categoryTitle');
    const categoryProductsGridEl = document.getElementById('categoryProductsGrid');
    const backToMainCatalogBtn = document.getElementById('backToMainCatalogBtn');

    const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');
    const backToCartBtn = document.getElementById('backToCartBtn'); // En la página de checkout
    const shippingForm = document.getElementById('shippingForm'); // Formulario de envío
    const confirmPurchaseBtn = document.getElementById('confirmPurchaseBtn');
    const checkoutOrderSummaryEl = document.getElementById('checkoutOrderSummary');
    const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
    const checkoutShippingEl = document.getElementById('checkoutShipping'); // Para mostrar costo de envío
    const checkoutTotalEl = document.getElementById('checkoutTotal');

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
        fetchCart(); // Cargar carrito después de iniciar sesión
    }

    function getToken() {
        return currentUser ? currentUser.token : null;
    }

    function loadUserSession() {
        const storedUser = localStorage.getItem('diamantechUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            // Opcional: verificar si el token aún es válido con un endpoint de 'verifyToken' o 'getProfile'
            updateUserUI();
            fetchCart(); // Cargar carrito si hay sesión
        } else {
            updateUserUI(); // Asegura que la UI esté en estado "no logueado"
        }
    }

    function clearUserSession() {
        localStorage.removeItem('diamantechUser');
        currentUser = null;
        cart = []; // Limpiar carrito local al cerrar sesión
        updateUserUI();
        renderCartItems(); // Actualizar vista del carrito
    }

    function isLoggedIn() {
        return !!currentUser && !!currentUser.token;
    }

    function updateUserUI() {
        if (isLoggedIn()) {
            if(loginBtn) loginBtn.classList.add('hidden');
            if(loginBtnMobile) loginBtnMobile.classList.add('hidden');
            if(logoutBtn) logoutBtn.classList.remove('hidden');
            if(userGreeting) {
                userGreeting.textContent = `Hola, ${currentUser.usuario.nombre_completo.split(' ')[0]}`;
                userGreeting.classList.remove('hidden');
            }
        } else {
            if(loginBtn) loginBtn.classList.remove('hidden');
            if(loginBtnMobile) loginBtnMobile.classList.remove('hidden');
            if(logoutBtn) logoutBtn.classList.add('hidden');
            if(userGreeting) userGreeting.classList.add('hidden');
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
        orderConfirmationPage.classList.add('view-hidden'); // Ocultar nueva vista
            
        if (viewToShow === 'main') mainPageContent.classList.remove('view-hidden');
        if (viewToShow === 'category') categoryView.classList.remove('view-hidden');
        if (viewToShow === 'checkout') checkoutPage.classList.remove('view-hidden');
        if (viewToShow === 'confirmation') orderConfirmationPage.classList.remove('view-hidden'); // Mostrar nueva vista
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
                    // Suponemos que el producto tiene variantes y necesitamos mostrar un producto "base"
                    // y luego el usuario seleccionará la variante en la página de detalle del producto (no implementada aquí)
                    // Por ahora, usaremos el precio_base o precio_final_desde si viene del backend
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
                    // NOTA: El botón "Añadir al Carrito" aquí es simplificado. 
                    // Idealmente, llevaría a una página de detalle del producto donde se selecciona la VARIANTE.
                    // Por ahora, este botón necesitará una lógica para seleccionar una variante por defecto o abrir un modal de variantes.
                    // Para la demostración actual, asumiremos que al hacer clic se añade la "primera variante disponible" o se pide al usuario que inicie sesión.
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
    
    if(backToMainCatalogBtn) backToMainCatalogBtn.addEventListener('click', () => showView('main'));

    // --- Lógica del Carrito ---
    function toggleCartModal() {
        cartModal.classList.toggle('active');
        if (cartModal.classList.contains('active')) {
            renderCartItems(); // Siempre renderizar al abrir para reflejar cambios
        }
    }
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
                if (response.status === 401) clearUserSession(); // Token inválido
                throw new Error('Error al cargar el carrito');
            }
            const cartData = await response.json();
            // El backend devuelve { items: [], subtotal: X, id_carrito: Y }
            // Mapeamos los items del backend a la estructura que usa el frontend si es necesario.
            // La estructura del backend es: ic.cantidad, ic.precio_unitario_al_agregar, pv.id_variante, pv.sku_variante, p.nombre_producto etc.
            // La estructura del frontend (cart.push({ ...product, quantity: 1 })) es más simple.
            // Necesitamos adaptar.
            cart = cartData.items.map(item => ({
                id: item.id_variante, // Usamos id_variante como 'id' único del item en el carrito frontend
                cart_item_id: item.id_item_carrito, // ID del item en la tabla ItemsCarrito
                name: item.nombre_producto,
                price: parseFloat(item.precio_unitario_al_agregar), // Precio al momento de agregar
                quantity: item.cantidad,
                image: item.imagen_variante_url || product.imagen_principal_url || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joya', // Mejorar esto
                sku: item.sku_variante,
                attributes: item.atributos_variante ? (typeof item.atributos_variante === 'string' ? JSON.parse(item.atributos_variante) : item.atributos_variante) : {}
            }));
            renderCartItems();
        } catch (error) {
            console.error("Error en fetchCart:", error);
            showToast('No se pudo cargar tu carrito.', 'error');
            cart = []; // Resetear carrito local en caso de error grave
            renderCartItems();
        }
    }

    function renderCartItems() {
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
                let attributesString = '';
                if (item.attributes && typeof item.attributes === 'object' && Object.keys(item.attributes).length > 0) {
                    attributesString = Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
                }

                itemElement.innerHTML = `
                    <img src="${item.image || 'https://placehold.co/80x80/E2E8F0/A0AEC0?text=Joyeria'}" alt="[Imagen de ${item.name}]" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md mr-3 md:mr-4" onerror="this.onerror=null;this.src='https://placehold.co/80x80/E2E8F0/A0AEC0?text=Error+Imagen';">
                    <div class="flex-grow">
                        <h3 class="font-semibold text-sm md:text-base">${item.name}</h3>
                        ${attributesString ? `<p class="text-xs md:text-sm text-gray-500">${attributesString}</p>` : ''}
                        <p class="text-blue-600 font-bold text-sm md:text-base">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="ml-auto flex flex-col md:flex-row items-end md:items-center">
                        <input type="number" value="${item.quantity}" min="1" class="w-12 text-center border rounded-md p-1 mb-1 md:mb-0 md:mr-2 cart-item-quantity" data-item-id="${item.cart_item_id || item.id}" data-variant-id="${item.id}">
                        <button class="text-red-500 hover:text-red-700 remove-cart-item" data-item-id="${item.cart_item_id || item.id}" data-variant-id="${item.id}"><i class="fas fa-trash"></i></button>
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
        if (!isLoggedIn()) {
            showToast('Debes iniciar sesión para añadir productos al carrito.', 'info');
            toggleAuthModal();
            return;
        }
        
        const productSlug = event.target.dataset.productSlug;
        // Idealmente, aquí abriríamos un modal para seleccionar la variante del producto.
        // Por ahora, vamos a simular que obtenemos la primera variante disponible del producto.
        try {
            showToast('Obteniendo detalles del producto...', 'info');
            const response = await fetch(`${API_BASE_URL}/products/${productSlug}`);
            if (!response.ok) throw new Error('Producto no encontrado o no disponible.');
            const productDetails = await response.json();

            if (!productDetails.variantes || productDetails.variantes.length === 0) {
                showToast('Este producto no tiene variantes disponibles en este momento.', 'error');
                return;
            }
            // Seleccionamos la primera variante como ejemplo
            const variantToAdd = productDetails.variantes[0]; 
            
            await addItemToBackendCart(variantToAdd.id_variante, 1);

        } catch (error) {
            console.error("Error al obtener detalles del producto para añadir al carrito:", error);
            showToast(error.message || 'Error al añadir el producto.', 'error');
        }
    }
    
    async function addItemToBackendCart(variantId, quantity) {
        if (!isLoggedIn()) {
             showToast('Debes iniciar sesión para añadir productos.', 'info');
             toggleAuthModal();
             return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cart/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ id_variante: variantId, cantidad: quantity })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al añadir item al carrito');
            }
            showToast(result.message || 'Item añadido al carrito.', 'success');
            await fetchCart(); // Recargar carrito desde el backend
        } catch (error) {
            console.error("Error en addItemToBackendCart:", error);
            showToast(error.message, 'error');
        }
    }


    async function handleQuantityChange(event) {
        if (!isLoggedIn()) {
            // Lógica para carrito de invitado si se implementa
            showToast('Inicia sesión para modificar tu carrito.', 'info');
            return;
        }
        const itemId = event.target.dataset.itemId; // Este es id_item_carrito
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
            await fetchCart(); // Re-fetch para asegurar consistencia incluso en error
        }
    }

    async function handleRemoveItem(event) {
        if (!isLoggedIn()) {
            // Lógica para carrito de invitado
            showToast('Inicia sesión para modificar tu carrito.', 'info');
            return;
        }
        const itemId = event.currentTarget.dataset.itemId; // Este es id_item_carrito
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
    if(goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', () => {
        if (!isLoggedIn()) {
            showToast('Debes iniciar sesión para proceder al pago.', 'info');
            toggleAuthModal();
            return;
        }
        if (cart.length === 0) {
            showToast('Tu carrito está vacío. Añade productos antes de pagar.', 'info');
            return;
        }
        loadCheckoutPage();
        toggleCartModal(); // Cerrar modal del carrito
        showView('checkout');
    });

    if(backToCartBtn) backToCartBtn.addEventListener('click', () => {
        showView('main'); // O la vista anterior, ej. 'category' si estaba allí
        toggleCartModal(); // Abrir modal del carrito
    });
    
    function loadCheckoutPage() {
        checkoutOrderSummaryEl.innerHTML = '';
        let subtotal = 0;
        const shippingCost = 10.00; // Podría venir de configuración o API

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

    if(shippingForm) shippingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevenir envío tradicional, manejaremos con confirmPurchaseBtn
    });

    if(confirmPurchaseBtn) confirmPurchaseBtn.addEventListener('click', async () => {
        if (!shippingForm.checkValidity()) {
            showToast('Por favor, completa todos los campos de envío requeridos.', 'error');
            shippingForm.reportValidity();
            return;
        }

        const shippingData = {
            nombre_cliente_envio: document.getElementById('fullName').value,
            direccion_envio_completa: document.getElementById('address').value,
            email_contacto_envio: document.getElementById('emailCheckout').value,
            // costo_envio se podría enviar si es variable, o el backend lo calcula/fija
        };

        try {
            showToast('Procesando tu pedido...', 'info');
            const response = await fetch(`${API_BASE_URL}/orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(shippingData)
            });
            const orderResult = await response.json();

            if (!response.ok) {
                throw new Error(orderResult.message || 'Error al crear el pedido');
            }
            
            currentOrderDetails = orderResult; // Guardar detalles del pedido creado
            // { message, id_pedido, codigo_pedido, total_pedido, estado_pedido, paymentInfo: { qrDataString, qrImageUrl, instructions } }
            
            showToast(orderResult.message || 'Pedido creado, pendiente de pago.', 'success');
            displayOrderConfirmation(orderResult);
            await fetchCart(); // El carrito debería estar vacío ahora en el backend

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
        currentOrderDetails = null; // Limpiar detalles del pedido actual
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
        const nombre_completo = registerForm.nombre_completo.value; // Cambiado de 'name' y 'apellido' a 'nombre_completo'
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const confirmPassword = registerForm.confirmPassword.value;
        const telefono = registerForm.telefono.value; // Añadido campo teléfono

        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden.', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_completo, email, password, telefono })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar usuario');
            }
            saveUserSession(data); // data = { message, token, usuario: { ... } }
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
        showView('main'); // Regresar a la página principal
    });

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
    loadUserSession(); // Cargar sesión al iniciar
    fetchCategories(); // Cargar categorías principales
    showView('main'); // Mostrar vista principal por defecto
    // renderCartItems(); // Se llama dentro de loadUserSession o fetchCart
});
