--
-- PostgreSQL database dump
--

\restrict 4jp2bq1ZKOZR2x1G3zKqfZFJn1UZlNDsqIByatlAPltvnTo2P1HL5vDNQPwNkFB

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: handle_new_user_workspace(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user_workspace() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare ws_id uuid;
begin
  insert into public.workspaces (owner_id, name)
    values (new.id, 'My Workspace')
    returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role_kind, role, status)
    values (ws_id, new.id, 'internal-team', 'owner', 'active');
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user_workspace() OWNER TO postgres;

--
-- Name: is_internal_member(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_internal_member(p_workspace uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id      = auth.uid()
      and m.role_kind    = 'internal-team'
      and m.status       = 'active'
  );
$$;


ALTER FUNCTION public.is_internal_member(p_workspace uuid) OWNER TO postgres;

--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.touch_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: formulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formulations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    mode text NOT NULL,
    product_type text,
    part_number text,
    current_version text,
    status text DEFAULT 'draft'::text,
    tags text[] DEFAULT '{}'::text[],
    project text,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id uuid,
    CONSTRAINT formulations_mode_check CHECK ((mode = ANY (ARRAY['fb'::text, 'baking'::text, 'catering'::text, 'feeds'::text, 'sausage'::text, 'supplements'::text]))),
    CONSTRAINT formulations_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in-pilot'::text, 'launched'::text, 'on-hold'::text])))
);


ALTER TABLE public.formulations OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    company_name text,
    subscription_tier text DEFAULT 'free'::text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'starter'::text, 'pro'::text, 'enterprise'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: supplier_qualifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_qualifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    supplier_name text NOT NULL,
    doc_type text NOT NULL,
    issued_date date,
    expiration_date date,
    certifier text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id uuid
);


ALTER TABLE public.supplier_qualifications OWNER TO postgres;

--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_kind text DEFAULT 'internal-team'::text NOT NULL,
    role text DEFAULT 'owner'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    invited_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_members_role_kind_check CHECK ((role_kind = ANY (ARRAY['internal-team'::text, 'external-collaboration'::text]))),
    CONSTRAINT workspace_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'revoked'::text])))
);


ALTER TABLE public.workspace_members OWNER TO postgres;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text DEFAULT 'My Workspace'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workspaces OWNER TO postgres;

--
-- Name: formulations formulations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formulations
    ADD CONSTRAINT formulations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: supplier_qualifications supplier_qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_qualifications
    ADD CONSTRAINT supplier_qualifications_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_workspace_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: idx_formulations_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formulations_mode ON public.formulations USING btree (owner_id, mode);


--
-- Name: idx_formulations_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formulations_owner ON public.formulations USING btree (owner_id);


--
-- Name: idx_formulations_part_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_formulations_part_number ON public.formulations USING btree (owner_id, part_number) WHERE (part_number IS NOT NULL);


--
-- Name: idx_formulations_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formulations_updated ON public.formulations USING btree (owner_id, updated_at DESC);


--
-- Name: idx_formulations_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formulations_workspace ON public.formulations USING btree (workspace_id);


--
-- Name: idx_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_members_user ON public.workspace_members USING btree (user_id, status);


--
-- Name: idx_supplier_quals_expiration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_quals_expiration ON public.supplier_qualifications USING btree (owner_id, expiration_date);


--
-- Name: idx_supplier_quals_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_quals_owner ON public.supplier_qualifications USING btree (owner_id);


--
-- Name: idx_supplier_quals_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_quals_workspace ON public.supplier_qualifications USING btree (workspace_id);


--
-- Name: idx_workspaces_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workspaces_owner ON public.workspaces USING btree (owner_id);


--
-- Name: formulations touch_formulations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER touch_formulations_updated_at BEFORE UPDATE ON public.formulations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: profiles touch_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER touch_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: formulations formulations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formulations
    ADD CONSTRAINT formulations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: formulations formulations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formulations
    ADD CONSTRAINT formulations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: supplier_qualifications supplier_qualifications_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_qualifications
    ADD CONSTRAINT supplier_qualifications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: supplier_qualifications supplier_qualifications_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_qualifications
    ADD CONSTRAINT supplier_qualifications_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: workspace_members workspace_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: supplier_qualifications Users can CRUD their own supplier qualifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can CRUD their own supplier qualifications" ON public.supplier_qualifications USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: profiles Users can read their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: formulations delete as creator or workspace owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "delete as creator or workspace owner" ON public.formulations FOR DELETE USING (((auth.uid() = owner_id) OR (EXISTS ( SELECT 1
   FROM public.workspaces w
  WHERE ((w.id = formulations.workspace_id) AND (w.owner_id = auth.uid()))))));


--
-- Name: formulations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.formulations ENABLE ROW LEVEL SECURITY;

--
-- Name: formulations members author in their workspace; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members author in their workspace" ON public.formulations FOR INSERT WITH CHECK (((auth.uid() = owner_id) AND ((workspace_id IS NULL) OR public.is_internal_member(workspace_id))));


--
-- Name: workspace_members owner manages memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner manages memberships" ON public.workspace_members USING ((EXISTS ( SELECT 1
   FROM public.workspaces w
  WHERE ((w.id = workspace_members.workspace_id) AND (w.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workspaces w
  WHERE ((w.id = workspace_members.workspace_id) AND (w.owner_id = auth.uid())))));


--
-- Name: workspaces owner manages workspace; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner manages workspace" ON public.workspaces USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: supplier_qualifications owner writes supplier quals (delete); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner writes supplier quals (delete)" ON public.supplier_qualifications FOR DELETE USING ((auth.uid() = owner_id));


--
-- Name: supplier_qualifications owner writes supplier quals (insert); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner writes supplier quals (insert)" ON public.supplier_qualifications FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: supplier_qualifications owner writes supplier quals (update); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner writes supplier quals (update)" ON public.supplier_qualifications FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: workspace_members read memberships in your workspaces; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read memberships in your workspaces" ON public.workspace_members FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.workspaces w
  WHERE ((w.id = workspace_members.workspace_id) AND (w.owner_id = auth.uid()))))));


--
-- Name: formulations read own or workspace member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own or workspace member" ON public.formulations FOR SELECT USING (((auth.uid() = owner_id) OR public.is_internal_member(workspace_id)));


--
-- Name: supplier_qualifications read own or workspace member (supplier quals); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own or workspace member (supplier quals)" ON public.supplier_qualifications FOR SELECT USING (((auth.uid() = owner_id) OR public.is_internal_member(workspace_id)));


--
-- Name: workspaces read workspaces you own or belong to; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read workspaces you own or belong to" ON public.workspaces FOR SELECT USING (((auth.uid() = owner_id) OR public.is_internal_member(id)));


--
-- Name: supplier_qualifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_qualifications ENABLE ROW LEVEL SECURITY;

--
-- Name: formulations update own or as workspace member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update own or as workspace member" ON public.formulations FOR UPDATE USING (((auth.uid() = owner_id) OR public.is_internal_member(workspace_id)));


--
-- Name: workspace_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_new_user_workspace(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user_workspace() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user_workspace() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user_workspace() TO service_role;


--
-- Name: FUNCTION is_internal_member(p_workspace uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_internal_member(p_workspace uuid) TO anon;
GRANT ALL ON FUNCTION public.is_internal_member(p_workspace uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_internal_member(p_workspace uuid) TO service_role;


--
-- Name: FUNCTION touch_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.touch_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_updated_at() TO service_role;


--
-- Name: TABLE formulations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.formulations TO anon;
GRANT ALL ON TABLE public.formulations TO authenticated;
GRANT ALL ON TABLE public.formulations TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE supplier_qualifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_qualifications TO anon;
GRANT ALL ON TABLE public.supplier_qualifications TO authenticated;
GRANT ALL ON TABLE public.supplier_qualifications TO service_role;


--
-- Name: TABLE workspace_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workspace_members TO anon;
GRANT ALL ON TABLE public.workspace_members TO authenticated;
GRANT ALL ON TABLE public.workspace_members TO service_role;


--
-- Name: TABLE workspaces; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workspaces TO anon;
GRANT ALL ON TABLE public.workspaces TO authenticated;
GRANT ALL ON TABLE public.workspaces TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict 4jp2bq1ZKOZR2x1G3zKqfZFJn1UZlNDsqIByatlAPltvnTo2P1HL5vDNQPwNkFB

