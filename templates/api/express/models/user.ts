import type { Sequelize } from "sequelize";
import { DataTypes, Model } from "sequelize";

export interface UserAttributes {
  id?: string;
  email: string | null;
  phone: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/*
 * Attributes are `declare`, never `public x!: T`.
 *
 * Sequelize installs its attribute getters and setters on the prototype. A
 * public class field is emitted as an own property initialised to undefined,
 * which shadows them: `user.id` reads undefined while `user.get("id")` returns
 * the row's value. Nothing catches it — the types say `string`, so it compiles,
 * and it only surfaces at runtime as a query built with an undefined parameter.
 *
 * `declare` emits no field at all, so the accessors survive.
 */
export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string | null;
  declare phone: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

const initializeUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      timestamps: true,
    },
  );

  return User;
};

export default initializeUserModel;
