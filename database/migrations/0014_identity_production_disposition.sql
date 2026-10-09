ALTER TABLE identity.role_grant ADD COLUMN production_disposition boolean NOT NULL DEFAULT false;
ALTER TABLE identity.role_grant ADD CONSTRAINT production_disposition_plan_only CHECK(NOT production_disposition OR actor_role='ACT-PLAN');
