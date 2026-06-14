


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Reject signup if email not whitelisted
  if not exists (
    select 1 from public.allowed_emails where email = new.email
  ) then
    raise exception 'Email % is not on the beta access list', new.email;
  end if;

  -- Otherwise, create the profile
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end; $$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."allowed_emails" (
    "email" "text" NOT NULL,
    "invited_by" "text",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."allowed_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."formulations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "product_type" "text",
    "part_number" "text",
    "current_version" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "project" "text",
    "data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "formulations_mode_check" CHECK (("mode" = ANY (ARRAY['fb'::"text", 'baking'::"text", 'catering'::"text", 'feeds'::"text", 'sausage'::"text", 'supplements'::"text"]))),
    CONSTRAINT "formulations_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in-pilot'::"text", 'launched'::"text", 'on-hold'::"text"])))
);


ALTER TABLE "public"."formulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "company_name" "text",
    "subscription_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'starter'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_qualifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "supplier_name" "text" NOT NULL,
    "doc_type" "text" NOT NULL,
    "issued_date" "date",
    "expiration_date" "date",
    "certifier" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."supplier_qualifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."allowed_emails"
    ADD CONSTRAINT "allowed_emails_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."formulations"
    ADD CONSTRAINT "formulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_qualifications"
    ADD CONSTRAINT "supplier_qualifications_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_formulations_mode" ON "public"."formulations" USING "btree" ("owner_id", "mode");



CREATE INDEX "idx_formulations_owner" ON "public"."formulations" USING "btree" ("owner_id");



CREATE UNIQUE INDEX "idx_formulations_part_number" ON "public"."formulations" USING "btree" ("owner_id", "part_number") WHERE ("part_number" IS NOT NULL);



CREATE INDEX "idx_formulations_updated" ON "public"."formulations" USING "btree" ("owner_id", "updated_at" DESC);



CREATE INDEX "idx_supplier_quals_expiration" ON "public"."supplier_qualifications" USING "btree" ("owner_id", "expiration_date");



CREATE INDEX "idx_supplier_quals_owner" ON "public"."supplier_qualifications" USING "btree" ("owner_id");



CREATE OR REPLACE TRIGGER "touch_formulations_updated_at" BEFORE UPDATE ON "public"."formulations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



ALTER TABLE ONLY "public"."formulations"
    ADD CONSTRAINT "formulations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_qualifications"
    ADD CONSTRAINT "supplier_qualifications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can read whitelist" ON "public"."allowed_emails" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can CRUD their own supplier qualifications" ON "public"."supplier_qualifications" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete their own formulations" ON "public"."formulations" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert their own formulations" ON "public"."formulations" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can read their own formulations" ON "public"."formulations" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own formulations" ON "public"."formulations" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."allowed_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_qualifications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."allowed_emails" TO "anon";
GRANT ALL ON TABLE "public"."allowed_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."allowed_emails" TO "service_role";



GRANT ALL ON TABLE "public"."formulations" TO "anon";
GRANT ALL ON TABLE "public"."formulations" TO "authenticated";
GRANT ALL ON TABLE "public"."formulations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_qualifications" TO "anon";
GRANT ALL ON TABLE "public"."supplier_qualifications" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_qualifications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































