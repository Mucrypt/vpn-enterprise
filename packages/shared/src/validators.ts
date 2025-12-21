import Joi from 'joi';

// Common validation schemas
export const emailSchema = Joi.string().email().required();
export const passwordSchema = Joi.string().min(8).required();
export const uuidSchema = Joi.string().uuid().required();

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const idParamSchema = Joi.object({
  id: uuidSchema,
});

// User validation
export const createUserSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  username: Joi.string().min(3).max(30).optional(),
  role: Joi.string().valid('admin', 'user', 'tenant_admin', 'developer').default('user'),
  tenantId: Joi.string().uuid().optional(),
});

export const updateUserSchema = Joi.object({
  email: emailSchema.optional(),
  username: Joi.string().min(3).max(30).optional(),
  role: Joi.string().valid('admin', 'user', 'tenant_admin', 'developer').optional(),
}).min(1);

// Tenant validation
export const createTenantSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  subdomain: Joi.string().lowercase().alphanum().min(3).max(63).required(),
  plan: Joi.string().valid('free', 'basic', 'pro', 'enterprise').default('free'),
});

export const updateTenantSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  plan: Joi.string().valid('free', 'basic', 'pro', 'enterprise').optional(),
  status: Joi.string().valid('active', 'suspended', 'deleted').optional(),
}).min(1);

// Database instance validation
export const createDatabaseSchema = Joi.object({
  name: Joi.string().min(3).max(63).required(),
  type: Joi.string().valid('postgresql', 'mysql', 'mongodb').required(),
  plan: Joi.string().valid('free', 'basic', 'pro', 'enterprise').optional(),
});

// Helper function to validate request data
export const validate = <T>(schema: Joi.ObjectSchema, data: any): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`Validation error: ${errors}`);
  }

  return value as T;
};
