// Mock product data
const allMockProducts = [
    { id: 101, category: "Anillos", name: "Anillo Diamante Solitario", price: 1250.00, image: "img/catalogo/anillos/anillo2.jpg", description: "Clásico anillo de compromiso con diamante solitario." },
    { id: 102, category: "Anillos", name: "Anillo Esmeralda Vintage", price: 980.00, image: "img/catalogo/anillos/anillo.jpg", description: "Elegante anillo con esmeralda y diseño vintage." },
    { id: 103, category: "Anillos", name: "Anillo Oro Rosa Moderno", price: 750.00, image: "img/catalogo/anillos/anillor.jpg", description: "Anillo moderno en oro rosa con incrustaciones." },
    { id: 201, category: "Pendientes", name: "Pendientes Perla Clásicos", price: 320.00, image: "https://placehold.co/300x300/FAF089/975A16?text=Pendientes+Perla", description: "Pendientes de perla cultivada, un toque de elegancia." },
    { id: 202, category: "Pendientes", name: "Aretes Diamante Brillante", price: 680.00, image: "https://placehold.co/300x300/BEE3F8/2A4365?text=Aretes+Diamante", description: "Aretes brillantes con pequeños diamantes." },
    { id: 301, category: "Collares", name: "Collar Corazón Zafiro", price: 890.00, image: "https://placehold.co/300x300/A3BFFA/2C5282?text=Collar+Zafiro", description: "Delicado collar con dije de corazón y zafiro." },
    { id: 302, category: "Collares", name: "Gargantilla Oro Blanco", price: 1100.00, image: "https://placehold.co/300x300/EBF4FF/4299E1?text=Gargantilla+Oro", description: "Sofisticada gargantilla en oro blanco de 18k." },
    { id: 401, category: "Pulseras", name: "Pulsera Infinito Plata", price: 250.00, image: "https://placehold.co/300x300/D6BCFA/6B46C1?text=Pulsera+Plata", description: "Pulsera de plata con símbolo de infinito." },
    { id: 402, category: "Pulseras", name: "Brazalete Rígido Dorado", price: 480.00, image: "https://placehold.co/300x300/FBD38D/975A16?text=Brazalete+Dorado", description: "Imponente brazalete rígido bañado en oro." },
];
let cart = [];
    document.addEventListener('DOMContentLoaded', () => {
        const mainPageContent = document.getElementById('mainPageContent');
        const categoryView = document.getElementById('categoryView');
        const checkoutPage = document.getElementById('checkoutPage');

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
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnMobile = document.getElementById('loginBtnMobile');
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
            
        const categoryCards = document.querySelectorAll('.product-card[data-category]');
        const categoryTitleEl = document.getElementById('categoryTitle');
        const categoryProductsGridEl = document.getElementById('categoryProductsGrid');
        const backToMainCatalogBtn = document.getElementById('backToMainCatalogBtn');

        const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');
        const backToCartBtn = document.getElementById('backToCartBtn');
        const confirmPurchaseBtn = document.getElementById('confirmPurchaseBtn');
        const checkoutOrderSummaryEl = document.getElementById('checkoutOrderSummary');
        const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
        const checkoutTotalEl = document.getElementById('checkoutTotal');

        function showView(viewToShow) {
            mainPageContent.classList.add('view-hidden');
            categoryView.classList.add('view-hidden');
            checkoutPage.classList.add('view-hidden');
                
            if (viewToShow === 'main') mainPageContent.classList.remove('view-hidden');
            if (viewToShow === 'category') categoryView.classList.remove('view-hidden');
            if (viewToShow === 'checkout') checkoutPage.classList.remove('view-hidden');
            window.scrollTo(0, 0);
        }

        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const categoryName = card.dataset.category;
                loadCategoryPage(categoryName);
            });
        });

        function loadCategoryPage(categoryName) {
            categoryTitleEl.textContent = `Catálogo: ${categoryName}`;
            const productsInCategory = allMockProducts.filter(p => p.category === categoryName);
            categoryProductsGridEl.innerHTML = ''; 

            if (productsInCategory.length === 0) {
                categoryProductsGridEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay productos en esta categoría en este momento.</p>';
            } else {
                productsInCategory.forEach(product => {
                    const productEl = document.createElement('div');
                    productEl.className = 'category-product-card bg-white p-6 rounded-lg shadow-lg text-center';
                    productEl.innerHTML = `
                        <img src="${product.image}" alt="[Imagen de ${product.name}]" class="w-full h-48 object-cover rounded-md mb-4 mx-auto">
                        <h3 class="text-xl font-semibold mb-1 text-gray-800">${product.name}</h3>
                        <p class="text-sm text-gray-500 mb-2">${product.description.substring(0,50)}...</p>
                        <p class="text-lg font-bold text-blue-600 mb-3">$${product.price.toFixed(2)}</p>
                        <button class="add-to-cart-btn bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm" data-product-id="${product.id}">
                        <i class="fas fa-cart-plus mr-1"></i> Añadir al Carrito
                        </button>
                    `;
                    categoryProductsGridEl.appendChild(productEl);
                });
            }
            showView('category');
            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', handleAddToCartFromCategory);
            });
        }
            
        function handleAddToCartFromCategory(event) {
            const productId = parseInt(event.target.dataset.productId);
            const productToAdd = allMockProducts.find(p => p.id === productId);
            if (productToAdd) {
                addItemToCart(productToAdd);
            }
        }

        backToMainCatalogBtn.addEventListener('click', () => showView('main'));

        function toggleCartModal() {
            cartModal.classList.toggle('active');
            if (cartModal.classList.contains('active')) {
                renderCartItems();
            }
        }
        if(cartToggleBtn) cartToggleBtn.addEventListener('click', toggleCartModal);
        if(cartToggleBtnMobileHeader) cartToggleBtnMobileHeader.addEventListener('click', toggleCartModal);
        if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCartModal);

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
                    itemElement.innerHTML = `
                        <img src="${item.image}" alt="[Imagen de ${item.name}]" class="w-20 h-20 object-cover rounded-md mr-4">
                        <div>
                            <h3 class="font-semibold">${item.name}</h3>
                            <p class="text-sm text-gray-500">${item.details || ''}</p>
                            <p class="text-blue-600 font-bold">$${item.price.toFixed(2)}</p>
                        </div>
                        <div class="ml-auto flex items-center">
                            <input type="number" value="${item.quantity}" min="1" class="w-12 text-center border rounded-md p-1 mr-2 cart-item-quantity" data-id="${item.id}">
                            <button class="text-red-500 hover:text-red-700 remove-cart-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
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

        function addItemToCart(product) {
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            renderCartItems();
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-md z-[100]';
            toast.textContent = `${product.name} añadido al carrito!`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 2000);
        }

        function handleQuantityChange(event) {
            const itemId = parseInt(event.target.dataset.id);
            const newQuantity = parseInt(event.target.value);
            const item = cart.find(i => i.id === itemId);
            if (item && newQuantity > 0) {
                item.quantity = newQuantity;
            } else if (item && newQuantity <= 0) {
                cart = cart.filter(i => i.id !== itemId);
            }
            renderCartItems();
        }

        function handleRemoveItem(event) {
            const itemId = parseInt(event.currentTarget.dataset.id);
            cart = cart.filter(item => item.id !== itemId);
            renderCartItems();
        }            
        function updateCartCount() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            if(cartItemCount) cartItemCount.textContent = totalItems;
            if(cartItemCountMobileHeader) cartItemCountMobileHeader.textContent = totalItems;
        }

            goToCheckoutBtn.addEventListener('click', () => {
                if (cart.length === 0) {
                    const cartModalContent = cartModal.querySelector('.cart-modal-content');
                    let msg = cartModalContent.querySelector('.checkout-warning-msg');
                    if (!msg) {
                        msg = document.createElement('p');
                        msg.className = 'checkout-warning-msg text-red-500 text-sm text-center mt-2';
                        cartTotalsDiv.insertAdjacentElement('afterend', msg);
                    }
                    msg.textContent = 'Tu carrito está vacío. Añade productos antes de proceder al pago.';
                    setTimeout(() => msg.remove(), 3000);
                    return;
                }
                loadCheckoutPage();
                toggleCartModal();
                showView('checkout');
            });

            backToCartBtn.addEventListener('click', () => {
                showView('main'); 
                toggleCartModal();
            });
            
            function loadCheckoutPage() {
                checkoutOrderSummaryEl.innerHTML = '';
                let subtotal = 0;
                const shippingCost = 10.00; 

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
                checkoutTotalEl.textContent = `$${(subtotal + shippingCost).toFixed(2)}`;
            }

            confirmPurchaseBtn.addEventListener('click', () => {
                const form = document.getElementById('shippingForm');
                if (form.checkValidity()) {
                    const checkoutContent = checkoutPage.querySelector('.container');
                    const successMessage = document.createElement('div');
                    successMessage.className = 'mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center';
                    successMessage.innerHTML = `
                        <h3 class="font-bold text-lg">¡Gracias por tu compra!</h3>
                        <p>Tu pedido ha sido procesado exitosamente.</p>
                        <p class="mt-2"><a href="#" id="returnHomeFromCheckout" class="text-green-700 hover:underline font-semibold">Volver a la página principal</a></p>
                    `;
                    checkoutContent.innerHTML = ''; 
                    checkoutContent.appendChild(successMessage);

                    document.getElementById('returnHomeFromCheckout').addEventListener('click', (e) => {
                        e.preventDefault();
                        cart = []; 
                        renderCartItems(); 
                        showView('main');
                    });

                } else {
                    let errorMsg = checkoutPage.querySelector('.form-error-msg');
                    if (!errorMsg) {
                        errorMsg = document.createElement('p');
                        errorMsg.className = 'form-error-msg text-red-500 text-sm text-center mt-4';
                        form.insertAdjacentElement('afterend', errorMsg);
                    }
                    errorMsg.textContent = 'Por favor, completa todos los campos requeridos en la información de envío.';
                    form.reportValidity(); 
                    setTimeout(() => errorMsg.remove(), 4000);
                }
            });

            function toggleAuthModal() {
                authModal.classList.toggle('active');
                loginFormContainer.classList.remove('hidden');
                registerFormContainer.classList.add('hidden');
            }
            if(loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); });
            if(loginBtnMobile) loginBtnMobile.addEventListener('click', (e) => { e.preventDefault(); toggleAuthModal(); mobileMenu.classList.add('hidden');});
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

            if(loginForm) loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Login attempt');
                toggleAuthModal();
            });
            if(registerForm) registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Register attempt');
                toggleAuthModal();
            });

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
                    showView('main'); 
                    setTimeout(() => {
                        const targetId = this.getAttribute('href');
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            // Ajustar el comportamiento de scrollIntoView para que tenga en cuenta el header fijo
                            const headerOffset = 70; // Altura aproximada del header
                            const elementPosition = targetElement.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      
                            window.scrollTo({
                                 top: offsetPosition,
                                 behavior: "smooth"
                            });
                        }
                        if (!mobileMenu.classList.contains('hidden')) {
                            mobileMenu.classList.add('hidden');
                        }
                    }, 50);
                });
            });
            
            showView('main');
            renderCartItems();
        });