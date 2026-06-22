import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import songsRouter from "./songs";
import setlistsRouter from "./setlists";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(songsRouter);
router.use(setlistsRouter);

export default router;
