-- Drop the safe tables/views that are causing issues
DROP VIEW IF EXISTS safe_app_users CASCADE;
DROP VIEW IF EXISTS safe_developers CASCADE; 
DROP VIEW IF EXISTS safe_sales_agents CASCADE;