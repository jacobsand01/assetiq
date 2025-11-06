SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict qUvcbvM0rYgy135HvFAjpkru3lWpUPZSfaUrp5XbQ8WlFPVLGTJxnqoiRoPTnyH

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '2d28dac5-a61a-4466-bdee-2543ca2b1ef3', '{"action":"user_signedup","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-11-05 14:26:23.346315+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bdb4b886-2e6c-449e-ba17-e9f685db95fb', '{"action":"login","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-05 14:26:23.356228+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c9ee006-ff5e-4c76-9361-c2a87e915a9f', '{"action":"token_refreshed","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 16:36:25.597834+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c9cd093e-ebc4-4416-9de9-377635903085', '{"action":"token_revoked","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 16:36:25.609517+00', ''),
	('00000000-0000-0000-0000-000000000000', '33ddd66d-774b-499f-9928-72b56f88d448', '{"action":"token_refreshed","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 17:34:26.354876+00', ''),
	('00000000-0000-0000-0000-000000000000', '34d730f2-8c49-4839-9c30-c45d3c25aa5e', '{"action":"token_revoked","actor_id":"17e1f638-7ac2-4b50-87ec-286da6c5a8f7","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 17:34:26.361411+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e823adba-cd35-469c-900d-9daf566cdb6a', '{"action":"user_signedup","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-11-05 17:59:53.97731+00', ''),
	('00000000-0000-0000-0000-000000000000', '9cc23db3-d117-4447-a1a8-a9ea3573df32', '{"action":"login","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-05 17:59:53.9882+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ff2f0850-6a26-4cba-ac00-7accec713df0', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 18:57:54.712055+00', ''),
	('00000000-0000-0000-0000-000000000000', '78202b78-6a2d-41b8-b5f3-c08fc372eee8', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 18:57:54.726265+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e4d93da3-bf21-4a8b-a246-feb913067a5d', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 19:56:14.473967+00', ''),
	('00000000-0000-0000-0000-000000000000', '989ccd5c-d2a4-48ea-86ff-3fb14c50f5c4', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 19:56:14.488593+00', ''),
	('00000000-0000-0000-0000-000000000000', '91a75551-5be8-4e6b-962d-13e2c0275846', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 21:06:31.592533+00', ''),
	('00000000-0000-0000-0000-000000000000', '55854e3f-d6a7-4f9b-82e8-32ab60c6fa0a', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-05 21:06:31.608024+00', ''),
	('00000000-0000-0000-0000-000000000000', '5341ff9f-12e2-4210-8dce-9f61da2e7b6e', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 13:14:36.997851+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ef9ed78-b08a-4462-ac20-206c39d74cdb', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 13:14:37.018239+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f7067cb-727f-422c-8e49-66f3afb33a93', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 14:50:36.186221+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b83b17a8-288a-42c9-9466-47d78c420fca', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 14:50:36.209213+00', ''),
	('00000000-0000-0000-0000-000000000000', '779d2312-ddc4-43c4-a8e9-e191280113ee', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 15:55:58.511299+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b53c00af-dc4a-4dd2-a924-a46c19be43e2', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 15:55:58.527055+00', ''),
	('00000000-0000-0000-0000-000000000000', '275db68c-5ed8-4dc3-9b83-722e576ec90a', '{"action":"token_refreshed","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 16:56:18.991055+00', ''),
	('00000000-0000-0000-0000-000000000000', 'febbf444-dcf2-4229-bdb3-4271b1f5c95e', '{"action":"token_revoked","actor_id":"05102289-5c79-4a62-9a2d-a575c6660573","actor_name":"Jacob Sandlin","actor_username":"jsandlin@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-11-06 16:56:19.051108+00', ''),
	('00000000-0000-0000-0000-000000000000', '85b0db29-f9f6-4b72-ba83-f6b9827ed3e2', '{"action":"user_signedup","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-11-06 17:38:37.660409+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf66bc85-c820-4489-933e-296d329fd186', '{"action":"login","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-06 17:38:37.687241+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e46ba96-5c96-4f09-99c1-22e894dc9d62', '{"action":"token_refreshed","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"token"}', '2025-11-06 18:41:30.655991+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab265c68-623a-4ea9-b234-7ef2c2f622b3', '{"action":"token_revoked","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"token"}', '2025-11-06 18:41:30.680373+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed97e816-e941-4626-b67c-b236f51c41a2', '{"action":"token_refreshed","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"token"}', '2025-11-06 19:46:42.398891+00', ''),
	('00000000-0000-0000-0000-000000000000', 'faa80bf3-589e-46fc-b346-dbbb52d89498', '{"action":"token_revoked","actor_id":"c5fbf023-335d-4bad-9bd3-97d9133e6b7b","actor_name":"Jacob Sandlin","actor_username":"jsandlin2@ecsdfl.us","actor_via_sso":false,"log_type":"token"}', '2025-11-06 19:46:42.428809+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '05102289-5c79-4a62-9a2d-a575c6660573', 'authenticated', 'authenticated', 'jsandlin@gmail.com', '$2a$10$8xudP3lNdPcyattwib6.6.jMnqQ6S4Mxq42sKQPrxffdlFuUbXGd2', '2025-11-05 17:59:53.979906+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-05 17:59:53.98943+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "05102289-5c79-4a62-9a2d-a575c6660573", "email": "jsandlin@gmail.com", "full_name": "Jacob Sandlin", "email_verified": true, "phone_verified": false}', NULL, '2025-11-05 17:59:53.932594+00', '2025-11-06 16:56:19.137777+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', 'authenticated', 'authenticated', 'test@gmail.com', '$2a$10$TzIGlZ9Ck0ocSn.Z5HNvb.LcoCGbHGnAib8wwm1GDSpfFsMCUEvQS', '2025-11-05 14:26:23.349123+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-05 14:26:23.357356+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "17e1f638-7ac2-4b50-87ec-286da6c5a8f7", "email": "test@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-11-05 14:26:23.288831+00', '2025-11-05 17:34:26.370943+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', 'authenticated', 'authenticated', 'jsandlin2@ecsdfl.us', '$2a$10$NWOQIESwMzK1mpKM1ItvP.ANorhiXtbCfF.LGbfM.d.5np5kusGRG', '2025-11-06 17:38:37.663767+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-06 17:38:37.688554+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c5fbf023-335d-4bad-9bd3-97d9133e6b7b", "email": "jsandlin2@ecsdfl.us", "full_name": "Jacob Sandlin", "email_verified": true, "phone_verified": false}', NULL, '2025-11-06 17:38:37.587206+00', '2025-11-06 19:46:42.460451+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('17e1f638-7ac2-4b50-87ec-286da6c5a8f7', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', '{"sub": "17e1f638-7ac2-4b50-87ec-286da6c5a8f7", "email": "test@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-05 14:26:23.340301+00', '2025-11-05 14:26:23.340334+00', '2025-11-05 14:26:23.340334+00', 'd9cda1f5-1963-412e-a389-991710340bcb'),
	('05102289-5c79-4a62-9a2d-a575c6660573', '05102289-5c79-4a62-9a2d-a575c6660573', '{"sub": "05102289-5c79-4a62-9a2d-a575c6660573", "email": "jsandlin@gmail.com", "full_name": "Jacob Sandlin", "email_verified": false, "phone_verified": false}', 'email', '2025-11-05 17:59:53.965896+00', '2025-11-05 17:59:53.966155+00', '2025-11-05 17:59:53.966155+00', 'de29d535-4421-4f2e-ac45-b1b11e6f89c1'),
	('c5fbf023-335d-4bad-9bd3-97d9133e6b7b', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', '{"sub": "c5fbf023-335d-4bad-9bd3-97d9133e6b7b", "email": "jsandlin2@ecsdfl.us", "full_name": "Jacob Sandlin", "email_verified": false, "phone_verified": false}', 'email', '2025-11-06 17:38:37.636474+00', '2025-11-06 17:38:37.636529+00', '2025-11-06 17:38:37.636529+00', '2f1c1cfa-95b9-48b4-9753-8b24639b68d9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id") VALUES
	('703e9ace-5184-4086-94a2-fcf05bc8c490', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', '2025-11-05 14:26:23.358269+00', '2025-11-05 17:34:26.377662+00', NULL, 'aal1', NULL, '2025-11-05 17:34:26.377376', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '172.18.0.1', NULL, NULL),
	('57d07a32-17ce-4544-9d42-392f87d2a7d1', '05102289-5c79-4a62-9a2d-a575c6660573', '2025-11-05 17:59:53.990253+00', '2025-11-06 16:56:19.192459+00', NULL, 'aal1', NULL, '2025-11-06 16:56:19.192254', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '172.18.0.1', NULL, NULL),
	('6995157f-2b46-4133-98ed-2cf1fb6043ed', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', '2025-11-06 17:38:37.690002+00', '2025-11-06 19:46:42.479667+00', NULL, 'aal1', NULL, '2025-11-06 19:46:42.479531', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '172.18.0.1', NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('703e9ace-5184-4086-94a2-fcf05bc8c490', '2025-11-05 14:26:23.373777+00', '2025-11-05 14:26:23.373777+00', 'password', 'a38e105e-fb4d-46c2-ab2d-5a8fe8659dbb'),
	('57d07a32-17ce-4544-9d42-392f87d2a7d1', '2025-11-05 17:59:54.003375+00', '2025-11-05 17:59:54.003375+00', 'password', '0b41eeae-e63a-423f-bd35-818f9ac33ac3'),
	('6995157f-2b46-4133-98ed-2cf1fb6043ed', '2025-11-06 17:38:37.710632+00', '2025-11-06 17:38:37.710632+00', 'password', '246b4442-5adc-4475-b35d-005f942c7423');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'n535fzzzcz63', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', true, '2025-11-05 14:26:23.36491+00', '2025-11-05 16:36:25.610294+00', NULL, '703e9ace-5184-4086-94a2-fcf05bc8c490'),
	('00000000-0000-0000-0000-000000000000', 2, 'jleest446y2t', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', true, '2025-11-05 16:36:25.626982+00', '2025-11-05 17:34:26.362006+00', 'n535fzzzcz63', '703e9ace-5184-4086-94a2-fcf05bc8c490'),
	('00000000-0000-0000-0000-000000000000', 3, 'vjzssk7kjxqf', '17e1f638-7ac2-4b50-87ec-286da6c5a8f7', false, '2025-11-05 17:34:26.366203+00', '2025-11-05 17:34:26.366203+00', 'jleest446y2t', '703e9ace-5184-4086-94a2-fcf05bc8c490'),
	('00000000-0000-0000-0000-000000000000', 4, 'gfthuyl4e2o3', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-05 17:59:53.995421+00', '2025-11-05 18:57:54.726953+00', NULL, '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 5, 'c7cn5vry3tk3', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-05 18:57:54.735034+00', '2025-11-05 19:56:14.489867+00', 'gfthuyl4e2o3', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 6, 'ewkbj3thyk5f', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-05 19:56:14.49653+00', '2025-11-05 21:06:31.609107+00', 'c7cn5vry3tk3', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 7, 'cg4liuowlbri', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-05 21:06:31.61585+00', '2025-11-06 13:14:37.020289+00', 'ewkbj3thyk5f', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 8, '3ttn6ramncal', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-06 13:14:37.029496+00', '2025-11-06 14:50:36.210518+00', 'cg4liuowlbri', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 9, 'b4sglmlanaok', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-06 14:50:36.220485+00', '2025-11-06 15:55:58.529033+00', '3ttn6ramncal', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 10, 'z6ztw2plonnf', '05102289-5c79-4a62-9a2d-a575c6660573', true, '2025-11-06 15:55:58.53966+00', '2025-11-06 16:56:19.054671+00', 'b4sglmlanaok', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 11, 'k7zafzrvuxqu', '05102289-5c79-4a62-9a2d-a575c6660573', false, '2025-11-06 16:56:19.081166+00', '2025-11-06 16:56:19.081166+00', 'z6ztw2plonnf', '57d07a32-17ce-4544-9d42-392f87d2a7d1'),
	('00000000-0000-0000-0000-000000000000', 12, 'uxks3fkmfcpg', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', true, '2025-11-06 17:38:37.698254+00', '2025-11-06 18:41:30.683101+00', NULL, '6995157f-2b46-4133-98ed-2cf1fb6043ed'),
	('00000000-0000-0000-0000-000000000000', 13, 'fqggpbybcjuq', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', true, '2025-11-06 18:41:30.703654+00', '2025-11-06 19:46:42.433006+00', 'uxks3fkmfcpg', '6995157f-2b46-4133-98ed-2cf1fb6043ed'),
	('00000000-0000-0000-0000-000000000000', 14, 'awf46g3idcpt', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', false, '2025-11-06 19:46:42.449892+00', '2025-11-06 19:46:42.449892+00', 'fqggpbybcjuq', '6995157f-2b46-4133-98ed-2cf1fb6043ed');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "domain", "threshold", "created_at", "slug") VALUES
	('541b52c3-3354-465b-b3aa-b81a87554258', 'pge', NULL, 30, '2025-11-05 14:29:10.047755+00', 'pge'),
	('5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PGE', 'ecsdfl.us', 365, '2025-11-05 18:00:16.849962+00', NULL),
	('add5521b-bc25-446f-9a55-b9974661e872', 'PGE', 'ecsd.fl.us', 30, '2025-11-06 17:38:43.892853+00', NULL);


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "org_id", "full_name", "role", "created_at") VALUES
	('17e1f638-7ac2-4b50-87ec-286da6c5a8f7', '541b52c3-3354-465b-b3aa-b81a87554258', 'jacob', 'owner', '2025-11-05 14:29:10.075586+00'),
	('05102289-5c79-4a62-9a2d-a575c6660573', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'Jacob Sandlin', 'owner', '2025-11-05 18:00:16.897174+00'),
	('c5fbf023-335d-4bad-9bd3-97d9133e6b7b', 'add5521b-bc25-446f-9a55-b9974661e872', 'Jacob Sandlin', 'owner', '2025-11-06 17:38:43.939481+00');


--
-- Data for Name: authority_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."authority_snapshots" ("id", "org_id", "name", "source", "uploaded_by", "uploaded_at", "total_rows", "status") VALUES
	('0b45e7f4-af8f-405b-949e-43d82885541c', 'add5521b-bc25-446f-9a55-b9974661e872', 'Test Assets - Nov 6, 2025', 'Record of authority CSV import', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', '2025-11-06 19:49:32.056951+00', 3, 'complete'),
	('dde2d75a-a6a3-4359-9705-e3409f5aa68f', 'add5521b-bc25-446f-9a55-b9974661e872', 'Test Nov 5 2025', 'Record of authority CSV import', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', '2025-11-06 19:58:15.443151+00', 3, 'complete');


--
-- Data for Name: authority_snapshot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."authority_snapshot_items" ("id", "snapshot_id", "authority_asset_id", "description", "site_code", "room", "custodian", "fund", "cost", "purchase_date", "raw_json") VALUES
	('8708d820-8635-4675-8b4e-8e80631e5e6c', '0b45e7f4-af8f-405b-949e-43d82885541c', 'A-001', 'Laptop', 'HS', '101', 'Smith', '111', 750, '2020-08-01', '{"Cost": "750", "Fund": "111", "Room": "101", "Site": "HS", "AssetID": "A-001", "Custodian": "Smith", "Description": "Laptop", "PurchaseDate": "2020-08-01"}'),
	('c2f3971d-5768-4c1b-9af8-7dd8c87e80a9', '0b45e7f4-af8f-405b-949e-43d82885541c', 'A-002', 'Projector', 'HS', '102', 'Jones', '111', 1200, '2019-05-15', '{"Cost": "1200", "Fund": "111", "Room": "102", "Site": "HS", "AssetID": "A-002", "Custodian": "Jones", "Description": "Projector", "PurchaseDate": "2019-05-15"}'),
	('d7d5c3ee-312b-437b-929c-d8a480cee08a', '0b45e7f4-af8f-405b-949e-43d82885541c', 'A-003', 'Cafeteria Table', 'MS', 'Cafe', 'Brown', '222', 500, '2015-01-10', '{"Cost": "500", "Fund": "222", "Room": "Cafe", "Site": "MS", "AssetID": "A-003", "Custodian": "Brown", "Description": "Cafeteria Table", "PurchaseDate": "2015-01-10"}'),
	('d8df6ce9-13b9-4f87-ab93-85194a865336', 'dde2d75a-a6a3-4359-9705-e3409f5aa68f', 'A-001', 'Laptop', 'HS', '101', 'Smith', '111', 750, '2020-08-01', '{"Cost": "750", "Fund": "111", "Room": "101", "Site": "HS", "AssetID": "A-001", "Custodian": "Smith", "Description": "Laptop", "PurchaseDate": "2020-08-01"}'),
	('b719cb90-7f06-4c83-b0ef-eb981065fc7c', 'dde2d75a-a6a3-4359-9705-e3409f5aa68f', 'A-002', 'Projector', 'HS', '102', 'Jones', '111', 1200, '2019-05-15', '{"Cost": "1200", "Fund": "111", "Room": "102", "Site": "HS", "AssetID": "A-002", "Custodian": "Jones", "Description": "Projector", "PurchaseDate": "2019-05-15"}'),
	('5f589c29-97ac-4f00-99ba-5b3eb60ae30c', 'dde2d75a-a6a3-4359-9705-e3409f5aa68f', 'A-003', 'Cafeteria Table', 'MS', 'Cafe', 'Brown', '222', 500, '2015-01-10', '{"Cost": "500", "Fund": "222", "Room": "Cafe", "Site": "MS", "AssetID": "A-003", "Custodian": "Brown", "Description": "Cafeteria Table", "PurchaseDate": "2015-01-10"}');


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."devices" ("id", "org_id", "asset_tag", "serial_number", "model", "platform", "status", "last_seen_at", "warranty_until", "created_at", "location", "metadata") VALUES
	('0495bfcf-babf-43ae-a1fb-bc00f9f6225c', '541b52c3-3354-465b-b3aa-b81a87554258', 'SKPOE2L', 'SN12345678', 'Dell Latitude 5400', 'windows', 'assigned', '2025-11-05 16:53:08.711+00', NULL, '2025-11-05 16:53:08.737812+00', NULL, '{}'),
	('5bd1a4d9-5edf-415e-8b56-8d1070109e35', 'add5521b-bc25-446f-9a55-b9974661e872', 'GA-CH-001', 'MOCK-GA-CH-001', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 17:48:08.731+00', '2026-11-06', '2025-11-06 17:48:08.771913+00', 'Lab 101', '{}'),
	('85dd478a-2940-4314-a68a-99fb1f0b7c66', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-101', 'SNTEST101', 'Test Chromebook 101', 'chromebook', 'active', NULL, '2026-06-30', '2025-11-05 18:15:19.290837+00', NULL, '{}'),
	('0e3d60f3-f911-4d6d-bfda-6baf40a5cf12', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-102', 'SNTEST102', 'Test Chromebook 102', 'chromebook', 'active', NULL, '2026-06-30', '2025-11-05 18:20:07.004491+00', NULL, '{}'),
	('acfe1a79-f1fa-41e8-bc99-708b927f405d', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-002', 'SN9999', 'ChromeBook', 'other', 'active', NULL, '2026-12-31', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('1e90a393-a519-40bb-8aad-b4bf9f630c6c', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-005', 'SN3333', 'iOS', 'ipad', 'repair', NULL, '2026-03-05', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('9be89aca-89d5-4494-add9-e7d9896edf78', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-006', 'SN7777', 'CHROMEBOOK', 'other', 'active', NULL, '2025-07-01', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('a0237d89-9b17-4dad-b2c1-b1f427610763', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-007', 'SN4444', 'Windows 11', 'other', 'retired', NULL, '2024-01-01', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('5201b8f7-365e-4327-8ffa-919aa295d558', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-008', 'SN5555', 'macos', 'mac', 'active', NULL, '2026-06-30', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('fa48deb3-d8b0-496c-b440-2fdaf0adec64', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'PG-CH-001', 'SN1234', NULL, 'chromebook', 'assigned', NULL, '2026-06-30', '2025-11-05 19:19:15.54795+00', NULL, '{}'),
	('f274151c-94b5-4a2e-aeeb-240a1918e095', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'GA-CH-001', 'MOCK-GA-CH-001', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 16:41:47.042+00', '2026-11-06', '2025-11-06 16:41:47.137721+00', 'Lab 101', '{}'),
	('32e73204-9711-4b4a-835a-a4619cb16e56', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'GA-CH-002', 'MOCK-GA-CH-002', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 16:41:47.042+00', '2026-11-06', '2025-11-06 16:41:47.137721+00', 'Lab 102', '{}'),
	('76241553-0f9c-4e35-ab33-10ea5525d725', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'GA-CH-003', 'MOCK-GA-CH-003', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 16:41:47.042+00', '2026-11-06', '2025-11-06 16:41:47.137721+00', 'Library cart', '{}'),
	('6e68674e-3ade-4e31-8650-ca3df687caad', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'GA-WIN-001', 'MOCK-GA-WIN-001', 'Windows Laptop (Google Admin mock)', 'windows', 'assigned', '2025-11-06 16:41:47.042+00', '2026-11-06', '2025-11-06 16:41:47.137721+00', 'Office 201', '{}'),
	('b99cd4c1-64cd-403a-994f-e8c5294fea2e', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'GA-MAC-001', 'MOCK-GA-MAC-001', 'MacBook (Google Admin mock)', 'mac', 'assigned', '2025-11-06 16:41:47.042+00', '2026-11-06', '2025-11-06 16:41:47.137721+00', 'Media center', '{}'),
	('035751db-153d-4361-b1fe-dd3175fd13ac', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-001', 'SN1234', 'Dell 3100', 'chromebook', 'assigned', NULL, '2026-06-30', '2025-11-06 17:42:47.581191+00', NULL, '{}'),
	('fff27bbd-7337-40af-9176-4b9097233845', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-005', 'SN3333', 'iPad 9th Gen', 'ipad', 'repair', NULL, '2026-03-05', '2025-11-06 17:42:47.581191+00', NULL, '{}'),
	('0652b2fb-6d46-4f77-901d-f3eac0f2467f', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-006', 'SN7777', 'Dell 3100', 'chromebook', 'active', NULL, '2025-07-01', '2025-11-06 17:42:47.581191+00', NULL, '{}'),
	('e0b71afa-8ba2-4f2e-b01e-6504695d80d1', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-007', 'SN4444', 'Surface Laptop', 'windows', 'retired', NULL, '2024-01-01', '2025-11-06 17:42:47.581191+00', NULL, '{}'),
	('573646be-fbb1-43ad-900a-93c260fd3390', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-008', 'SN5555', 'Mac Mini', 'mac', 'active', NULL, '2026-06-30', '2025-11-06 17:42:47.581191+00', NULL, '{}'),
	('76ba0d0e-0825-4c49-ad18-d257fa6800e1', 'add5521b-bc25-446f-9a55-b9974661e872', 'PG-CH-002', 'SN9999', 'HP x360', 'chromebook', 'assigned', NULL, '2026-12-31', '2025-11-06 17:42:47.581191+00', 'Room 122', '{}'),
	('84e66a33-94d6-4fef-a5bb-f007f6d5a5f4', 'add5521b-bc25-446f-9a55-b9974661e872', 'GA-CH-002', 'MOCK-GA-CH-002', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 17:48:08.731+00', '2026-11-06', '2025-11-06 17:48:08.771913+00', 'Lab 102', '{}'),
	('5a31d3e2-7237-48b9-92e5-edd4e3a55dee', 'add5521b-bc25-446f-9a55-b9974661e872', 'GA-CH-003', 'MOCK-GA-CH-003', 'Chromebook (Google Admin mock)', 'chromebook', 'assigned', '2025-11-06 17:48:08.731+00', '2026-11-06', '2025-11-06 17:48:08.771913+00', 'Library cart', '{}'),
	('2647e001-5f34-446d-a7c2-b4e19bb16ebd', 'add5521b-bc25-446f-9a55-b9974661e872', 'GA-WIN-001', 'MOCK-GA-WIN-001', 'Windows Laptop (Google Admin mock)', 'windows', 'assigned', '2025-11-06 17:48:08.731+00', '2026-11-06', '2025-11-06 17:48:08.771913+00', 'Office 201', '{}'),
	('a8145168-530a-41bc-92d7-9d7df36d245b', 'add5521b-bc25-446f-9a55-b9974661e872', 'GA-MAC-001', 'MOCK-GA-MAC-001', 'MacBook (Google Admin mock)', 'mac', 'assigned', '2025-11-06 17:48:08.731+00', '2026-11-06', '2025-11-06 17:48:08.771913+00', 'Media center', '{}');


--
-- Data for Name: device_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_assignments" ("id", "org_id", "device_id", "assignee_name", "assignee_email", "assigned_at", "returned_at", "notes", "created_at") VALUES
	('89ff2c31-8574-4a19-a9af-c75b1fff0ac6', '541b52c3-3354-465b-b3aa-b81a87554258', '0495bfcf-babf-43ae-a1fb-bc00f9f6225c', 'Jacob Sandlin', 'jsandlin1@ecsdfl.us', '2025-11-05 17:10:44.431+00', NULL, NULL, '2025-11-05 17:10:44.472732+00'),
	('d7518a61-d6f4-4b91-b9af-e8ca68083b58', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'fa48deb3-d8b0-496c-b440-2fdaf0adec64', 'Jane Doe', 'jdoe@ecsdfl.us', '2025-11-05 20:10:35.27+00', NULL, NULL, '2025-11-05 20:10:35.292556+00'),
	('427d1d11-9512-4a0d-ad90-f03832abe19d', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'f274151c-94b5-4a2e-aeeb-240a1918e095', 'Alex Teacher', 'alex.teacher@example.org', '2025-11-06 16:41:47.042+00', NULL, 'Mock assignment from fake-sync demo.', '2025-11-06 16:41:47.241957+00'),
	('b851c376-a1d6-41a5-bb43-99d7ecd999fa', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', '32e73204-9711-4b4a-835a-a4619cb16e56', 'Jamie Staff', 'jamie.staff@example.org', '2025-11-06 16:41:47.042+00', NULL, 'Mock assignment from fake-sync demo.', '2025-11-06 16:41:47.241957+00'),
	('0e11c0e6-1d0d-40c5-bfd6-bd44f9a2c937', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', '76241553-0f9c-4e35-ab33-10ea5525d725', 'Riley Librarian', 'riley.librarian@example.org', '2025-11-06 16:41:47.042+00', NULL, 'Mock assignment from fake-sync demo.', '2025-11-06 16:41:47.241957+00'),
	('06a2042e-b98d-4e85-bd0f-bf72c80a6597', 'add5521b-bc25-446f-9a55-b9974661e872', '76ba0d0e-0825-4c49-ad18-d257fa6800e1', 'jane doe', 'jdoe@ecsdfl', '2025-11-06 17:43:57.207+00', NULL, NULL, '2025-11-06 17:43:57.241375+00'),
	('d5119baf-6fba-420d-a5b3-1bfa2e253ca9', 'add5521b-bc25-446f-9a55-b9974661e872', '84e66a33-94d6-4fef-a5bb-f007f6d5a5f4', 'Jamie Staff', 'jamie.staff@example.org', '2025-11-06 17:48:08.731+00', NULL, 'Mock assignment from fake-sync demo.', '2025-11-06 17:48:08.855021+00'),
	('552352c8-d68d-430f-bcab-c05a3d8f8ebd', 'add5521b-bc25-446f-9a55-b9974661e872', '5a31d3e2-7237-48b9-92e5-edd4e3a55dee', 'Riley Librarian', 'riley.librarian@example.org', '2025-11-06 17:48:08.731+00', NULL, 'Mock assignment from fake-sync demo.', '2025-11-06 17:48:08.855021+00'),
	('17510e43-777b-4c45-888c-1f6b5ad93b08', 'add5521b-bc25-446f-9a55-b9974661e872', '5bd1a4d9-5edf-415e-8b56-8d1070109e35', 'Alex Teacher', 'alex.teacher@example.org', '2025-11-06 17:48:08.731+00', '2025-11-06 18:10:26.393+00', 'Mock assignment from fake-sync demo.', '2025-11-06 17:48:08.855021+00'),
	('8ba52c0f-f350-48c3-abce-135438e62946', 'add5521b-bc25-446f-9a55-b9974661e872', '5bd1a4d9-5edf-415e-8b56-8d1070109e35', 'Lab 101', NULL, '2025-11-06 18:10:26.393+00', '2025-11-06 18:10:49.244+00', 'Location assignment', '2025-11-06 18:10:27.345088+00'),
	('40362cad-3ef1-457a-a9bb-4e66eeb6b7cb', 'add5521b-bc25-446f-9a55-b9974661e872', '5bd1a4d9-5edf-415e-8b56-8d1070109e35', 'ss', 'sssssssssssss@sdasds', '2025-11-06 18:10:49.244+00', '2025-11-06 18:10:57.141+00', NULL, '2025-11-06 18:10:49.363316+00'),
	('d2b0b71f-cc6d-41f0-bdf0-a1a7cd3d8d2c', 'add5521b-bc25-446f-9a55-b9974661e872', '5bd1a4d9-5edf-415e-8b56-8d1070109e35', 'asdsa', 'sadsadsad@asdad', '2025-11-06 18:10:57.141+00', NULL, 'Assigned with location: Lab 101', '2025-11-06 18:10:57.212766+00');


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."feedback" ("id", "org_id", "user_id", "rating", "message", "created_at") VALUES
	('0c3d8605-5af6-49d8-8106-bafb78888507', 'add5521b-bc25-446f-9a55-b9974661e872', 'c5fbf023-335d-4bad-9bd3-97d9133e6b7b', 1, 'AWesome stuff!', '2025-11-06 18:42:15.329869+00');


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."integrations" ("id", "org_id", "type", "config", "last_sync_at", "created_at") VALUES
	('88765315-3f4b-41c4-b4a6-95bc640108ab', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'google_admin', '{"org_unit": "", "service_account_json": ""}', NULL, '2025-11-06 16:41:41.565574+00'),
	('3c60635d-57ea-46bd-97af-f377110a035d', 'add5521b-bc25-446f-9a55-b9974661e872', 'google_admin', '{"org_unit": "", "service_account_json": ""}', NULL, '2025-11-06 17:48:07.32162+00');


--
-- Data for Name: job_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: offboarding_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."offboarding_events" ("id", "org_id", "user_email", "user_name", "status", "created_at", "completed_at", "notes", "manager_email", "devices_expected", "devices_returned", "reminders_sent", "devices_due_date", "reminder_plan", "next_reminder_at") VALUES
	('3eb74268-8c3e-467e-8ae1-1b553a57b2c9', '5b5c7026-1b5a-4fa2-8431-93b9329910ba', 'tsandlin@gmail.com', 'Thomas Sandlin', 'open', '2025-11-05 18:36:37.235388+00', NULL, 'Assigned in **/**/**, signed off on it, documented, needs to be back by **/**/**

Manager: jsandlin1@ecsdfl.us

Devices expected:
11111 - MacBook Air', NULL, 0, false, 0, NULL, 'default', NULL);


--
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sync_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: test_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 14, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict qUvcbvM0rYgy135HvFAjpkru3lWpUPZSfaUrp5XbQ8WlFPVLGTJxnqoiRoPTnyH

RESET ALL;
