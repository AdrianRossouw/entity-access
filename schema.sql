-- ----------------------------
--  Sequence for acl table
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."acl_id_seq" CASCADE;
CREATE SEQUENCE "public"."acl_id_seq" START 1000;

-- ----------------------------
--  Table structure for acl
-- ----------------------------
DROP TABLE IF EXISTS "public"."acl";
CREATE TABLE "public"."acl" (
	"id" INTEGER DEFAULT nextval('acl_id_seq'::regclass),
	"entity" varchar NOT NULL DEFAULT '',
	"entity_id" varchar,
	"lock" varchar,
	"key" varchar,
	"read" boolean,
	"write" boolean,
	"remove" boolean
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."acl" OWNER TO "postgres";
-- ----------------------------
--  Primary key structure for table acl
-- ----------------------------
ALTER TABLE "public"."acl" ADD PRIMARY KEY ("id") NOT DEFERRABLE INITIALLY IMMEDIATE;
