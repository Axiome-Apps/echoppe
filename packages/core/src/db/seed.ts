import { db } from './index';
import {
  country,
  taxRate,
  role,
  user,
  company,
  category,
  product,
  variant,
  media,
  productMedia,
  option,
  productOption,
  optionValue,
  variantOptionValue,
  stockMove,
} from './schema';
import { eq } from 'drizzle-orm';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(import.meta.dir, '../../../../apps/api/uploads');

// Download placeholder image from Picsum
async function downloadPlaceholder(
  width: number,
  height: number,
  seed: string
): Promise<{ buffer: Buffer; size: number }> {
  const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, size: buffer.length };
}

// Create a media record with downloaded image
async function createMedia(
  seed: string,
  title: string,
  width = 800,
  height = 800
): Promise<string | null> {
  try {
    const { buffer, size } = await downloadPlaceholder(width, height, seed);
    const filenameDisk = `${randomUUID()}.jpg`;
    const filePath = join(UPLOAD_DIR, filenameDisk);
    await Bun.write(filePath, buffer);

    const [mediaRecord] = await db
      .insert(media)
      .values({
        filenameDisk,
        filenameOriginal: `${seed}.jpg`,
        title,
        mimeType: 'image/jpeg',
        size,
        width,
        height,
      })
      .returning();

    return mediaRecord?.id ?? null;
  } catch {
    console.log(`    ⚠ Failed to download image: ${seed}`);
    return null;
  }
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Ensure uploads directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // === COUNTRIES ===
  console.log('  → Countries...');
  const countries = await db
    .insert(country)
    .values([
      { name: 'France', code: 'FR', isShippingEnabled: true },
      { name: 'Belgique', code: 'BE', isShippingEnabled: true },
      { name: 'Suisse', code: 'CH', isShippingEnabled: true },
      { name: 'Luxembourg', code: 'LU', isShippingEnabled: true },
      { name: 'Monaco', code: 'MC', isShippingEnabled: true },
      { name: 'Allemagne', code: 'DE', isShippingEnabled: false },
      { name: 'Espagne', code: 'ES', isShippingEnabled: false },
      { name: 'Italie', code: 'IT', isShippingEnabled: false },
      { name: 'Royaume-Uni', code: 'GB', isShippingEnabled: false },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`    ✓ ${countries.length} countries`);

  // === COMPANY (Shop Settings) ===
  console.log('  → Company settings...');
  const [france] = await db.select().from(country).where(eq(country.code, 'FR'));

  if (france) {
    const [existingCompany] = await db.select().from(company).limit(1);
    if (!existingCompany) {
      await db.insert(company).values({
        shopName: 'Ma Boutique Artisanale',
        publicEmail: 'contact@maboutique.fr',
        publicPhone: '01 23 45 67 89',
        legalName: 'Ma Boutique Artisanale SASU',
        legalForm: 'SASU',
        siren: '123456789',
        siret: '12345678900001',
        tvaIntra: 'FR12345678901',
        rcsCity: 'Paris',
        shareCapital: '1000.00',
        street: '123 Rue de la Création',
        postalCode: '75001',
        city: 'Paris',
        country: france.id,
        documentPrefix: 'REC',
        invoicePrefix: 'FA',
      });
      console.log('    ✓ Company settings created');
    } else {
      console.log('    ⊘ Company settings already exist');
    }
  }

  // === TAX RATES ===
  console.log('  → Tax rates...');
  const taxRates = await db
    .insert(taxRate)
    .values([
      { name: 'TVA 20%', rate: '20.00', isDefault: true, mention: null },
      { name: 'TVA 10%', rate: '10.00', isDefault: false, mention: null },
      { name: 'TVA 5.5%', rate: '5.50', isDefault: false, mention: null },
      { name: 'TVA 2.1%', rate: '2.10', isDefault: false, mention: null },
      {
        name: 'Franchise en base',
        rate: '0.00',
        isDefault: false,
        mention: 'TVA non applicable, art. 293 B du CGI',
      },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`    ✓ ${taxRates.length} tax rates`);

  // === ROLES ===
  console.log('  → Roles...');
  const roles = await db
    .insert(role)
    .values([
      {
        name: 'Owner',
        description: 'Propriétaire de la boutique - accès total',
        scope: 'admin',
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Administrateur - accès complet sauf paramètres critiques',
        scope: 'admin',
        isSystem: true,
      },
      {
        name: 'Manager',
        description: 'Gestionnaire - gestion produits, commandes, clients',
        scope: 'admin',
        isSystem: false,
      },
      {
        name: 'Support',
        description: 'Support client - lecture seule + gestion commandes',
        scope: 'admin',
        isSystem: false,
      },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`    ✓ ${roles.length} roles`);

  // === CATEGORIES ===
  console.log('  → Categories...');
  const categories = await db
    .insert(category)
    .values([
      { name: 'Bijoux', slug: 'bijoux', description: 'Bijoux artisanaux faits main', sortOrder: 0 },
      {
        name: 'Poterie',
        slug: 'poterie',
        description: 'Céramiques et poteries artisanales',
        sortOrder: 1,
      },
      {
        name: 'Textile',
        slug: 'textile',
        description: 'Créations textiles et tissages',
        sortOrder: 2,
      },
      {
        name: 'Décoration',
        slug: 'decoration',
        description: 'Objets de décoration uniques',
        sortOrder: 3,
      },
      {
        name: 'Papeterie',
        slug: 'papeterie',
        description: 'Carnets, cartes et papeterie artisanale',
        sortOrder: 4,
      },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`    ✓ ${categories.length} categories`);

  // === GET REFERENCES ===
  const [defaultTax] = await db.select().from(taxRate).where(eq(taxRate.isDefault, true));
  const [bijouxCat] = await db.select().from(category).where(eq(category.slug, 'bijoux'));
  const [poterieCat] = await db.select().from(category).where(eq(category.slug, 'poterie'));
  const [textileCat] = await db.select().from(category).where(eq(category.slug, 'textile'));
  const [decoCat] = await db.select().from(category).where(eq(category.slug, 'decoration'));

  if (!defaultTax || !bijouxCat || !poterieCat || !textileCat || !decoCat) {
    console.log('    ⊘ Skipped products (missing tax rate or categories)');
    return;
  }

  // === PRODUCTS ===
  console.log('  → Products...');
  const productsData = [
    {
      name: "Boucles d'oreilles Lune",
      slug: 'boucles-oreilles-lune',
      description:
        "Élégantes boucles d'oreilles en forme de croissant de lune, façonnées à la main en laiton doré. Chaque paire est unique, légèrement martelée pour un effet texturé subtil.",
      category: bijouxCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Collier Perles de Verre',
      slug: 'collier-perles-verre',
      description:
        'Collier artisanal composé de perles de verre soufflé aux reflets irisés. Fermoir en argent 925. Longueur ajustable.',
      category: bijouxCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Bracelet Tressé Cuir',
      slug: 'bracelet-tresse-cuir',
      description:
        'Bracelet en cuir végétal tressé à la main, fermoir magnétique en acier inoxydable. Disponible en plusieurs couleurs.',
      category: bijouxCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Bol en Grès Émaillé',
      slug: 'bol-gres-emaille',
      description:
        "Bol en grès tourné à la main, émaillage bleu océan unique. Passe au lave-vaisselle et au micro-ondes. Parfait pour le petit-déjeuner ou les soupes.",
      category: poterieCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Vase Terre Cuite',
      slug: 'vase-terre-cuite',
      description:
        'Vase en terre cuite brute, finition mate naturelle. Idéal pour fleurs séchées ou en pièce décorative seule.',
      category: poterieCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Mug Céramique Artisanal',
      slug: 'mug-ceramique-artisanal',
      description:
        "Mug en céramique tournée main, anse ergonomique. Émaillage intérieur alimentaire, extérieur texturé. Contenance 30cl.",
      category: poterieCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Écharpe Lin Naturel',
      slug: 'echarpe-lin-naturel',
      description:
        'Écharpe tissée main en lin français, légère et respirante. Idéale pour toutes les saisons.',
      category: textileCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Coussin Brodé Main',
      slug: 'coussin-brode-main',
      description:
        'Coussin en coton bio avec broderie florale traditionnelle. Housse déhoussable, garnissage inclus.',
      category: textileCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Bougie Parfumée Artisanale',
      slug: 'bougie-parfumee-artisanale',
      description:
        'Bougie coulée à la main en cire de soja, mèche coton. Parfums naturels aux huiles essentielles. Durée de combustion ~45h.',
      category: decoCat.id,
      taxRate: defaultTax.id,
      status: 'published' as const,
    },
    {
      name: 'Miroir Rotin Tressé',
      slug: 'miroir-rotin-tresse',
      description:
        'Miroir rond encadré de rotin naturel tressé à la main. Diamètre total 45cm. Fixation murale incluse.',
      category: decoCat.id,
      taxRate: defaultTax.id,
      status: 'draft' as const,
    },
  ];

  const products = await db.insert(product).values(productsData).onConflictDoNothing().returning();
  console.log(`    ✓ ${products.length} products`);

  // Map products by slug for easy access
  const productMap = new Map(products.map((p) => [p.slug, p]));

  // === GLOBAL OPTIONS ===
  console.log('  → Global options...');

  // Créer les options globales
  const globalOptionsData = [
    { name: 'Couleur', sortOrder: 0 },
    { name: 'Taille', sortOrder: 1 },
    { name: 'Longueur', sortOrder: 2 },
    { name: 'Motif', sortOrder: 3 },
    { name: 'Parfum', sortOrder: 4 },
  ];

  const globalOptions = await db.insert(option).values(globalOptionsData).onConflictDoNothing().returning();
  console.log(`    ✓ ${globalOptions.length} global options`);

  // Map option name -> option id
  const optionByName = new Map<string, string>();
  for (const opt of globalOptions) {
    optionByName.set(opt.name, opt.id);
  }
  // Si options existaient déjà, les récupérer
  if (optionByName.size === 0) {
    const existingOptions = await db.select().from(option);
    for (const opt of existingOptions) {
      optionByName.set(opt.name, opt.id);
    }
  }

  // === OPTION VALUES ===
  console.log('  → Option values...');

  const optionValuesData: { optionName: string; values: string[] }[] = [
    { optionName: 'Couleur', values: ['Or', 'Argent', 'Or Rose', 'Naturel', 'Noir', 'Marron', 'Bleu Océan', 'Vert Sauge', 'Terracotta', 'Blanc', 'Gris', 'Beige', 'Écru', 'Gris Chiné', 'Bleu Indigo'] },
    { optionName: 'Taille', values: ['S', 'M', 'L', 'Petit', 'Moyen', 'Grand'] },
    { optionName: 'Longueur', values: ['40cm', '45cm', '50cm'] },
    { optionName: 'Motif', values: ['Floral', 'Géométrique', 'Feuillage'] },
    { optionName: 'Parfum', values: ['Lavande', 'Cèdre', "Fleur d'Oranger", 'Vanille'] },
  ];

  // Map: optionName -> (valueName -> valueId)
  const valueMap = new Map<string, Map<string, string>>();
  let valueCount = 0;

  for (const ov of optionValuesData) {
    const optId = optionByName.get(ov.optionName);
    if (!optId) continue;

    const valMap = new Map<string, string>();
    for (let i = 0; i < ov.values.length; i++) {
      const [val] = await db
        .insert(optionValue)
        .values({ option: optId, value: ov.values[i], sortOrder: i })
        .onConflictDoNothing()
        .returning();
      if (val) {
        valMap.set(ov.values[i], val.id);
        valueCount++;
      }
    }
    valueMap.set(ov.optionName, valMap);
  }
  // Si valeurs existaient déjà, les récupérer
  const existingValues = await db.select().from(optionValue);
  for (const val of existingValues) {
    const optName = [...optionByName.entries()].find(([_, id]) => id === val.option)?.[0];
    if (optName) {
      if (!valueMap.has(optName)) valueMap.set(optName, new Map());
      valueMap.get(optName)!.set(val.value, val.id);
    }
  }
  console.log(`    ✓ ${valueCount} option values`);

  // === PRODUCT-OPTION LINKS ===
  console.log('  → Product-option links...');

  const productOptionsToCreate = [
    { productSlug: 'boucles-oreilles-lune', optionName: 'Couleur' },
    { productSlug: 'collier-perles-verre', optionName: 'Longueur' },
    { productSlug: 'bracelet-tresse-cuir', optionName: 'Couleur' },
    { productSlug: 'bracelet-tresse-cuir', optionName: 'Taille' },
    { productSlug: 'bol-gres-emaille', optionName: 'Taille' },
    { productSlug: 'bol-gres-emaille', optionName: 'Couleur' },
    { productSlug: 'mug-ceramique-artisanal', optionName: 'Couleur' },
    { productSlug: 'echarpe-lin-naturel', optionName: 'Couleur' },
    { productSlug: 'coussin-brode-main', optionName: 'Motif' },
    { productSlug: 'bougie-parfumee-artisanale', optionName: 'Parfum' },
  ];

  let linkCount = 0;
  for (const po of productOptionsToCreate) {
    const prod = productMap.get(po.productSlug);
    const optId = optionByName.get(po.optionName);
    if (!prod || !optId) continue;

    await db
      .insert(productOption)
      .values({ product: prod.id, option: optId, sortOrder: linkCount })
      .onConflictDoNothing();
    linkCount++;
  }
  console.log(`    ✓ ${linkCount} product-option links`);

  // === VARIANTS ===
  console.log('  → Variants...');

  type VariantDef = {
    productSlug: string;
    sku: string;
    price: string;
    comparePrice?: string;
    quantity: number;
    isDefault: boolean;
    options?: { name: string; value: string }[];
  };

  const variantsToCreate: VariantDef[] = [
    // Boucles d'oreilles - 3 couleurs
    { productSlug: 'boucles-oreilles-lune', sku: 'BOUCLE-LUNE-OR', price: '35.00', quantity: 12, isDefault: true, options: [{ name: 'Couleur', value: 'Or' }] },
    { productSlug: 'boucles-oreilles-lune', sku: 'BOUCLE-LUNE-ARG', price: '32.00', quantity: 8, isDefault: false, options: [{ name: 'Couleur', value: 'Argent' }] },
    { productSlug: 'boucles-oreilles-lune', sku: 'BOUCLE-LUNE-ROSE', price: '38.00', quantity: 5, isDefault: false, options: [{ name: 'Couleur', value: 'Or Rose' }] },

    // Collier - 3 longueurs
    { productSlug: 'collier-perles-verre', sku: 'COLLIER-40', price: '65.00', quantity: 5, isDefault: false, options: [{ name: 'Longueur', value: '40cm' }] },
    { productSlug: 'collier-perles-verre', sku: 'COLLIER-45', price: '68.00', quantity: 8, isDefault: true, options: [{ name: 'Longueur', value: '45cm' }] },
    { productSlug: 'collier-perles-verre', sku: 'COLLIER-50', price: '72.00', quantity: 3, isDefault: false, options: [{ name: 'Longueur', value: '50cm' }] },

    // Bracelet - combinaisons couleur/taille
    { productSlug: 'bracelet-tresse-cuir', sku: 'BRAC-NAT-M', price: '28.00', quantity: 15, isDefault: true, options: [{ name: 'Couleur', value: 'Naturel' }, { name: 'Taille', value: 'M' }] },
    { productSlug: 'bracelet-tresse-cuir', sku: 'BRAC-NOIR-M', price: '28.00', quantity: 12, isDefault: false, options: [{ name: 'Couleur', value: 'Noir' }, { name: 'Taille', value: 'M' }] },
    { productSlug: 'bracelet-tresse-cuir', sku: 'BRAC-MARR-M', price: '28.00', quantity: 10, isDefault: false, options: [{ name: 'Couleur', value: 'Marron' }, { name: 'Taille', value: 'M' }] },
    { productSlug: 'bracelet-tresse-cuir', sku: 'BRAC-NAT-S', price: '26.00', quantity: 8, isDefault: false, options: [{ name: 'Couleur', value: 'Naturel' }, { name: 'Taille', value: 'S' }] },
    { productSlug: 'bracelet-tresse-cuir', sku: 'BRAC-NAT-L', price: '30.00', quantity: 6, isDefault: false, options: [{ name: 'Couleur', value: 'Naturel' }, { name: 'Taille', value: 'L' }] },

    // Bol - tailles et couleurs
    { productSlug: 'bol-gres-emaille', sku: 'BOL-BLEU-S', price: '24.00', quantity: 20, isDefault: false, options: [{ name: 'Taille', value: 'Petit' }, { name: 'Couleur', value: 'Bleu Océan' }] },
    { productSlug: 'bol-gres-emaille', sku: 'BOL-BLEU-M', price: '32.00', quantity: 15, isDefault: true, options: [{ name: 'Taille', value: 'Moyen' }, { name: 'Couleur', value: 'Bleu Océan' }] },
    { productSlug: 'bol-gres-emaille', sku: 'BOL-BLEU-L', price: '42.00', quantity: 8, isDefault: false, options: [{ name: 'Taille', value: 'Grand' }, { name: 'Couleur', value: 'Bleu Océan' }] },
    { productSlug: 'bol-gres-emaille', sku: 'BOL-VERT-M', price: '32.00', quantity: 12, isDefault: false, options: [{ name: 'Taille', value: 'Moyen' }, { name: 'Couleur', value: 'Vert Sauge' }] },
    { productSlug: 'bol-gres-emaille', sku: 'BOL-TERRA-M', price: '32.00', quantity: 10, isDefault: false, options: [{ name: 'Taille', value: 'Moyen' }, { name: 'Couleur', value: 'Terracotta' }] },

    // Vase - variante unique
    { productSlug: 'vase-terre-cuite', sku: 'VASE-TC-01', price: '42.00', quantity: 8, isDefault: true },

    // Mug - 3 couleurs
    { productSlug: 'mug-ceramique-artisanal', sku: 'MUG-BLANC', price: '22.00', quantity: 25, isDefault: true, options: [{ name: 'Couleur', value: 'Blanc' }] },
    { productSlug: 'mug-ceramique-artisanal', sku: 'MUG-GRIS', price: '22.00', quantity: 18, isDefault: false, options: [{ name: 'Couleur', value: 'Gris' }] },
    { productSlug: 'mug-ceramique-artisanal', sku: 'MUG-BEIGE', price: '22.00', quantity: 20, isDefault: false, options: [{ name: 'Couleur', value: 'Beige' }] },

    // Écharpe - 3 couleurs
    { productSlug: 'echarpe-lin-naturel', sku: 'ECHARPE-ECRU', price: '55.00', quantity: 20, isDefault: true, options: [{ name: 'Couleur', value: 'Écru' }] },
    { productSlug: 'echarpe-lin-naturel', sku: 'ECHARPE-GRIS', price: '55.00', quantity: 15, isDefault: false, options: [{ name: 'Couleur', value: 'Gris Chiné' }] },
    { productSlug: 'echarpe-lin-naturel', sku: 'ECHARPE-INDIGO', price: '58.00', quantity: 10, isDefault: false, options: [{ name: 'Couleur', value: 'Bleu Indigo' }] },

    // Coussin - 3 motifs
    { productSlug: 'coussin-brode-main', sku: 'COUSSIN-FLORAL', price: '75.00', quantity: 6, isDefault: true, options: [{ name: 'Motif', value: 'Floral' }] },
    { productSlug: 'coussin-brode-main', sku: 'COUSSIN-GEO', price: '75.00', quantity: 4, isDefault: false, options: [{ name: 'Motif', value: 'Géométrique' }] },
    { productSlug: 'coussin-brode-main', sku: 'COUSSIN-FEUIL', price: '78.00', quantity: 5, isDefault: false, options: [{ name: 'Motif', value: 'Feuillage' }] },

    // Bougie - 4 parfums
    { productSlug: 'bougie-parfumee-artisanale', sku: 'BOUGIE-LAVANDE', price: '24.00', quantity: 30, isDefault: true, options: [{ name: 'Parfum', value: 'Lavande' }] },
    { productSlug: 'bougie-parfumee-artisanale', sku: 'BOUGIE-CEDRE', price: '24.00', quantity: 25, isDefault: false, options: [{ name: 'Parfum', value: 'Cèdre' }] },
    { productSlug: 'bougie-parfumee-artisanale', sku: 'BOUGIE-FLEUR', price: '26.00', quantity: 20, isDefault: false, options: [{ name: 'Parfum', value: "Fleur d'Oranger" }] },
    { productSlug: 'bougie-parfumee-artisanale', sku: 'BOUGIE-VANILLE', price: '24.00', quantity: 28, isDefault: false, options: [{ name: 'Parfum', value: 'Vanille' }] },

    // Miroir - variante unique (draft)
    { productSlug: 'miroir-rotin-tresse', sku: 'MIROIR-45', price: '89.00', comparePrice: '110.00', quantity: 3, isDefault: true },
  ];

  const variantMap = new Map<string, string>(); // sku -> variantId
  let variantCount = 0;

  for (const v of variantsToCreate) {
    const prod = productMap.get(v.productSlug);
    if (!prod) continue;

    const [createdVariant] = await db
      .insert(variant)
      .values({
        product: prod.id,
        sku: v.sku,
        priceHt: v.price,
        compareAtPriceHt: v.comparePrice,
        quantity: v.quantity,
        isDefault: v.isDefault,
        status: prod.status,
        sortOrder: variantCount,
      })
      .onConflictDoNothing()
      .returning();

    if (createdVariant) {
      variantMap.set(v.sku, createdVariant.id);
      variantCount++;

      // Link option values
      if (v.options) {
        for (const opt of v.options) {
          const valuesForOption = valueMap.get(opt.name);
          if (valuesForOption) {
            const valueId = valuesForOption.get(opt.value);
            if (valueId) {
              await db
                .insert(variantOptionValue)
                .values({ variant: createdVariant.id, optionValue: valueId })
                .onConflictDoNothing();
            }
          }
        }
      }
    }
  }
  console.log(`    ✓ ${variantCount} variants`);

  // === STOCK MOVES ===
  console.log('  → Stock moves (initial restock)...');

  // Create initial restock movements for all variants
  const allVariants = await db
    .select({
      id: variant.id,
      sku: variant.sku,
      quantity: variant.quantity,
      productName: product.name,
    })
    .from(variant)
    .innerJoin(product, eq(variant.product, product.id));

  let stockMoveCount = 0;
  for (const v of allVariants) {
    if (v.quantity <= 0) continue;

    const label = v.sku ? `${v.productName} — ${v.sku}` : v.productName;

    await db
      .insert(stockMove)
      .values({
        variant: v.id,
        label,
        quantity: v.quantity,
        type: 'restock',
        note: 'Stock initial',
      })
      .onConflictDoNothing();

    stockMoveCount++;
  }
  console.log(`    ✓ ${stockMoveCount} stock moves`);

  // === PRODUCT IMAGES ===
  console.log('  → Product images (downloading from Picsum)...');

  type ImageDef = {
    productSlug: string;
    seed: string;
    title: string;
    isFeatured: boolean;
    forVariantSku?: string;
  };

  const imagesToCreate: ImageDef[] = [
    // Boucles d'oreilles - 4 images
    { productSlug: 'boucles-oreilles-lune', seed: 'earrings-gold-1', title: "Boucles Lune Or - Vue principale", isFeatured: true },
    { productSlug: 'boucles-oreilles-lune', seed: 'earrings-gold-2', title: "Boucles Lune Or - Détail", isFeatured: false, forVariantSku: 'BOUCLE-LUNE-OR' },
    { productSlug: 'boucles-oreilles-lune', seed: 'earrings-silver-1', title: "Boucles Lune Argent", isFeatured: false, forVariantSku: 'BOUCLE-LUNE-ARG' },
    { productSlug: 'boucles-oreilles-lune', seed: 'earrings-rose-1', title: "Boucles Lune Or Rose", isFeatured: false, forVariantSku: 'BOUCLE-LUNE-ROSE' },

    // Collier - 3 images
    { productSlug: 'collier-perles-verre', seed: 'necklace-glass-1', title: "Collier Perles - Vue principale", isFeatured: true },
    { productSlug: 'collier-perles-verre', seed: 'necklace-glass-2', title: "Collier Perles - Détail perles", isFeatured: false },
    { productSlug: 'collier-perles-verre', seed: 'necklace-glass-3', title: "Collier Perles - Porté", isFeatured: false },

    // Bracelet - 4 images
    { productSlug: 'bracelet-tresse-cuir', seed: 'bracelet-natural-1', title: "Bracelet Naturel", isFeatured: true },
    { productSlug: 'bracelet-tresse-cuir', seed: 'bracelet-black-1', title: "Bracelet Noir", isFeatured: false, forVariantSku: 'BRAC-NOIR-M' },
    { productSlug: 'bracelet-tresse-cuir', seed: 'bracelet-brown-1', title: "Bracelet Marron", isFeatured: false, forVariantSku: 'BRAC-MARR-M' },
    { productSlug: 'bracelet-tresse-cuir', seed: 'bracelet-detail-1', title: "Bracelet - Détail fermoir", isFeatured: false },

    // Bol - 5 images
    { productSlug: 'bol-gres-emaille', seed: 'bowl-blue-1', title: "Bol Bleu Océan", isFeatured: true },
    { productSlug: 'bol-gres-emaille', seed: 'bowl-blue-2', title: "Bol Bleu - Vue dessus", isFeatured: false, forVariantSku: 'BOL-BLEU-M' },
    { productSlug: 'bol-gres-emaille', seed: 'bowl-green-1', title: "Bol Vert Sauge", isFeatured: false, forVariantSku: 'BOL-VERT-M' },
    { productSlug: 'bol-gres-emaille', seed: 'bowl-terra-1', title: "Bol Terracotta", isFeatured: false, forVariantSku: 'BOL-TERRA-M' },
    { productSlug: 'bol-gres-emaille', seed: 'bowl-sizes-1', title: "Bols - Comparaison tailles", isFeatured: false },

    // Vase - 3 images
    { productSlug: 'vase-terre-cuite', seed: 'vase-terra-1', title: "Vase Terre Cuite - Vue principale", isFeatured: true },
    { productSlug: 'vase-terre-cuite', seed: 'vase-terra-2', title: "Vase - Avec fleurs séchées", isFeatured: false },
    { productSlug: 'vase-terre-cuite', seed: 'vase-terra-3', title: "Vase - Détail texture", isFeatured: false },

    // Mug - 4 images
    { productSlug: 'mug-ceramique-artisanal', seed: 'mug-white-1', title: "Mug Blanc", isFeatured: true },
    { productSlug: 'mug-ceramique-artisanal', seed: 'mug-grey-1', title: "Mug Gris", isFeatured: false, forVariantSku: 'MUG-GRIS' },
    { productSlug: 'mug-ceramique-artisanal', seed: 'mug-beige-1', title: "Mug Beige", isFeatured: false, forVariantSku: 'MUG-BEIGE' },
    { productSlug: 'mug-ceramique-artisanal', seed: 'mug-detail-1', title: "Mug - Détail anse", isFeatured: false },

    // Écharpe - 4 images
    { productSlug: 'echarpe-lin-naturel', seed: 'scarf-ecru-1', title: "Écharpe Écru", isFeatured: true },
    { productSlug: 'echarpe-lin-naturel', seed: 'scarf-grey-1', title: "Écharpe Gris Chiné", isFeatured: false, forVariantSku: 'ECHARPE-GRIS' },
    { productSlug: 'echarpe-lin-naturel', seed: 'scarf-indigo-1', title: "Écharpe Bleu Indigo", isFeatured: false, forVariantSku: 'ECHARPE-INDIGO' },
    { productSlug: 'echarpe-lin-naturel', seed: 'scarf-texture-1', title: "Écharpe - Texture lin", isFeatured: false },

    // Coussin - 4 images
    { productSlug: 'coussin-brode-main', seed: 'cushion-floral-1', title: "Coussin Floral", isFeatured: true },
    { productSlug: 'coussin-brode-main', seed: 'cushion-geo-1', title: "Coussin Géométrique", isFeatured: false, forVariantSku: 'COUSSIN-GEO' },
    { productSlug: 'coussin-brode-main', seed: 'cushion-leaf-1', title: "Coussin Feuillage", isFeatured: false, forVariantSku: 'COUSSIN-FEUIL' },
    { productSlug: 'coussin-brode-main', seed: 'cushion-detail-1', title: "Coussin - Détail broderie", isFeatured: false },

    // Bougie - 5 images
    { productSlug: 'bougie-parfumee-artisanale', seed: 'candle-lavender-1', title: "Bougie Lavande", isFeatured: true },
    { productSlug: 'bougie-parfumee-artisanale', seed: 'candle-cedar-1', title: "Bougie Cèdre", isFeatured: false, forVariantSku: 'BOUGIE-CEDRE' },
    { productSlug: 'bougie-parfumee-artisanale', seed: 'candle-orange-1', title: "Bougie Fleur d'Oranger", isFeatured: false, forVariantSku: 'BOUGIE-FLEUR' },
    { productSlug: 'bougie-parfumee-artisanale', seed: 'candle-vanilla-1', title: "Bougie Vanille", isFeatured: false, forVariantSku: 'BOUGIE-VANILLE' },
    { productSlug: 'bougie-parfumee-artisanale', seed: 'candle-ambiance-1', title: "Bougies - Ambiance", isFeatured: false },

    // Miroir - 2 images
    { productSlug: 'miroir-rotin-tresse', seed: 'mirror-rattan-1', title: "Miroir Rotin - Vue principale", isFeatured: true },
    { productSlug: 'miroir-rotin-tresse', seed: 'mirror-rattan-2', title: "Miroir - Détail tressage", isFeatured: false },
  ];

  let imageCount = 0;
  for (const img of imagesToCreate) {
    const prod = productMap.get(img.productSlug);
    if (!prod) continue;

    const mediaId = await createMedia(img.seed, img.title);
    if (!mediaId) continue;

    const variantId = img.forVariantSku ? variantMap.get(img.forVariantSku) : null;

    await db
      .insert(productMedia)
      .values({
        product: prod.id,
        media: mediaId,
        sortOrder: imageCount,
        isFeatured: img.isFeatured,
        featuredForVariant: variantId,
      })
      .onConflictDoNothing();

    imageCount++;
    process.stdout.write(`\r    ↻ ${imageCount}/${imagesToCreate.length} images...`);
  }
  console.log(`\r    ✓ ${imageCount} product images          `);

  // === DEFAULT ADMIN USER ===
  console.log('  → Default admin user...');

  const [ownerRole] = await db.select().from(role).where(eq(role.name, 'Owner'));

  if (ownerRole) {
    const [existingAdmin] = await db.select().from(user).where(eq(user.email, 'admin@echoppe.dev'));

    if (!existingAdmin) {
      const passwordHash = await Bun.password.hash('admin123', {
        algorithm: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
      });

      await db.insert(user).values({
        email: 'admin@echoppe.dev',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Échoppe',
        role: ownerRole.id,
        isOwner: true,
        isActive: true,
      });
      console.log('    ✓ Admin user created (admin@echoppe.dev / admin123)');
    } else {
      console.log('    ⊘ Admin user already exists');
    }
  }

  console.log('✅ Seed completed!');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
