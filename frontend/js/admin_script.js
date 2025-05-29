// frontend/js/admin_script.js
const API_BASE_URL = 'http://localhost:3000/api'; // Asegúrate que coincida
let adminToken = null;
let currentEditingProductId = null;
let currentEditingCategoryId = null;
let currentViewingOrderId = null;
let currentManagingComplaintId = null;
let adminCategoriesCache = []; // Cache para select de categorías en formulario de producto

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
        const adminUser = JSON.parse(localStorage.getItem('diamantechAdminUser'));
        if (adminToken && adminUser && adminUser.rol === 'administrador') {
            adminLoginContainer.classList.add('hidden');
            adminDashboardContainer.classList.remove('hidden');
            if (adminUserGreeting) adminUserGreeting.textContent = `Admin: ${adminUser.nombre_completo}`;
            showAdminSection('orders'); // Mostrar pedidos por defecto
        } else {
            adminLoginContainer.classList.remove('hidden');
            adminDashboardContainer.classList.add('hidden');
        }
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = adminLoginForm.email.value;
            const password = adminLoginForm.password.value;
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (!response.ok || data.usuario.rol !== 'administrador') {
                    throw new Error(data.message || 'Acceso denegado. Solo administradores.');
                }
                localStorage.setItem('diamantechAdminToken', data.token);
                localStorage.setItem('diamantechAdminUser', JSON.stringify(data.usuario));
                adminToken = data.token;
                checkAdminLogin();
            } catch (error) {
                alert(`Error de login: ${error.message}`);
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('diamantechAdminToken');
            localStorage.removeItem('diamantechAdminUser');
            adminToken = null;
            checkAdminLogin();
        });
    }

    // --- Navegación Admin ---
    function showAdminSection(sectionId) {
        adminSections.forEach(section => section.classList.add('hidden'));
        document.getElementById(`admin${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Section`).classList.remove('hidden');
        
        // Resaltar botón activo
        adminNavBtns.forEach(btn => {
            btn.classList.remove('bg-blue-200', 'text-blue-800', 'font-semibold');
            btn.classList.add('hover:bg-blue-100', 'text-blue-700');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('bg-blue-200', 'text-blue-800', 'font-semibold');
                btn.classList.remove('hover:bg-blue-100');
            }
        });

        // Cargar datos de la sección
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
            // Usamos el endpoint público, ya que el admin también necesita verlas
            const response = await fetch(`${API_BASE_URL}/products/categories`, {
                headers: { 'Authorization': `Bearer ${adminToken}` } // Aunque sea público, enviar token por si acaso
            });
            if (!response.ok) throw new Error('Error al cargar categorías');
            const categories = await response.json();
            adminCategoriesCache = categories; // Guardar para el select de productos
            renderAdminCategories(categories);
            populateCategorySelect(categories); // Para el formulario de productos
        } catch (error) {
            adminCategoryList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }

    function renderAdminCategories(categories) {
        if (categories.length === 0) {
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
                    <tr>
                        <td class="py-2 px-3 text-sm">${cat.nombre_categoria}</td>
                        <td class="py-2 px-3 text-sm">${cat.slug_categoria}</td>
                        <td class="py-2 px-3 text-sm">${cat.activo ? 'Sí' : 'No'}</td>
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
        categoryModalTitle.textContent = 'Añadir Categoría';
        categoryForm.reset();
        document.getElementById('categoryActivo').checked = true;
        categoryModal.classList.remove('hidden');
        categoryModal.classList.add('flex');
    });
    if(closeCategoryModalBtn) closeCategoryModalBtn.addEventListener('click', () => categoryModal.classList.add('hidden'));

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
            categoryModal.classList.add('hidden');
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
        categoryModalTitle.textContent = 'Editar Categoría';
        categoryForm.nombre_categoria.value = category.nombre_categoria;
        categoryForm.slug_categoria.value = category.slug_categoria;
        categoryForm.descripcion_categoria.value = category.descripcion_categoria || '';
        categoryForm.imagen_url_categoria.value = category.imagen_url_categoria || '';
        categoryForm.activo.checked = category.activo;
        categoryModal.classList.remove('hidden');
        categoryModal.classList.add('flex');
    }


    // --- Gestión de Productos (Admin) ---
    async function loadAdminProducts() {
        if (!adminProductList) return;
        adminProductList.innerHTML = 'Cargando productos...';
        await loadAdminCategories(); // Asegurar que las categorías estén cargadas para el select
        try {
            // Necesitamos un endpoint para listar TODOS los productos para el admin, incluyendo inactivos
            // Por ahora, usaremos el público y filtraremos en cliente o crearemos uno nuevo en backend.
            // Asumamos que tenemos un endpoint /admin/products que trae todos.
            const response = await fetch(`${API_BASE_URL}/admin/products-all`, { // Endpoint NUEVO necesario
                 headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar productos');
            const products = await response.json();
            renderAdminProducts(products);
        } catch (error) {
            adminProductList.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }

    function renderAdminProducts(products) {
        if (products.length === 0) {
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
                    <tr>
                        <td class="py-2 px-3 text-sm">${p.nombre_producto}</td>
                        <td class="py-2 px-3 text-sm">${p.sku}</td>
                        <td class="py-2 px-3 text-sm">Bs. ${parseFloat(p.precio).toFixed(2)}</td>
                        <td class="py-2 px-3 text-sm">${p.stock}</td>
                        <td class="py-2 px-3 text-sm">${p.activo ? 'Sí' : 'No'}</td>
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
        if (!productCategorySelect) return;
        productCategorySelect.innerHTML = '<option value="">Seleccione categoría...</option>';
        categories.forEach(cat => {
            if (cat.activo) { // Solo categorías activas para asignar a productos
                const option = document.createElement('option');
                option.value = cat.id_categoria;
                option.textContent = cat.nombre_categoria;
                productCategorySelect.appendChild(option);
            }
        });
    }

    if(showAddProductModalBtn) showAddProductModalBtn.addEventListener('click', () => {
        currentEditingProductId = null;
        productModalTitle.textContent = 'Añadir Producto';
        productForm.reset();
        document.getElementById('productActivo').checked = true;
        productModal.classList.remove('hidden');
        productModal.classList.add('flex');
    });
    if(closeProductModalBtn) closeProductModalBtn.addEventListener('click', () => productModal.classList.add('hidden'));

    if(productForm) productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nombre_producto: productForm.nombre_producto.value,
            slug_producto: productForm.slug_producto.value,
            id_categoria: productForm.id_categoria.value,
            precio: parseFloat(productForm.precio.value),
            stock: parseInt(productForm.stock.value),
            sku: productForm.sku.value,
            descripcion_corta: productForm.descripcion_corta.value,
            descripcion_larga: productForm.descripcion_larga.value,
            imagen_principal_url: productForm.imagen_principal_url.value,
            galeria_imagenes_urls: productForm.galeria_imagenes_urls.value, // Dejar como string, el backend parsea
            materiales: productForm.materiales.value,
            activo: productForm.activo.checked,
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
            productModal.classList.add('hidden');
            loadAdminProducts();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    async function openEditProductModal(event) {
        const productId = event.currentTarget.dataset.id;
        // Necesitamos un endpoint para obtener un producto específico para admin, incluyendo todos sus campos
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, { // Endpoint NUEVO necesario
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar datos del producto');
            const product = await response.json();

            currentEditingProductId = productId;
            productModalTitle.textContent = 'Editar Producto';
            productForm.nombre_producto.value = product.nombre_producto;
            productForm.slug_producto.value = product.slug_producto;
            productForm.id_categoria.value = product.id_categoria;
            productForm.precio.value = product.precio;
            productForm.stock.value = product.stock;
            productForm.sku.value = product.sku;
            productForm.descripcion_corta.value = product.descripcion_corta || '';
            productForm.descripcion_larga.value = product.descripcion_larga || '';
            productForm.imagen_principal_url.value = product.imagen_principal_url || '';
            productForm.galeria_imagenes_urls.value = product.galeria_imagenes_urls ? JSON.stringify(product.galeria_imagenes_urls) : '';
            productForm.materiales.value = product.materiales || '';
            productForm.activo.checked = product.activo;
            
            productModal.classList.remove('hidden');
            productModal.classList.add('flex');
        } catch (error) {
            alert(`Error: ${error.message}`);
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
        if (orders.length === 0) {
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
        adminOrderDetailModal.classList.remove('hidden');
        adminOrderDetailModal.classList.add('flex');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${currentViewingOrderId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar detalles del pedido');
            const order = await response.json();
            orderModalTitle.textContent = `Detalles del Pedido #${order.codigo_pedido}`;
            adminUpdateOrderStatusSelect.value = order.estado_pedido;
            
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
    if(closeAdminOrderDetailModalBtn) closeAdminOrderDetailModalBtn.addEventListener('click', () => adminOrderDetailModal.classList.add('hidden'));
    
    if(submitUpdateOrderStatusBtn) submitUpdateOrderStatusBtn.addEventListener('click', async () => {
        if (!currentViewingOrderId) return;
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
            adminOrderDetailModal.classList.add('hidden');
            loadAdminOrders(); // Recargar lista de pedidos
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
    
    if(downloadOrderInfoBtn) downloadOrderInfoBtn.addEventListener('click', async () => {
        if (!currentViewingOrderId) { alert('Primero abre un pedido.'); return; }
        // Re-fetch order details to ensure data is current, or use cached if available and deemed safe
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

            // Crear un blob y descargar
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
         if (complaints.length === 0) {
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
        adminComplaintModal.classList.remove('hidden');
        adminComplaintModal.classList.add('flex');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/complaints/${currentManagingComplaintId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar detalles de la queja');
            const complaint = await response.json();
            complaintModalTitleAdmin.textContent = `Gestionar Queja #${complaint.id_queja} (Pedido ${complaint.codigo_pedido})`;
            adminComplaintDetailContent.innerHTML = `
                <p><strong>Cliente:</strong> ${complaint.cliente_nombre} (${complaint.cliente_email})</p>
                <p><strong>Fecha Queja:</strong> ${new Date(complaint.fecha_queja).toLocaleString()}</p>
                <p><strong>Estado Actual:</strong> ${formatAdminOrderStatus(complaint.estado_queja)}</p>
                <p class="mt-2"><strong>Descripción de la Queja:</strong></p>
                <p class="bg-gray-100 p-2 rounded">${complaint.descripcion_queja}</p>
            `;
            document.getElementById('adminEditComplaintId').value = complaint.id_queja;
            if (complaint.respuesta_admin) {
                document.getElementById('adminComplaintResponseText').value = complaint.respuesta_admin;
            }
            document.getElementById('adminComplaintNewStatus').value = complaint.estado_queja; // O el siguiente estado lógico

        } catch (error) {
            adminComplaintDetailContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
    if(closeAdminComplaintModalBtn) closeAdminComplaintModalBtn.addEventListener('click', () => adminComplaintModal.classList.add('hidden'));

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
            adminComplaintModal.classList.add('hidden');
            loadAdminComplaints(); // Recargar lista
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- Inicialización Admin ---
    checkAdminLogin();
});
