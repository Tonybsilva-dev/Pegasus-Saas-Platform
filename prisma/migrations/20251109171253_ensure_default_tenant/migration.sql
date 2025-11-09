-- Migration: Ensure default tenant exists
-- This migration ensures that a tenant with slug 'default' exists in the database
-- This tenant is used for new users before they complete onboarding

DO $$
BEGIN
  -- Check if default tenant already exists
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'default') THEN
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
      gen_random_uuid()::text,
      'Default Tenant',
      'default',
      true,
      NOW(),
      NOW(),
      'FREE'
    );
  END IF;
END $$;
