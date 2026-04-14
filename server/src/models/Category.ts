import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory {
  _id?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  subCategories: ISubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const subCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: false, // Auto-generated in pre-save hook
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

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: false, // Auto-generated in pre-save hook
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
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
categorySchema.pre('save', function (next) {
  // Always generate slug if it doesn't exist or if name changed
  if (!this.slug || this.isModified('name') || this.isNew) {
    if (this.name) {
      this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }
  }
  
  // Generate slugs for subcategories
  if (this.isModified('subCategories') || this.isNew) {
    this.subCategories.forEach((subCat: any) => {
      if (!subCat.slug && subCat.name) {
        subCat.slug = subCat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      }
    });
  }
  
  next();
});

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;

