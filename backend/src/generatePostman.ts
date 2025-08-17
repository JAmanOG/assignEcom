import fs from "fs";
import path from "path";
import listEndpoints from "express-list-endpoints";
import { app } from "./app.js";

// Configuration (can be overridden via env or CLI args)
const DEFAULT_BASE_URL =
  process.env.POSTMAN_BASE_URL || "http://localhost:3000";
const DEFAULT_OUTPUT = process.env.POSTMAN_OUTPUT || "postman_collection.json";

// Allow: node generatePostman.js --baseUrl=http://localhost:4000 --out=collection.json
for (const arg of process.argv.slice(2)) {
  const [k, v] = arg.split("=");
  if (k === "--baseUrl" && v) (process as any).baseUrl = v;
  if (k === "--out" && v) (process as any).outFile = v;
}
const BASE_URL = (process as any).baseUrl || DEFAULT_BASE_URL;
const OUTPUT_FILE = (process as any).outFile || DEFAULT_OUTPUT;

interface EndpointInfo {
  path: string;
  methods: string[];
  middlewares?: string[];
}

const endpoints: EndpointInfo[] = listEndpoints(app) as any;

// Heuristic sample bodies per route keyword (updated to match controllers)
function sampleBodyFor(path: string, method: string) {
  const lower = path.toLowerCase();
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    if (lower.includes("/auth/login"))
      return { email: "user@example.com", password: "StrongP@ssw0rd" };
    if (lower.includes("/auth/register"))
      return {
        full_name: "John Doe",
        email: "user@example.com",
        phone: "+15550001122",
        password: "StrongP@ssw0rd",
      };
    if (lower.includes("change-password"))
      return { oldPassword: "OldP@ssw0rd", newPassword: "NewStrongP@ss1" };
    if (lower.includes("/categories"))
      return { name: "Category Name", slug: "category-slug" };
    if (
      lower.includes("/orders") &&
      method === "POST" &&
      !lower.includes("/admin/")
    ) {
      return {
        address_id: "{{address_id}}",
        // Or provide new_shipping_address instead of address_id
        // new_shipping_address: { recipient_name: 'Jane', phone: '+15550002233', address: '123 Main St', city: 'City', state: 'ST', postal_code: '12345' },
        items: [{ product_id: "{{product_id}}", quantity: 2 }],
      };
    }
    if (lower.includes("/orders") && lower.includes("/status"))
      return { status: "SHIPPED" };
    if (lower.includes("/orders") && lower.includes("/assign"))
      return { deliveryPartnerId: "{{delivery_partner_id}}" };
    if (lower.includes("/cart/add"))
      return { productId: "{{product_id}}", quantity: 1 };
    if (lower.match(/\/cart\/[^/]+$/) && method === "PUT")
      return { quantity: 3 };
    if (lower.includes("/inventory_transactions/stock/restock"))
      return {
        productId: "{{product_id}}",
        quantity: 10,
        reason: "Replenishment",
      };
    if (lower.includes("/inventory_transactions/stock/reserve"))
      return { items: [{ productId: "{{product_id}}", quantity: 1 }] };
    if (lower.includes("/address") && method === "POST")
      return {
        label: "Home",
        recipient_name: "Jane",
        phone: "+15550003344",
        address: "123 Main St",
        city: "City",
        state: "ST",
        postal_code: "12345",
        country: "US",
        is_default: true,
      };
    if (lower.includes("/address") && method === "PUT")
      return { label: "Office", city: "New City" };
    if (lower.includes("/admin/orders/total/status")) return {};
  }
  return {};
}

// Detect multipart form-data need (product image upload)
function needsMultipart(path: string, method: string) {
  return /\/products/.test(path) && ["POST", "PUT"].includes(method);
}
// Build body object for Postman
function buildBody(path: string, method: string) {
  if (needsMultipart(path, method)) {
    return {
      mode: "formdata",
      formdata: [
        { key: "name", value: "Sample Product", type: "text" },
        { key: "description", value: "Great product", type: "text" },
        { key: "price", value: "99.99", type: "text" },
        { key: "stock", value: "25", type: "text" },
        { key: "categoryId", value: "{{category_id}}", type: "text" },
        { key: "imagesURL", type: "file", src: ["sample-image.png"] },
      ],
    };
  }
  const sample = sampleBodyFor(path, method);
  if (Object.keys(sample).length === 0) return undefined;
  return { mode: "raw", raw: JSON.stringify(sample, null, 2) };
}

// Derive folder name from first segment after /api
function folderNameFor(p: string) {
  const segs = p.split("/").filter(Boolean);
  if (segs[0] === "api" && segs.length > 1) return segs[1];
  return segs[0] || "root";
}

function isAuthRequired(e: EndpointInfo): boolean {
  // If any middleware name suggests auth / role protection
  return (e.middlewares || []).some((m) => /auth|role/i.test(m));
}

function pathParamsFor(rawPath: string) {
  // Express style :id -> Postman {{id}}
  const parts = rawPath
    .split("/")
    .filter(Boolean)
    .map((seg) => (seg.startsWith(":") ? `{{${seg.slice(1)}}}` : seg));
  return parts;
}

// Extended query param templates
function queryParamsTemplate(rawPath: string) {
  if (/products$/i.test(rawPath)) {
    return [
      { key: "page", value: "1", disabled: false },
      { key: "limit", value: "10", disabled: false },
      { key: "search", value: "", disabled: true },
      { key: "sortBy", value: "created_at", disabled: true },
      { key: "sortOrder", value: "desc", disabled: true },
    ];
  }
  if (/products\/filter$/i.test(rawPath)) {
    return [
      { key: "categoryId", value: "", disabled: true },
      { key: "minPrice", value: "0", disabled: true },
      { key: "maxPrice", value: "1000", disabled: true },
      { key: "search", value: "", disabled: true },
      { key: "inStock", value: "true", disabled: true },
      { key: "page", value: "1", disabled: false },
      { key: "limit", value: "10", disabled: false },
    ];
  }
  if (/orders$/i.test(rawPath) && !/admin/.test(rawPath)) {
    return [
      { key: "page", value: "1", disabled: false },
      { key: "limit", value: "10", disabled: false },
      { key: "status", value: "PENDING", disabled: true },
    ];
  }
  return [];
}

interface PostmanItem {
  name: string;
  request: any;
}

// Group endpoints by folder
const folders: Record<string, PostmanItem[]> = {};

for (const ep of endpoints) {
  for (const method of ep.methods) {
    const folder = folderNameFor((ep as any).path || "") as any;
    if (!folders[folder]) folders[folder] = [];

    const requiresAuth = isAuthRequired(ep);
    const pathSegments = pathParamsFor(ep.path);
    const bodyDef = buildBody(ep.path, method);

    const item: PostmanItem = {
      name: `${method} ${ep.path}`,
      request: {
        method,
        header: [
          ...(requiresAuth
            ? [
                {
                  key: "Authorization",
                  value: "Bearer {{authToken}}",
                  type: "text",
                },
              ]
            : []),
          ...(bodyDef && bodyDef.mode === "raw"
            ? [{ key: "Content-Type", value: "application/json", type: "text" }]
            : []),
        ],
        ...(bodyDef ? { body: bodyDef } : {}),
        url: {
          raw: `${BASE_URL}${ep.path}`,
          protocol: BASE_URL.startsWith("https") ? "https" : "http",
          host: [BASE_URL.replace(/^https?:\/\//, "").replace(/:\\d+.*/, "")],
          port: (() => {
            const m = BASE_URL.match(/:(\d+)/);
            return m ? m[1] : undefined;
          })(),
          path: pathSegments,
          query: queryParamsTemplate(ep.path),
        },
        description: `Auto-generated request for ${method} ${ep.path}${
          requiresAuth ? " (auth required)" : ""
        }`,
      },
    };
    folders[folder].push(item);
  }
}

// Convert folders to Postman items structure
const collectionItems = Object.entries(folders).map(([folderName, items]) => ({
  name: folderName,
  item: items.sort((a, b) => a.name.localeCompare(b.name)),
}));

const postmanCollection = {
  info: {
    name: "E-Commerce API",
    description:
      "Generated from Express routes. Use environment vars for tokens & IDs.",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: BASE_URL },
    { key: "authToken", value: "" },
    { key: "product_id", value: "" },
    { key: "category_id", value: "" },
    { key: "address_id", value: "" },
    { key: "delivery_partner_id", value: "" },
  ],
  item: collectionItems,
};

// Ensure output directory exists
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(postmanCollection, null, 2));
console.log(`✅ Postman collection generated: ${OUTPUT_FILE}`);
