<!-- Généré par docs/scripts/gen-sdk-reference.ts — NE PAS ÉDITER À LA MAIN. -->

# Référence des modèles

Forme de chaque schéma exposé par le SDK (surface boutique), rendue depuis le contrat
figé `@echoppe/client`. Chaque modèle liste ses propriétés (type, description, objets
imbriqués dépliables) avec un exemple d’appel et un exemple de réponse.

## Address

<ModelDoc name="Address" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/customer/addresses/{id}', {
  params: { path: { id: '3fa85f64-…' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/addresses/3fa85f64-…', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="Address" />

## AddressList

<ModelDoc name="AddressList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/customer/addresses/');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/addresses/', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="AddressList" />

## Cart

<ModelDoc name="Cart" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/cart/');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/cart/', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="Cart" />

## CartMerge

<ModelDoc name="CartMerge" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.POST('/cart/merge');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/cart/merge', {
  method: 'POST',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="CartMerge" />

## Category

<ModelDoc name="Category" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/categories/{id}', {
  params: { path: { id: '3fa85f64-…' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/categories/3fa85f64-…', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="Category" />

## CategoryList

<ModelDoc name="CategoryList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/categories/');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/categories/', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="CategoryList" />

## CheckoutResult

<ModelDoc name="CheckoutResult" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.POST('/checkout/', {
  body: {
    "shippingAddress": {
      "firstName": "string",
      "lastName": "string",
      "company": "string",
      "street": "string",
      "street2": "string",
      "postalCode": "string",
      "city": "string",
      "countryCode": "string",
      "phone": "string"
    },
    "billingAddress": {
      "firstName": "string",
      "lastName": "string",
      "company": "string",
      "street": "string",
      "street2": "string",
      "postalCode": "string",
      "city": "string",
      "countryCode": "string",
      "phone": "string"
    },
    "useSameAddress": true,
    "customerNote": "string",
    "paymentProvider": "stripe",
    "successUrl": "string",
    "cancelUrl": "string"
  },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/checkout/', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "shippingAddress": {
      "firstName": "string",
      "lastName": "string",
      "company": "string",
      "street": "string",
      "street2": "string",
      "postalCode": "string",
      "city": "string",
      "countryCode": "string",
      "phone": "string"
    },
    "billingAddress": {
      "firstName": "string",
      "lastName": "string",
      "company": "string",
      "street": "string",
      "street2": "string",
      "postalCode": "string",
      "city": "string",
      "countryCode": "string",
      "phone": "string"
    },
    "useSameAddress": true,
    "customerNote": "string",
    "paymentProvider": "stripe",
    "successUrl": "string",
    "cancelUrl": "string"
  }),
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="CheckoutResult" />

## Collection

<ModelDoc name="Collection" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/collections/{id}', {
  params: { path: { id: '3fa85f64-…' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/collections/3fa85f64-…', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="Collection" />

## CollectionList

<ModelDoc name="CollectionList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/collections/', {
  params: { query: { page: 1, limit: 20 } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/collections/?page=1&limit=20', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="CollectionList" />

## CustomerAuth

<ModelDoc name="CustomerAuth" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/customer/auth/me');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/auth/me', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="CustomerAuth" />

## LoginResult

<ModelDoc name="LoginResult" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.POST('/customer/auth/login', {
  body: {
    "email": "client@exemple.fr",
    "password": "string"
  },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "email": "client@exemple.fr",
    "password": "string"
  }),
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="LoginResult" />

## Order

<ModelDoc name="Order" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/customer/orders/{id}', {
  params: { path: { id: '3fa85f64-…' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/orders/3fa85f64-…', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="Order" />

## OrderList

<ModelDoc name="OrderList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/customer/orders/', {
  params: { query: { page: 1, limit: 20 } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/customer/orders/?page=1&limit=20', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="OrderList" />

## PaymentProviderList

<ModelDoc name="PaymentProviderList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/checkout/payment-providers');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/checkout/payment-providers', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="PaymentProviderList" />

## ProductDetail

<ModelDoc name="ProductDetail" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/products/by-slug/{slug}', {
  params: { path: { slug: 'mon-slug' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/products/by-slug/mon-slug', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="ProductDetail" />

## ProductList

<ModelDoc name="ProductList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/products/', {
  params: { query: { page: 1, limit: 20, search: "string", category: "3fa85f64-5717-4562-b3fc-2c963f66afa6", minPrice: 0, maxPrice: 0, inStock: true, sort: "price", order: "asc" } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/products/?page=1&limit=20&search=string&category=3fa85f64-5717-4562-b3fc-2c963f66afa6&minPrice=0&maxPrice=0&inStock=true&sort=price&order=asc', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="ProductList" />

## ProductWithVariants

<ModelDoc name="ProductWithVariants" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/products/{id}', {
  params: { path: { id: '3fa85f64-…' } },
});
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/products/3fa85f64-…', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="ProductWithVariants" />

## TaxRateList

<ModelDoc name="TaxRateList" />

**Exemple d’appel**

::: code-group

```ts [SDK]
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/tax-rates/');
```

```js [REST]
const res = await fetch('https://api.maboutique.fr/tax-rates/', {
  method: 'GET',
  credentials: 'include',
});
const data = await res.json();
```

:::

**Exemple de réponse**

<ResponseSample name="TaxRateList" />
