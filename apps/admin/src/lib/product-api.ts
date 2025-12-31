/**
 * Helpers typés pour les routes produit avec paramètres dynamiques imbriqués.
 * Ces routes ne peuvent pas être appelées avec la syntaxe objet d'Eden Treaty.
 */
import { api } from './api';

interface OptionValue {
  id: string;
  value: string;
}

interface SuccessResponse {
  success: boolean;
}

/**
 * POST /products/:id/options/:optionId/values
 * Crée une nouvelle valeur pour une option
 */
export async function createOptionValue(
  productId: string,
  optionId: string,
  value: string,
): Promise<OptionValue | null> {
  // @ts-expect-error - Eden Treaty ne supporte pas la notation bracket pour les paramètres dynamiques imbriqués
  const { data } = await api.products[productId].options[optionId].values.post({ value });
  if (data && 'id' in data) {
    return data as OptionValue;
  }
  return null;
}

/**
 * GET /products/:id/options/:optionId/values
 * Récupère les valeurs d'une option
 */
export async function getOptionValues(
  productId: string,
  optionId: string,
): Promise<OptionValue[]> {
  // @ts-expect-error - Eden Treaty ne supporte pas la notation bracket pour les paramètres dynamiques imbriqués
  const { data } = await api.products[productId].options[optionId].values.get();
  if (Array.isArray(data)) {
    return data as OptionValue[];
  }
  return [];
}

/**
 * PUT /products/:id/variants/:variantId/options
 * Met à jour les valeurs d'options d'une variante
 */
export async function updateVariantOptions(
  productId: string,
  variantId: string,
  optionValueIds: string[],
): Promise<SuccessResponse | null> {
  // @ts-expect-error - Eden Treaty ne supporte pas la notation bracket pour les paramètres dynamiques imbriqués
  const { data } = await api.products[productId].variants[variantId].options.put({ optionValueIds });
  if (data && 'success' in data) {
    return data as SuccessResponse;
  }
  return null;
}
