CREATE SCHEMA identity;
CREATE TABLE identity.account (
 installation_id uuid NOT NULL,
 account_id uuid NOT NULL,
 person_id uuid NOT NULL,
 username varchar(64) NOT NULL CHECK(username ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
 password_hash varchar(180) NOT NULL CHECK(password_hash ~ '^scrypt\$v=1\$N=131072,r=8,p=1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$'),
 enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,account_id),
 UNIQUE(installation_id,person_id),
 UNIQUE(installation_id,username)
);
CREATE TABLE identity.role_grant (
 installation_id uuid NOT NULL,
 account_id uuid NOT NULL,
 authority_scope_id uuid NOT NULL,
 actor_role varchar(32) NOT NULL CHECK(actor_role IN ('ACT-SEC','ACT-SALES','ACT-PROC','ACT-WH','ACT-PLAN','ACT-OP','ACT-SHIP','ACT-FIN','ACT-CUST')),
 customer_scope varchar(256) NOT NULL DEFAULT '',
 PRIMARY KEY(installation_id,account_id,authority_scope_id,actor_role,customer_scope),
 FOREIGN KEY(installation_id,account_id) REFERENCES identity.account(installation_id,account_id),
 CHECK(actor_role <> 'ACT-CUST' OR length(customer_scope)>0)
);
CREATE TABLE identity.session (
 installation_id uuid NOT NULL,
 token_digest varchar(64) NOT NULL CHECK(token_digest ~ '^[0-9a-f]{64}$'),
 account_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '8 hours',
 revoked_at timestamptz,
 PRIMARY KEY(installation_id,token_digest),
 FOREIGN KEY(installation_id,account_id) REFERENCES identity.account(installation_id,account_id),
 CHECK(expires_at>created_at),
 CHECK(last_seen_at>=created_at)
);
CREATE INDEX identity_session_account ON identity.session(installation_id,account_id);
CREATE TABLE identity.security_event (
 event_id uuid PRIMARY KEY,
 installation_id uuid NOT NULL,
 kind varchar(32) NOT NULL CHECK(kind IN ('LOGIN_ACCEPTED','LOGIN_DENIED','LOGOUT','SESSION_REVOKED','ACCOUNT_CREATED','ACCOUNT_DISABLED','GRANT_CHANGED','PASSWORD_CHANGED')),
 actor_person_id uuid,
 target_person_id uuid,
 safe_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(safe_details)='object'),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(installation_id,actor_person_id) REFERENCES identity.account(installation_id,person_id),
 FOREIGN KEY(installation_id,target_person_id) REFERENCES identity.account(installation_id,person_id)
);
CREATE INDEX identity_security_event_time ON identity.security_event(installation_id,occurred_at,event_id);
