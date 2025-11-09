-- Migration: Ensure default tenant exists
-- This migration ensures that a tenant with slug 'default' exists in the database
-- This tenant is used for new users before they complete onboarding

DO $$
DECLARE
  default_tenant_id TEXT;
BEGIN
  -- Check if default tenant already exists
  SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'default' LIMIT 1;

  -- If it doesn't exist, create it
  IF default_tenant_id IS NULL THEN
    -- Generate a new ID (using cuid-like format)
    default_tenant_id := gen_random_uuid()::text;
    
    -- Create default tenant
    INSERT INTO tenants (
      id,
      name,
      slug,
      "isActive",
      "createdAt",
      "updatedAt",
      plan
    ) VALUES (
      default_tenant_id,
      'Default Tenant',
      'default',
      true,
      NOW(),
      NOW(),
      'FREE'
    );
  END IF;
END $$;
