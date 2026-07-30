import type { Sequelize } from "sequelize";
import { DataTypes, Model } from "sequelize";

export interface UserAttributes {
  id?: string;
  email: string | null;
  phone: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public email!: string | null;
  public phone!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
