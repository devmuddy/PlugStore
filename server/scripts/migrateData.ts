import dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';

// Load environment variables
dotenv.config();

// Subcategory schema (for destination database)
const subCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

// Category schema (for destination database)
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subCategories: {
      type: [subCategorySchema],
      default: [],
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Product schema (for destination database)
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    stock: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const migrateData = async () => {
  let sourceConnection: mongoose.Connection | null = null;
  let destConnection: mongoose.Connection | null = null;

  try {
    // Get destination MongoDB URI from command line argument
    const destMongoURI = process.argv[2];
    
    if (!destMongoURI) {
      console.error('❌ Error: Destination MongoDB URI is required');
      console.log('\nUsage: npm run migrate-data <destination-mongodb-uri>');
      console.log('Example: npm run migrate-data "mongodb+srv://user:pass@cluster.mongodb.net/destdb"');
      process.exit(1);
    }

    // Get source MongoDB URI from environment
    const sourceMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plugstore';

    console.log('\n🚀 Starting Data Migration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connect to source database
    console.log('📡 Connecting to source database...');
    const sourceUriForLog = sourceMongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`   Source URI: ${sourceUriForLog}`);
    
    sourceConnection = mongoose.createConnection(sourceMongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    await sourceConnection.asPromise();
    console.log('✅ Connected to source database\n');

    // Connect to destination database
    console.log('📡 Connecting to destination database...');
    const destUriForLog = destMongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`   Destination URI: ${destUriForLog}`);
    
    destConnection = mongoose.createConnection(destMongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    await destConnection.asPromise();
    console.log('✅ Connected to destination database\n');

    // Create models for destination database
    const DestCategory = destConnection.model('Category', categorySchema);
    const DestProduct = destConnection.model('Product', productSchema);

    // Create models for source database (using same schemas)
    const SourceCategory = sourceConnection.model('Category', categorySchema);
    const SourceProduct = sourceConnection.model('Product', productSchema);

    // ============================================
    // STEP 1: Migrate Categories
    // ============================================
    console.log('📦 Step 1: Migrating Categories...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sourceCategories = await SourceCategory.find({}).lean();
    console.log(`   Found ${sourceCategories.length} categories in source database`);

    // Create category ID map outside the if block so it's accessible in Step 2
    const categoryIdMap = new Map<string, mongoose.Types.ObjectId>();
    const categoryNameMap = new Map<string, string>();

    if (sourceCategories.length === 0) {
      console.log('   ⚠️  No categories found in source database');
    } else {
      let categoriesCreated = 0;
      let categoriesUpdated = 0;

      for (const sourceCategory of sourceCategories) {
        try {
          // Prepare subcategories data (preserve all fields including _id if needed)
          const subCategoriesData = (sourceCategory.subCategories || []).map((subCat: any) => ({
            _id: subCat._id, // Preserve original subcategory ID
            name: subCat.name,
            slug: subCat.slug || subCat.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
            isActive: subCat.isActive !== undefined ? subCat.isActive : true,
          }));

          // Prepare category data (preserve original _id)
          const categoryData: any = {
            _id: sourceCategory._id, // Preserve original category ID
            name: sourceCategory.name,
            slug: sourceCategory.slug,
            description: sourceCategory.description,
            icon: sourceCategory.icon,
            isActive: sourceCategory.isActive !== undefined ? sourceCategory.isActive : true,
            subCategories: subCategoriesData,
            createdAt: sourceCategory.createdAt,
            updatedAt: sourceCategory.updatedAt,
          };

          // Find existing category in destination by _id (not slug)
          const existingCategory = await DestCategory.findById(sourceCategory._id);

          if (existingCategory) {
            // Update existing category - properly handle subcategories
            existingCategory.name = categoryData.name;
            existingCategory.slug = categoryData.slug;
            existingCategory.description = categoryData.description;
            existingCategory.icon = categoryData.icon;
            existingCategory.isActive = categoryData.isActive;
            existingCategory.subCategories = categoryData.subCategories; // Replace entire array
            if (categoryData.createdAt) existingCategory.createdAt = categoryData.createdAt;
            if (categoryData.updatedAt) existingCategory.updatedAt = categoryData.updatedAt;
            
            const savedCategory = await existingCategory.save();
            if (!savedCategory || !savedCategory._id) {
              throw new Error('Failed to save category - no ID returned');
            }
            categoryIdMap.set(sourceCategory._id.toString(), savedCategory._id);
            categoryNameMap.set(sourceCategory._id.toString(), sourceCategory.name);
            categoriesUpdated++;
            console.log(`   ✅ Updated category: "${sourceCategory.name}" (${subCategoriesData.length} subcategories)`);
          } else {
            // Create new category
            const newCategory = new DestCategory(categoryData);
            const savedCategory = await newCategory.save();
            if (!savedCategory || !savedCategory._id) {
              throw new Error('Failed to save category - no ID returned');
            }
            categoryIdMap.set(sourceCategory._id.toString(), savedCategory._id);
            categoryNameMap.set(sourceCategory._id.toString(), sourceCategory.name);
            categoriesCreated++;
            console.log(`   ✅ Created category: "${sourceCategory.name}" (${subCategoriesData.length} subcategories)`);
          }
          
          // Log subcategories if any
          if (subCategoriesData.length > 0) {
            subCategoriesData.forEach((subCat: any) => {
              console.log(`      └─ Subcategory: "${subCat.name}" (slug: ${subCat.slug})`);
            });
          }
        } catch (error: any) {
          console.error(`   ❌ Error migrating category "${sourceCategory.name}":`, error.message);
          if (error.errors) {
            console.error(`      Validation errors:`, JSON.stringify(error.errors, null, 2));
          }
        }
      }

      console.log(`\n   📊 Categories Summary:`);
      console.log(`      Created: ${categoriesCreated}`);
      console.log(`      Updated: ${categoriesUpdated}`);
      console.log(`      Total: ${categoriesCreated + categoriesUpdated}`);
    }

    // ============================================
    // STEP 2: Migrate Products
    // ============================================
    console.log('\n📦 Step 2: Migrating Products...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sourceProducts = await SourceProduct.find({}).lean();
    console.log(`   Found ${sourceProducts.length} products in source database`);

    if (sourceProducts.length === 0) {
      console.log('   ⚠️  No products found in source database');
    } else {
      // Use the categoryIdMap and categoryNameMap created in Step 1
      const allDestCategories = await DestCategory.find({}).lean();
      
      console.log(`   Using ${categoryIdMap.size} mapped categories from Step 1`);
      console.log(`   Found ${allDestCategories.length} destination categories\n`);
      
      // Build subcategory mapping for validation
      // Map: categoryId -> Set of valid subcategory slugs
      const categorySubCategoryMap = new Map<string, Set<string>>();
      allDestCategories.forEach((destCat: any) => {
        const catId = destCat._id.toString();
        const subCatSlugs = new Set<string>();
        if (destCat.subCategories && Array.isArray(destCat.subCategories)) {
          destCat.subCategories.forEach((subCat: any) => {
            if (subCat.slug) {
              subCatSlugs.add(subCat.slug.toLowerCase());
            }
            if (subCat.name) {
              // Also add name-based slug as fallback
              const nameSlug = subCat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
              subCatSlugs.add(nameSlug);
            }
          });
        }
        categorySubCategoryMap.set(catId, subCatSlugs);
      });
      
      // Log subcategories for each category
      console.log(`   Subcategories in destination:`);
      allDestCategories.forEach((destCat: any) => {
        const subCats = destCat.subCategories || [];
        if (subCats.length > 0) {
          console.log(`      Category "${destCat.name}": ${subCats.length} subcategories`);
          subCats.forEach((subCat: any) => {
            console.log(`         └─ "${subCat.name}" (slug: ${subCat.slug || 'N/A'})`);
          });
        } else {
          console.log(`      Category "${destCat.name}": No subcategories`);
        }
      });
      console.log('');
      
      // Verify we have all products
      const totalProductsCount = await SourceProduct.countDocuments({});
      console.log(`   Verified: ${totalProductsCount} total products in source database`);
      if (sourceProducts.length !== totalProductsCount) {
        console.log(`   ⚠️  WARNING: Fetched ${sourceProducts.length} products but count shows ${totalProductsCount}`);
      }
      console.log('');

      // Analyze product categories and subcategories before migration
      const productCategoryStats = new Map<string, number>();
      const productSubCategoryStats = new Map<string, number>();
      sourceProducts.forEach((p: any) => {
        const catId = p.category?.toString() || 'no-category';
        productCategoryStats.set(catId, (productCategoryStats.get(catId) || 0) + 1);
        if (p.subCategory) {
          const key = `${catId}:${p.subCategory}`;
          productSubCategoryStats.set(key, (productSubCategoryStats.get(key) || 0) + 1);
        }
      });
      
      console.log(`   Product category distribution:`);
      productCategoryStats.forEach((count, catId) => {
        const catName = categoryNameMap.get(catId) || 'Unknown';
        const isMapped = categoryIdMap.has(catId);
        console.log(`      ${isMapped ? '✅' : '❌'} Category "${catName}" (ID: ${catId}): ${count} products`);
      });
      
      if (productSubCategoryStats.size > 0) {
        console.log(`\n   Product subcategory distribution:`);
        productSubCategoryStats.forEach((count, key) => {
          const [catId, subCatSlug] = key.split(':');
          const catName = categoryNameMap.get(catId) || 'Unknown';
          const newCatId = categoryIdMap.get(catId);
          const validSubCats = newCatId ? categorySubCategoryMap.get(newCatId.toString()) : null;
          const isValid = validSubCats && validSubCats.has(subCatSlug.toLowerCase());
          console.log(`      ${isValid ? '✅' : '⚠️'} "${catName}" > "${subCatSlug}": ${count} products`);
        });
      }
      console.log('');

      let productsCreated = 0;
      let productsUpdated = 0;
      let productsSkipped = 0;
      let productsFailed = 0;
      const skippedProducts: Array<{ name: string; reason: string }> = [];
      const failedProducts: Array<{ name: string; error: string }> = [];

      for (let i = 0; i < sourceProducts.length; i++) {
        const sourceProduct = sourceProducts[i];
        try {
          // Get new category ID
          const oldCategoryId = sourceProduct.category?.toString();
          
          if (!oldCategoryId) {
            const reason = 'Product has no category ID';
            console.log(`   ⚠️  [${i + 1}/${sourceProducts.length}] Skipped product "${sourceProduct.name}" - ${reason}`);
            productsSkipped++;
            skippedProducts.push({ name: sourceProduct.name, reason });
            continue;
          }

          const newCategoryId = categoryIdMap.get(oldCategoryId);
          const categoryName = categoryNameMap.get(oldCategoryId);

          if (!newCategoryId) {
            const reason = `Category not found in destination (source category ID: ${oldCategoryId})`;
            console.log(`   ⚠️  [${i + 1}/${sourceProducts.length}] Skipped product "${sourceProduct.name}" - ${reason}`);
            productsSkipped++;
            skippedProducts.push({ name: sourceProduct.name, reason });
            continue;
          }

          // Validate subcategory if product has one
          let validSubCategory: string | undefined = sourceProduct.subCategory || undefined;
          if (sourceProduct.subCategory) {
            const validSubCats = categorySubCategoryMap.get(newCategoryId.toString());
            const subCatLower = sourceProduct.subCategory.toLowerCase().trim();
            
            if (validSubCats && validSubCats.size > 0) {
              // Check if subcategory slug exists
              const subCatExists = validSubCats.has(subCatLower);
              
              if (!subCatExists) {
                // Try to find matching subcategory by name or partial match
                const destCategory = allDestCategories.find((dc: any) => dc._id.toString() === newCategoryId.toString());
                if (destCategory && destCategory.subCategories) {
                  const matchingSubCat = destCategory.subCategories.find((sc: any) => 
                    sc.slug?.toLowerCase() === subCatLower ||
                    sc.name?.toLowerCase() === subCatLower ||
                    sc.slug?.toLowerCase().includes(subCatLower) ||
                    sc.name?.toLowerCase().includes(subCatLower)
                  );
                  
                  if (matchingSubCat && matchingSubCat.slug) {
                    validSubCategory = matchingSubCat.slug;
                    console.log(`   ℹ️  [${i + 1}/${sourceProducts.length}] Mapped subcategory "${sourceProduct.subCategory}" -> "${validSubCategory}" for product "${sourceProduct.name}"`);
                  } else {
                    console.log(`   ⚠️  [${i + 1}/${sourceProducts.length}] Product "${sourceProduct.name}" has invalid subcategory "${sourceProduct.subCategory}" - will be set to null`);
                    validSubCategory = undefined;
                  }
                } else {
                  console.log(`   ⚠️  [${i + 1}/${sourceProducts.length}] Product "${sourceProduct.name}" has subcategory "${sourceProduct.subCategory}" but category has no subcategories - will be set to null`);
                  validSubCategory = undefined;
                }
              }
            } else {
              console.log(`   ⚠️  [${i + 1}/${sourceProducts.length}] Product "${sourceProduct.name}" has subcategory "${sourceProduct.subCategory}" but category has no subcategories - will be set to null`);
              validSubCategory = undefined;
            }
          }

          // Prepare product data (preserve original _id)
          const productData: any = {
            _id: sourceProduct._id, // Preserve original product ID
            name: sourceProduct.name,
            description: sourceProduct.description,
            price: sourceProduct.price,
            category: newCategoryId,
            subCategory: validSubCategory,
            image: sourceProduct.image,
            imagePublicId: sourceProduct.imagePublicId,
            stock: sourceProduct.stock !== undefined ? sourceProduct.stock : 0,
            balance: sourceProduct.balance,
            isActive: sourceProduct.isActive !== undefined ? sourceProduct.isActive : true,
            tags: sourceProduct.tags || [],
            createdAt: sourceProduct.createdAt,
            updatedAt: sourceProduct.updatedAt,
          };

          // Check if product already exists by its original _id
          const existingProduct = await DestProduct.findById(sourceProduct._id);

          if (existingProduct) {
            // Update existing product
            Object.assign(existingProduct, productData);
            const savedProduct = await existingProduct.save();
            if (!savedProduct || !savedProduct._id) {
              throw new Error('Failed to save product - no ID returned');
            }
            productsUpdated++;
            const subCatInfo = validSubCategory ? ` > Subcategory: ${validSubCategory}` : '';
            console.log(`   ✅ [${i + 1}/${sourceProducts.length}] Updated product: "${sourceProduct.name}" (ID: ${sourceProduct._id}) (Category: ${categoryName}${subCatInfo})`);
          } else {
            // Create new product with original _id
            const newProduct = new DestProduct(productData);
            const savedProduct = await newProduct.save();
            if (!savedProduct || !savedProduct._id) {
              throw new Error('Failed to save product - no ID returned');
            }
            productsCreated++;
            const subCatInfo = validSubCategory ? ` > Subcategory: ${validSubCategory}` : '';
            console.log(`   ✅ [${i + 1}/${sourceProducts.length}] Created product: "${sourceProduct.name}" (ID: ${sourceProduct._id}) (Category: ${categoryName}${subCatInfo})`);
          }
        } catch (error: any) {
          productsFailed++;
          const errorMsg = error.message || 'Unknown error';
          console.error(`   ❌ [${i + 1}/${sourceProducts.length}] Error migrating product "${sourceProduct.name}":`, errorMsg);
          if (error.errors) {
            console.error(`      Validation errors:`, JSON.stringify(error.errors, null, 2));
          }
          failedProducts.push({ name: sourceProduct.name, error: errorMsg });
        }
      }

      console.log(`\n   📊 Products Summary:`);
      console.log(`      Total in source: ${sourceProducts.length}`);
      console.log(`      Created: ${productsCreated}`);
      console.log(`      Updated: ${productsUpdated}`);
      console.log(`      Skipped: ${productsSkipped}`);
      console.log(`      Failed: ${productsFailed}`);
      console.log(`      Successfully migrated: ${productsCreated + productsUpdated}`);
      
      if (skippedProducts.length > 0) {
        console.log(`\n   ⚠️  Skipped Products (${skippedProducts.length}):`);
        skippedProducts.forEach((p, idx) => {
          console.log(`      ${idx + 1}. "${p.name}" - ${p.reason}`);
        });
      }
      
      if (failedProducts.length > 0) {
        console.log(`\n   ❌ Failed Products (${failedProducts.length}):`);
        failedProducts.forEach((p, idx) => {
          console.log(`      ${idx + 1}. "${p.name}" - ${p.error}`);
        });
      }
    }

    // ============================================
    // STEP 3: Verify Migration
    // ============================================
    console.log('\n🔍 Step 3: Verifying Migration...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Verify categories
      const destCategoriesCount = await DestCategory.countDocuments({});
      const destCategoriesWithSubs = await DestCategory.find({}).lean();
      let totalSubCategories = 0;
      destCategoriesWithSubs.forEach((cat: any) => {
        totalSubCategories += (cat.subCategories || []).length;
      });

      console.log(`   Categories in destination: ${destCategoriesCount}`);
      console.log(`   Total subcategories: ${totalSubCategories}`);
      
      if (destCategoriesCount > 0) {
        console.log(`\n   Category details:`);
        destCategoriesWithSubs.forEach((cat: any) => {
          const subCount = (cat.subCategories || []).length;
          console.log(`      ✅ "${cat.name}" - ${subCount} subcategories`);
          if (subCount > 0) {
            cat.subCategories.forEach((sub: any) => {
              console.log(`         └─ "${sub.name}" (slug: ${sub.slug || 'N/A'})`);
            });
          }
        });
      }

      // Verify products
      const destProductsCount = await DestProduct.countDocuments({});
      const destProductsActive = await DestProduct.countDocuments({ isActive: true });
      const destProductsInactive = await DestProduct.countDocuments({ isActive: false });
      
      console.log(`\n   Products in destination: ${destProductsCount}`);
      console.log(`      Active: ${destProductsActive}`);
      console.log(`      Inactive: ${destProductsInactive}`);

      // Check products by category
      const productsByCategory = await DestProduct.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      if (productsByCategory.length > 0) {
        console.log(`\n   Products by category:`);
        for (const group of productsByCategory) {
          const category = await DestCategory.findById(group._id).lean();
          const categoryName = category ? (category as any).name : 'Unknown';
          console.log(`      "${categoryName}": ${group.count} products`);
        }
      }

      // Check products with subcategories
      const productsWithSubCat = await DestProduct.countDocuments({ 
        $and: [
          { subCategory: { $exists: true } },
          { subCategory: { $ne: null } },
          { subCategory: { $ne: '' } }
        ]
      });
      const productsWithoutSubCat = await DestProduct.countDocuments({ 
        $or: [
          { subCategory: { $exists: false } },
          { subCategory: null },
          { subCategory: '' }
        ]
      });
      
      console.log(`\n   Products with subcategories: ${productsWithSubCat}`);
      console.log(`   Products without subcategories: ${productsWithoutSubCat}`);

      // Sample products
      const sampleProducts = await DestProduct.find({})
        .populate('category', 'name')
        .limit(5)
        .lean();
      
      if (sampleProducts.length > 0) {
        console.log(`\n   Sample products (first 5):`);
        sampleProducts.forEach((p: any, idx: number) => {
          const catName = p.category ? (p.category as any).name : 'Unknown';
          const subCat = p.subCategory || 'None';
          console.log(`      ${idx + 1}. "${p.name}" - Category: ${catName}, Subcategory: ${subCat}`);
        });
      }

      console.log('\n   ✅ Verification complete!');
      
      // Compare counts
      const sourceCategoriesCount = await SourceCategory.countDocuments({});
      const sourceProductsCount = await SourceProduct.countDocuments({});
      
      if (destCategoriesCount !== sourceCategoriesCount) {
        console.log(`\n   ⚠️  WARNING: Category count mismatch!`);
        console.log(`      Source: ${sourceCategoriesCount}, Destination: ${destCategoriesCount}`);
      }
      
      if (destProductsCount !== sourceProductsCount) {
        console.log(`\n   ⚠️  WARNING: Product count mismatch!`);
        console.log(`      Source: ${sourceProductsCount}, Destination: ${destProductsCount}`);
      }

    } catch (error: any) {
      console.error(`   ❌ Error during verification:`, error.message);
    }

    // ============================================
    // Migration Complete
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('ℹ️  Note: Source database data remains untouched.');
    console.log('   This was a copy operation, not a move operation.\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('🔌 Source database connection closed');
    }
    if (destConnection) {
      await destConnection.close();
      console.log('🔌 Destination database connection closed');
    }
    process.exit(0);
  }
};

// Run the migration
migrateData();

