import { db } from './index';
import { country, taxRate, role, user, category, product, variant, media, productMedia } from './schema';
import { eq } from 'drizzle-orm';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(import.meta.dir, '../../../../apps/api/uploads');

// Download placeholder image from Picsum
async function downloadPlaceholder(width: number, height: number, seed: string): Promise<{ buffer: Buffer; size: number }> {
  const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, size: buffer.length };
}

async function seed() {
  console.log('🌱 Seeding database...');

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
      { name: 'Poterie', slug: 'poterie', description: 'Céramiques et poteries artisanales', sortOrder: 1 },
      { name: 'Textile', slug: 'textile', description: 'Créations textiles et tissages', sortOrder: 2 },
      { name: 'Décoration', slug: 'decoration', description: 'Objets de décoration uniques', sortOrder: 3 },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`    ✓ ${categories.length} categories`);

  // === PRODUCTS ===
  console.log('  → Products...');

  // Get default tax rate (TVA 20%)
  const [defaultTax] = await db.select().from(taxRate).where(eq(taxRate.isDefault, true));
  // Get categories for reference
  const [bijouxCat] = await db.select().from(category).where(eq(category.slug, 'bijoux'));
  const [poterieCat] = await db.select().from(category).where(eq(category.slug, 'poterie'));
  const [textileCat] = await db.select().from(category).where(eq(category.slug, 'textile'));

  if (defaultTax && bijouxCat && poterieCat && textileCat) {
    const products = await db
      .insert(product)
      .values([
        {
          name: 'Boucles d\'oreilles Lune',
          slug: 'boucles-oreilles-lune',
          description: 'Élégantes boucles d\'oreilles en forme de croissant de lune, façonnées à la main en laiton doré.',
          category: bijouxCat.id,
          taxRate: defaultTax.id,
          status: 'published',
        },
        {
          name: 'Collier Perles de Verre',
          slug: 'collier-perles-verre',
          description: 'Collier artisanal composé de perles de verre soufflé, chaque pièce est unique.',
          category: bijouxCat.id,
          taxRate: defaultTax.id,
          status: 'published',
        },
        {
          name: 'Bol en Grès Émaillé',
          slug: 'bol-gres-emaille',
          description: 'Bol en grès tourné à la main, émaillage bleu océan. Passe au lave-vaisselle.',
          category: poterieCat.id,
          taxRate: defaultTax.id,
          status: 'published',
        },
        {
          name: 'Vase Terre Cuite',
          slug: 'vase-terre-cuite',
          description: 'Vase en terre cuite brute, finition mate. Idéal pour fleurs séchées.',
          category: poterieCat.id,
          taxRate: defaultTax.id,
          status: 'published',
        },
        {
          name: 'Écharpe Lin Naturel',
          slug: 'echarpe-lin-naturel',
          description: 'Écharpe tissée main en lin français, légère et respirante.',
          category: textileCat.id,
          taxRate: defaultTax.id,
          status: 'published',
        },
        {
          name: 'Coussin Brodé Main',
          slug: 'coussin-brode-main',
          description: 'Coussin en coton bio avec broderie florale traditionnelle.',
          category: textileCat.id,
          taxRate: defaultTax.id,
          status: 'draft',
        },
      ])
      .onConflictDoNothing()
      .returning();
    console.log(`    ✓ ${products.length} products`);

    // === VARIANTS ===
    console.log('  → Variants...');
    const [bouclesLune] = await db.select().from(product).where(eq(product.slug, 'boucles-oreilles-lune'));
    const [bolGres] = await db.select().from(product).where(eq(product.slug, 'bol-gres-emaille'));
    const [echarpeLin] = await db.select().from(product).where(eq(product.slug, 'echarpe-lin-naturel'));
    const [collierPerles] = await db.select().from(product).where(eq(product.slug, 'collier-perles-verre'));
    const [vaseTerre] = await db.select().from(product).where(eq(product.slug, 'vase-terre-cuite'));
    const [coussinBrode] = await db.select().from(product).where(eq(product.slug, 'coussin-brode-main'));

    const variantsData = [];

    if (bouclesLune) {
      variantsData.push(
        { product: bouclesLune.id, sku: 'BOUCLE-LUNE-OR', priceHt: '35.00', isDefault: true, status: 'published' as const, quantity: 12 },
        { product: bouclesLune.id, sku: 'BOUCLE-LUNE-ARG', priceHt: '32.00', isDefault: false, status: 'published' as const, quantity: 8 },
      );
    }
    if (collierPerles) {
      variantsData.push(
        { product: collierPerles.id, sku: 'COLLIER-PERLE-01', priceHt: '65.00', isDefault: true, status: 'published' as const, quantity: 5 },
      );
    }
    if (bolGres) {
      variantsData.push(
        { product: bolGres.id, sku: 'BOL-GRES-S', priceHt: '28.00', isDefault: false, status: 'published' as const, quantity: 15 },
        { product: bolGres.id, sku: 'BOL-GRES-M', priceHt: '38.00', isDefault: true, status: 'published' as const, quantity: 10 },
        { product: bolGres.id, sku: 'BOL-GRES-L', priceHt: '48.00', isDefault: false, status: 'published' as const, quantity: 6 },
      );
    }
    if (vaseTerre) {
      variantsData.push(
        { product: vaseTerre.id, sku: 'VASE-TC-01', priceHt: '42.00', isDefault: true, status: 'published' as const, quantity: 8 },
      );
    }
    if (echarpeLin) {
      variantsData.push(
        { product: echarpeLin.id, sku: 'ECHARPE-LIN-ECRU', priceHt: '55.00', isDefault: true, status: 'published' as const, quantity: 20 },
        { product: echarpeLin.id, sku: 'ECHARPE-LIN-GRIS', priceHt: '55.00', isDefault: false, status: 'published' as const, quantity: 15 },
      );
    }
    if (coussinBrode) {
      variantsData.push(
        { product: coussinBrode.id, sku: 'COUSSIN-BRODE-01', priceHt: '75.00', isDefault: true, status: 'draft' as const, quantity: 3 },
      );
    }

    if (variantsData.length > 0) {
      const variants = await db.insert(variant).values(variantsData).onConflictDoNothing().returning();
      console.log(`    ✓ ${variants.length} variants`);
    }

    // === MEDIA & PRODUCT IMAGES ===
    console.log('  → Product images...');

    // Ensure uploads directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const productImages: { productId: string; seed: string; title: string }[] = [
      { productId: bouclesLune?.id || '', seed: 'earrings-moon', title: 'Boucles d\'oreilles Lune' },
      { productId: collierPerles?.id || '', seed: 'necklace-glass', title: 'Collier Perles de Verre' },
      { productId: bolGres?.id || '', seed: 'bowl-ceramic', title: 'Bol en Grès Émaillé' },
      { productId: vaseTerre?.id || '', seed: 'vase-terracotta', title: 'Vase Terre Cuite' },
      { productId: echarpeLin?.id || '', seed: 'scarf-linen', title: 'Écharpe Lin Naturel' },
      { productId: coussinBrode?.id || '', seed: 'cushion-embroidered', title: 'Coussin Brodé Main' },
    ].filter(p => p.productId);

    let mediaCount = 0;
    for (const img of productImages) {
      try {
        // Download placeholder image
        const { buffer, size } = await downloadPlaceholder(800, 800, img.seed);

        // Save to disk
        const filenameDisk = `${randomUUID()}.jpg`;
        const filePath = join(UPLOAD_DIR, filenameDisk);
        await Bun.write(filePath, buffer);

        // Insert media record
        const [mediaRecord] = await db
          .insert(media)
          .values({
            filenameDisk,
            filenameOriginal: `${img.seed}.jpg`,
            title: img.title,
            mimeType: 'image/jpeg',
            size,
            width: 800,
            height: 800,
          })
          .onConflictDoNothing()
          .returning();

        if (mediaRecord) {
          // Link to product
          await db
            .insert(productMedia)
            .values({
              product: img.productId,
              media: mediaRecord.id,
              sortOrder: 0,
              isFeatured: true,
            })
            .onConflictDoNothing();
          mediaCount++;
        }
      } catch (error) {
        console.log(`    ⚠ Failed to download image for ${img.title}`);
      }
    }
    console.log(`    ✓ ${mediaCount} product images`);

  } else {
    console.log('    ⊘ Skipped products (missing tax rate or categories)');
  }

  // === DEFAULT ADMIN USER ===
  console.log('  → Default admin user...');

  // Get Owner role
  const [ownerRole] = await db.select().from(role).where(eq(role.name, 'Owner'));

  if (ownerRole) {
    // Check if admin user already exists
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
