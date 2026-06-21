"use server";

import { ZodError, ZodSchema } from "zod";
import dbConnect from "../mongoose";
import { ValidationError } from "../http-errors";

type ActionOptions<T> = {
  params?: T;
  schema?: ZodSchema<T>;
  authorize?: boolean;
};

async function action<T>({ params, schema }: ActionOptions<T>) {
  let parsedParams = params;

  if (schema && params) {
    try {
      parsedParams = schema.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        return new ValidationError(
          error.flatten().fieldErrors as Record<string, string[]>
        );
      } else {
        return new Error("Schema validation failed");
      }
    }
  }

  await dbConnect();

  return { params: parsedParams };
}

export default action;
