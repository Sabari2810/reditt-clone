"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20210718131030 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20210718131030 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
    }
}
exports.Migration20210718131030 = Migration20210718131030;
//# sourceMappingURL=Migration20210718131030.js.map