/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ApiResponseMessage:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Operation successful" }
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Resource not found" }
 *         error: { type: string, example: "NotFound" }
 *         details: { type: object, nullable: true }
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 57 }
 *         totalPages: { type: integer, example: 6 }
 *     Role:
 *       type: string
 *       enum: [ADMIN, CUSTOMER, DELIVERY]
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         full_name: { type: string }
 *         email: { type: string, format: email }
 *         phone: { type: string }
 *         role: { $ref: '#/components/schemas/Role' }
 *         is_active: { type: boolean }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *       example:
 *         id: "clx0abc123"
 *         full_name: "Jane Doe"
 *         email: "jane@example.com"
 *         phone: "+15551234567"
 *         role: CUSTOMER
 *         is_active: true
 *         created_at: "2025-08-16T12:00:00.000Z"
 *         updated_at: "2025-08-16T12:00:00.000Z"
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         slug: { type: string }
 *       example: { id: "cat_1", name: "Accessories", slug: "accessories" }
 *     ProductImage:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         image_url: { type: string, format: uri }
 *         sort_order: { type: integer }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *       example:
 *         id: "img_1"
 *         image_url: "https://cdn.example.com/mouse.jpg"
 *         sort_order: 1
 *         created_at: "2025-08-16T12:00:00.000Z"
 *         updated_at: "2025-08-16T12:00:00.000Z"
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         price: { type: number, format: float }
 *         stock: { type: integer }
 *         categoryId: { type: string }
 *         is_active: { type: boolean }
 *         category: { $ref: '#/components/schemas/Category' }
 *         imagesURL:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductImage' }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *       example:
 *         id: "prod_123"
 *         name: "Wireless Mouse"
 *         description: "Ergonomic wireless mouse"
 *         price: 29.99
 *         stock: 120
 *         is_active: true
 *         categoryId: "cat_1"
 *         category: { id: "cat_1", name: "Accessories", slug: "accessories" }
 *         imagesURL: [ { id: "img_1", image_url: "https://cdn.example.com/mouse.jpg", sort_order: 1 } ]
 *         created_at: "2025-08-16T12:00:00.000Z"
 *         updated_at: "2025-08-16T12:00:00.000Z"
 *     CartItem:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         productId: { type: string }
 *         product_name: { type: string }
 *         quantity: { type: integer }
 *         unit_price: { type: number }
 *         total_price: { type: number }
 *       example:
 *         id: "ci_1"
 *         productId: "prod_123"
 *         product_name: "Wireless Mouse"
 *         quantity: 2
 *         unit_price: 29.99
 *         total_price: 59.98
 *     Cart:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         status: { type: string, enum: [ACTIVE, CONVERTED, ABANDONED] }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/CartItem' }
 *       example:
 *         id: "cart_1"
 *         userId: "clx0abc123"
 *         status: ACTIVE
 *         items: [ { id: "ci_1", productId: "prod_123", product_name: "Wireless Mouse", quantity: 2, unit_price: 29.99, total_price: 59.98 } ]
 *     Address:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         label: { type: string }
 *         recipient_name: { type: string }
 *         phone: { type: string }
 *         address: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         postal_code: { type: string }
 *         country: { type: string }
 *         is_default: { type: boolean }
 *       example:
 *         id: "addr_1"
 *         label: "Home"
 *         recipient_name: "Jane Doe"
 *         phone: "+15551234567"
 *         address: "123 Main St"
 *         city: "Metropolis"
 *         state: "NY"
 *         postal_code: "10001"
 *         country: "USA"
 *         is_default: true
 *     ShippingAddress:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         ship_name: { type: string }
 *         ship_phone: { type: string }
 *         ship_address: { type: string }
 *         ship_city: { type: string }
 *         ship_state: { type: string }
 *         ship_zip: { type: string }
 *         notes: { type: string, nullable: true }
 *       example:
 *         id: "ship_1"
 *         ship_name: "Jane Doe"
 *         ship_phone: "+15551234567"
 *         ship_address: "123 Main St"
 *         ship_city: "Metropolis"
 *         ship_state: "NY"
 *         ship_zip: "10001"
 *         notes: null
 *     OrderItem:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         product_id: { type: string }
 *         product_name: { type: string }
 *         unit_price: { type: number }
 *         quantity: { type: integer }
 *         line_total: { type: number }
 *       example:
 *         id: "oi_1"
 *         product_id: "prod_123"
 *         product_name: "Wireless Mouse"
 *         unit_price: 29.99
 *         quantity: 2
 *         line_total: 59.98
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         status: { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *         payment_status: { type: string, enum: [UNPAID, PAID, FAILED] }
 *         shipping_address: { $ref: '#/components/schemas/ShippingAddress' }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderItem' }
 *         placed_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *       example:
 *         id: "ord_1"
 *         userId: "clx0abc123"
 *         status: PENDING
 *         payment_status: UNPAID
 *         shipping_address: { id: "ship_1", ship_name: "Jane Doe", ship_phone: "+15551234567", ship_address: "123 Main St", ship_city: "Metropolis", ship_state: "NY", ship_zip: "10001", notes: null }
 *         items: [ { id: "oi_1", product_id: "prod_123", product_name: "Wireless Mouse", unit_price: 29.99, quantity: 2, line_total: 59.98 } ]
 *         placed_at: "2025-08-16T12:00:00.000Z"
 *         updated_at: "2025-08-16T12:00:00.000Z"
 *     Delivery:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         order_id: { type: string }
 *         delivery_partner_id: { type: string }
 *         status: { type: string, enum: [UNASSIGNED, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED] }
 *         assigned_at: { type: string, format: date-time }
 *         last_update_at: { type: string, format: date-time }
 *         notes: { type: string, nullable: true }
 *       example:
 *         id: "del_1"
 *         order_id: "ord_1"
 *         delivery_partner_id: "clxDelivery1"
 *         status: ASSIGNED
 *         assigned_at: "2025-08-16T12:00:00.000Z"
 *         last_update_at: "2025-08-16T12:00:00.000Z"
 *         notes: null
 *     InventoryTransaction:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         product_id: { type: string }
 *         delta: { type: integer }
 *         reason: { type: string }
 *         created_by: { type: string }
 *         created_at: { type: string, format: date-time }
 *       example:
 *         id: "it_1"
 *         product_id: "prod_123"
 *         delta: 25
 *         reason: "Restock"
 *         created_by: "clx0admin"
 *         created_at: "2025-08-16T12:00:00.000Z"
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string }
 *         password: { type: string, format: password }
 *       example:
 *         email: "jane@example.com"
 *         password: "StrongP@ssw0rd"
 *     RegisterRequest:
 *       type: object
 *       required: [full_name, email, password, phone]
 *       properties:
 *         full_name: { type: string }
 *         email: { type: string }
 *         password: { type: string, format: password }
 *         phone: { type: string }
 *       example:
 *         full_name: "Jane Doe"
 *         email: "jane@example.com"
 *         password: "StrongP@ssw0rd"
 *         phone: "+15551234567"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string }
 *         refreshToken: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 *       example:
 *         accessToken: "eyJhbGciOiJI..."
 *         refreshToken: "eyJhbGciOiJI..."
 *         user:
 *           id: "clx0abc123"
 *           full_name: "Jane Doe"
 *           email: "jane@example.com"
 *           phone: "+15551234567"
 *           role: CUSTOMER
 *           is_active: true
 *           created_at: "2025-08-16T12:00:00.000Z"
 *           updated_at: "2025-08-16T12:00:00.000Z"
 *     CreateProductRequest:
 *       type: object
 *       required: [name, description, price, stock, categoryId]
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         price: { type: number }
 *         stock: { type: integer }
 *         categoryId: { type: string }
 *       example:
 *         name: "Wireless Mouse"
 *         description: "Ergonomic wireless mouse"
 *         price: 29.99
 *         stock: 100
 *         categoryId: "cat_1"
 *     UpdateProductRequest:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         price: { type: number }
 *         stock: { type: integer }
 *         categoryId: { type: string }
 *     AddCartItemRequest:
 *       type: object
 *       required: [productId, quantity]
 *       properties:
 *         productId: { type: string }
 *         quantity: { type: integer, minimum: 1 }
 *       example:
 *         productId: "prod_123"
 *         quantity: 2
 *     PlaceOrderRequest:
 *       type: object
 *       required: [items]
 *       properties:
 *         items:
 *           type: array
 *           description: List of order line items.
 *           items:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id: { type: string }
 *               quantity: { type: integer, minimum: 1 }
 *         address_id:
 *           type: string
 *           description: ID of a saved address (required if new_shipping_address not provided)
 *         new_shipping_address:
 *           type: object
 *           description: Inline shipping address object (required if address_id not provided)
 *           properties:
 *             recipient_name: { type: string }
 *             phone: { type: string }
 *             address: { type: string }
 *             city: { type: string }
 *             state: { type: string }
 *             postal_code: { type: string }
 *             country: { type: string }
 *             notes: { type: string }
 *       oneOf:
 *         - required: [items, address_id]
 *         - required: [items, new_shipping_address]
 *       example:
 *         items:
 *           - product_id: "prod_123"
 *             quantity: 2
 *         address_id: "addr_1"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Login successful" }
 *         accessToken: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "User registered successfully" }
 *         user: { $ref: '#/components/schemas/User' }
 *     GenericMessageResponse:
 *       type: object
 *       properties:
 *         message: { type: string }
 *       example: { message: "Operation completed" }
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         full_name: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *     ChangePasswordRequest:
 *       type: object
 *       required: [oldPassword, newPassword]
 *       properties:
 *         oldPassword: { type: string }
 *         newPassword: { type: string }
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status: { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     AssignOrderRequest:
 *       type: object
 *       required: [deliveryPartnerId]
 *       properties:
 *         deliveryPartnerId: { type: string }
 *     UpdateDeliveryStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status: { type: string, enum: [UNASSIGNED, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED] }
 *         notes: { type: string }
 *     RestockRequest:
 *       type: object
 *       required: [productId, quantity]
 *       properties:
 *         productId: { type: string }
 *         quantity: { type: integer, minimum: 1 }
 *         reason: { type: string }
 *       example:
 *         productId: "prod_123"
 *         quantity: 50
 *         reason: "Admin Restock"
 *     ReserveStockRequest:
 *       type: object
 *       required: [items]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer }
 *       example:
 *         items:
 *           - productId: "prod_123"
 *             quantity: 2
 *     CreateCategoryRequest:
 *       type: object
 *       required: [name, slug]
 *       properties:
 *         name: { type: string }
 *         slug: { type: string }
 *     UpdateCategoryRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateCategoryRequest'
 *     CreateAddressRequest:
 *       type: object
 *       required: [recipient_name, phone, address, city, state, postal_code, country]
 *       properties:
 *         label: { type: string }
 *         recipient_name: { type: string }
 *         phone: { type: string }
 *         address: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         postal_code: { type: string }
 *         country: { type: string }
 *         is_default: { type: boolean }
 *     UpdateAddressRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateAddressRequest'
 *     UpdateCartItemQuantityRequest:
 *       type: object
 *       required: [quantity]
 *       properties:
 *         quantity: { type: integer, minimum: 1 }
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *     ValidationError:
 *       description: Validation failed
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *     ForbiddenError:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

export {};
