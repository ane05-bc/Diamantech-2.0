// frontend/js/admin_script.js
const API_BASE_URL = 'http://localhost:3000/api'; 
let adminToken = null;
let currentEditingProductId = null;
let currentEditingCategoryId = null;
let currentViewingOrderId = null;
let currentManagingComplaintId = null;
let adminCategoriesCache = []; 
let adminProductsCache = []; 

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginContainer = document.getElementById('adminLoginContainer');
    const adminDashboardContainer = document.getElementById('adminDashboardContainer');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminUserGreeting = document.getElementById('adminUserGreeting');

    const adminNavBtns = document.querySelectorAll('.admin-nav-btn');
    const adminSections = document.querySelectorAll('.admin-section');

    const adminProductList = document.getElementById('adminProductList');
    const showAddProductModalBtn = document.getElementById('showAddProductModalBtn');
    const productModal = document.getElementById('productModal');
    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    const productForm = document.getElementById('productForm');
    const productModalTitle = document.getElementById('productModalTitle');
    const productCategorySelect = document.getElementById('productCategory');

    const adminOrderList = document.getElementById('adminOrderList');
    const adminOrderDetailModal = document.getElementById('adminOrderDetailModal');
    const closeAdminOrderDetailModalBtn = document.getElementById('closeAdminOrderDetailModalBtn');
    const adminOrderDetailContent = document.getElementById('adminOrderDetailContent');
    const orderModalTitle = document.getElementById('orderModalTitle');
    const adminUpdateOrderStatusSelect = document.getElementById('adminUpdateOrderStatusSelect');
    const submitUpdateOrderStatusBtn = document.getElementById('submitUpdateOrderStatusBtn');
    const downloadOrderInfoBtn = document.getElementById('downloadOrderInfoBtn');
    const orderFilterEmailInput = document.getElementById('orderFilterEmail');
    const orderFilterStatusSelect = document.getElementById('orderFilterStatus');
    const applyOrderFiltersBtn = document.getElementById('applyOrderFiltersBtn');

    const adminComplaintList = document.getElementById('adminComplaintList');
    const adminComplaintModal = document.getElementById('adminComplaintModal');
    const closeAdminComplaintModalBtn = document.getElementById('closeAdminComplaintModalBtn');
    const adminComplaintDetailContent = document.getElementById('adminComplaintDetailContent');
    const adminComplaintResponseForm = document.getElementById('adminComplaintResponseForm');
    const complaintModalTitleAdmin = document.getElementById('complaintModalTitleAdmin');
    const complaintFilterStatusSelect = document.getElementById('complaintFilterStatus');
    const applyComplaintFiltersBtn = document.getElementById('applyComplaintFiltersBtn');
    
    const adminCategoryList = document.getElementById('adminCategoryList');
    const showAddCategoryModalBtn = document.getElementById('showAddCategoryModalBtn');
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryModalBtn = document.getElementById('closeCategoryModalBtn');
    const categoryForm = document.getElementById('categoryForm');
    const categoryModalTitle = document.getElementById('categoryModalTitle');

    // --- Autenticación Admin ---
    function checkAdminLogin() {
        adminToken = localStorage.getItem('diamantechAdminToken');
        const adminUserString = localStorage.getItem('diamantechAdminUser');
        
        if (adminToken && adminUserString) {
            try {
                const adminUser = JSON.parse(adminUserString);
                if (adminUser && adminUser.rol === 'administrador') {
                    if(adminLoginContainer) adminLoginContainer.classList.add('hidden');
                    if(adminDashboardContainer) adminDashboardContainer.classList.remove('hidden');
                    if (adminUserGreeting) adminUserGreeting.textContent = `Admin: ${adminUser.nombre_completo || adminUser.email}`;
                    showAdminSection('orders'); 
                    return;
                } else {
                    localStorage.removeItem('diamantechAdminToken');
                    localStorage.removeItem('diamantechAdminUser');
                    adminToken = null;
                }
            } catch (e) {
                console.error("Error parsing admin user from localStorage", e);
                localStorage.removeItem('diamantechAdminToken');
                localStorage.removeItem('diamantechAdminUser');
                adminToken = null;
            }
        }
        if(adminLoginContainer) adminLoginContainer.classList.remove('hidden');
        if(adminDashboardContainer) adminDashboardContainer.classList.add('hidden');
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = adminLoginForm.email.value;
            const password = adminLoginForm.password.value;
            const submitButton = adminLoginForm.querySelector('button[type="submit"]');
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = "Ingresando..."; }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (!response.ok || !data.usuario || data.usuario.rol !== 'administrador') {
                    throw new Error(data.message || 'Acceso denegado. Solo administradores o credenciales incorrectas.');
                }
                localStorage.setItem('diamantechAdminToken', data.token);
                localStorage.setItem('diamantechAdminUser', JSON.stringify(data.usuario)); 
                adminToken = data.token;
                checkAdminLogin(); 
            } catch (error) {
                alert(`Error de login: ${error.message}`);
            } finally {
                if(submitButton) { submitButton.disabled = false; submitButton.textContent = "Ingresar"; }
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('diamantechAdminToken');
            localStorage.removeItem('diamantechAdminUser');
            localStorage.removeItem('diamantechUser'); 
            adminToken = null;
            window.location.href = 'index.html'; 
        });
    }

    // --- Navegación Admin ---
    function showAdminSection(sectionId) {
        adminSections.forEach(section => section.classList.add('hidden'));
        const sectionElement = document.getElementById(`admin${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Section`);
        if (sectionElement) {
            sectionElement.classList.remove('hidden');
        } else {
            console.error(`Sección admin no encontrada: admin${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Section`);
        }
        
        adminNavBtns.forEach(btn => {
            btn.classList.remove('bg-blue-200', 'text-blue-800', 'font-semibold');
            btn.classList.add('hover:bg-blue-100', 'text-blue-700');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('bg-blue-200', 'text-blue-800', 'font-semibold');
                btn.classList.remove('hover:bg-blue-100');
            }
        });

        if (sectionId === 'products') loadAdminProducts();
        if (sectionId === 'orders') loadAdminOrders();
        if (sectionId === 'complaints') loadAdminComplaints();
        if (sectionId === 'categories') loadAdminCategories();
    }

    adminNavBtns.forEach(btn => {
        btn.addEventListener('click', () => showAdminSection(btn.dataset.section));
    });

    // --- Gestión de Categorías (Admin) ---
    async function loadAdminCategories() {
        if (!adminCategoryList) return;
        adminCategoryList.innerHTML = 'Cargando categorías...';
        try {
            // Usar el nuevo endpoint que trae TODAS las categorías para el admin
            const response = await fetch(`${API_BASE_URL}/admin/categories-all`, { 
                headers: { 'Authorization': `Bearer ${adminToken}` } 
            });
            if (!response.ok) throw new Error('Error al cargar categorías para admin: ' + response.statusText);
            const categories = await response.json();
            adminCategoriesCache = categories; 
            renderAdminCategories(categories);
            populateCategorySelect(categories); 
        } catch (error) {
            adminCategoryList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
            console.error("Error en loadAdminCategories:", error);
        }
    }

    function renderAdminCategories(categories) {
        if (!adminCategoryList) return;
        if (!categories || categories.length === 0) {
            adminCategoryList.innerHTML = '<p>No hay categorías creadas.</p>'; return;
        }
        adminCategoryList.innerHTML = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-100"><tr>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Activa</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-200">
                ${categories.map(cat => `
                    <tr class="${!cat.activo ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}">
                        <td class="py-2 px-3 text-sm">${cat.nombre_categoria}</td>
                        <td class="py-2 px-3 text-sm">${cat.slug_categoria}</td>
                        <td class="py-2 px-3 text-sm font-semibold ${!cat.activo ? 'text-red-600' : 'text-green-600'}">${cat.activo ? 'Sí' : 'No'}</td>
                        <td class="py-2 px-3 text-sm">
                            <button class="edit-category-btn text-blue-600 hover:text-blue-800 mr-2" data-id="${cat.id_categoria}"><i class="fas fa-edit"></i></button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        `;
        document.querySelectorAll('.edit-category-btn').forEach(btn => btn.addEventListener('click', openEditCategoryModal));
    }
    
    if(showAddCategoryModalBtn) showAddCategoryModalBtn.addEventListener('click', () => {
        currentEditingCategoryId = null;
        if(categoryModalTitle) categoryModalTitle.textContent = 'Añadir Categoría';
        if(categoryForm) categoryForm.reset();
        const activoCheckbox = document.getElementById('categoryActivo');
        if(activoCheckbox) activoCheckbox.checked = true;
        if(categoryModal) {
            categoryModal.classList.remove('hidden');
            categoryModal.classList.add('flex');
        }
    });
    if(closeCategoryModalBtn) closeCategoryModalBtn.addEventListener('click', () => {if(categoryModal) categoryModal.classList.add('hidden')});

    if(categoryForm) categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nombre_categoria: categoryForm.nombre_categoria.value,
            slug_categoria: categoryForm.slug_categoria.value,
            descripcion_categoria: categoryForm.descripcion_categoria.value,
            imagen_url_categoria: categoryForm.imagen_url_categoria.value,
            activo: categoryForm.activo.checked,
        };
        const url = currentEditingCategoryId 
            ? `${API_BASE_URL}/admin/categories/${currentEditingCategoryId}` 
            : `${API_BASE_URL}/admin/categories`;
        const method = currentEditingCategoryId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al guardar categoría');
            alert(result.message);
            if(categoryModal) categoryModal.classList.add('hidden');
            loadAdminCategories(); 
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    async function openEditCategoryModal(event) {
        const categoryId = event.currentTarget.dataset.id;
        const category = adminCategoriesCache.find(c => c.id_categoria == categoryId);
        if (!category) { alert('Categoría no encontrada'); return; }

        currentEditingCategoryId = categoryId;
        if(categoryModalTitle) categoryModalTitle.textContent = 'Editar Categoría';
        if(categoryForm) {
            categoryForm.nombre_categoria.value = category.nombre_categoria;
            categoryForm.slug_categoria.value = category.slug_categoria;
            categoryForm.descripcion_categoria.value = category.descripcion_categoria || '';
            categoryForm.imagen_url_categoria.value = category.imagen_url_categoria || '';
            categoryForm.activo.checked = !!category.activo; 
        }
        if(categoryModal) {
            categoryModal.classList.remove('hidden');
            categoryModal.classList.add('flex');
        }
    }

    // --- Gestión de Productos (Admin) ---
    async function loadAdminProducts() {
        if (!adminProductList) return;
        adminProductList.innerHTML = 'Cargando productos...';
        
        if (adminCategoriesCache.length === 0) { 
            await loadAdminCategories(); 
        } else {
            populateCategorySelect(adminCategoriesCache); 
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/products-all`, { 
                 headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar productos: ' + response.statusText);
            const products = await response.json();
            adminProductsCache = products; 
            renderAdminProducts(products);
        } catch (error) {
            adminProductList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
            console.error("Error en loadAdminProducts:", error);
        }
    }

    function renderAdminProducts(products) {
        if (!adminProductList) return;
        if (!products || products.length === 0) {
            adminProductList.innerHTML = '<p>No hay productos creados.</p>'; return;
        }
        adminProductList.innerHTML = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-100"><tr>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-200">
                ${products.map(p => `
                    <tr class="${!p.activo ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}">
                        <td class="py-2 px-3 text-sm">${p.nombre_producto}</td>
                        <td class="py-2 px-3 text-sm">${p.sku}</td>
                        <td class="py-2 px-3 text-sm">Bs. ${parseFloat(p.precio).toFixed(2)}</td>
                        <td class="py-2 px-3 text-sm">${p.stock}</td>
                        <td class="py-2 px-3 text-sm font-semibold ${!p.activo ? 'text-red-600' : 'text-green-600'}">${p.activo ? 'Sí' : 'No'}</td>
                        <td class="py-2 px-3 text-sm">
                            <button class="edit-product-btn text-blue-600 hover:text-blue-800 mr-2" data-id="${p.id_producto}"><i class="fas fa-edit"></i></button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        `;
        document.querySelectorAll('.edit-product-btn').forEach(btn => btn.addEventListener('click', openEditProductModal));
    }
    
    function populateCategorySelect(categories) {
        if (!productCategorySelect) { console.error("Select de categoría (#productCategory) no encontrado en el DOM."); return; }
        productCategorySelect.innerHTML = '<option value="">Seleccione categoría...</option>';
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                // Mostrar todas las categorías (activas e inactivas) para que el admin pueda verlas,
                // pero podría ser preferible solo mostrar activas para asignar a un producto nuevo/editado.
                // Si se desea solo activas: if (cat.activo) { ... }
                const option = document.createElement('option');
                option.value = cat.id_categoria;
                option.textContent = `${cat.nombre_categoria} ${!cat.activo ? '(Inactiva)' : ''}`;
                productCategorySelect.appendChild(option);
            });
        } else {
            console.warn("No hay categorías para poblar el select o adminCategoriesCache está vacío.");
            productCategorySelect.innerHTML = '<option value="">No hay categorías disponibles</option>';
        }
    }

    if(showAddProductModalBtn) showAddProductModalBtn.addEventListener('click', () => {
        currentEditingProductId = null;
        if(productModalTitle) productModalTitle.textContent = 'Añadir Producto';
        if(productForm) productForm.reset();
        const activoCheckbox = document.getElementById('productActivo');
        if(activoCheckbox) activoCheckbox.checked = true;
        
        if(adminCategoriesCache.length > 0){
            populateCategorySelect(adminCategoriesCache);
        } else {
            loadAdminCategories().then(() => populateCategorySelect(adminCategoriesCache));
        }

        if(productModal) {
            productModal.classList.remove('hidden');
            productModal.classList.add('flex');
        }
    });
    if(closeProductModalBtn) closeProductModalBtn.addEventListener('click', () => {if(productModal) productModal.classList.add('hidden')});

    if(productForm) productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nombre_producto: productForm.nombre_producto ? productForm.nombre_producto.value : '',
            slug_producto: productForm.slug_producto ? productForm.slug_producto.value : '',
            id_categoria: productForm.id_categoria ? productForm.id_categoria.value : '',
            precio: productForm.precio ? parseFloat(productForm.precio.value) : 0,
            stock: productForm.stock ? parseInt(productForm.stock.value) : 0,
            sku: productForm.sku ? productForm.sku.value : '',
            descripcion_corta: productForm.descripcion_corta ? productForm.descripcion_corta.value : '',
            descripcion_larga: productForm.descripcion_larga ? productForm.descripcion_larga.value : '',
            imagen_principal_url: productForm.imagen_principal_url ? productForm.imagen_principal_url.value : '',
            galeria_imagenes_urls: productForm.galeria_imagenes_urls ? productForm.galeria_imagenes_urls.value : '[]', 
            materiales: productForm.materiales ? productForm.materiales.value : '',
            peso_gramos: productForm.peso_gramos && productForm.peso_gramos.value ? parseFloat(productForm.peso_gramos.value) : null,
            dimensiones: productForm.dimensiones ? productForm.dimensiones.value : '',
            activo: productForm.activo ? productForm.activo.checked : true,
        };

        const url = currentEditingProductId 
            ? `${API_BASE_URL}/admin/products/${currentEditingProductId}` 
            : `${API_BASE_URL}/admin/products`;
        const method = currentEditingProductId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al guardar producto');
            alert(result.message);
            if(productModal) productModal.classList.add('hidden');
            loadAdminProducts();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    async function openEditProductModal(event) {
        const productId = event.currentTarget.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, { 
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar datos del producto para editar: ' + response.statusText);
            const product = await response.json();

            currentEditingProductId = productId;
            if(productModalTitle) productModalTitle.textContent = 'Editar Producto';
            
            if(productForm) {
                if(adminCategoriesCache.length > 0){
                    populateCategorySelect(adminCategoriesCache);
                } else {
                    await loadAdminCategories(); 
                    populateCategorySelect(adminCategoriesCache);
                }

                // Verificar cada campo antes de asignar
                const fields = ['nombre_producto', 'slug_producto', 'id_categoria', 'precio', 'stock', 'sku', 'descripcion_corta', 'descripcion_larga', 'imagen_principal_url', 'materiales', 'peso_gramos', 'dimensiones'];
                fields.forEach(fieldKey => {
                    if (productForm[fieldKey]) {
                        productForm[fieldKey].value = product[fieldKey] || (fieldKey === 'stock' ? 0 : '');
                    } else {
                        console.warn(`Campo de formulario '${fieldKey}' no encontrado en productForm.`);
                    }
                });
                
                if(productForm.galeria_imagenes_urls) productForm.galeria_imagenes_urls.value = product.galeria_imagenes_urls && Array.isArray(product.galeria_imagenes_urls) ? JSON.stringify(product.galeria_imagenes_urls) : '[]';
                if(productForm.activo) productForm.activo.checked = product.activo;

            } else {
                console.error("El formulario de producto (productForm) no se encontró.");
            }

            if(productModal) {
                productModal.classList.remove('hidden');
                productModal.classList.add('flex');
            }
        } catch (error) {
            alert(`Error al abrir modal de edición: ${error.message}`);
            console.error("Error en openEditProductModal:", error);
        }
    }

    // --- Gestión de Pedidos (Admin) ---
    async function loadAdminOrders(filters = {}) {
        if (!adminOrderList) return;
        adminOrderList.innerHTML = 'Cargando pedidos...';
        let url = `${API_BASE_URL}/admin/orders`;
        const queryParams = new URLSearchParams();
        if (filters.estado) queryParams.append('estado', filters.estado);
        if (filters.cliente_email) queryParams.append('cliente_email', filters.cliente_email);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            if (!response.ok) throw new Error('Error al cargar pedidos');
            const orders = await response.json();
            renderAdminOrders(orders);
        } catch (error) {
            adminOrderList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if (applyOrderFiltersBtn) applyOrderFiltersBtn.addEventListener('click', () => {
        loadAdminOrders({
            estado: orderFilterStatusSelect.value,
            cliente_email: orderFilterEmailInput.value
        });
    });

    function renderAdminOrders(orders) {
        if (!adminOrderList) return;
        if (!orders || orders.length === 0) {
            adminOrderList.innerHTML = '<p>No hay pedidos que coincidan con los filtros.</p>'; return;
        }
        adminOrderList.innerHTML = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-100"><tr>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pedido</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-200">
                ${orders.map(order => `
                    <tr>
                        <td class="py-2 px-3 text-sm">${order.codigo_pedido}</td>
                        <td class="py-2 px-3 text-sm">${new Date(order.fecha_pedido).toLocaleDateString()}</td>
                        <td class="py-2 px-3 text-sm">${order.cliente_nombre} (${order.cliente_email})</td>
                        <td class="py-2 px-3 text-sm">Bs. ${parseFloat(order.total_pedido).toFixed(2)}</td>
                        <td class="py-2 px-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded-full ${getAdminOrderStatusColor(order.estado_pedido)}">${formatAdminOrderStatus(order.estado_pedido)}</span></td>
                        <td class="py-2 px-3 text-sm">
                            <button class="view-admin-order-btn text-blue-600 hover:text-blue-800" data-id="${order.id_pedido}"><i class="fas fa-eye"></i> Ver/Editar</button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        `;
        document.querySelectorAll('.view-admin-order-btn').forEach(btn => btn.addEventListener('click', openAdminOrderDetailModal));
    }
    function getAdminOrderStatusColor(status) {
        const colors = {
            'pendiente_pago': 'bg-yellow-200 text-yellow-800', 'pagado': 'bg-green-200 text-green-800', 
            'en_proceso': 'bg-blue-200 text-blue-800', 'enviado': 'bg-purple-200 text-purple-800', 
            'entregado': 'bg-teal-200 text-teal-800', 'cancelado': 'bg-red-200 text-red-800', 'fallido': 'bg-red-300 text-red-900'
        };
        return colors[status] || 'bg-gray-200 text-gray-800';
    }
    function formatAdminOrderStatus(status) { return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

    async function openAdminOrderDetailModal(event) {
        currentViewingOrderId = event.currentTarget.dataset.id;
        if (!adminOrderDetailModal || !adminOrderDetailContent) return;
        adminOrderDetailContent.innerHTML = 'Cargando detalles del pedido...';
        if(adminOrderDetailModal) {
            adminOrderDetailModal.classList.remove('hidden');
            adminOrderDetailModal.classList.add('flex');
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${currentViewingOrderId}`, { 
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar detalles del pedido');
            const order = await response.json();
            if(orderModalTitle) orderModalTitle.textContent = `Detalles del Pedido #${order.codigo_pedido}`;
            if(adminUpdateOrderStatusSelect) adminUpdateOrderStatusSelect.value = order.estado_pedido;
            
            let itemsHtml = order.detalles.map(item => `
                <tr>
                    <td class="py-1">${item.nombre_producto_historico} (SKU: ${item.sku_historico})</td>
                    <td class="py-1 text-center">${item.cantidad_comprada}</td>
                    <td class="py-1 text-right">Bs. ${parseFloat(item.precio_unitario_compra).toFixed(2)}</td>
                    <td class="py-1 text-right">Bs. ${parseFloat(item.subtotal_item).toFixed(2)}</td>
                </tr>
            `).join('');

            adminOrderDetailContent.innerHTML = `
                <p><strong>Cliente:</strong> ${order.nombre_cliente} (${order.email_cliente}) Tel: ${order.telefono_cliente || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${new Date(order.fecha_pedido).toLocaleString()}</p>
                <p><strong>Estado Actual:</strong> <span class="font-semibold ${getAdminOrderStatusColor(order.estado_pedido).replace('bg-', 'text-')}">${formatAdminOrderStatus(order.estado_pedido)}</span></p>
                <h4 class="font-semibold mt-3 mb-1">Dirección de Envío:</h4>
                <p>${order.calle_avenida}, Nro. ${order.numero_vivienda}, Zona ${order.nombre_zona}</p>
                ${order.referencia_adicional ? `<p>Ref: ${order.referencia_adicional}</p>` : ''}
                <h4 class="font-semibold mt-3 mb-1">Items del Pedido:</h4>
                <table class="w-full text-xs mt-1">
                    <thead class="bg-gray-50"><tr><th class="text-left py-1">Producto</th><th class="text-center py-1">Cant.</th><th class="text-right py-1">Precio U.</th><th class="text-right py-1">Subtotal</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="mt-2 text-right">
                    <p><strong>Subtotal Productos:</strong> Bs. ${parseFloat(order.subtotal_productos).toFixed(2)}</p>
                    <p><strong>Costo Envío:</strong> Bs. ${parseFloat(order.costo_envio).toFixed(2)}</p>
                    <p class="font-bold"><strong>Total Pedido:</strong> Bs. ${parseFloat(order.total_pedido).toFixed(2)}</p>
                </div>
                ${order.queja ? `
                    <div class="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                        <h4 class="font-semibold text-yellow-700">Queja Asociada (ID: ${order.queja.id_queja})</h4>
                        <p><strong>Estado Queja:</strong> ${formatAdminOrderStatus(order.queja.estado_queja)}</p>
                        <p><strong>Descripción:</strong> ${order.queja.descripcion_queja}</p>
                        ${order.queja.respuesta_admin ? `<p><strong>Respuesta Admin:</strong> ${order.queja.respuesta_admin}</p>`: ''}
                    </div>
                ` : ''}
            `;
        } catch (error) {
            adminOrderDetailContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if(closeAdminOrderDetailModalBtn) closeAdminOrderDetailModalBtn.addEventListener('click', () => {if(adminOrderDetailModal) adminOrderDetailModal.classList.add('hidden')});
    
    if(submitUpdateOrderStatusBtn) submitUpdateOrderStatusBtn.addEventListener('click', async () => {
        if (!currentViewingOrderId || !adminUpdateOrderStatusSelect) return;
        const nuevo_estado = adminUpdateOrderStatusSelect.value;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${currentViewingOrderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({ nuevo_estado })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al actualizar estado');
            alert(result.message);
            if(adminOrderDetailModal) adminOrderDetailModal.classList.add('hidden');
            loadAdminOrders(); 
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
    
    if(downloadOrderInfoBtn) downloadOrderInfoBtn.addEventListener('click', async () => {
        if (!currentViewingOrderId) { alert('Primero abre un pedido.'); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${currentViewingOrderId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('No se pudo obtener la información del pedido para descargar.');
            const order = await response.json();
            
            let deliveryText = `--- INFORMACIÓN PARA DELIVERY ---\n`;
            deliveryText += `Pedido #: ${order.codigo_pedido}\n`;
            deliveryText += `Fecha: ${new Date(order.fecha_pedido).toLocaleString()}\n\n`;
            deliveryText += `Cliente: ${order.nombre_cliente}\n`;
            deliveryText += `Email: ${order.email_cliente}\n`;
            deliveryText += `Teléfono: ${order.telefono_cliente || 'N/A'}\n\n`;
            deliveryText += `Dirección de Entrega:\n`;
            deliveryText += `${order.calle_avenida}, Nro. ${order.numero_vivienda}\n`;
            deliveryText += `Zona: ${order.nombre_zona}\n`;
            if (order.referencia_adicional) deliveryText += `Referencia: ${order.referencia_adicional}\n`;
            deliveryText += `\nItems:\n`;
            order.detalles.forEach(item => {
                deliveryText += `- ${item.cantidad_comprada}x ${item.nombre_producto_historico} (SKU: ${item.sku_historico})\n`;
            });
            deliveryText += `\nTotal a Cobrar (si aplica, verificar estado de pago): Bs. ${parseFloat(order.total_pedido).toFixed(2)}\n`;
            deliveryText += `Estado del Pedido: ${formatAdminOrderStatus(order.estado_pedido)}\n`;
            if (order.notas_cliente) deliveryText += `\nNotas del Cliente: ${order.notas_cliente}\n`; 
            deliveryText += `---------------------------------`;

            const blob = new Blob([deliveryText], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pedido_${order.codigo_pedido}_delivery.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            alert(`Error al generar info para delivery: ${error.message}`);
        }
    });

    // --- Gestión de Quejas (Admin) ---
    async function loadAdminComplaints(filters = {}) {
        if (!adminComplaintList) return;
        adminComplaintList.innerHTML = 'Cargando quejas...';
        let url = `${API_BASE_URL}/admin/complaints`;
        const queryParams = new URLSearchParams();
        if (filters.estado_queja) queryParams.append('estado', filters.estado_queja);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            if (!response.ok) throw new Error('Error al cargar quejas');
            const complaints = await response.json();
            renderAdminComplaints(complaints);
        } catch (error) {
            adminComplaintList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if (applyComplaintFiltersBtn) applyComplaintFiltersBtn.addEventListener('click', () => {
        loadAdminComplaints({ estado_queja: complaintFilterStatusSelect.value });
    });

    function renderAdminComplaints(complaints) {
         if (!adminComplaintList) return;
         if (!complaints || complaints.length === 0) {
            adminComplaintList.innerHTML = '<p>No hay quejas que coincidan con los filtros.</p>'; return;
        }
        adminComplaintList.innerHTML = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-100"><tr>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">ID Queja</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Queja</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Queja</th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-200">
                ${complaints.map(c => `
                    <tr>
                        <td class="py-2 px-3 text-sm">${c.id_queja}</td>
                        <td class="py-2 px-3 text-sm">${c.codigo_pedido}</td>
                        <td class="py-2 px-3 text-sm">${c.cliente_nombre}</td>
                        <td class="py-2 px-3 text-sm">${new Date(c.fecha_queja).toLocaleDateString()}</td>
                        <td class="py-2 px-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded-full ${getAdminOrderStatusColor(c.estado_queja.replace('_admin','').replace('_cliente',''))}">${formatAdminOrderStatus(c.estado_queja)}</span></td>
                        <td class="py-2 px-3 text-sm">
                            <button class="view-admin-complaint-btn text-blue-600 hover:text-blue-800" data-id="${c.id_queja}"><i class="fas fa-eye"></i> Ver/Responder</button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        `;
        document.querySelectorAll('.view-admin-complaint-btn').forEach(btn => btn.addEventListener('click', openAdminComplaintModal));
    }

    async function openAdminComplaintModal(event) {
        currentManagingComplaintId = event.currentTarget.dataset.id;
        if (!adminComplaintModal || !adminComplaintDetailContent || !adminComplaintResponseForm) return;
        adminComplaintDetailContent.innerHTML = 'Cargando detalles de la queja...';
        adminComplaintResponseForm.reset();
        if(adminComplaintModal) {
            adminComplaintModal.classList.remove('hidden');
            adminComplaintModal.classList.add('flex');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/complaints/${currentManagingComplaintId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar detalles de la queja');
            const complaint = await response.json();
            if(complaintModalTitleAdmin) complaintModalTitleAdmin.textContent = `Gestionar Queja #${complaint.id_queja} (Pedido ${complaint.codigo_pedido})`;
            adminComplaintDetailContent.innerHTML = `
                <p><strong>Cliente:</strong> ${complaint.cliente_nombre} (${complaint.cliente_email})</p>
                <p><strong>Fecha Queja:</strong> ${new Date(complaint.fecha_queja).toLocaleString()}</p>
                <p><strong>Estado Actual:</strong> ${formatAdminOrderStatus(complaint.estado_queja)}</p>
                <p class="mt-2"><strong>Descripción de la Queja:</strong></p>
                <p class="bg-gray-100 p-2 rounded">${complaint.descripcion_queja}</p>
            `;
            const editComplaintIdEl = document.getElementById('adminEditComplaintId');
            const responseTextEl = document.getElementById('adminComplaintResponseText');
            const newStatusEl = document.getElementById('adminComplaintNewStatus');

            if(editComplaintIdEl) editComplaintIdEl.value = complaint.id_queja;
            if (responseTextEl && complaint.respuesta_admin) {
                responseTextEl.value = complaint.respuesta_admin;
            }
            if(newStatusEl) newStatusEl.value = complaint.estado_queja; 

        } catch (error) {
            adminComplaintDetailContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if(closeAdminComplaintModalBtn) closeAdminComplaintModalBtn.addEventListener('click', () => {if(adminComplaintModal) adminComplaintModal.classList.add('hidden')});

    if(adminComplaintResponseForm) adminComplaintResponseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentManagingComplaintId) return;
        const formData = {
            respuesta_admin: adminComplaintResponseForm.respuesta_admin.value,
            nuevo_estado_queja: adminComplaintResponseForm.nuevo_estado_queja.value,
        };
        try {
            const response = await fetch(`${API_BASE_URL}/admin/complaints/${currentManagingComplaintId}/respond`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al responder queja');
            alert(result.message);
            if(adminComplaintModal) adminComplaintModal.classList.add('hidden');
            loadAdminComplaints(); 
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- Inicialización Admin ---
    checkAdminLogin();
});
