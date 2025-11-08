-- Find all triggers in the database
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY trigger_schema, event_object_table, trigger_name;
