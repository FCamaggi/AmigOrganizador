ALTER TABLE app.groups ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE app.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE app.group_plans ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE app.calendar_sources ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app FROM anon, authenticated;
  ELSE
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON SCHEMA app FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON SCHEMA app FROM authenticated;
    END IF;
  END IF;
END
$$;
