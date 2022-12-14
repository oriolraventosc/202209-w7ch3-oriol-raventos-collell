import enviroment from "../../loadEnviroment.js";
import type { Request, Response, NextFunction } from "express";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import debugCreator from "debug";
import type { ItemStructure } from "./types.js";
import CustomError from "../customError/customError.js";
import { Item } from "../../database/models/Items/Items.js";

const debug = debugCreator(`${enviroment.debug}controllers`);

export const loadItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { owner } = req.body as ItemStructure;
  try {
    if (!owner) {
      const customError = new CustomError("Wrong owner", 400, "Wrong owner");
      next(customError);
      return;
    }

    const items = await Item.find({ owner });

    if (items.length === 0) {
      const customError = new CustomError("No items", 400, "No items");
      next(customError);
      return;
    }

    res.status(200).json({ items });
  } catch (error: unknown) {
    next(error);
  }
};

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { owner, name } = req.body as ItemStructure;

  await fs.rename(
    path.join("assets", "images", req.file.filename),
    path.join("assets", "images", req.file.originalname)
  );
  try {
    if (!owner || !name) {
      const customError = new CustomError(
        "Missing information",
        400,
        "Missing information"
      );
      next(customError);
      return;
    }

    const newItem = await Item.create({
      owner,
      name,
      image: req.file.filename,
    });

    res.status(201).json({ newItem, image: `assets/images/${newItem.image}` });
    debug(chalk.greenBright(`Item ${name} registered!`));
  } catch (error: unknown) {
    next(error);
  }
};
