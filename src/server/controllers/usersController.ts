import enviroment from "../../loadEnviroment.js";
import jwt from "jsonwebtoken";
import chalk from "chalk";
import type { NextFunction, Request, Response } from "express";
import debugCreator from "debug";
import bcrypt from "bcryptjs";
import type RegisterData from "../types.js";
import { User } from "../../database/models/Users/Users.js";
import CustomError from "../customError/customError.js";
import type { Credentials, UserTokenPayload } from "./types.js";

const debug = debugCreator(`${enviroment.debug}controllers`);

export const userRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password, email } = req.body as RegisterData;
  try {
    if (!username || !password || !email) {
      const customError = new CustomError(
        "Error registering",
        401,
        "Missing credentials!"
      );
      next(customError);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userToRegister = User.create({
      username,
      password: hashedPassword,
      email,
    });

    res.status(201).json(userToRegister);
    debug(chalk.greenBright(`User ${username} registered!`));
  } catch (error: unknown) {
    next(error);
  }
};

export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body as Credentials;
  try {
    const user = await User.findOne({ username });

    if (!user) {
      const customError = new CustomError(
        "Wrong credentials!",
        401,
        "Wrong credentials!"
      );
      next(customError);
      return;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      const customError = new CustomError(
        "Wrong credentials!",
        401,
        "Wrong credentials!"
      );
      next(customError);
      return;
    }

    const tokenPayload: UserTokenPayload = {
      id: user._id.toString(),
      username,
    };

    const token = jwt.sign(tokenPayload, enviroment.jwtSecretKey, {
      expiresIn: "3d",
    });

    res.status(200).json({ accessToken: token });
  } catch (error: unknown) {
    next(error);
  }
};
