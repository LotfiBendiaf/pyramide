// "use server";

// import mongoose, { FilterQuery } from "mongoose";
// import { simulationFormSchema } from "@/lib/validators/simulation";
// import {
//   startOfDay,
//   endOfDay,
//   startOfWeek,
//   endOfWeek,
//   startOfMonth,
//   endOfMonth,
// } from "date-fns";
// import action from "../handlers/action";
// import handleError from "../handlers/error";

// import dbConnect from "../mongoose";
// import Simulation, { ISimulationDoc } from "@/database/sumulation.model";
// import { requireUser } from "@/app/data/require-user";
// import { revalidatePath } from "next/cache";

// export async function createSimulation(
//   params: CreateSimulationParams
// ): Promise<ActionResponse<ISimulationDoc>> {
//   const validationResult = await action({
//     params,
//     schema: simulationFormSchema,
//   });

//   if (validationResult instanceof Error) {
//     return handleError(validationResult) as ErrorResponse;
//   }

//   const {
//     firstname,
//     lastname,
//     age,
//     phonenumber,
//     email,
//     salary,
//     domaine,
//     fonction,
//     appartmentType,
//   } = validationResult.params!;

//   await dbConnect();

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const [simulation] = await Simulation.create(
//       [
//         {
//           firstname,
//           lastname,
//           age,
//           phonenumber,
//           email,
//           salary,
//           domaine,
//           fonction,
//           appartmentType,
//         },
//       ],
//       { session }
//     );

//     if (!simulation)
//       return handleError("Failed to create simulation") as ErrorResponse;

//     await session.commitTransaction();

//     revalidatePath("/dashboard");

//     return {
//       success: true,
//       data: JSON.parse(JSON.stringify(simulation)),
//       status: 201,
//     };
//   } catch (error) {
//     session.abortTransaction();
//     return handleError(error) as ErrorResponse;
//   } finally {
//     session.endSession();
//   }
// }

// export type SalaryFilter =
//   | "all"
//   | "below120k"
//   | "between120kAnd240k"
//   | "above240k";

// type FetchSimulationsParams = {
//   period?: "today" | "week" | "month" | "all";
//   ageFilter?: "below34" | "aboveOrEqual34" | "all";
//   salaryFilter?: SalaryFilter;
//   appartmentType?: "Studio" | "F2" | "F3" | "F4" | "all";
//   status?: "all" | boolean;
// };

// export async function fetchSimulations({
//   period,
//   ageFilter,
//   salaryFilter,
//   appartmentType,
//   status,
// }: FetchSimulationsParams): Promise<ActionResponse<ISimulation[]>> {
//   try {
//     await requireUser();
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
//   try {
//     await dbConnect();

//     const filter: FilterQuery<typeof Simulation> = {};

//     // Filter by creation period
//     const now = new Date();
//     if (period === "today") {
//       filter.createdAt = { $gte: startOfDay(now), $lte: endOfDay(now) };
//     } else if (period === "week") {
//       filter.createdAt = { $gte: startOfWeek(now), $lte: endOfWeek(now) };
//     } else if (period === "month") {
//       filter.createdAt = { $gte: startOfMonth(now), $lte: endOfMonth(now) };
//     }

//     // Filter by age
//     if (ageFilter === "below34") {
//       filter.age = { $lt: 34 };
//     } else if (ageFilter === "aboveOrEqual34") {
//       filter.age = { $gte: 34 };
//     }

//     // Filter by salary
//     if (salaryFilter === "below120k") {
//       filter.salary = { $lt: 120_000 };
//     } else if (salaryFilter === "between120kAnd240k") {
//       filter.salary = { $gte: 120_000, $lt: 240_000 };
//     } else if (salaryFilter === "above240k") {
//       filter.salary = { $gte: 240_000 };
//     }

//     if (typeof status === "boolean") {
//       filter.status = status;
//     }

//     // Filter by apartment type
//     if (appartmentType && appartmentType !== "all") {
//       filter.appartmentType = appartmentType;
//     }

//     const simulations = await Simulation.find(filter)
//       .sort({ createdAt: -1 })
//       .lean();

//     return {
//       success: true,
//       data: JSON.parse(JSON.stringify(simulations)),
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }

// export async function fetchSimulationById(
//   id: string
// ): Promise<ActionResponse<ISimulation>> {
//   try {
//     await dbConnect();

//     const simulation = await Simulation.findById(id).lean();

//     if (!simulation) {
//       return {
//         success: false,
//         error: { message: "Simulation introuvable" },
//         status: 404,
//       };
//     }

//     return {
//       success: true,
//       data: JSON.parse(JSON.stringify(simulation)),
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }

// export async function validateSimulation(
//   simulationId: string,
//   validation: boolean
// ) {
//   try {
//     await dbConnect();
//     const user = await requireUser();

//     const updatedSimulation = await Simulation.findByIdAndUpdate(
//       simulationId,
//       {
//         status: validation,
//         whoValidated: user.name,
//         validatedAt: new Date(),
//       },
//       { new: true }
//     ).lean();

//     if (!updatedSimulation) {
//       return {
//         success: false,
//         error: { message: "Simulation introuvable" },
//         status: 404,
//       };
//     }

//     revalidatePath("/dashboard");

//     return {
//       success: true,
//       status: 200,
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }

// export async function deleteSimulationById(id: string) {
//   try {
//     await requireUser();
//     await dbConnect();
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return {
//         success: false,
//         error: { message: "ID invalide" },
//         status: 400,
//       };
//     }

//     const simulation = await Simulation.findByIdAndDelete(id).lean();

//     if (!simulation) {
//       return {
//         success: false,
//         error: { message: "Simulation introuvable" },
//         status: 404,
//       };
//     }

//     revalidatePath("/dashboard");

//     return {
//       success: true,
//       status: 200,
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }
